/**
 * PRD Viewer（增强版）
 * 右下浮动按钮 + 右侧抽屉，展示本页对应的 PRD 章节 + 变更记录。
 *
 * 功能：
 *   A. 抽屉内搜索（高亮 + 上一条/下一条 + 计数）
 *   B. 锚点目录（h2/h3/h4 自动生成，滚动联动高亮，点击跳转）
 *   C. 快捷键（? 或 Ctrl/Cmd+K 打开；Esc 关闭；/ 聚焦搜索；↑↓ 导航结果）
 *   D. 抽屉宽度（默认 640px，左边缘拖拽，localStorage 记忆）
 *
 * 数据源：common/prd-sections.json（由 tools/build-prd.py 构建）
 */
(function () {
    'use strict';

    if (window.__prdViewerInjected__) return;
    window.__prdViewerInjected__ = true;

    // ---------- 常量 ----------
    var ASSET_PREFIX = '';
    var DATA_URL = ASSET_PREFIX + 'common/prd-sections.json';
    var SOURCE_URL = ASSET_PREFIX + 'PRD/prd.md';
    var FULL_URL = ASSET_PREFIX + 'common/prd-full.html';

    var STORAGE_KEY_WIDTH = 'prd-viewer.width';
    var DEFAULT_WIDTH = 640;
    var MIN_WIDTH = 420;
    // 最大宽度在运行期按视口宽度计算

    // ---------- 工具 ----------
    function getPageKey() {
        var name = (window.location.pathname || '').split('/').pop() || '';
        return name || 'index.html';
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '\u0026amp;')
            .replace(/</g, '\u0026lt;')
            .replace(/>/g, '\u0026gt;')
            .replace(/"/g, '\u0026quot;')
            .replace(/'/g, '\u0026#39;');
    }

    function renderInline(text) {
        var safe = escapeHtml(text);
        return safe.replace(/`([^`]+)`/g, function (_m, code) {
            return '<code>' + code + '</code>';
        });
    }

    function slugify(text, seen) {
        var base = String(text).trim().replace(/\s+/g, '-').replace(/[^\w\-\u4e00-\u9fa5]+/g, '');
        if (!base) base = 'section';
        var slug = base;
        var i = 2;
        while (seen[slug]) {
            slug = base + '-' + i++;
        }
        seen[slug] = true;
        return slug;
    }

    // ---------- Markdown 渲染（带 anchor） ----------
    /**
     * @returns {{ html: string, headings: Array<{level:number, text:string, id:string}> }}
     */
    function renderMarkdown(md) {
        if (!md) return { html: '', headings: [] };
        var lines = md.split(/\r?\n/);
        var out = [];
        var headings = [];
        var seen = {};
        var listStack = [];

        function closeListsUntil(indent) {
            while (listStack.length && listStack[listStack.length - 1] > indent) {
                out.push('</ul>');
                listStack.pop();
            }
        }
        function closeAllLists() {
            while (listStack.length) { out.push('</ul>'); listStack.pop(); }
        }

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].replace(/\s+$/, '');
            if (!line.trim()) { closeAllLists(); continue; }

            var h = /^(#{1,4})\s+(.*)$/.exec(line);
            if (h) {
                closeAllLists();
                var level = h[1].length;
                var text = h[2];
                var id = slugify(text, seen);
                if (level >= 2 && level <= 4) {
                    headings.push({ level: level, text: text, id: id });
                }
                out.push('<h' + level + ' id="' + id + '" data-anchor="' + id + '">' + renderInline(text) + '</h' + level + '>');
                continue;
            }
            if (/^---+\s*$/.test(line)) {
                closeAllLists();
                out.push('<hr>');
                continue;
            }
            var li = /^(\s*)-\s+(.*)$/.exec(line);
            if (li) {
                var indent = li[1].length;
                if (!listStack.length || listStack[listStack.length - 1] < indent) {
                    out.push('<ul>'); listStack.push(indent);
                } else {
                    closeListsUntil(indent);
                    if (!listStack.length || listStack[listStack.length - 1] < indent) {
                        out.push('<ul>'); listStack.push(indent);
                    }
                }
                out.push('<li>' + renderInline(li[2]) + '</li>');
                continue;
            }
            closeAllLists();
            out.push('<p>' + renderInline(line) + '</p>');
        }
        closeAllLists();
        return { html: out.join('\n'), headings: headings };
    }

    function renderChangelog(list) {
        if (!list || !list.length) {
            return '<div class="prd-changelog-empty">该页面暂无变更记录</div>';
        }
        var html = '<ul class="prd-changelog-list">';
        list.forEach(function (item) {
            html += '<li class="prd-changelog-item">' +
                '<div>' +
                    '<span class="prd-changelog-date">' + escapeHtml(item.date) + '</span>' +
                    (item.scope ? '<span class="prd-changelog-scope">' + escapeHtml(item.scope) + '</span>' : '') +
                '</div>' +
                '<div class="prd-changelog-summary">' + renderInline(item.summary) + '</div>' +
            '</li>';
        });
        return html + '</ul>';
    }

    function renderTOC(headings) {
        if (!headings || !headings.length) {
            return '<div class="prd-viewer-toc-empty">（无章节标题）</div>';
        }
        var html = '<ul class="prd-viewer-toc-list">';
        headings.forEach(function (h) {
            html += '<li class="prd-viewer-toc-item level-' + h.level + '" data-target="' + h.id + '">' +
                    escapeHtml(h.text) + '</li>';
        });
        return html + '</ul>';
    }

    // ---------- 图标 ----------
    var FAB_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
    var CLOSE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>';

    // ---------- DOM 构建 ----------
    function buildDOM(data, rendered) {
        var fab = document.createElement('button');
        fab.className = 'prd-viewer-fab';
        fab.setAttribute('data-tip', '查看本页 PRD（? 键打开）');
        fab.setAttribute('aria-label', '查看本页 PRD');
        fab.innerHTML = FAB_ICON;

        var backdrop = document.createElement('div');
        backdrop.className = 'prd-viewer-backdrop';

        var drawer = document.createElement('aside');
        drawer.className = 'prd-viewer-drawer';
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-label', 'PRD 查看');

        var moduleLabel = data.section
            ? data.module + ' / ' + data.section
            : data.module || '未关联模块';
        var changelogCount = (data.changelog && data.changelog.length) || 0;

        drawer.innerHTML =
            '<div class="prd-viewer-resizer" title="拖拽调整宽度"></div>' +
            '<div class="prd-viewer-header">' +
                '<div>' +
                    '<div class="prd-viewer-title">' + escapeHtml(data.title || '产品需求') + '</div>' +
                    '<div class="prd-viewer-subtitle">' + escapeHtml(moduleLabel) + '</div>' +
                '</div>' +
                '<div style="display:flex;gap:4px;align-items:center">' +
                    '<button class="prd-viewer-search-btn" data-act="toggle-search" title="搜索 (/)">🔍</button>' +
                    '<button class="prd-viewer-search-btn" data-act="toggle-help" title="快捷键 (?)">?</button>' +
                    '<button class="prd-viewer-close" aria-label="关闭">' + CLOSE_ICON + '</button>' +
                '</div>' +
            '</div>' +
            '<div class="prd-viewer-searchbar">' +
                '<input type="text" placeholder="在本页 PRD 内搜索..." />' +
                '<span class="prd-viewer-search-count">0 / 0</span>' +
                '<button class="prd-viewer-search-btn" data-act="prev" title="上一条 (↑)">▲</button>' +
                '<button class="prd-viewer-search-btn" data-act="next" title="下一条 (↓)">▼</button>' +
            '</div>' +
            '<div class="prd-viewer-tabs">' +
                '<button class="prd-viewer-tab active" data-tab="prd">需求描述</button>' +
                '<button class="prd-viewer-tab" data-tab="changelog">变更记录' +
                    (changelogCount ? '<span class="count">' + changelogCount + '</span>' : '') +
                '</button>' +
            '</div>' +
            '<div class="prd-viewer-layout">' +
                '<nav class="prd-viewer-toc" aria-label="本页目录">' +
                    '<div class="prd-viewer-toc-title">目录</div>' +
                    renderTOC(rendered.headings) +
                '</nav>' +
                '<div class="prd-viewer-body">' +
                    '<div class="prd-viewer-pane active" data-pane="prd">' +
                        (data.missing
                            ? '<div class="prd-viewer-missing">该页面暂无 PRD 描述。<br>请在 <code>PRD/prd.md</code> 中补充对应章节。</div>'
                            : '<div class="prd-md">' + rendered.html + '</div>') +
                    '</div>' +
                    '<div class="prd-viewer-pane" data-pane="changelog">' +
                        renderChangelog(data.changelog) +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="prd-viewer-footer">' +
                '<a href="' + FULL_URL + '?page=' + encodeURIComponent(getPageKey()) + '" target="_blank" rel="noopener" title="在新标签页打开 PRD 全文并高亮本章节">在 prd.md 中查看完整文档 ↗</a>' +
                '<button class="prd-copy-btn">复制本页内容</button>' +
            '</div>';

        var help = document.createElement('div');
        help.className = 'prd-viewer-help';
        help.innerHTML =
            '<div class="prd-viewer-help-title">快捷键 ' +
                '<button class="prd-viewer-help-close" aria-label="关闭">×</button>' +
            '</div>' +
            '<div class="prd-viewer-help-row"><span><kbd>?</kbd> <kbd>Ctrl/⌘</kbd>+<kbd>K</kbd></span><span>打开/关闭抽屉</span></div>' +
            '<div class="prd-viewer-help-row"><span><kbd>Esc</kbd></span><span>关闭抽屉 / 清除搜索</span></div>' +
            '<div class="prd-viewer-help-row"><span><kbd>/</kbd></span><span>聚焦搜索框</span></div>' +
            '<div class="prd-viewer-help-row"><span><kbd>↑</kbd> <kbd>↓</kbd> / <kbd>Enter</kbd></span><span>搜索结果上/下一条</span></div>' +
            '<div class="prd-viewer-help-row"><span><kbd>1</kbd> <kbd>2</kbd></span><span>切换 Tab（抽屉打开时）</span></div>';

        var toast = document.createElement('div');
        toast.className = 'prd-viewer-toast';

        document.body.appendChild(fab);
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
        document.body.appendChild(help);
        document.body.appendChild(toast);

        return { fab: fab, backdrop: backdrop, drawer: drawer, help: help, toast: toast };
    }

    // ---------- 搜索（A） ----------
    function createSearcher(drawer) {
        var bar = drawer.querySelector('.prd-viewer-searchbar');
        var input = bar.querySelector('input');
        var countEl = bar.querySelector('.prd-viewer-search-count');
        var btnPrev = bar.querySelector('[data-act="prev"]');
        var btnNext = bar.querySelector('[data-act="next"]');
        var hits = [];
        var current = -1;

        function activePane() {
            return drawer.querySelector('.prd-viewer-pane.active');
        }

        function clear() {
            var pane = activePane();
            if (!pane) return;
            pane.querySelectorAll('mark.prd-hit').forEach(function (m) {
                var parent = m.parentNode;
                parent.replaceChild(document.createTextNode(m.textContent), m);
                parent.normalize();
            });
            hits = [];
            current = -1;
            updateCount();
        }

        function updateCount() {
            countEl.textContent = hits.length ? (current + 1) + ' / ' + hits.length : '0 / 0';
            btnPrev.disabled = btnNext.disabled = hits.length === 0;
        }

        function highlight(term) {
            clear();
            if (!term) return;
            var pane = activePane();
            if (!pane) return;
            var rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$\u0026'), 'gi');

            function walk(node) {
                if (!node) return;
                if (node.nodeType === Node.TEXT_NODE) {
                    var text = node.nodeValue;
                    if (!text || !rx.test(text)) return;
                    rx.lastIndex = 0;
                    var frag = document.createDocumentFragment();
                    var last = 0, m;
                    while ((m = rx.exec(text)) !== null) {
                        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
                        var mk = document.createElement('mark');
                        mk.className = 'prd-hit';
                        mk.textContent = m[0];
                        frag.appendChild(mk);
                        hits.push(mk);
                        last = m.index + m[0].length;
                        if (m[0].length === 0) rx.lastIndex++;
                    }
                    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
                    node.parentNode.replaceChild(frag, node);
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    var tag = node.tagName;
                    if (tag === 'MARK' || tag === 'SCRIPT' || tag === 'STYLE') return;
                    var children = Array.prototype.slice.call(node.childNodes);
                    children.forEach(walk);
                }
            }
            walk(pane);
            if (hits.length) focusHit(0);
            updateCount();
        }

        function focusHit(idx) {
            if (!hits.length) return;
            if (idx < 0) idx = hits.length - 1;
            if (idx >= hits.length) idx = 0;
            hits.forEach(function (m) { m.classList.remove('current'); });
            hits[idx].classList.add('current');
            hits[idx].scrollIntoView({ block: 'center', behavior: 'smooth' });
            current = idx;
            updateCount();
        }

        function openBar() {
            bar.classList.add('open');
            setTimeout(function () { input.focus(); input.select(); }, 0);
        }
        function closeBar() {
            bar.classList.remove('open');
            input.value = '';
            clear();
        }
        function isOpen() { return bar.classList.contains('open'); }

        input.addEventListener('input', function () { highlight(input.value.trim()); });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                focusHit(e.shiftKey ? current - 1 : current + 1);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                if (input.value) { input.value = ''; clear(); }
                else closeBar();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault(); focusHit(current + 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault(); focusHit(current - 1);
            }
        });
        btnPrev.addEventListener('click', function () { focusHit(current - 1); });
        btnNext.addEventListener('click', function () { focusHit(current + 1); });

        return {
            open: openBar,
            close: closeBar,
            isOpen: isOpen,
            clear: clear,
            rerun: function () { if (input.value.trim()) highlight(input.value.trim()); },
            next: function () { focusHit(current + 1); },
            prev: function () { focusHit(current - 1); },
            focusInput: function () { openBar(); }
        };
    }

    // ---------- 目录联动（B） ----------
    function setupTOC(drawer) {
        var toc = drawer.querySelector('.prd-viewer-toc');
        var body = drawer.querySelector('.prd-viewer-body');
        var items = toc.querySelectorAll('.prd-viewer-toc-item');

        items.forEach(function (it) {
            it.addEventListener('click', function () {
                var target = it.getAttribute('data-target');
                var el = body.querySelector('[data-anchor="' + target + '"]');
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setActive(it);
                }
            });
        });

        function setActive(item) {
            items.forEach(function (x) { x.classList.toggle('active', x === item); });
        }

        // 滚动联动：当前可见区域最靠上的标题高亮
        body.addEventListener('scroll', function () {
            if (drawer.__tocSyncTimer) cancelAnimationFrame(drawer.__tocSyncTimer);
            drawer.__tocSyncTimer = requestAnimationFrame(function () {
                var anchors = body.querySelectorAll('[data-anchor]');
                if (!anchors.length) return;
                var top = body.getBoundingClientRect().top;
                var best = null;
                for (var i = 0; i < anchors.length; i++) {
                    var r = anchors[i].getBoundingClientRect();
                    if (r.top - top <= 24) best = anchors[i]; else break;
                }
                if (!best) best = anchors[0];
                var id = best.getAttribute('data-anchor');
                var item = toc.querySelector('[data-target="' + id + '"]');
                if (item) setActive(item);
            });
        });
    }

    // ---------- 宽度拖拽（D） ----------
    function setupResizer(drawer) {
        var handle = drawer.querySelector('.prd-viewer-resizer');
        var stored = parseInt(localStorage.getItem(STORAGE_KEY_WIDTH), 10);
        if (stored && stored >= MIN_WIDTH) applyWidth(stored);

        function applyWidth(w) {
            var max = Math.max(MIN_WIDTH, window.innerWidth - 40);
            w = Math.max(MIN_WIDTH, Math.min(max, w));
            drawer.style.width = w + 'px';
        }

        var dragging = false;
        handle.addEventListener('mousedown', function (e) {
            dragging = true;
            drawer.classList.add('resizing');
            handle.classList.add('dragging');
            document.body.style.cursor = 'ew-resize';
            e.preventDefault();
        });
        window.addEventListener('mousemove', function (e) {
            if (!dragging) return;
            // 宽度 = 视口右缘 - 鼠标 X
            applyWidth(window.innerWidth - e.clientX);
        });
        window.addEventListener('mouseup', function () {
            if (!dragging) return;
            dragging = false;
            drawer.classList.remove('resizing');
            handle.classList.remove('dragging');
            document.body.style.cursor = '';
            try {
                localStorage.setItem(STORAGE_KEY_WIDTH, parseInt(drawer.style.width, 10));
            } catch (_) {}
        });

        // 视口变化时约束宽度不超过视口
        window.addEventListener('resize', function () {
            var cur = parseInt(drawer.style.width, 10) || DEFAULT_WIDTH;
            applyWidth(cur);
        });
    }

    // ---------- 交互绑定 ----------
    function bindEvents(els, data) {
        var fab = els.fab, backdrop = els.backdrop, drawer = els.drawer, help = els.help, toast = els.toast;
        var searcher = createSearcher(drawer);
        setupTOC(drawer);
        setupResizer(drawer);

        function showToast(msg) {
            toast.textContent = msg;
            toast.classList.add('show');
            clearTimeout(toast.__t);
            toast.__t = setTimeout(function () { toast.classList.remove('show'); }, 1800);
        }

        function open() {
            backdrop.classList.add('open');
            drawer.classList.add('open');
        }
        function close() {
            backdrop.classList.remove('open');
            drawer.classList.remove('open');
            searcher.close();
            help.classList.remove('open');
        }
        function isOpen() { return drawer.classList.contains('open'); }
        function toggle() { isOpen() ? close() : open(); }

        fab.addEventListener('click', open);
        backdrop.addEventListener('click', close);
        drawer.querySelector('.prd-viewer-close').addEventListener('click', close);

        // 头部工具栏按钮
        drawer.querySelectorAll('[data-act]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                var act = btn.getAttribute('data-act');
                if (act === 'toggle-search') searcher.isOpen() ? searcher.close() : searcher.open();
                else if (act === 'toggle-help') help.classList.toggle('open');
            });
        });
        help.querySelector('.prd-viewer-help-close').addEventListener('click', function () {
            help.classList.remove('open');
        });

        // Tab 切换
        var tabs = drawer.querySelectorAll('.prd-viewer-tab');
        var panes = drawer.querySelectorAll('.prd-viewer-pane');
        var layout = drawer.querySelector('.prd-viewer-layout');
        function switchTab(name) {
            tabs.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-tab') === name); });
            panes.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-pane') === name); });
            // 标记当前 Tab，供 CSS 控制目录显示（变更记录 Tab 隐藏目录）
            if (layout) {
                layout.classList.toggle('tab-prd', name === 'prd');
                layout.classList.toggle('tab-changelog', name === 'changelog');
            }
            // 切换后重跑搜索（搜索作用于当前 pane）
            searcher.rerun();
        }
        // 初始化标记为需求描述 Tab
        if (layout) layout.classList.add('tab-prd');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () { switchTab(tab.getAttribute('data-tab')); });
        });

        // 复制
        drawer.querySelector('.prd-copy-btn').addEventListener('click', function () {
            var text = data.markdown || '';
            if (data.changelog && data.changelog.length) {
                text += '\n\n## 变更记录\n';
                data.changelog.forEach(function (c) {
                    text += '- ' + c.date + ' [' + (c.scope || '') + '] ' + c.summary + '\n';
                });
            }
            copyText(text, showToast);
        });

        // 全局快捷键（C）
        document.addEventListener('keydown', function (e) {
            var tag = (e.target && e.target.tagName) || '';
            var typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable);

            // 打开：? 或 Ctrl/Cmd+K
            if (!typing && (e.key === '?' || ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')))) {
                e.preventDefault();
                toggle();
                return;
            }
            if (!isOpen()) return;

            if (e.key === 'Escape') {
                // 若搜索栏开着则优先关闭搜索栏
                if (searcher.isOpen()) { searcher.close(); return; }
                if (help.classList.contains('open')) { help.classList.remove('open'); return; }
                close();
                return;
            }

            // 抽屉已打开，以下交互不应在编辑框中误触发
            if (typing) return;

            if (e.key === '/') {
                e.preventDefault();
                searcher.focusInput();
            } else if (e.key === 'ArrowDown') {
                if (searcher.isOpen()) { e.preventDefault(); searcher.next(); }
            } else if (e.key === 'ArrowUp') {
                if (searcher.isOpen()) { e.preventDefault(); searcher.prev(); }
            } else if (e.key === '1') {
                switchTab('prd');
            } else if (e.key === '2') {
                switchTab('changelog');
            }
        });
    }

    function copyText(text, showToast) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(
                function () { showToast('已复制到剪贴板'); },
                function () { fallbackCopy(text, showToast); }
            );
        } else {
            fallbackCopy(text, showToast);
        }
    }

    function fallbackCopy(text, showToast) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showToast('已复制到剪贴板'); }
        catch (_) { showToast('复制失败'); }
        document.body.removeChild(ta);
    }

    // ---------- 启动 ----------
    function init() {
        var pageKey = getPageKey();
        fetch(DATA_URL, { cache: 'no-cache' })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
            .then(function (json) {
                var sections = (json && json.sections) || {};
                var data = sections[pageKey];
                if (!data) {
                    data = { title: '产品需求', module: null, section: null, markdown: '', changelog: [], missing: true };
                }
                var rendered = data.missing
                    ? { html: '', headings: [] }
                    : renderMarkdown(data.markdown || '');
                var els = buildDOM(data, rendered);
                bindEvents(els, data);
                // 暴露调试接口
                window.PRDViewer = {
                    data: data,
                    open: function () { els.drawer.classList.add('open'); els.backdrop.classList.add('open'); },
                    close: function () { els.drawer.classList.remove('open'); els.backdrop.classList.remove('open'); }
                };
            })
            .catch(function (err) {
                console.warn('[prd-viewer] 加载 prd-sections.json 失败：', err);
                var data = { title: '产品需求', module: null, section: null, markdown: '', changelog: [], missing: true, _loadError: String(err && err.message || err) };
                var els = buildDOM(data, { html: '', headings: [] });
                bindEvents(els, data);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();