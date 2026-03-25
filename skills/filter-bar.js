/**
 * 筛选条件和按钮标准组件
 * 用于统一页面的筛选条件和按钮布局
 */

class FilterBar {
    /**
     * 构造函数
     * @param {Object} options - 配置选项
     * @param {string} options.container - 容器选择器
     * @param {Array} options.filters - 筛选条件选项
     * @param {Array} options.buttons - 按钮配置
     * @param {Function} options.onSearch - 搜索回调函数
     * @param {Function} options.onRefresh - 刷新回调函数
     */
    constructor(options) {
        this.container = document.querySelector(options.container);
        this.filters = options.filters || [
            { value: 'code', label: '编码' },
            { value: 'name', label: '名称' },
            { value: 'status', label: '状态' }
        ];
        this.buttons = options.buttons || [
            { id: 'add-btn', label: '新增', icon: 'plus', primary: true, onClick: null }
        ];
        this.onSearch = options.onSearch || function() {};
        this.onRefresh = options.onRefresh || function() {};
        this.advancedFilters = options.advancedFilters || [];
        
        this.init();
    }
    
    /**
     * 初始化组件
     */
    init() {
        this.render();
        this.bindEvents();
    }
    
    /**
     * 渲染组件
     */
    render() {
        const html = `
            <!-- 搜索条件和按钮 -->
            <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex-1 flex items-center space-x-2">
                    <!-- 筛选条件选择器 -->
                    <select id="filter-select" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none text-sm">
                        ${this.filters.map(filter => `
                            <option value="${filter.value}">${filter.label}</option>
                        `).join('')}
                    </select>
                    
                    <!-- 输入框 -->
                    <input type="text" id="filter-input" placeholder="按${this.filters[0].label}搜索" class="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                    
                    <!-- 搜索按钮 -->
                    <button id="search-btn" class="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">
                        <i data-lucide="search" class="w-4 h-4"></i>
                    </button>
                    
                    <!-- 刷新按钮 -->
                    <button id="refresh-btn" class="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">
                        <i data-lucide="refresh-ccw" class="w-4 h-4"></i>
                    </button>
                    
                    <!-- 高级筛选按钮 -->
                    <button id="advanced-filter-btn" class="px-3 py-2 text-primary hover:bg-secondary rounded-md transition-colors flex items-center">
                        高级筛选
                        <i data-lucide="chevron-down" class="w-4 h-4 ml-1"></i>
                    </button>
                </div>
                
                <!-- 按钮组 -->
                <div class="flex space-x-3">
                    ${this.buttons.map(button => `
                        <button id="${button.id}" class="px-4 py-2 ${button.primary ? 'bg-primary text-white hover:bg-blue-700' : 'bg-white border border-primary text-primary hover:bg-secondary'} rounded-md transition-colors flex items-center">
                            ${button.icon ? `<i data-lucide="${button.icon}" class="w-4 h-4 mr-2"></i>` : ''}
                            ${button.label}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <!-- 高级筛选条件 -->
            <div id="advanced-filter" class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 hidden">
                ${this.advancedFilters.map(filter => `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">${filter.label}</label>
                        ${filter.type === 'select' ? `
                            <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                ${filter.options.map(option => `
                                    <option value="${option.value}">${option.label}</option>
                                `).join('')}
                            </select>
                        ` : `
                            <input type="${filter.type || 'text'}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                        `}
                    </div>
                `).join('')}
            </div>
        `;
        
        this.container.innerHTML = html;
        
        // 初始化Lucide图标
        if (window.lucide) {
            lucide.createIcons();
        }
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 筛选条件选择器事件
        const filterSelect = document.getElementById('filter-select');
        const filterInput = document.getElementById('filter-input');
        
        filterSelect.addEventListener('change', () => {
            const selectedValue = filterSelect.value;
            const selectedFilter = this.filters.find(f => f.value === selectedValue);
            
            if (selectedFilter) {
                filterInput.placeholder = `按${selectedFilter.label}搜索`;
                filterInput.value = '';
            }
        });
        
        // 搜索按钮事件
        document.getElementById('search-btn').addEventListener('click', () => {
            this.onSearch({
                filter: document.getElementById('filter-select').value,
                keyword: document.getElementById('filter-input').value
            });
        });
        
        // 刷新按钮事件
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.onRefresh();
        });
        
        // 高级筛选按钮事件
        const advancedFilterBtn = document.getElementById('advanced-filter-btn');
        const advancedFilter = document.getElementById('advanced-filter');
        
        advancedFilterBtn.addEventListener('click', () => {
            advancedFilter.classList.toggle('hidden');
            
            // 切换按钮文本和图标
            if (!advancedFilter.classList.contains('hidden')) {
                advancedFilterBtn.innerHTML = '收起筛选 <i data-lucide="chevron-up" class="w-4 h-4 ml-1"></i>';
            } else {
                advancedFilterBtn.innerHTML = '高级筛选 <i data-lucide="chevron-down" class="w-4 h-4 ml-1"></i>';
            }
            
            // 重新初始化图标
            if (window.lucide) {
                lucide.createIcons();
            }
        });
        
        // 按钮点击事件
        this.buttons.forEach(button => {
            if (button.onClick) {
                const btn = document.getElementById(button.id);
                if (btn) {
                    btn.addEventListener('click', button.onClick);
                }
            }
        });
    }
    
    /**
     * 获取筛选值
     * @returns {Object} 筛选值
     */
    getFilterValue() {
        return {
            filter: document.getElementById('filter-select').value,
            keyword: document.getElementById('filter-input').value
        };
    }
    
    /**
     * 重置筛选条件
     */
    reset() {
        document.getElementById('filter-select').value = this.filters[0].value;
        document.getElementById('filter-input').value = '';
        document.getElementById('filter-input').placeholder = `按${this.filters[0].label}搜索`;
    }
}

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterBar;
} else if (typeof window !== 'undefined') {
    window.FilterBar = FilterBar;
}
