/**
 * 移动端菜单管理器 - 处理侧滑菜单和目录生成
 * 负责移动端菜单的显示/隐藏、目录生成、章节跳转等功能
 */
class MobileMenu {
    constructor() {
        // 菜单状态
        this.isVisible = false;
        this.currentToc = [];
        this.activeSection = null;
        
        // DOM 元素引用
        this.elements = {
            menu: null,
            overlay: null,
            closeBtn: null,
            tocContainer: null,
            contentFrame: null
        };
        
        // 配置选项
        this.config = {
            animationDuration: 300,
            scrollOffset: 60, // 滚动偏移量，考虑固定header高度
            tocLevels: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
        };
        
        // 事件监听器
        this.listeners = new Map();
        
        this.init();
    }
    
    /**
     * 初始化移动端菜单
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        
        console.log('MobileMenu initialized');
    }
    
    /**
     * 缓存DOM元素引用
     */
    cacheElements() {
        this.elements.menu = document.getElementById('mobileMenu');
        this.elements.overlay = document.getElementById('mobileMenuOverlay');
        this.elements.closeBtn = document.getElementById('mobileMenuClose');
        this.elements.tocContainer = document.getElementById('tableOfContents');
        this.elements.contentFrame = document.getElementById('contentFrame');
        
        // 验证必要元素是否存在
        if (!this.elements.menu || !this.elements.overlay || !this.elements.tocContainer) {
            throw new Error('MobileMenu: Required DOM elements not found');
        }
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 关闭按钮点击事件
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }
        
        // 遮罩层点击事件
        this.elements.overlay.addEventListener('click', () => {
            this.hide();
        });
        
        // 阻止菜单内部点击事件冒泡
        this.elements.menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // 监听iframe内容加载完成
        if (this.elements.contentFrame) {
            this.elements.contentFrame.addEventListener('load', () => {
                this.generateTableOfContents();
            });
        }
        
