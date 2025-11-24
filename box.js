(function () {
  // --- Keyboard Tab Cycling ---
window.addEventListener("keydown", function (e) {
    if (!root || !tabs.length) return; // no UI yet

    // Must be TAB
    if (e.key !== "Tab") return;

    e.preventDefault(); // stop browser focus movement

    let index = tabs.findIndex(t => t.id === currentTab?.id);
    if (index === -1) index = 0;

    let newIndex;

    if (e.shiftKey) {
        // backward cycle
        newIndex = (index - 1 + tabs.length) % tabs.length;
    } else {
        // forward cycle
        newIndex = (index + 1) % tabs.length;
    }

    const nextTab = tabs[newIndex];
    switchToTab(nextTab.id);
});

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
  padding: 6px 8px !important;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.0));
  cursor: move;
}

.tm-box-title {
  font-weight: 600;
  font-size: 13px;
  padding-left: 6px !important;
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
  padding: 4px 6px !important;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.tm-box-tabs-bar {
  display: block;
  scrollbar-width: none;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.tm-box-tabs-bar::-webkit-scrollbar {
  display: none;
}
.tm-box-tab {
  display: inline-block;
  padding: 8px 12px !important;
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
    overflow-x: auto;        /* allow left-right scrolling */
    overflow-y: auto;        /* keep normal vertical scroll */
    white-space: nowrap;     /* prevents content from wrapping */
  padding: 8px !important;
  flex: 1 1 auto;
  min-height: 50px;
}

/* Rows & controls */
.tm-box-row {
    flex-shrink: 0;        /* prevent rows from compressing */
    white-space: nowrap
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 4px !important;
  flex-wrap: wrap;
}

.tm-box-button {
  padding: 6px 10px !important;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.02);
  color: inherit;
  cursor: pointer;
  font-size: 13px;
}

.tm-box-label {
  font-size: 13px;
  padding: 4px 6px !important;
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
(function installSafeShield(rootSelector = '.tm-box-ui') {
  const root = document.querySelector(rootSelector);
  if (!root) {
    console.warn('SafeShield: box root not found with selector', rootSelector);
    return;
  }
  const originals = {
    doc_onmousedown: document.onmousedown,
    doc_onselectstart: document.onselectstart,
    win_onmousedown: window.onmousedown,
    win_onselectstart: window.onselectstart
  };
  function wrapperFactory(orig) {
    return function wrappedEventHandler(e) {
      try {
        if (e && e.target && root.contains(e.target)) {
          return;
        }
      } catch (err) { /* swallow */ }
      if (typeof orig === 'function') {
        try { orig.call(this, e); } catch (err) { console.error('orig handler error', err); }
      }
    };
  }
  document.onmousedown = wrapperFactory(originals.doc_onmousedown);
  document.onselectstart = wrapperFactory(originals.doc_onselectstart);
  window.onmousedown = wrapperFactory(originals.win_onmousedown);
  window.onselectstart = wrapperFactory(originals.win_onselectstart);
  const markHandler = function(e) {
    try { if (root.contains(e.target)) e.__tm_inside_box = true; }
    catch (err) {}
  };
  ['mousedown','pointerdown','touchstart','click','selectstart'].forEach(ev =>
    window.addEventListener(ev, markHandler, true)
  );
  window.__tm_safeShieldUninstall = function() {
    document.onmousedown = originals.doc_onmousedown;
    document.onselectstart = originals.doc_onselectstart;
    window.onmousedown = originals.win_onmousedown;
    window.onselectstart = originals.win_onselectstart;

    // remove mark handler
    ['mousedown','pointerdown','touchstart','click','selectstart'].forEach(ev =>
      window.removeEventListener(ev, markHandler, true)
    );
    console.log('SafeShield uninstalled (restored originals).');
  };

  return window.__tm_safeShieldUninstall;
})();

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
    if (!root) createRoot();  // Only create once, and only when initialize is called

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
  api.addTextInput = function (width = '160px', options = {}) {
  ensureUI();
  if (!currentRow) api.addRow();

  const {
    placeholder = '',
    initial = '',
    maxLength = null,
    onChange = null,
    onEnter = null,
    readonly = false,
    type = 'text'
  } = options || {};

  // wrapper so it behaves like other inline controls
  const wrapper = document.createElement('div');
  wrapper.style.display = 'inline-flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.flex = '0 0 auto';
  wrapper.style.gap = '6px';

  // input element
  const input = document.createElement('input');
  input.type = type;
  input.placeholder = placeholder;
  if (maxLength !== null) input.maxLength = maxLength;
  input.value = initial != null ? String(initial) : '';

  // normalize width
  input.style.width = (typeof width === 'number') ? (width + 'px') : String(width);

  // inline styles to avoid site CSS interference (padding, line-height, box-sizing, etc.)
  input.style.padding = '6px 8px';
  input.style.boxSizing = 'border-box';
  input.style.borderRadius = '6px';
  input.style.border = '1px solid rgba(255,255,255,0.06)';
  input.style.background = 'rgba(255,255,255,0.02)';
  input.style.color = 'inherit';
  input.style.height = '32px';
  input.style.lineHeight = '20px';
  input.style.fontSize = '13px';
  input.style.outline = 'none';
  input.style.flex = '0 0 auto';
  input.style.minWidth = '40px';
  input.style.transition = 'box-shadow 120ms ease, border-color 120ms ease';

  // hover/focus visual (inline handlers to avoid site CSS)
  input.addEventListener('mouseenter', () => {
    input.style.boxShadow = 'inset 0 0 0 2px rgba(255,255,255,0.02)';
  });
  input.addEventListener('mouseleave', () => {
    if (document.activeElement !== input) input.style.boxShadow = 'none';
  });
  input.addEventListener('focus', () => {
    input.style.boxShadow = 'inset 0 0 0 2px rgba(255,255,255,0.06)';
    input.select && input.select();
  });
  input.addEventListener('blur', () => {
    input.style.boxShadow = 'none';
  });

  // input events
  function safeCall(fn, ...args) {
    try { fn && fn(...args); } catch (err) { console.error('textInput handler error', err); }
  }

  input.addEventListener('input', (e) => {
    safeCall(onChange, e.target.value, e);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      safeCall(onEnter, e.target.value, e);
    }
  });

  // assemble
  wrapper.appendChild(input);
  currentRow.appendChild(wrapper);

  // API
  return {
    wrapper,
    input,
    getValue: () => input.value,
    setValue: (v) => { input.value = String(v); },
    clear: () => { input.value = ''; },
    focus: () => { input.focus(); },
    blur: () => { input.blur(); },
    setReadonly: (yes = true) => { input.readOnly = !!yes; input.style.opacity = yes ? '0.7' : '1'; },
    setPlaceholder: (txt) => { input.placeholder = String(txt); },
    setMaxLength: (n) => { input.maxLength = n; },
    setType: (t) => { input.type = String(t); },
    onChange: (fn) => {
      if (typeof fn === 'function') {
        input.addEventListener('input', (e) => safeCall(fn, e.target.value, e));
      }
    }
  };
};

api.addSlider = function (
    min = 0,
    max = 100,
    onChange = null,
    width = "160px",
    options = {}
) {
    ensureUI();
    if (!currentRow) api.addRow();

    const {
        initial = null,
        step = 1,
        trackColor = "#888",
        thumbColor = "#ccc"
    } = options;

    // Wrapper
    const wrapper = document.createElement("div");
    wrapper.style.display = "inline-flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "8px";
    wrapper.style.flex = "0 0 auto";
    wrapper.style.width = (typeof width === "number") ? width + "px" : width;

    // Slider input
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.style.flex = "1 1 auto";
    input.style.margin = "0";
    input.style.cursor = "pointer";

    // Initial value
    const initVal = (initial !== null)
        ? Number(initial)
        : Math.round((Number(min) + Number(max)) / 2);

    input.value = String(
        Math.min(Math.max(initVal, Number(min)), Number(max))
    );

    // Value display
    const valueDisplay = document.createElement("span");
    valueDisplay.className = "tm-box-label";
    valueDisplay.style.whiteSpace = "nowrap";
    valueDisplay.textContent = input.value;

    // Inject CSS exactly once
    if (!window.__tm_slider_css_fixed) {
        window.__tm_slider_css_fixed = true;

        const style = document.createElement("style");
        style.textContent = `
        /* Base slider */
        .tm-slider {
            -webkit-appearance: none;
            appearance: none;
            height: 6px;
            border-radius: 4px;
            outline: none;
            background: #777; /* default track */
        }

        /* Track */
        .tm-slider::-webkit-slider-runnable-track {
            height: 6px;
            border-radius: 4px;
        }
        .tm-slider::-moz-range-track {
            height: 6px;
            border-radius: 4px;
        }

        /* Thumb */
        .tm-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #ccc;    /* visible default */
            border: 2px solid #0004;
            cursor: pointer;
            margin-top: -5px; /* aligns thumb with track */
        }
        .tm-slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #ccc;    /* visible default */
            border: 2px solid #0004;
            cursor: pointer;
        }
        `;
        document.head.appendChild(style);
    }

    // Apply class
    input.classList.add("tm-slider");

    // Custom styling
    input.style.background = trackColor;

    // Custom thumb color (inline style override)
    input.style.setProperty("--thumbColor", thumbColor);

    // Force thumb color using inline CSS (Chrome/Safari/WebKit)
    input.addEventListener("input", () => {
        valueDisplay.textContent = input.value;
        onChange && onChange(Number(input.value));
    });

    input.addEventListener("change", () => {
        valueDisplay.textContent = input.value;
        onChange && onChange(Number(input.value));
    });

    // Build slider
    wrapper.appendChild(input);
    wrapper.appendChild(valueDisplay);
    currentRow.appendChild(wrapper);

    return {
        wrapper,
        input,
        valueDisplay,
        setTrackColor: (c) => input.style.background = c,
        setThumbColor: (c) => {
            input.style.setProperty("--thumbColor", c);
            input.style.background = input.style.background; // refresh
        },
        setValue: (v) => {
            input.value = String(v);
            valueDisplay.textContent = input.value;
            onChange && onChange(Number(v));
        },
        getValue: () => Number(input.value)
    };
};

api.addSegmentedButton = function (labels = [], callbacks = [], options = {}) {
  ensureUI();
  if (!currentRow) api.addRow();

  // Normalize inputs
  if (!Array.isArray(labels)) labels = [String(labels)];
  if (!Array.isArray(callbacks)) callbacks = [callbacks || (() => {})];

  const {
    height = 32,
    width = 'auto',
    borderRadius = 6,
    bgColor = '#2f2f2f',
    textColor = '#eee',
    activeBg = '#4caf50',
    activeText = '#000',
    borderColor = 'rgba(255,255,255,0.06)',
    spacing = 0,
    radio = false,
    allowDeselect = false,
    initialIndex = -1,
    id = -1,
    repeat = false  // NEW: repeat currently active callback each tick
  } = options || {};

  window.__tm_segmented_groups = window.__tm_segmented_groups || {};
  if (Number.isFinite(id) && id !== -1) {
    window.__tm_segmented_groups[id] = window.__tm_segmented_groups[id] || [];
  }

  const container = document.createElement('div');
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'flex-start';
  container.style.gap = (spacing || 0) + 'px';
  container.style.flex = '0 0 auto';
  if (width !== 'auto') container.style.width = (typeof width === 'number' ? width + 'px' : width);

  const btns = [];
  let activeIndex = -1;

  // ---- Tick loop for repeated callbacks ----
  let running = false;
  function tickLoop() {
    if (!repeat || activeIndex < 0 || !btns[activeIndex]) return;
    try {
      const cb = callbacks[activeIndex];
      if (typeof cb === 'function') cb();
    } catch (e) { console.error('segmented repeat callback error', e); }
    if (running) requestAnimationFrame(tickLoop);
  }

  function startLoop() {
    if (!running && repeat && activeIndex >= 0) {
      running = true;
      requestAnimationFrame(tickLoop);
    }
  }

  function stopLoop() {
    running = false;
  }

  // ---- Visual helpers ----
  function applyActiveLocal(idx) {
    for (let i = 0; i < btns.length; i++) {
      const b = btns[i];
      if (i === idx) {
        b.style.background = activeBg;
        b.style.color = activeText;
      } else {
        b.style.background = bgColor;
        b.style.color = textColor;
      }
    }
    activeIndex = idx;
    if (repeat) {
      stopLoop();
      if (activeIndex >= 0) startLoop();
    }
  }

  function applyActive(idx, doNotifyGroup = true) {
    if (Number.isFinite(id) && id !== -1 && idx >= 0 && doNotifyGroup) {
      const list = window.__tm_segmented_groups[id] || [];
      for (const inst of list) {
        if (inst !== apiHandle) {
          try { inst._applyActiveLocal(-1); inst._activeIndex = -1; } catch (e) {}
        }
      }
    }

    if (!radio && !(Number.isFinite(id) && id !== -1)) {
      for (let i = 0; i < btns.length; i++) {
        btns[i].style.background = bgColor;
        btns[i].style.color = textColor;
      }
      activeIndex = -1;
      stopLoop();
      return;
    }

    applyActiveLocal(idx);
  }

  // ---- Style each button ----
  function styleButton(btn, idx) {
    btn.type = 'button';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.height = height + 'px';
    btn.style.lineHeight = (height - 2) + 'px';
    btn.style.padding = '0 12px';
    btn.style.margin = '0';
    btn.style.border = '1px solid ' + borderColor;
    btn.style.background = bgColor;
    btn.style.color = textColor;
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '13px';
    btn.style.userSelect = 'none';
    btn.style.boxSizing = 'border-box';
    btn.style.outline = 'none';
    btn.style.flex = '0 0 auto';
    btn.style.transition = 'box-shadow 120ms ease, background 120ms ease, color 120ms ease';

    if (idx === 0) {
      btn.style.borderTopLeftRadius = borderRadius + 'px';
      btn.style.borderBottomLeftRadius = borderRadius + 'px';
    } else {
      btn.style.borderTopLeftRadius = '0px';
      btn.style.borderBottomLeftRadius = '0px';
    }
    if (idx === labels.length - 1) {
      btn.style.borderTopRightRadius = borderRadius + 'px';
      btn.style.borderBottomRightRadius = borderRadius + 'px';
    } else {
      btn.style.borderTopRightRadius = '0px';
      btn.style.borderBottomRightRadius = '0px';
    }

    if (idx > 0) btn.style.borderLeftWidth = '0px';

    btn.addEventListener('mouseenter', () => btn.style.boxShadow = 'inset 0 0 0 2px rgba(255,255,255,0.07)');
    btn.addEventListener('mouseleave', () => btn.style.boxShadow = 'none');
    btn.addEventListener('focus', () => btn.style.boxShadow = 'inset 0 0 0 2px rgba(255,255,255,0.08)');
    btn.addEventListener('blur', () => btn.style.boxShadow = 'none');
  }

  // ---- Create buttons and click handlers ----
  for (let i = 0; i < labels.length; i++) {
    const text = String(labels[i] == null ? '' : labels[i]);
    const cb = (typeof callbacks[i] === 'function') ? callbacks[i] : (() => {});
    const btn = document.createElement('button');
    btn.textContent = text;
    styleButton(btn, i);

    btn.addEventListener('click', (ev) => {
      try { cb(ev); } catch (err) { console.error('segmented callback error', err); }

      if (Number.isFinite(id) && id !== -1) {
        const list = window.__tm_segmented_groups[id] || [];
        for (const inst of list) {
          if (inst !== apiHandle) { inst._applyActiveLocal(-1); inst._activeIndex = -1; }
        }
      }

      if (radio) {
        if (activeIndex === i) {
          if (allowDeselect) applyActive(-1);
          else applyActive(activeIndex);
        } else {
          applyActive(i);
        }
      } else {
        if (Number.isFinite(id) && id !== -1) applyActive(i);
      }
    });

    container.appendChild(btn);
    btns.push(btn);
  }

  const apiHandle = { container, buttons: btns, _applyActiveLocal: applyActiveLocal, _activeIndex: activeIndex };
  if (Number.isFinite(id) && id !== -1) window.__tm_segmented_groups[id].push(apiHandle);

  if (Number.isFinite(initialIndex) && initialIndex >= 0 && initialIndex < btns.length) applyActive(initialIndex, false);
  else { if (!radio && !(Number.isFinite(id) && id !== -1)) applyActive(-1, false); }

  currentRow.appendChild(container);

  return {
    container,
    buttons: btns,
    getActive: () => activeIndex,
    setActive: (idx) => applyActive(idx),
    clearActive: () => applyActive(-1),
    setLabel: (idx, newLabel) => { if (idx >= 0 && idx < btns.length) btns[idx].textContent = String(newLabel); },
    enable: (idx, yes = true) => { if (idx >= 0 && idx < btns.length) { btns[idx].disabled = !yes; btns[idx].style.opacity = yes ? '1' : '0.5'; btns[idx].style.cursor = yes ? 'pointer' : 'default'; } }
  };
};


  api.addToggleButton = function (
    text = "Toggle",
    functionOn = null,
    functionOff = null,
    runOnEachFrameWhenOn = false,
    runOnEachFrameWhenOff = false,
    options = {}
) {
    ensureUI();
    if (!currentRow) api.addRow();

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

            // Start per-frame ON loop if enabled
            if (runOnEachFrameWhenOn && functionOn) {
                startFrameLoop(functionOn);
            }
        } else {
            // OFF
            try { functionOff && functionOff(); } catch (err) { console.error(err); }

            // Start per-frame OFF loop if enabled
            if (runOnEachFrameWhenOff && functionOff) {
                startFrameLoop(functionOff);
            }
        }
    });

    currentRow.appendChild(btn);
    return btn;
};
api.addHSpace = function (width = 8) {
    ensureUI();
    if (!currentRow) api.addRow();

    const spacer = document.createElement("div");
    spacer.style.display = "inline-block";
    spacer.style.width = width + "px";
    spacer.style.height = "1px";
    spacer.style.flex = "0 0 auto";

    currentRow.appendChild(spacer);
    return spacer;
};

