/**
 * 布局管理器 - 处理响应式布局切换和状态管理
 * 负责屏幕尺寸检测、布局模式切换、侧边栏状态管理等核心功能
 */
class LayoutManager {
    constructor() {
        // 断点配置 - 先初始化断点配置
        this.breakpoints = {
            mobile: 768,
            tablet: 1024,
            desktop: 1200
        };
        
        // 布局状态 - 在断点配置之后初始化
        this.currentMode = this.detectInitialMode();
        this.sidebarVisible = true;
        this.menuVisible = false;
        
        // 防抖定时器
        this.resizeTimer = null;
        this.debounceDelay = 150;
        
        // DOM 元素引用
        this.elements = {
            sidebar: null,
            mainContent: null,
            appContainer: null
        };
        
        // 事件监听器
        this.listeners = new Map();
        
        this.init();
    }
    
    /**
     * 初始化布局管理器
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.applyInitialLayout();
        
        console.log(`LayoutManager initialized in ${this.currentMode} mode`);
    }
    
    /**
     * 缓存DOM元素引用
     */
    cacheElements() {
        this.elements.sidebar = document.getElementById('sidebar');
        this.elements.mainContent = document.getElementById('mainContent');
        this.elements.appContainer = document.querySelector('.app-container');
        
        // 验证必要元素是否存在
        if (!this.elements.sidebar || !this.elements.mainContent || !this.elements.appContainer) {
            throw new Error('LayoutManager: Required DOM elements not found');
        }
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 窗口大小变化监听（带防抖）
        const debouncedResize = this.debounce(() => {
            this.handleResize();
        }, this.debounceDelay);
        
        window.addEventListener('resize', debouncedResize);
        this.listeners.set('resize', debouncedResize);
        
        // 方向变化监听（移动设备）
        window.addEventListener('orientationchange', () => {
            // 延迟处理，等待方向变化完成
            setTimeout(() => {
                this.handleResize();
            }, 100);
        });
    }
    
    /**
     * 检测初始布局模式
     * @returns {string} 'desktop' | 'mobile'
     */
    detectInitialMode() {
        return window.innerWidth > this.breakpoints.mobile ? 'desktop' : 'mobile';
    }
    
    /**
     * 检测当前屏幕尺寸对应的布局模式
     * @returns {string} 'desktop' | 'mobile'
     */
    detectScreenSize() {
        const width = window.innerWidth;
        
        if (width <= this.breakpoints.mobile) {
            return 'mobile';
        } else {
            return 'desktop';
        }
    }
    
