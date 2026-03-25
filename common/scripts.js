// 初始化Lucide图标
function initLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// 侧边栏折叠/展开功能
function initSidebar() {
    const toggleSidebar = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    
    if (toggleSidebar && sidebar && mainContent) {
        // 移除可能存在的旧事件监听器
        toggleSidebar.removeEventListener('click', handleSidebarToggle);
        
        // 定义处理函数
        function handleSidebarToggle() {
            sidebar.classList.toggle('collapsed');
            if (sidebar.classList.contains('collapsed')) {
                mainContent.classList.remove('ml-64');
                mainContent.classList.add('ml-16');
            } else {
                mainContent.classList.remove('ml-16');
                mainContent.classList.add('ml-64');
            }
        }
        
        // 添加新的事件监听器
        toggleSidebar.addEventListener('click', handleSidebarToggle);
    }
}

// 菜单展开/收拢功能
function initMenu() {
    const menuHeaders = document.querySelectorAll('.menu-header');
    
    menuHeaders.forEach(header => {
        // 移除可能存在的旧事件监听器
        header.removeEventListener('click', handleMenuToggle);
        
        // 定义处理函数
        function handleMenuToggle() {
            const menuName = header.getAttribute('data-menu');
            const content = document.getElementById(`${menuName}-content`);
            const icon = header.querySelector('.menu-icon');
            
            if (content && icon) {
                // 切换内容显示/隐藏
                content.classList.toggle('hidden');
                
                // 切换图标旋转
                if (content.classList.contains('hidden')) {
                    icon.style.transform = 'rotate(0deg)';
                } else {
                    icon.style.transform = 'rotate(180deg)';
                }
            }
        }
        
        // 添加新的事件监听器
        header.addEventListener('click', handleMenuToggle);
    });
}

// 高亮当前页面的导航项
function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && currentPath.includes(href)) {
            item.classList.add('active');
            
            // 展开包含当前页面的菜单
            const menuContent = item.closest('.menu-content');
            if (menuContent) {
                menuContent.classList.remove('hidden');
                const menuHeader = menuContent.previousElementSibling;
                if (menuHeader) {
                    const icon = menuHeader.querySelector('.menu-icon');
                    if (icon) {
                        icon.style.transform = 'rotate(180deg)';
                    }
                }
            }
        }
    });
}

// 抽屉功能
function initDrawers() {
    // 创建抽屉遮罩层
    let drawerOverlay = document.getElementById('drawer-overlay');
    if (!drawerOverlay) {
        drawerOverlay = document.createElement('div');
        drawerOverlay.className = 'drawer-overlay';
        drawerOverlay.id = 'drawer-overlay';
        document.body.appendChild(drawerOverlay);
    }
    
    // 打开抽屉
    window.openDrawer = function(drawer) {
        if (drawer && typeof drawer === 'object') {
            drawer.classList.add('open');
            drawerOverlay.classList.add('open');
        }
    };
    
    // 关闭抽屉
    window.closeDrawer = function(drawer) {
        if (drawer && typeof drawer === 'object') {
            drawer.classList.remove('open');
            drawerOverlay.classList.remove('open');
        }
    };
    
    // 点击遮罩层关闭所有抽屉
    drawerOverlay.removeEventListener('click', handleDrawerOverlayClick);
    function handleDrawerOverlayClick() {
        document.querySelectorAll('.drawer').forEach(drawer => {
            drawer.classList.remove('open');
        });
        drawerOverlay.classList.remove('open');
    }
    drawerOverlay.addEventListener('click', handleDrawerOverlayClick);
}

// 高级筛选功能
function initAdvancedFilter() {
    const advancedFilterBtn = document.getElementById('advanced-filter-btn');
    const advancedFilter = document.getElementById('advanced-filter');
    
    if (advancedFilterBtn && advancedFilter) {
        advancedFilterBtn.removeEventListener('click', handleAdvancedFilterToggle);
        function handleAdvancedFilterToggle() {
            advancedFilter.classList.toggle('hidden');
            
            // 切换按钮文本和图标
            if (!advancedFilter.classList.contains('hidden')) {
                this.innerHTML = '收起筛选 <i data-lucide="chevron-up" class="w-4 h-4 ml-1"></i>';
            } else {
                this.innerHTML = '高级筛选 <i data-lucide="chevron-down" class="w-4 h-4 ml-1"></i>';
            }
            
            // 重新初始化图标
            initLucideIcons();
        }
        advancedFilterBtn.addEventListener('click', handleAdvancedFilterToggle);
    }
}

// 筛选条件选择器功能
function initFilterSelect() {
    const filterSelect = document.getElementById('filter-select');
    const filterInput = document.getElementById('filter-input');
    
    if (filterSelect && filterInput) {
        filterSelect.removeEventListener('change', handleFilterSelectChange);
        function handleFilterSelectChange() {
            const selectedValue = this.value;
            
            // 根据选择的筛选条件更新占位符
            if (selectedValue === 'code') {
                filterInput.placeholder = '按编码搜索';
            } else if (selectedValue === 'name') {
                filterInput.placeholder = '按名称搜索';
            } else if (selectedValue === 'status') {
                filterInput.placeholder = '按状态搜索';
            }
            
            // 清空输入框
            filterInput.value = '';
        }
        filterSelect.addEventListener('change', handleFilterSelectChange);
    }
}

// 批量操作功能
function initBatchOperations() {
    const selectAllCheckbox = document.querySelector('input[type="checkbox"]');
    if (selectAllCheckbox) {
        selectAllCheckbox.removeEventListener('change', handleSelectAllChange);
        function handleSelectAllChange() {
            const checkboxes = document.querySelectorAll('table input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        }
        selectAllCheckbox.addEventListener('change', handleSelectAllChange);
    }
}

// 初始化所有功能
function initCommonFunctions() {
    // 确保DOM完全加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            performInit();
        });
    } else {
        performInit();
    }
    
    function performInit() {
        // 等待一小段时间确保侧边栏完全加载
        setTimeout(() => {
            initLucideIcons();
            initSidebar();
            initMenu();
            highlightCurrentPage();
            initDrawers();
            initAdvancedFilter();
            initFilterSelect();
            initBatchOperations();
        }, 200);
    }
}

// 导出初始化函数，方便动态加载时调用
window.initCommonFunctions = initCommonFunctions;