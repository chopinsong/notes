/**
 * TableOfContents - 目录生成和导航组件
 * 负责自动解析笔记标题层级、生成目录结构、处理章节跳转和当前位置高亮
 */
class TableOfContents {
    constructor() {
        // 目录状态
        this.currentToc = [];
        this.activeSection = null;
        this.currentNote = null;
        
        // DOM 元素引用
        this.elements = {
            tocContainer: null,
            contentFrame: null
        };
        
        // 配置选项
        this.config = {
            scrollOffset: 60, // 滚动偏移量，考虑固定header高度
            tocLevels: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            highlightThreshold: 100, // 高亮阈值（像素）
            scrollDebounceDelay: 100 // 滚动防抖延迟
        };
        
        // 滚动监听器
        this.scrollListener = null;
        this.intersectionObserver = null;
        
        this.init();
    }
    
    /**
     * 初始化目录组件
     */
    init() {
        this.cacheElements();
        this.setupIntersectionObserver();
        
        console.log('TableOfContents initialized');
    }
    
    /**
     * 缓存DOM元素引用
     */
    cacheElements() {
        this.elements.tocContainer = document.getElementById('tableOfContents');
        this.elements.contentFrame = document.getElementById('contentFrame');
        
        if (!this.elements.tocContainer) {
            throw new Error('TableOfContents: TOC container element not found');
        }
    }
    
