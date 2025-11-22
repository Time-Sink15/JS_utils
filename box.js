// tm-box-ui.js
// Tampermonkey-friendly UI library exposing `window.box`
// Delayed initialization: nothing appears until box.initialize() is called.
//
// API:
//   box.initialize(x, y, w, h)
//   box.newTab(name) -> returns tabId
//   box.addRow(bgColor?) -> returns row element
//   box.addButton(text, fn, textColor?, bgColor?, borderColor?) -> returns button element
//   box.addLabel(textOrFn, textColor?) -> returns span element (dynamic if function)
//   box.addLineSeperator(color?) -> returns separator element
//   box.addToggleButton(text, fnOn, fnOff, runOnEachFrameWhenOn=false, runOnEachFrameWhenOff=false, options={}) -> returns button element
//   box.addRadioButton(groupId, onSelectFn, text?, options?) -> returns wrapper element
//   box.newTab(name)
//   box.switchTo(tabId)
//   box.setTitle(text)
//   box.destroy()
//
// Designed to be safe to drop in — no UI created until initialize().

(function () {
  if (window.box) return; // do not overwrite existing

  // --- internal state ---
  let root = null;
  let header = null;
  let tabsBar = null;
  let contentArea = null;
  let titleEl = null;
  let toggleBtn = null;
  let tabs = []; // {id,name,tabEl,contentEl, rows: []}
  let currentTab = null;
  let currentRow = null;
  let dynamicLabels = []; // {el, fn}
  let dynamicUpdaterId = null;
  let STYLE_ID = 'tm-box-ui-styles-v2';

  // --- CSS string (ONLY CSS inside this template literal) ---
  const CSS = `
/* tm-box-ui styles */
#tm-box-ui-root {
  position: fixed;
  z-index: 999999;
  background: rgba(30,30,30,0.95);
  color: #f5f5f5;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.6);
  overflow: hidden;
  min-width: 200px;
  max-width: 95vw;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.tm-box-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.0));
  cursor: move;
}

.tm-box-title {
  font-weight: 600;
  font-size: 13px;
  padding-left: 6px;
  flex: 0 0 auto;
}

.tm-box-controls {
  margin-left: auto;
  display: flex;
  gap: 6px;
  align-items: center;
}

.tm-box-toggle-btn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.06);
  color: inherit;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

/* Tabs bar (hidden scrollbar, horizontal scrollable) */
.tm-box-tabs-bar {
  display: block;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  scrollbar-width: none; /* Firefox */
}
.tm-box-tabs-bar::-webkit-scrollbar { display: none; } /* WebKit */

/* Individual tab */
.tm-box-tab {
  display: inline-block;
  padding: 8px 12px;
  margin: 6px 4px;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: #ddd;
  user-select: none;
}

.tm-box-tab.active {
  background: rgba(255,255,255,0.04);
  color: #fff;
  font-weight: 700;
  box-shadow: inset 0 -2px 0 rgba(255,255,255,0.02);
}

.tm-box-content {
  padding: 8px;
  overflow: auto;
  flex: 1 1 auto;
  min-height: 50px;
}

/* Rows & controls */
.tm-box-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 4px;
  flex-wrap: wrap;
}

.tm-box-button {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.02);
  color: inherit;
  cursor: pointer;
  font-size: 13px;
}

.tm-box-label {
  font-size: 13px;
  padding: 4px 6px;
  color: #eaeaea;
}

.tm-box-sep {
  border-top: 1px solid rgba(255,255,255,0.06);
  margin: 6px 0;
}

/* Radio */
.tm-box-radio {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  margin: 4px 0;
}

.tm-box-radio:hover {
  background: rgba(255,255,255,0.02);
}

.tm-box-radio-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.18);
  display: inline-block;
  box-sizing: border-box;
  position: relative;
  flex: 0 0 auto;
}

.tm-box-radio-indicator::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.95);
  transition: transform 0.12s ease;
}

.tm-box-radio.selected .tm-box-radio-indicator::after {
  transform: translate(-50%, -50%) scale(1);
}

.tm-box-radio-label {
  font-size: 13px;
  color: #eaeaea;
}
`;

  // --- helper: insert styles (only called when createRoot runs) ---
  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // --- helpers for dragging ---
  function makeDraggable(container, handle, onMove) {
    let dragging = false;
    let startX = 0, startY = 0, origLeft = 0, origTop = 0;

    handle.addEventListener('mousedown', (ev) => {
      dragging = true;
      startX = ev.clientX;
      startY = ev.clientY;
      const rect = container.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;
      ev.preventDefault();
    });
    window.addEventListener('mousemove', (ev) => {
      if (!dragging) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const nx = Math.round(origLeft + dx);
      const ny = Math.round(origTop + dy);
      onMove(nx, ny);
    });
    window.addEventListener('mouseup', () => {
      dragging = false;
    });
    // touch events
    handle.addEventListener('touchstart', (ev) => {
      const t = ev.touches[0];
      dragging = true;
      startX = t.clientX;
      startY = t.clientY;
      const rect = container.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;
      ev.preventDefault();
    }, {passive:false});
    window.addEventListener('touchmove', (ev) => {
      if (!dragging) return;
      const t = ev.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const nx = Math.round(origLeft + dx);
      const ny = Math.round(origTop + dy);
      onMove(nx, ny);
    }, {passive:false});
    window.addEventListener('touchend', () => dragging = false);
  }

  // --- create DOM root (only called from initialize) ---
  function createRoot() {
    if (root) return;
    addStyles();

    root = document.createElement('div');
    root.id = 'tm-box-ui-root';
    root.style.left = '20px';
    root.style.top = '20px';
    root.style.width = '380px';
    root.style.height = '320px';

    // Header
    header = document.createElement('div');
    header.className = 'tm-box-header';

    titleEl = document.createElement('div');
    titleEl.className = 'tm-box-title';
    titleEl.textContent = 'Box UI';

    const controls = document.createElement('div');
    controls.className = 'tm-box-controls';

    toggleBtn = document.createElement('button');
    toggleBtn.className = 'tm-box-toggle-btn';
    toggleBtn.textContent = '—';
    toggleBtn.title = 'Collapse/Expand';
    toggleBtn.addEventListener('click', () => {
      if (contentArea.style.display === 'none') {
        contentArea.style.display = '';
        tabsBar.style.display = '';
        toggleBtn.textContent = '—';
      } else {
        contentArea.style.display = 'none';
        tabsBar.style.display = 'none';
        toggleBtn.textContent = '+';
      }
    });

    controls.appendChild(toggleBtn);
    header.appendChild(titleEl);
    header.appendChild(controls);

    // tabs bar
    tabsBar = document.createElement('div');
    tabsBar.className = 'tm-box-tabs-bar';

    // content area
    contentArea = document.createElement('div');
    contentArea.className = 'tm-box-content';

    root.appendChild(header);
    root.appendChild(tabsBar);
    root.appendChild(contentArea);

    document.body.appendChild(root);

    makeDraggable(root, header, (x, y) => {
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      const rect = root.getBoundingClientRect();
      let nx = x, ny = y;
      if (nx + rect.width > vw - 10) nx = vw - rect.width - 10;
      if (ny + rect.height > vh - 10) ny = vh - rect.height - 10;
      if (nx < 0) nx = 0;
      if (ny < 0) ny = 0;
      root.style.left = nx + 'px';
      root.style.top = ny + 'px';
    });

    // wheel to scroll tabs horizontally if vertical wheel used
    tabsBar.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        tabsBar.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    });

    startDynamicUpdater();
  }

  // --- tabs behavior ---
  function createTab(name) {
    const id = 'tab_' + Math.random().toString(36).slice(2, 9);
    const tabEl = document.createElement('div');
    tabEl.className = 'tm-box-tab';
    tabEl.textContent = name;

    const contentEl = document.createElement('div');
    contentEl.style.display = 'none';
    contentEl.className = 'tm-box-tab-content';

    const tabObj = { id, name, tabEl, contentEl, rows: [] };

    tabEl.addEventListener('click', () => switchToTab(id));

    tabsBar.appendChild(tabEl);
    contentArea.appendChild(contentEl);
    tabs.push(tabObj);

    switchToTab(id);
    return tabObj;
  }

  function switchToTab(id) {
    for (const t of tabs) {
      if (t.id === id) {
        t.tabEl.classList.add('active');
        t.contentEl.style.display = '';
        currentTab = t;
      } else {
        t.tabEl.classList.remove('active');
        t.contentEl.style.display = 'none';
      }
    }
    currentRow = null;
  }

  // --- rows & items ---
  function createRow(bg = null) {
    if (!currentTab) createTab('Default');
    const row = document.createElement('div');
    row.className = 'tm-box-row';
    if (bg) row.style.background = bg;
    currentTab.contentEl.appendChild(row);
    currentTab.rows.push(row);
    currentRow = row;
    return row;
  }

  function ensureUI() {
    if (!root) createRoot();
  }

  // --- dynamic label updater ---
  function startDynamicUpdater() {
    if (dynamicUpdaterId != null) return;
    function step() {
      if (dynamicLabels.length) {
        for (let i = 0; i < dynamicLabels.length; i++) {
          const entry = dynamicLabels[i];
          try {
            const v = entry.fn();
            if (String(entry.el.textContent) !== String(v)) {
              entry.el.textContent = String(v);
            }
          } catch (err) {
            console.error('box dynamic label error', err);
          }
        }
      }
      dynamicUpdaterId = requestAnimationFrame(step);
    }
    dynamicUpdaterId = requestAnimationFrame(step);
  }

  function stopDynamicUpdater() {
    if (dynamicUpdaterId != null) {
      cancelAnimationFrame(dynamicUpdaterId);
      dynamicUpdaterId = null;
    }
  }

  // --- API object (exposed immediately) ---
  const api = {
    // initialize creates DOM if needed and positions/sizes the box
    initialize(x = 20, y = 20, w = 380, h = 320) {
      if (!root) createRoot();
      root.style.left = (Number.isFinite(x) ? x : 20) + 'px';
      root.style.top = (Number.isFinite(y) ? y : 20) + 'px';
      root.style.width = (Number.isFinite(w) ? w : 380) + 'px';
      root.style.height = (Number.isFinite(h) ? h : 320) + 'px';
      return api;
    },

    newTab(name = 'Tab') {
      ensureUI();
      const t = createTab(String(name));
      return t.id;
    },

    addRow(bg = null) {
      ensureUI();
      return createRow(bg);
    },

    addButton(text, fn, textColor = null, bgColor = null, borderColor = null) {
      ensureUI();
      if (!currentRow) createRow();
      const btn = document.createElement('button');
      btn.className = 'tm-box-button';
      btn.textContent = text;
      if (textColor) btn.style.color = textColor;
      if (bgColor) btn.style.background = bgColor;
      if (borderColor) btn.style.borderColor = borderColor;
      btn.addEventListener('click', (e) => {
        try { fn && fn.call(null, e); } catch (err) { console.error('box button handler error', err); }
      });
      currentRow.appendChild(btn);
      return btn;
    },

    addLabel(textOrFn, color = null) {
      ensureUI();
      if (!currentRow) createRow();
      const span = document.createElement('span');
      span.className = 'tm-box-label';
      if (color) span.style.color = color;
      if (typeof textOrFn === 'function') {
        try { span.textContent = String(textOrFn()); } catch (err) { span.textContent = 'Err'; }
        dynamicLabels.push({ el: span, fn: textOrFn });
      } else {
        span.textContent = String(textOrFn);
      }
      currentRow.appendChild(span);
      return span;
    },

    addLineSeperator(color = null) {
      ensureUI();
      currentRow = null;
      if (!currentTab) createTab('Default');
      const hr = document.createElement('div');
      hr.className = 'tm-box-sep';
      if (color) hr.style.borderTop = `1px solid ${color}`;
      currentTab.contentEl.appendChild(hr);
      return hr;
    },

    addToggleButton(text = "Toggle",
                    functionOn = null,
                    functionOff = null,
                    runOnEachFrameWhenOn = false,
                    runOnEachFrameWhenOff = false,
                    options = {}) {
      ensureUI();
      if (!currentRow) createRow();

      const {
        textColorOn = "white",
        textColorOff = "white",
        bgColorOn = "#3a7",
        bgColorOff = "#444",
        borderColorOn = "#3a7",
        borderColorOff = "#444"
      } = options;

      let state = false; // OFF
      let frameLoopId = null;

      const btn = document.createElement("button");
      btn.className = "tm-box-button";
      btn.textContent = text;

      // initial appearance (OFF)
      btn.style.color = textColorOff;
      btn.style.background = bgColorOff;
      btn.style.borderColor = borderColorOff;

      function stopFrameLoop() {
        if (frameLoopId !== null) {
          cancelAnimationFrame(frameLoopId);
          frameLoopId = null;
        }
      }

      function startFrameLoop(fn) {
        function loop() {
          try { fn(); } catch (err) { console.error(err); }
          frameLoopId = requestAnimationFrame(loop);
        }
        frameLoopId = requestAnimationFrame(loop);
      }

      function applyStateAppearance() {
        if (state) {
          btn.style.color = textColorOn;
          btn.style.background = bgColorOn;
          btn.style.borderColor = borderColorOn;
        } else {
          btn.style.color = textColorOff;
          btn.style.background = bgColorOff;
          btn.style.borderColor = borderColorOff;
        }
      }

      btn.addEventListener("click", () => {
        state = !state;
        applyStateAppearance();

        // Stop any previous loops
        stopFrameLoop();

        if (state) {
          // ON
          try { functionOn && functionOn(); } catch (err) { console.error(err); }
          if (runOnEachFrameWhenOn && functionOn) startFrameLoop(functionOn);
        } else {
          // OFF
          try { functionOff && functionOff(); } catch (err) { console.error(err); }
          if (runOnEachFrameWhenOff && functionOff) startFrameLoop(functionOff);
        }
      });

      currentRow.appendChild(btn);
      return btn;
    },

    // Radio groups storage
    _internals: {
      radioGroups: {}
    },

    addRadioButton(groupId, onSelectFn, text = null, options = {}) {
      ensureUI();
      if (!currentRow) createRow();

      const opts = Object.assign({
        selected: false,
        textColor: null,
        bgColorOn: null,
        borderColorOn: null
      }, options || {});

      if (!api._internals.radioGroups[groupId]) {
        api._internals.radioGroups[groupId] = { buttons: [], selected: null };
      }
      const group = api._internals.radioGroups[groupId];

      const wrapper = document.createElement('div');
      wrapper.className = 'tm-box-radio';
      wrapper.setAttribute('data-radio-group', String(groupId));

      const ind = document.createElement('span');
      ind.className = 'tm-box-radio-indicator';
      wrapper.appendChild(ind);

      const lab = document.createElement('span');
      lab.className = 'tm-box-radio-label';
      if (text != null) lab.textContent = String(text);
      if (opts.textColor) lab.style.color = opts.textColor;
      wrapper.appendChild(lab);

      const btnObj = { wrapper, indicator: ind, label: lab, onSelectFn, text: text };

      function selectThis(emit = true) {
        if (group.selected && group.selected !== btnObj) {
          group.selected.wrapper.classList.remove('selected');
          if (group.selected._prevStyles) {
            Object.assign(group.selected.wrapper.style, group.selected._prevStyles);
          }
          group.selected = null;
        }

        wrapper.classList.add('selected');
        btnObj._prevStyles = {
          background: wrapper.style.background || '',
          borderColor: wrapper.style.borderColor || ''
        };
        if (opts.bgColorOn) wrapper.style.background = opts.bgColorOn;
        if (opts.borderColorOn) wrapper.style.borderColor = opts.borderColorOn;

        group.selected = btnObj;

        if (emit && typeof onSelectFn === 'function') {
          try { onSelectFn(btnObj.text, wrapper); } catch (err) { console.error('radio onSelect error', err); }
        }
      }

      wrapper.addEventListener('click', () => {
        if (group.selected === btnObj) {
          try { onSelectFn && onSelectFn(btnObj.text, wrapper); } catch (err) {}
          return;
        }
        selectThis(true);
      });

      currentRow.appendChild(wrapper);
      group.buttons.push(btnObj);

      if (opts.selected) {
        selectThis(false);
        try { onSelectFn && onSelectFn(btnObj.text, wrapper); } catch (err) {}
      }

      return wrapper;
    },

    switchTo(tabId) {
      if (!tabId) return;
      switchToTab(tabId);
    },

    setTitle(txt) {
      if (!titleEl) {
        // not created yet; store name to set once created
        // but to keep code simple, createRoot will set default title; user can call setTitle later after initialize
      } else {
        titleEl.textContent = String(txt);
      }
    },

    // debugging helpers
    _getInternalState() {
      return {
        rootExists: !!root,
        tabsCount: tabs.length,
        currentTabId: currentTab ? currentTab.id : null
      };
    },

    destroy() {
      stopDynamicUpdater();
      if (root && root.parentNode) root.parentNode.removeChild(root);
      root = header = tabsBar = contentArea = titleEl = toggleBtn = null;
      tabs = [];
      currentTab = null;
      currentRow = null;
      dynamicLabels = [];
      // leave api exposed so scripts can re-initialize
    }
  };

  // --- keyboard: Tab cycles through tabs (only when root exists) ---
  window.addEventListener('keydown', function (e) {
    if (!root || !tabs.length) return;
    if (e.key !== 'Tab') return;
    // If focus is inside an input/textarea/select, ignore (let browser behavior)
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

    e.preventDefault();
    let index = tabs.findIndex(t => t.id === (currentTab && currentTab.id));
    if (index === -1) index = 0;
    let newIndex;
    if (e.shiftKey) newIndex = (index - 1 + tabs.length) % tabs.length;
    else newIndex = (index + 1) % tabs.length;
    const nextTab = tabs[newIndex];
    switchToTab(nextTab.id);
  });

  // expose api
  window.box = api;

  // auto-clean on unload
  window.addEventListener('beforeunload', () => {
    try { api.destroy(); } catch (e) {}
  });

})();
