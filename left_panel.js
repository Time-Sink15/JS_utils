(function () {
    'use strict';

    function createTMPanel(options = {}) {
        const id = options.id || 'tm-panel-' + Math.floor(Math.random() * 1e9);
        const container = document.createElement('div');
        container.id = id;

        const css = `
            #${id} {
                position: fixed;
                left: 12px;
                top: 12px;
                width: 360px;
                height: 520px;
                background: rgba(255,255,255,0.97);
                border: 1px solid rgba(0,0,0,0.2);
                box-shadow: 0 6px 18px rgba(0,0,0,0.12);
                z-index: 999999999;
                display: flex;
                flex-direction: column;
                font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
                color: #111;
                border-radius: 8px;
                overflow: hidden;
            }
            #${id} .tm-tabrow {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px;
                min-height: 38px;
                max-height: 38px;
                overflow-x: auto;
                white-space: nowrap;
                background: linear-gradient(180deg, #f8f8f8, #efefef);
                border-bottom: 1px solid rgba(0,0,0,0.06);
            }
            #${id} .tm-tabrow::-webkit-scrollbar {
                height: 8px;
            }

            #${id} .tm-tabrow .tm-tab-btn {
                padding: 6px 10px;
                border-radius: 6px;
                background: transparent;
                border: 1px solid transparent;
                cursor: pointer;
                font-size: 13px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 160px;
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

        const body = document.createElement('div');
        body.className = 'tm-body';

        container.appendChild(tabRow);
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

                activateTab(tid);

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

    const tmPanel = createTMPanel();
    window.tmPanel = tmPanel;
    window.tm = tmPanel;
})();
