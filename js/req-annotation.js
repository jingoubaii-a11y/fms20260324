var ReqAnnotation = (function() {
    var activeTooltips = {};
    var dragState = null;
    var floatingBadges = {};

    function runSelfCheck() {
        var badges = document.querySelectorAll('.req-badge');
        var warnings = [];

        badges.forEach(function(badge) {
            var reqNum = badge.getAttribute('data-req');
            var marker = badge.parentElement;
            var hasTitle = badge.hasAttribute('data-title');
            var hasContent = badge.hasAttribute('data-content');

            if (!hasTitle || !hasContent) {
                warnings.push('[角标' + reqNum + '] 缺少 data-title 或 data-content 属性');
            }
            if (marker && !marker.classList.contains('req-marker')) {
                warnings.push('[角标' + reqNum + '] 父元素缺少 req-marker class');
            }
        });

        var container = document.getElementById('req-tooltip-container');
        if (!container) {
            warnings.push('[全局] 缺少 #req-tooltip-container 容器元素');
        }

        var floatStyle = document.querySelector('.req-badge-float');
        if (!floatStyle) {
            var styleSheets = document.styleSheets;
            var hasFloatStyle = false;
            for (var i = 0; i < styleSheets.length; i++) {
                try {
                    var rules = styleSheets[i].cssRules || [];
                    for (var j = 0; j < rules.length; j++) {
                        if (rules[j].selectorText && rules[j].selectorText.indexOf('req-badge-float') !== -1) {
                            hasFloatStyle = true;
                            if (rules[j].style.position !== 'fixed') {
                                warnings.push('[CSS] .req-badge-float 缺少 position: fixed');
                            }
                            break;
                        }
                    }
                    if (hasFloatStyle) break;
                } catch(e) {}
            }
            if (!hasFloatStyle) {
                warnings.push('[CSS] 缺少 .req-badge-float 样式定义');
            }
        }

        if (warnings.length > 0) {
            console.warn('[ReqAnnotation] 自检发现 ' + warnings.length + ' 个问题：');
            warnings.forEach(function(w) { console.warn('  ⚠ ' + w); });
        } else {
            console.log('[ReqAnnotation] 自检通过 ✓ 共 ' + badges.length + ' 个角标');
        }

        return warnings.length === 0;
    }

    function createFloatingBadge(originalBadge) {
        var reqNum = originalBadge.getAttribute('data-req');
        if (floatingBadges[reqNum]) return floatingBadges[reqNum];

        var floatBadge = document.createElement('span');
        floatBadge.className = 'req-badge-float';
        floatBadge.setAttribute('data-req', reqNum);
        floatBadge.textContent = reqNum;

        floatBadge.addEventListener('mouseenter', function() {
            showTooltip(parseInt(reqNum));
        });

        document.body.appendChild(floatBadge);
        floatingBadges[reqNum] = { el: floatBadge, original: originalBadge };
        return floatingBadges[reqNum];
    }

    function updateFloatingPositions() {
        Object.keys(floatingBadges).forEach(function(reqNum) {
            var item = floatingBadges[reqNum];
            var marker = item.original.parentElement;
            if (!marker) return;

            var markerRect = marker.getBoundingClientRect();
            var badgeWidth = 20;
            var badgeHeight = 18;

            if (markerRect.width === 0 || markerRect.height === 0) {
                item.el.style.visibility = 'hidden';
                return;
            }

            item.el.style.visibility = 'visible';
            item.el.style.top = Math.max(0, markerRect.top - 10) + 'px';
            item.el.style.left = Math.max(0, markerRect.right - badgeWidth - 6) + 'px';
            item.el.style.width = badgeWidth + 'px';
            item.el.style.height = badgeHeight + 'px';
        });
    }

    function getRequirement(reqNum) {
        var badge = document.querySelector('.req-badge[data-req="' + reqNum + '"]');
        if (!badge) return null;
        return {
            num: reqNum,
            title: badge.getAttribute('data-title') || ('需求 ' + reqNum),
            content: badge.getAttribute('data-content') || ''
        };
    }

    function createTooltip(req) {
        var tooltip = document.createElement('div');
        tooltip.className = 'req-tooltip';
        tooltip.id = 'req-tooltip-' + req.num;
        tooltip.innerHTML = '<div class="req-tooltip-header">' +
            '<span class="req-tooltip-title"><span style="background:rgb(250,173,20);color:white;font-size:10px;font-weight:bold;padding:1px 4px;border-radius:2px;margin-right:6px;">' + req.num + '</span>' + req.title + '</span>' +
            '<span class="req-tooltip-close" onclick="ReqAnnotation.closeTooltip(' + req.num + ')">×</span>' +
            '</div>' +
            '<div class="req-tooltip-content">' + req.content + '</div>';

        tooltip.addEventListener('mousedown', function(e) {
            if (e.target.classList.contains('req-tooltip-close')) return;
            dragState = {
                tooltip: tooltip,
                startX: e.clientX,
                startY: e.clientY,
                initialLeft: tooltip.offsetLeft,
                initialTop: tooltip.offsetTop
            };
            e.preventDefault();
        });

        return tooltip;
    }

    function positionTooltip(tooltip, reqNum) {
        var floatItem = floatingBadges[reqNum];
        if (!floatItem || !floatItem.el) return;

        var badgeRect = floatItem.el.getBoundingClientRect();
        var tooltipWidth = 450;
        var tooltipMaxHeight = 500;
        var gap = 8;
        var safeMargin = 16;

        var left = badgeRect.left;
        var top = badgeRect.bottom + gap;

        if (left + tooltipWidth > window.innerWidth - safeMargin) {
            left = window.innerWidth - tooltipWidth - safeMargin;
        }
        if (top + tooltipMaxHeight > window.innerHeight - safeMargin) {
            top = badgeRect.top - gap - Math.min(tooltipMaxHeight, window.innerHeight * 0.7);
        }
        if (left < safeMargin) left = safeMargin;
        if (top < safeMargin) top = badgeRect.bottom + gap;

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }

    function showTooltip(reqNum) {
        if (activeTooltips[reqNum]) {
            var existing = document.getElementById('req-tooltip-' + reqNum);
            if (existing) existing.classList.add('show');
            return;
        }

        var req = getRequirement(reqNum);
        if (!req || !req.content) return;

        var tooltip = createTooltip(req);
        if (!tooltip) return;

        var container = document.getElementById('req-tooltip-container');
        if (container) {
            container.appendChild(tooltip);
            positionTooltip(tooltip, reqNum);
            tooltip.classList.add('show');
            activeTooltips[reqNum] = true;
        } else {
            console.error('[ReqAnnotation] 缺少 #req-tooltip-container，无法显示浮窗');
        }
    }

    function closeTooltip(reqNum) {
        var tooltip = document.getElementById('req-tooltip-' + reqNum);
        if (tooltip) {
            tooltip.classList.remove('show');
            setTimeout(function() { tooltip.remove(); }, 200);
        }
        delete activeTooltips[reqNum];
    }

    function init() {
        var badges = document.querySelectorAll('.req-badge');
        if (badges.length === 0) {
            console.log('[ReqAnnotation] 未找到任何 .req-badge 角标，跳过初始化');
            return;
        }

        runSelfCheck();

        badges.forEach(function(badge) {
            createFloatingBadge(badge);
        });

        function doPosition() {
            updateFloatingPositions();
        }

        doPosition();
        setTimeout(doPosition, 100);
        setTimeout(doPosition, 500);

        document.addEventListener('mousemove', function(e) {
            if (!dragState) return;
            var dx = e.clientX - dragState.startX;
            var dy = e.clientY - dragState.startY;
            dragState.tooltip.style.left = (dragState.initialLeft + dx) + 'px';
            dragState.tooltip.style.top = (dragState.initialTop + dy) + 'px';
        });

        document.addEventListener('mouseup', function() {
            dragState = null;
        });

        var ticking = false;
        function onScrollOrResize() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    updateFloatingPositions();
                    Object.keys(activeTooltips).forEach(function(num) {
                        var tt = document.getElementById('req-tooltip-' + num);
                        if (tt) positionTooltip(tt, parseInt(num));
                    });
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScrollOrResize, true);
        window.addEventListener('resize', onScrollOrResize);
    }

    return {
        init: init,
        closeTooltip: closeTooltip,
        showTooltip: showTooltip
    };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ReqAnnotation.init);
} else {
    ReqAnnotation.init();
}