    /**
     * 设置Intersection Observer用于自动高亮
     */
    setupIntersectionObserver() {
        // 创建Intersection Observer用于检测标题元素的可见性
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                this.handleIntersectionChanges(entries);
            },
            {
                root: null, // 使用viewport作为root
                rootMargin: `-${this.config.scrollOffset}px 0px -50% 0px`,
                threshold: [0, 0.1, 0.5, 1.0]
            }
        );
    }
    
    /**
     * 处理Intersection Observer变化
     * @param {Array} entries - Intersection Observer条目
     */
    handleIntersectionChanges(entries) {
        let visibleHeadings = [];
        
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const headingId = entry.target.id;
                const tocItem = this.currentToc.find(item => item.id === headingId);
                if (tocItem) {
                    visibleHeadings.push({
                        ...tocItem,
                        intersectionRatio: entry.intersectionRatio,
                        boundingRect: entry.boundingClientRect
                    });
                }
            }
        });
        
        // 根据可见的标题确定当前活跃章节
        if (visibleHeadings.length > 0) {
            // 选择最靠近顶部且可见度最高的标题
            const activeHeading = visibleHeadings.reduce((prev, current) => {
                if (current.boundingRect.top < prev.boundingRect.top) {
                    return current;
                }
                if (current.boundingRect.top === prev.boundingRect.top) {
                    return current.intersectionRatio > prev.intersectionRatio ? current : prev;
                }
                return prev;
            });
            
            this.setActiveSection(activeHeading.id);
        }
    }
    
    /**
     * 从笔记内容生成目录结构
     * @param {Object} note - 笔记对象
     * @param {HTMLIFrameElement|HTMLElement} contentElement - 内容元素
     * @returns {Array} 目录数据数组
     */
    generateFromContent(note, contentElement) {
        try {
            this.currentNote = note;
            
            // 清空当前目录
            this.currentToc = [];
            
            // 获取文档对象
            const doc = this.getDocumentFromElement(contentElement);
            if (!doc) {
                this.renderEmptyToc();
                return [];
            }
            
            // 查找所有标题元素
            const headings = this.findHeadings(doc);
            
            if (headings.length === 0) {
                this.renderEmptyToc();
                return [];
            }
            
            // 处理标题数据
            this.currentToc = this.processHeadings(headings);
            
            // 渲染目录
            this.renderTableOfContents();
            
            // 设置滚动监听和Intersection Observer
            this.setupContentObservation(doc);
            
            // 触发目录生成事件
            this.emit('tocGenerated', {
                note: this.currentNote,
                toc: this.currentToc,
                headingCount: this.currentToc.length
            });
            
            console.log(`Generated TOC with ${this.currentToc.length} items for: ${note.title}`);
            
            return this.currentToc;
            
        } catch (error) {
            console.error('Failed to generate table of contents:', error);
            this.renderEmptyToc();
            return [];
        }
    }
    
    /**
     * 从元素获取文档对象
     * @param {HTMLIFrameElement|HTMLElement} element - 内容元素
     * @returns {Document|null} 文档对象
     */
    getDocumentFromElement(element) {
        try {
            if (element.tagName && element.tagName.toLowerCase() === 'iframe') {
                // iframe元素
                const iframeDoc = element.contentDocument || element.contentWindow?.document;
                
                if (!iframeDoc) {
                    console.warn('Cannot access iframe document (possible CORS issue)');
                    return null;
                }
                
                // 检查文档是否已加载
                if (iframeDoc.readyState !== 'complete') {
                    console.warn('Iframe document not fully loaded');
                    return null;
                }
                
                return iframeDoc;
            } else {
                // 普通HTML元素
                return element.ownerDocument || document;
            }
        } catch (error) {
            console.warn('Cannot access document from element:', error);
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
        // 生成基于文本内容的ID
        const baseId = text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fff]+/g, '-') // 保留中文字符
            .replace(/^-+|-+$/g, '');
        
        return baseId ? `heading-${baseId}-${index}` : `heading-${index}`;
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
                       data-heading-index="${item.index}"
                       data-heading-level="${item.level}">
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
                const headingLevel = parseInt(link.getAttribute('data-heading-level'));
                
                this.scrollToHeading(headingId, headingIndex);
                this.setActiveSection(headingId);
                
                // 触发章节跳转事件
                this.emit('sectionJump', {
                    headingId,
                    headingIndex,
                    headingLevel,
                    note: this.currentNote
                });
                
                // 在移动端点击目录项后关闭菜单
                if (window.mobileMenu && window.layoutManager && 
                    window.layoutManager.currentMode === 'mobile') {
                    window.mobileMenu.hide();
                }
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
            const doc = this.getDocumentFromElement(this.elements.contentFrame);
            if (!doc) {
                console.warn('Cannot access document for scrolling');
                return;
            }
            
            const targetElement = doc.getElementById(headingId);
            if (!targetElement) {
                console.warn(`Heading element not found: ${headingId}`);
                return;
            }
            
            // 计算滚动位置
            const elementTop = targetElement.offsetTop;
            const scrollTop = Math.max(0, elementTop - this.config.scrollOffset);
            
            // 执行平滑滚动
            if (doc.documentElement.scrollTo) {
                doc.documentElement.scrollTo({
                    top: scrollTop,
                    behavior: 'smooth'
                });
            } else {
                // 兼容性处理
                doc.documentElement.scrollTop = scrollTop;
                doc.body.scrollTop = scrollTop;
            }
            
            // 触发滚动事件
            this.emit('scroll', {
                headingId,
                headingIndex,
                scrollTop,
                note: this.currentNote
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
        if (this.activeSection === headingId) {
            return; // 避免重复设置
        }
        
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
            
            // 确保活跃项在可视区域内（如果目录容器可滚动）
            this.scrollTocItemIntoView(newActive);
            
            // 触发活跃章节变化事件
            this.emit('activeSectionChange', {
                headingId,
                previousSection: this.activeSection,
                note: this.currentNote
            });
        }
    }
    
    /**
     * 确保目录项在可视区域内
     * @param {HTMLElement} tocItem - 目录项元素
     */
    scrollTocItemIntoView(tocItem) {
        if (!tocItem || !this.elements.tocContainer) return;
        
        const container = this.elements.tocContainer.closest('.mobile-menu') || 
                         this.elements.tocContainer.parentElement;
        
        if (container && container.scrollHeight > container.clientHeight) {
            // 目录容器可滚动，确保活跃项可见
            const containerRect = container.getBoundingClientRect();
            const itemRect = tocItem.getBoundingClientRect();
            
            if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
                tocItem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }
    
    /**
     * 设置内容观察（滚动监听和Intersection Observer）
     * @param {Document} doc - 文档对象
     */
    setupContentObservation(doc) {
        // 清除之前的监听器
        this.clearContentObservation();
        
        // 设置滚动监听（备用方案）
        this.scrollListener = this.debounce(() => {
            this.updateActiveSectionByScroll(doc);
        }, this.config.scrollDebounceDelay);
        
        doc.addEventListener('scroll', this.scrollListener);
        
        // 设置Intersection Observer监听所有标题
        this.currentToc.forEach(tocItem => {
            if (tocItem.element) {
                this.intersectionObserver.observe(tocItem.element);
            }
        });
    }
    
    /**
     * 清除内容观察
     */
    clearContentObservation() {
        // 清除滚动监听器
        if (this.scrollListener) {
            const doc = this.getDocumentFromElement(this.elements.contentFrame);
            if (doc) {
                doc.removeEventListener('scroll', this.scrollListener);
            }
            this.scrollListener = null;
        }
        
        // 清除Intersection Observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
    }
    
    /**
     * 根据滚动位置更新活跃章节（备用方案）
     * @param {Document} doc - 文档对象
     */
    updateActiveSectionByScroll(doc) {
        if (this.currentToc.length === 0) return;
        
        const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop;
        
        // 找到当前可见的标题
        let activeHeading = null;
        
        for (let i = this.currentToc.length - 1; i >= 0; i--) {
            const heading = this.currentToc[i];
            const element = doc.getElementById(heading.id);
            
            if (element) {
                const elementTop = element.offsetTop;
                
                if (elementTop <= scrollTop + this.config.highlightThreshold) {
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
     * 获取当前目录状态
     * @returns {Object} 目录状态对象
     */
    getTocState() {
        return {
            tocItems: this.currentToc.length,
            activeSection: this.activeSection,
            currentNote: this.currentNote,
            hasContent: this.currentToc.length > 0
        };
    }
    
    /**
     * 刷新目录
     */
    refresh() {
        if (this.currentNote && this.elements.contentFrame) {
            this.generateFromContent(this.currentNote, this.elements.contentFrame);
        }
        console.log('TableOfContents refreshed');
    }
    
    /**
     * 清空目录
     */
    clear() {
        this.clearContentObservation();
        this.currentToc = [];
        this.activeSection = null;
        this.currentNote = null;
        this.renderEmptyToc();
        
        console.log('TableOfContents cleared');
    }
    
    /**
     * 事件发射器 - 触发自定义事件
     * @param {string} eventName - 事件名称
     * @param {Object} data - 事件数据
     */
    emit(eventName, data) {
        const event = new CustomEvent(`toc:${eventName}`, {
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
        window.addEventListener(`toc:${eventName}`, callback);
    }
    
    /**
     * 移除事件监听器
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(eventName, callback) {
        window.removeEventListener(`toc:${eventName}`, callback);
    }
    
    /**
     * 销毁目录组件
     */
    destroy() {
        // 清除内容观察
        this.clearContentObservation();
        
        // 清理数据
        this.currentToc = [];
        this.activeSection = null;
        this.currentNote = null;
        this.elements = {};
        
        console.log('TableOfContents destroyed');
    }
}

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TableOfContents;
}