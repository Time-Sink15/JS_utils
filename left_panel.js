(function () {
'use strict';

function createTMPanel(options = {}) {
const id = options.id || 'tm-panel-' + Math.floor(Math.random() * 1e9);
const container = document.createElement('div');
container.id = id;

const css = `
           /* Panel container on left side */
#${id} {
   position: fixed;
   left: 12px;
   top: 12px;
   width: 360px;
   height: 520px;
   display: flex;
   flex-direction: column;
   border-radius: 8px;
   background: rgba(255,255,255,0.97);
   border: 1px solid rgba(0,0,0,0.2);
   box-shadow: 0 6px 18px rgba(0,0,0,0.12);
   z-index: 999999999;
   overflow: hidden;
}

/* Tab row */
#${id} .tm-tabrow {
   display: flex;
   flex-direction: row;
   align-items: center;
   gap: 6px;
   padding: 6px;
   min-height: 38px;
   max-height: 38px;

   overflow-x: auto;   /* enable horizontal scroll */
   overflow-y: hidden;
   white-space: nowrap; 
   flex-shrink: 0;
}
/* Line between tabs and content */
#${id} .tm-tab-separator {
   height: 1px;
   width: 100%;
    background-color: #888888
   flex-shrink: 0;
}
/* Tab buttons */
#${id} .tm-tabrow .tm-tab-btn {
   flex: 0 0 auto;     /* prevent shrinking, don't grow */
   padding: 6px 10px;
   border-radius: 6px;
   background: transparent;
   border: 1px solid transparent;
   cursor: pointer;
   font-size: 13px;
   white-space: nowrap;  /* don't wrap inside button */
}

/* Optional: scrollbar style */
#${id} .tm-tabrow::-webkit-scrollbar {
   height: 8px;
}

#${id} .tm-tabrow {
   scroll-behavior: smooth;
}

           #${id} .tm-tabrow .tm-tab-btn.active {
               background: white;
               border-color: rgba(0,0,0,0.08);
               box-shadow: 0 2px 6px rgba(0,0,0,0.06) inset;
           }
           #${id} .tm-body {
               flex: 1 1 auto;
               overflow: auto;
               padding: 8px;
           }
           #${id} .tm-tab-content {
               display: none;
           }
           #${id} .tm-tab-content.active {
               display: block;
           }
           #${id} .tm-btn {
               cursor: pointer;
               border: 1px solid rgba(0,0,0,0.08);
               background: transparent;
               border-radius: 4px;
               font-size: 13px;
           }
           #${id} .tm-separator {
               background: rgba(0,0,0,0.08);
           }
       `.trim();

const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);
const tabRow = document.createElement('div');
tabRow.className = 'tm-tabrow';

const tabSeparator = document.createElement('div');
tabSeparator.className = 'tm-tab-separator';

const body = document.createElement('div');
body.className = 'tm-body';

container.appendChild(tabRow);
container.appendChild(tabSeparator);  // <- separator between tabs and content
container.appendChild(body);

document.body.appendChild(container);

const tabs = [];
let currentTab = null;

function activateTab(tabId) {
for (const t of tabs) {
const is = t.id === tabId;
t.btn.classList.toggle('active', is);
t.content.classList.toggle('active', is);
if (is) currentTab = t;
}
}

const api = {
container,
tabRow,
body,
tabs,
currentTab: () => currentTab,

            newTab(title = 'Tab') {
                const tid = 'tm-tab-' + Math.floor(Math.random() * 1e9);
                const btn = document.createElement('button');
                btn.className = 'tm-tab-btn';
                btn.textContent = title;
                btn.title = title;

                const content = document.createElement('div');
                content.className = 'tm-tab-content';
                content.style.padding = '6px 2px';

                tabRow.appendChild(btn);
                body.appendChild(content);

                const tab = { id: tid, title, btn, content };
                tabs.push(tab);

                btn.addEventListener('click', () => {
                    activateTab(tid);
                });
if (tabs.length === 1) {
    activateTab(tid);
}

                return tab;
            },


selectTab(identifier) {
const t = tabs.find(tt => tt.id === identifier || tt.title === identifier);
if (!t) return false;
activateTab(t.id);
return true;
},

removeTab(identifier) {
const idx = tabs.findIndex(tt => tt.id === identifier || tt.title === identifier);
if (idx === -1) return false;
const t = tabs[idx];
t.btn.remove();
t.content.remove();
tabs.splice(idx, 1);
if (currentTab && currentTab.id === t.id) {
if (tabs.length) activateTab(tabs[0].id);
else currentTab = null;
}
return true;
},

exposeAs(varName) {
if (!varName || typeof varName !== 'string') return false;
try {
window[varName] = api;
return true;
} catch (e) {
return false;
}
},
createButton(text, parent, onClick) {
const btn = document.createElement('button');
btn.textContent = text;
btn.className = 'tm-btn';
btn.style.margin = '2px';
btn.style.padding = '2px 5px';
if (typeof onClick === 'function') btn.addEventListener('click', onClick);
(parent || (currentTab ? currentTab.content : body)).appendChild(btn);
return btn;
},

createLoneButton(text, onClick) {
const row = api.makeRowContainer();
const btn = document.createElement('button');
btn.textContent = text;
btn.style.margin = '2px';
btn.className = 'tm-btn';
btn.style.padding = '2px 5px';
if (typeof onClick === 'function') btn.addEventListener('click', onClick);
row.appendChild(btn);
return btn;
},

makeRowContainer() {
const r = document.createElement('div');
r.style.display = 'block';
r.style.marginBottom = '6px';
(currentTab ? currentTab.content : body).appendChild(r);
return r;
},

addLabel(text) {
const label = document.createElement('div');
label.textContent = text;
label.style.fontWeight = 'bold';
label.style.marginTop = '6px';
label.style.marginBottom = '4px';
(currentTab ? currentTab.content : body).appendChild(label);
return label;
},

addLabelToRow(text, parent) {
const label = document.createElement('span');
label.textContent = text;
label.style.fontWeight = 'bold';
label.style.marginTop = '6px';
label.style.marginBottom = '4px';
(parent || (currentTab ? currentTab.content : body)).appendChild(label);
return label;
},

addLine() {
const hr = document.createElement('div');
hr.style.height = '1px';
hr.style.background = '#000';
hr.className = 'tm-separator';
hr.style.margin = '6px 0';
(currentTab ? currentTab.content : body).appendChild(hr);
},

clearCurrentTab() {
if (!currentTab) return;
currentTab.content.innerHTML = '';
}
};

return api;
}
function lerpColor(color1, color2, t) {
return color1.map((c, i) => Math.round(c + (color2[i] - c) * t));
}

function rgbToCss(rgb) {
return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

function getBackgroundBrightness() {
const bg = getComputedStyle(document.body).backgroundColor;
const match = bg.match(/\d+/g);
if (!match) return 255;
const [r, g, b] = match.map(Number);
// Perceived brightness
return (0.299 * r + 0.587 * g + 0.114 * b);
}

// panels: array of panel containers
function applySmoothTheme(panels) {
const brightness = getBackgroundBrightness() / 255; // 0=dark, 1=bright
const t = 1 - brightness; // how dark we should be

const textLight = [0, 0, 0], textDark = [255, 255, 255];
const borderLight = [68, 68, 68], borderDark = [204, 204, 204];
const buttonLight = [246, 246, 246], buttonDark = [51, 51, 51];
const panelLight = [255, 255, 255], panelDark = [0, 0, 0];
const lineLight = [0, 0, 0], lineDark = [204, 204, 204];

const textColor = rgbToCss(lerpColor(textLight, textDark, t));
const borderColor = rgbToCss(lerpColor(borderLight, borderDark, t));
const buttonBg = rgbToCss(lerpColor(buttonLight, buttonDark, t));
const panelBg = `rgba(${lerpColor(panelLight, panelDark, t).join(",")},0.9)`;
const lineColor = rgbToCss(lerpColor(lineLight, lineDark, t));

panels.forEach(panel => {
// Panel container
panel.style.color = textColor;
panel.style.borderColor = borderColor;
panel.style.backgroundColor = panelBg;

// Tab buttons
panel.querySelectorAll(".tm-tab-btn").forEach(btn => {
btn.style.color = textColor;
btn.style.borderColor = borderColor;
btn.style.backgroundColor = buttonBg;
});

// Body buttons
panel.querySelectorAll(".tm-btn").forEach(btn => {
btn.style.color = textColor;
btn.style.borderColor = borderColor;
btn.style.backgroundColor = buttonBg;
});

// Separator lines
panel.querySelectorAll(".tm-separator").forEach(line => {
line.style.backgroundColor = lineColor;
});

});
}

setTimeout(() => {
    setInterval(() => applySmoothTheme([tmPanel.container]), 0);
}, 500);

const tmPanel = createTMPanel();
window.tmPanel = tmPanel;
window.tm = tmPanel;
})();