        // 键盘事件监听
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }
    
    /**
     * 显示移动端菜单
     */
    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        
        // 显示遮罩层和菜单
        this.elements.overlay.classList.add('show');
        this.elements.menu.classList.add('show');
        
        // 防止背景滚动
        document.body.style.overflow = 'hidden';
        
        // 生成目录（如果还没有生成）
        if (this.currentToc.length === 0) {
            this.generateTableOfContents();
        }
        
        // 触发显示事件
        this.emit('show', {
            timestamp: Date.now(),
            tocItems: this.currentToc.length
        });
        
        console.log('Mobile menu shown');
    }
    
    /**
     * 隐藏移动端菜单
     */
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        
        // 隐藏遮罩层和菜单
        this.elements.overlay.classList.remove('show');
        this.elements.menu.classList.remove('show');
        
        // 恢复背景滚动
        document.body.style.overflow = '';
        
        // 触发隐藏事件
        this.emit('hide', {
            timestamp: Date.now()
        });
        
        console.log('Mobile menu hidden');
    }
    
    /**
     * 切换菜单显示状态
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * 生成目录结构 - 使用全局TableOfContents组件
     */
    generateTableOfContents() {
        try {
            // 使用全局的TableOfContents组件
            if (window.noteRenderer && window.noteRenderer.tableOfContents) {
                // 获取当前笔记信息
                const currentNote = this.getCurrentNote();
                if (currentNote && this.elements.contentFrame) {
                    // 使用TableOfContents组件生成目录
                    const toc = window.noteRenderer.tableOfContents.generateFromContent(
                        currentNote, 
                        this.elements.contentFrame
                    );
                    this.currentToc = toc;
                    console.log(`Generated TOC with ${this.currentToc.length} items via TableOfContents component`);
                    return;
                }
            }
            
            // 回退到原有实现
            this.generateTableOfContentsLegacy();
            
        } catch (error) {
            console.error('Failed to generate table of contents:', error);
            this.generateTableOfContentsLegacy();
        }
    }
    
    /**
     * 获取当前笔记信息
     * @returns {Object|null} 当前笔记对象
     */
    getCurrentNote() {
        // 从全局变量获取当前笔记信息
        if (window.currentNoteId && window.notes) {
            return window.notes.find(note => note.id === window.currentNoteId);
        }
        return null;
    }
    
    /**
     * 生成目录结构 - 原有实现（作为回退方案）
     */
    generateTableOfContentsLegacy() {
        try {
            // 清空当前目录
            this.currentToc = [];
            
            // 获取iframe内容
            const iframeDoc = this.getIframeDocument();
            if (!iframeDoc) {
                this.renderEmptyToc();
                return;
            }
            
            // 查找所有标题元素
            const headings = this.findHeadings(iframeDoc);
            
            if (headings.length === 0) {
                this.renderEmptyToc();
                return;
            }
            
            // 处理标题数据
            this.currentToc = this.processHeadings(headings);
            
            // 渲染目录
            this.renderTableOfContents();
            
            // 设置滚动监听（用于高亮当前章节）
            this.setupScrollListener(iframeDoc);
            
            console.log(`Generated TOC with ${this.currentToc.length} items (legacy)`);
            
        } catch (error) {
            console.error('Failed to generate table of contents (legacy):', error);
            this.renderEmptyToc();
        }
    }
    
    /**
     * 获取iframe文档对象
     * @returns {Document|null}
     */
    getIframeDocument() {
        try {
            if (!this.elements.contentFrame || !this.elements.contentFrame.contentDocument) {
                return null;
            }
            
            const iframeDoc = this.elements.contentFrame.contentDocument;
            
            // 检查文档是否已加载
            if (iframeDoc.readyState !== 'complete') {
                return null;
            }
            
            return iframeDoc;
        } catch (error) {
            // 跨域或其他安全限制可能导致无法访问iframe内容
            console.warn('Cannot access iframe document (possible CORS issue):', error);
            return null;
        }
    }
    
    /**
     * 查找文档中的所有标题元素
     * @param {Document} doc - 文档对象
     * @returns {Array} 标题元素数组
     */
    findHeadings(doc) {
        const selector = this.config.tocLevels.join(', ');
        const headings = Array.from(doc.querySelectorAll(selector));
        
        // 按在文档中的顺序排序
        return headings.sort((a, b) => {
            const position = a.compareDocumentPosition(b);
            return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        });
    }
    
    /**
     * 处理标题数据，生成目录结构
     * @param {Array} headings - 标题元素数组
     * @returns {Array} 处理后的目录数据
     */
    processHeadings(headings) {
        return headings.map((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            const text = heading.textContent.trim();
            const id = heading.id || this.generateHeadingId(text, index);
            
            // 如果标题没有id，为其添加id
            if (!heading.id) {
                heading.id = id;
            }
            
            return {
                id,
                text,
                level,
                element: heading,
                index
            };
        });
    }
    
    /**
     * 为标题生成唯一ID
     * @param {string} text - 标题文本
     * @param {number} index - 索引
     * @returns {string} 生成的ID
     */
    generateHeadingId(text, index) {
        // 简单的ID生成策略
        const baseId = text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fff]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        return `heading-${baseId}-${index}`;
    }
    
    /**
     * 渲染目录列表
     */
    renderTableOfContents() {
        if (this.currentToc.length === 0) {
            this.renderEmptyToc();
            return;
        }
        
        const tocHtml = this.currentToc.map(item => {
            return `
                <li class="toc-item">
                    <a href="#${item.id}" 
                       class="toc-link toc-level-${item.level}" 
                       data-heading-id="${item.id}"
                       data-heading-index="${item.index}">
                        ${this.escapeHtml(item.text)}
                    </a>
                </li>
            `;
        }).join('');
        
        this.elements.tocContainer.innerHTML = tocHtml;
        
        // 绑定目录链接点击事件
        this.bindTocLinkEvents();
    }
    
    /**
     * 渲染空目录提示
     */
    renderEmptyToc() {
        this.elements.tocContainer.innerHTML = '<li class="no-toc-message">暂无目录</li>';
    }
    
    /**
     * 绑定目录链接点击事件
     */
    bindTocLinkEvents() {
        const tocLinks = this.elements.tocContainer.querySelectorAll('.toc-link');
        
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const headingId = link.getAttribute('data-heading-id');
                const headingIndex = parseInt(link.getAttribute('data-heading-index'));
                
                this.scrollToHeading(headingId, headingIndex);
                this.setActiveSection(headingId);
                
                // 点击后隐藏菜单
                this.hide();
            });
        });
    }
    
    /**
     * 滚动到指定标题
     * @param {string} headingId - 标题ID
     * @param {number} headingIndex - 标题索引
     */
    scrollToHeading(headingId, headingIndex) {
        try {
            const iframeDoc = this.getIframeDocument();
            if (!iframeDoc) return;
            
            const targetElement = iframeDoc.getElementById(headingId);
            if (!targetElement) {
                console.warn(`Heading element not found: ${headingId}`);
                return;
            }
            
            // 计算滚动位置
            const elementTop = targetElement.offsetTop;
            const scrollTop = Math.max(0, elementTop - this.config.scrollOffset);
            
            // 执行滚动
            iframeDoc.documentElement.scrollTop = scrollTop;
            iframeDoc.body.scrollTop = scrollTop; // 兼容性处理
            
            // 触发滚动事件
            this.emit('scroll', {
                headingId,
                headingIndex,
                scrollTop
            });
            
            console.log(`Scrolled to heading: ${headingId}`);
            
        } catch (error) {
            console.error('Failed to scroll to heading:', error);
        }
    }
    
    /**
     * 设置当前活跃章节
     * @param {string} headingId - 标题ID
     */
    setActiveSection(headingId) {
        // 移除之前的活跃状态
        const prevActive = this.elements.tocContainer.querySelector('.toc-link.active');
        if (prevActive) {
            prevActive.classList.remove('active');
        }
        
        // 设置新的活跃状态
        const newActive = this.elements.tocContainer.querySelector(`[data-heading-id="${headingId}"]`);
        if (newActive) {
            newActive.classList.add('active');
            this.activeSection = headingId;
        }
    }
    
    /**
     * 设置滚动监听，用于自动高亮当前章节
     * @param {Document} iframeDoc - iframe文档对象
     */
    setupScrollListener(iframeDoc) {
        // 移除之前的监听器
        if (this.scrollListener) {
            iframeDoc.removeEventListener('scroll', this.scrollListener);
        }
        
        // 创建新的滚动监听器
        this.scrollListener = this.debounce(() => {
            this.updateActiveSection(iframeDoc);
        }, 100);
        
        iframeDoc.addEventListener('scroll', this.scrollListener);
    }
    
    /**
     * 根据滚动位置更新活跃章节
     * @param {Document} iframeDoc - iframe文档对象
     */
    updateActiveSection(iframeDoc) {
        if (this.currentToc.length === 0) return;
        
        const scrollTop = iframeDoc.documentElement.scrollTop || iframeDoc.body.scrollTop;
        const windowHeight = iframeDoc.documentElement.clientHeight;
        
        // 找到当前可见的标题
        let activeHeading = null;
        
        for (let i = this.currentToc.length - 1; i >= 0; i--) {
            const heading = this.currentToc[i];
            const element = iframeDoc.getElementById(heading.id);
            
            if (element) {
                const elementTop = element.offsetTop;
                
                if (elementTop <= scrollTop + this.config.scrollOffset) {
                    activeHeading = heading;
                    break;
                }
            }
        }
        
        // 如果没有找到合适的标题，使用第一个
        if (!activeHeading && this.currentToc.length > 0) {
            activeHeading = this.currentToc[0];
        }
        
        // 更新活跃状态
        if (activeHeading && activeHeading.id !== this.activeSection) {
            this.setActiveSection(activeHeading.id);
        }
    }
    
    /**
     * HTML转义
     * @param {string} text - 要转义的文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    /**
     * 获取当前菜单状态
     * @returns {Object} 菜单状态对象
     */
    getMenuState() {
        return {
            isVisible: this.isVisible,
            tocItems: this.currentToc.length,
            activeSection: this.activeSection,
            hasContent: this.elements.contentFrame && this.elements.contentFrame.src
        };
    }
    
    /**
     * 刷新目录
     */
    refresh() {
        this.generateTableOfContents();
        console.log('Mobile menu refreshed');
    }
    
    /**
     * 事件发射器 - 触发自定义事件
     * @param {string} eventName - 事件名称
     * @param {Object} data - 事件数据
     */
    emit(eventName, data) {
        const event = new CustomEvent(`mobileMenu:${eventName}`, {
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
        window.addEventListener(`mobileMenu:${eventName}`, callback);
    }
    
    /**
     * 移除事件监听器
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(eventName, callback) {
        window.removeEventListener(`mobileMenu:${eventName}`, callback);
    }
    
    /**
     * 销毁移动端菜单
     */
    destroy() {
        // 隐藏菜单
        this.hide();
        
        // 移除滚动监听器
        if (this.scrollListener) {
            const iframeDoc = this.getIframeDocument();
            if (iframeDoc) {
                iframeDoc.removeEventListener('scroll', this.scrollListener);
            }
        }
        
        // 清理数据
        this.currentToc = [];
        this.activeSection = null;
        this.elements = {};
        
        console.log('MobileMenu destroyed');
    }
}

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileMenu;
}