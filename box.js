(function () {
  if (window.box) return; // do not overwrite existing
  const STYLE_ID = 'tm-box-ui-styles';

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
.tm-box-ui {
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

.tm-box-tabs-bar {
  display: none;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

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
`;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  // Create DOM structure
  let root, header, tabsBar, contentArea, titleEl, toggleBtn;
  let tabs = []; // {id, name, tabEl, contentEl, rows: []}
  let currentTab = null;
  let currentRow = null;
  let dynamicLabels = []; // {el, fn}
  let dynamicUpdaterId = null;

  function createRoot() {
    if (root) return;

    addStyles();

    root = document.createElement('div');
    root.className = 'tm-box-ui';
    root.style.left = '20px';
    root.style.top = '20px';
    root.style.width = '380px';
    root.style.height = '320px';

    // Header (draggable)
    header = document.createElement('div');
    header.className = 'tm-box-header';
    titleEl = document.createElement('div');
    titleEl.className = 'tm-box-title';
    titleEl.textContent = 'Box UI';

    const controls = document.createElement('div');
    controls.className = 'tm-box-controls';

    // collapse toggle
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

    // Tabs bar
    tabsBar = document.createElement('div');
    tabsBar.className = 'tm-box-tabs-bar';

    // Content area
    contentArea = document.createElement('div');
    contentArea.className = 'tm-box-content';

    root.appendChild(header);
    root.appendChild(tabsBar);
    root.appendChild(contentArea);

    document.body.appendChild(root);

    makeDraggable(root, header, (x, y) => {
      // keep inside viewport
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

    // make scrollbars nice when mouse wheel over tabsBar
    tabsBar.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        tabsBar.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    });

    startDynamicUpdater();
  }

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

  // Tab switching
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

  // Row creation
  function createRow() {
    if (!currentTab) {
      createTab('Default');
    }
    const row = document.createElement('div');
    row.className = 'tm-box-row';
    currentTab.contentEl.appendChild(row);
    currentTab.rows.push(row);
    currentRow = row;
    return row;
  }

  function addButton(text, fn) {
    ensureUI();
    if (!currentRow) createRow();
    const btn = document.createElement('button');
    btn.className = 'tm-box-button';
    btn.textContent = text;
    btn.addEventListener('click', (e) => {
      try {
        fn && fn.call(null, e);
      } catch (err) {
        console.error('box button handler error', err);
      }
    });
    currentRow.appendChild(btn);
    return btn;
  }

  function addLabel(textOrFn) {
    ensureUI();
    if (!currentRow) createRow();
    const span = document.createElement('span');
    span.className = 'tm-box-label';
    if (typeof textOrFn === 'function') {
      // set initial text
      try {
        span.textContent = String(textOrFn());
      } catch (err) {
        span.textContent = 'Error';
      }
      dynamicLabels.push({ el: span, fn: textOrFn });
    } else {
      span.textContent = String(textOrFn);
    }
    currentRow.appendChild(span);
    return span;
  }

  function addLineSeperator() {
    ensureUI();
    const hr = document.createElement('div');
    hr.className = 'tm-box-sep';
    // if called inside a row, close current row so separator stands alone
    currentRow = null;
    if (!currentTab) createTab('Default');
    currentTab.contentEl.appendChild(hr);
    return hr;
  }

  function ensureUI() {
    if (!root) createRoot();
  }

  function startDynamicUpdater() {
    if (dynamicUpdaterId != null) return;
    function step() {
      if (dynamicLabels.length) {
        for (let i = 0; i < dynamicLabels.length; i++) {
          const entry = dynamicLabels[i];
          try {
            const v = entry.fn();
            // only update if changed (avoid layout thrash)
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

  // API
  const api = {
    initialize(x = 20, y = 20, w = 380, h = 320) {
      createRoot();
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

    addRow() {
      ensureUI();
      createRow();
      return currentRow;
    },

    addButton(text, fn) {
      ensureUI();
      return addButton(text, fn);
    },

    addLabel(textOrFn) {
      ensureUI();
      return addLabel(textOrFn);
    },

    addLineSeperator() {
      ensureUI();
      return addLineSeperator();
    },

    // convenience: switch to a tab id if you saved it
    switchTo(tabId) {
      if (!tabId) return;
      switchToTab(tabId);
    },

    // expose some internals for debugging (not recommended)
    _internals: {
      getRoot: () => root,
      getTabs: () => tabs,
    },

    // remove the UI entirely
    destroy() {
      stopDynamicUpdater();
      if (root && root.parentNode) root.parentNode.removeChild(root);
      root = header = tabsBar = contentArea = titleEl = toggleBtn = null;
      tabs = [];
      currentTab = null;
      currentRow = null;
      dynamicLabels = [];
    },

    // set title text shown in header
    setTitle(txt) {
      ensureUI();
      titleEl.textContent = String(txt);
    },
  };

  // wire api functions that were shadowed by inner helpers
  // (rename inner helpers to avoid conflicts)
  // To avoid naming collision we assign wrapper functions:
  api.addButton = function (text, fn) {
    ensureUI();
    if (!currentRow) createRow();
    const btn = document.createElement('button');
    btn.className = 'tm-box-button';
    btn.textContent = text;
    btn.addEventListener('click', (e) => {
      try { fn && fn.call(null, e); } catch (err) { console.error(err); }
    });
    currentRow.appendChild(btn);
    return btn;
  };

  api.addLabel = function (textOrFn) {
    ensureUI();
    if (!currentRow) createRow();
    const span = document.createElement('span');
    span.className = 'tm-box-label';
    if (typeof textOrFn === 'function') {
      try { span.textContent = String(textOrFn()); } catch (err) { span.textContent = 'Err'; }
      dynamicLabels.push({ el: span, fn: textOrFn });
    } else {
      span.textContent = String(textOrFn);
    }
    currentRow.appendChild(span);
    return span;
  };

  api.addLineSeperator = function () {
    ensureUI();
    const hr = document.createElement('div');
    hr.className = 'tm-box-sep';
    currentRow = null;
    if (!currentTab) createTab('Default');
    currentTab.contentEl.appendChild(hr);
    return hr;
  };

  // ensure createRoot exists and proper bindings for newTab/addRow
  api.newTab = function (name = 'Tab') {
    ensureUI();
    const t = createTab(String(name));
    return t.id;
  };

  api.addRow = function () {
    ensureUI();
    return createRow();
  };

  // initialize immediately so it's available right away
  createRoot();

  // expose
  window.box = api;

  // auto-clean if page unloads (keeps DOM tidy)
  window.addEventListener('beforeunload', () => {
    if (window.box && window.box._internals) {
      try { window.box.destroy(); } catch (e) {}
    }
  });
})();