    /**
     * 处理窗口大小变化
     */
    handleResize() {
        const newMode = this.detectScreenSize();
        const modeChanged = newMode !== this.currentMode;
        
        if (modeChanged) {
            console.log(`Layout mode changed: ${this.currentMode} -> ${newMode}`);
            this.switchMode(newMode);
        }
        
        // 触发布局更新事件
        this.emit('resize', {
            mode: this.currentMode,
            modeChanged,
            dimensions: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
    }
    
    /**
     * 切换布局模式
     * @param {string} mode - 'desktop' | 'mobile'
     */
    switchMode(mode) {
        if (mode === this.currentMode) {
            return;
        }
        
        const previousMode = this.currentMode;
        this.currentMode = mode;
        
        try {
            if (mode === 'desktop') {
                this.applyDesktopLayout();
            } else {
                this.applyMobileLayout();
            }
            
            // 触发模式切换事件
            this.emit('modeChange', {
                from: previousMode,
                to: mode,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('Layout mode switch failed:', error);
            // 回退到之前的模式
            this.currentMode = previousMode;
            throw error;
        }
    }
    
    /**
     * 应用桌面端布局
     */
    applyDesktopLayout() {
        // 重置移动端的变换
        this.elements.sidebar.classList.remove('hidden');
        this.elements.mainContent.classList.remove('show');
        
        // 确保侧边栏可见
        this.sidebarVisible = true;
        this.menuVisible = false;
        
        // 应用桌面端样式类
        this.elements.appContainer.classList.remove('mobile-layout');
        this.elements.appContainer.classList.add('desktop-layout');
        
        console.log('Applied desktop layout');
    }
    
    /**
     * 应用移动端布局
     */
    applyMobileLayout() {
        // 应用移动端样式类
        this.elements.appContainer.classList.remove('desktop-layout');
        this.elements.appContainer.classList.add('mobile-layout');
        
        // 根据当前状态决定显示哪个视图
        if (this.shouldShowNoteView()) {
            this.showMobileNoteView();
        } else {
            this.showMobileListView();
        }
        
        console.log('Applied mobile layout');
    }
    
    /**
     * 应用初始布局
     */
    applyInitialLayout() {
        if (this.currentMode === 'desktop') {
            this.applyDesktopLayout();
        } else {
            this.applyMobileLayout();
        }
    }
    
    /**
     * 切换侧边栏显示状态
     * @param {boolean} visible - 可选，指定显示状态
     */
    toggleSidebar(visible) {
        if (typeof visible === 'boolean') {
            this.sidebarVisible = visible;
        } else {
            this.sidebarVisible = !this.sidebarVisible;
        }
        
        if (this.currentMode === 'desktop') {
            // 桌面端侧边栏切换（可能需要动画效果）
            if (this.sidebarVisible) {
                this.elements.sidebar.classList.remove('collapsed');
            } else {
                this.elements.sidebar.classList.add('collapsed');
            }
        } else {
            // 移动端侧边栏切换
            if (this.sidebarVisible) {
                this.showMobileListView();
            } else {
                this.showMobileNoteView();
            }
        }
        
        this.emit('sidebarToggle', {
            visible: this.sidebarVisible,
            mode: this.currentMode
        });
        
        console.log(`Sidebar ${this.sidebarVisible ? 'shown' : 'hidden'} in ${this.currentMode} mode`);
    }
    
    /**
     * 切换移动端菜单显示状态
     * @param {boolean} visible - 可选，指定显示状态
     */
    toggleMobileMenu(visible) {
        if (this.currentMode !== 'mobile') {
            console.warn('toggleMobileMenu called in non-mobile mode');
            return;
        }
        
        if (typeof visible === 'boolean') {
            this.menuVisible = visible;
        } else {
            this.menuVisible = !this.menuVisible;
        }
        
        // 通过全局mobileMenu实例控制菜单显示
        if (window.mobileMenu) {
            if (this.menuVisible) {
                window.mobileMenu.show();
            } else {
                window.mobileMenu.hide();
            }
        }
        
        this.emit('menuToggle', {
            visible: this.menuVisible,
            mode: this.currentMode
        });
        
        console.log(`Mobile menu ${this.menuVisible ? 'shown' : 'hidden'}`);
    }
    
    /**
     * 显示移动端笔记视图
     */
    showMobileNoteView() {
        console.log('showMobileNoteView called');
        console.log('Before - sidebar classes:', this.elements.sidebar.className);
        console.log('Before - mainContent classes:', this.elements.mainContent.className);
        
        // 确保在移动端模式下才执行
        if (this.currentMode !== 'mobile') {
            console.warn('showMobileNoteView called in non-mobile mode');
            return;
        }
        
        // 强制重置状态，确保CSS正确应用
        this.elements.sidebar.classList.remove('hidden');
        this.elements.mainContent.classList.remove('show');
        
        // 使用 requestAnimationFrame 确保DOM更新后再应用新状态
        requestAnimationFrame(() => {
            this.elements.sidebar.classList.add('hidden');
            this.elements.mainContent.classList.add('show');
            this.sidebarVisible = false;
            
            console.log('After - sidebar classes:', this.elements.sidebar.className);
            console.log('After - mainContent classes:', this.elements.mainContent.className);
            
            // 验证CSS变换是否正确应用
            setTimeout(() => {
                const sidebarTransform = getComputedStyle(this.elements.sidebar).transform;
                const mainContentTransform = getComputedStyle(this.elements.mainContent).transform;
                console.log('Sidebar transform:', sidebarTransform);
                console.log('MainContent transform:', mainContentTransform);
            }, 50);
        });
        
        this.emit('viewChange', {
            view: 'note',
            mode: 'mobile'
        });
    }
    
    /**
     * 显示移动端列表视图
     */
    showMobileListView() {
        this.elements.sidebar.classList.remove('hidden');
        this.elements.mainContent.classList.remove('show');
        this.sidebarVisible = true;
        
        this.emit('viewChange', {
            view: 'list',
            mode: 'mobile'
        });
    }
    
    /**
     * 判断是否应该显示笔记视图（移动端）
     * @returns {boolean}
     */
    shouldShowNoteView() {
        // 检查是否有当前选中的笔记
        // 这个逻辑可能需要与其他组件协调
        const activeNote = document.querySelector('.note-item.active');
        return activeNote !== null;
    }
    
    /**
     * 获取当前布局状态
     * @returns {Object} 布局状态对象
     */
    getLayoutState() {
        return {
            currentMode: this.currentMode,
            sidebarVisible: this.sidebarVisible,
            menuVisible: this.menuVisible,
            dimensions: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            breakpoints: this.breakpoints
        };
    }
    
    /**
     * 强制刷新布局
     */
    refresh() {
        const currentMode = this.detectScreenSize();
        this.switchMode(currentMode);
        
        console.log('Layout refreshed');
    }
    
    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    debounce(func, delay) {
        return (...args) => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    /**
     * 事件发射器 - 触发自定义事件
     * @param {string} eventName - 事件名称
     * @param {Object} data - 事件数据
     */
    emit(eventName, data) {
        const event = new CustomEvent(`layout:${eventName}`, {
            detail: data
        });
        window.dispatchEvent(event);
    }
    
    /**
     * 添加事件监听器
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(eventName, callback) {
        window.addEventListener(`layout:${eventName}`, callback);
    }
    
    /**
     * 移除事件监听器
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(eventName, callback) {
        window.removeEventListener(`layout:${eventName}`, callback);
    }
    
    /**
     * 销毁布局管理器
     */
    destroy() {
        // 清理定时器
        if (this.resizeTimer) {
            clearTimeout(this.resizeTimer);
        }
        
        // 移除事件监听器
        this.listeners.forEach((listener, event) => {
            window.removeEventListener(event, listener);
        });
        this.listeners.clear();
        
        // 清理DOM引用
        this.elements = {};
        
        console.log('LayoutManager destroyed');
    }
}

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayoutManager;
}