api.addHLine = function (height = 16, color = "#666") {
    ensureUI();
    if (!currentRow) api.addRow();

    const line = document.createElement("div");
    line.style.display = "inline-block";
    line.style.width = "1px";
    line.style.height = height + "px";
    line.style.background = color;
    line.style.margin = "0 6px";
    line.style.flex = "0 0 auto";

    currentRow.appendChild(line);
    return line;
};

api.addLabel = function (textOrFn, color = null) {
    ensureUI();
    if (!currentRow) api.addRow();

    const span = document.createElement('span');
    span.className = 'tm-box-label';

    if (color) span.style.color = color;

    if (typeof textOrFn === 'function') {
        try { span.textContent = String(textOrFn()); }
        catch { span.textContent = 'Err'; }
        dynamicLabels.push({ el: span, fn: textOrFn });
    } else {
        span.textContent = textOrFn;
    }

    currentRow.appendChild(span);
    return span;
};
api.addButton = function (text, fn, textColor = null, bgColor = null, borderColor = null) {
    ensureUI();
    if (!currentRow) api.addRow();

    const btn = document.createElement('button');
    btn.className = 'tm-box-button';
    btn.textContent = text;

    if (textColor) btn.style.color = textColor;
    if (bgColor) btn.style.background = bgColor;
    if (borderColor) btn.style.borderColor = borderColor;

    btn.addEventListener('click', (e) => {
        try { fn && fn(e); } catch (err) { console.error(err); }
    });

    currentRow.appendChild(btn);
    return btn;
};
api.addLineSeperator = function (color = null) {
    ensureUI();
    currentRow = null;

    const hr = document.createElement('div');
    hr.className = 'tm-box-sep';

    if (color)
        hr.style.borderTop = `1px solid ${color}`;

    if (!currentTab) createTab('Default');

    currentTab.contentEl.appendChild(hr);
    return hr;
};

api.addRow = function (bg = null) {
    ensureUI();
    if (!currentTab) createTab('Default');

    const row = document.createElement('div');
    row.className = 'tm-box-row';

    if (bg) row.style.background = bg;

    currentTab.contentEl.appendChild(row);
    currentTab.rows.push(row);
    currentRow = row;
    return row;
};


  // expose
  window.box = api;

  // auto-clean if page unloads (keeps DOM tidy)
  window.addEventListener('beforeunload', () => {
    if (window.box && window.box._internals) {
      try { window.box.destroy(); } catch (e) {}
    }
  });
})();
