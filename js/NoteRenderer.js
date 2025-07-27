/**
 * NoteRenderer - 笔记内容渲染器
 * 负责笔记内容的加载、渲染、样式注入和错误处理
 */
class NoteRenderer {
    constructor() {
        this.currentNote = null;
        this.styleProcessor = null;
        this.tableOfContents = null;
        this.loadingStates = new Map();
        this.errorStates = new Map();
        this.contentCache = new Map();
        
        // 配置选项
        this.config = {
            enableCache: true,
            cacheTimeout: 5 * 60 * 1000, // 5分钟缓存
            loadTimeout: 10000, // 10秒加载超时
            retryAttempts: 3,
            retryDelay: 1000
        };
        
        // 事件监听器
        this.listeners = new Map();
        
        this.init();
    }
    
    /**
     * 初始化渲染器
     */
    init() {
        // 获取StyleProcessor实例
        if (window.styleProcessor) {
            this.styleProcessor = window.styleProcessor;
        } else {
            console.warn('StyleProcessor not found, creating new instance');
            this.styleProcessor = new StyleProcessor();
        }
        
        // 初始化TableOfContents实例
        if (typeof TableOfContents !== 'undefined') {
            this.tableOfContents = new TableOfContents();
        } else {
            console.warn('TableOfContents class not found');
        }
        
        console.log('NoteRenderer initialized');
    }
    
    /**
     * 加载并渲染笔记内容
     * @param {Object} note - 笔记对象 {id, title, content, url}
     * @param {HTMLElement} targetElement - 目标容器元素
     * @returns {Promise<boolean>} 加载成功返回true
     */
    async loadNote(note, targetElement) {
        if (!note || !targetElement) {
            throw new Error('Note and target element are required');
        }
        
        const noteId = note.id;
        
        try {
            // 设置加载状态
            this.setLoadingState(noteId, true);
            this.showLoadingIndicator(targetElement, note.title);
            
            // 对于HTML文件和iframe，直接渲染而不获取内容
            if (targetElement.tagName.toLowerCase() === 'iframe' && 
                note.content && note.content.endsWith('.html')) {
                
                console.log(`Loading HTML file directly to iframe: ${note.title}`);
                await this.renderToIframeDirectly(targetElement, note);
                
                // 更新状态
                this.setLoadingState(noteId, false);
                this.clearErrorState(noteId);
                this.currentNote = note;
                
                // 触发加载完成事件
                this.emit('noteLoaded', { note, content: note.content });
                
                console.log(`Note loaded successfully: ${note.title}`);
                return true;
            }
            
            // 检查缓存
            if (this.config.enableCache && this.contentCache.has(noteId)) {
                const cachedData = this.contentCache.get(noteId);
                if (Date.now() - cachedData.timestamp < this.config.cacheTimeout) {
                    console.log(`Loading note from cache: ${note.title}`);
                    await this.renderCachedContent(cachedData.content, targetElement, note);
                    this.setLoadingState(noteId, false);
                    this.currentNote = note;
                    return true;
                }
            }
            
            // 加载笔记内容
            const content = await this.fetchNoteContent(note);
            
            // 缓存内容
            if (this.config.enableCache) {
                this.contentCache.set(noteId, {
                    content: content,
                    timestamp: Date.now()
                });
            }
            
            // 渲染内容
            await this.renderNoteContent(content, targetElement, note);
            
            // 更新状态
            this.setLoadingState(noteId, false);
            this.clearErrorState(noteId);
            this.currentNote = note;
            
            // 触发加载完成事件
            this.emit('noteLoaded', { note, content });
            
            console.log(`Note loaded successfully: ${note.title}`);
            return true;
            
        } catch (error) {
            console.error(`Failed to load note: ${note.title}`, error);
            
            // 设置错误状态
            this.setErrorState(noteId, error);
            this.setLoadingState(noteId, false);
            
            // 显示错误内容
            this.showErrorContent(targetElement, note, error);
            
            // 触发加载失败事件
            this.emit('noteLoadError', { note, error });
            
            return false;
        }
    }
    
    /**
     * 获取笔记内容
     * @param {Object} note - 笔记对象
     * @returns {Promise<string>} 笔记HTML内容
     */
    async fetchNoteContent(note) {
        const url = note.content || note.url;
        if (!url) {
            throw new Error('Note content URL not specified');
        }
        
        let lastError;
        
        // 重试机制
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                console.log(`Fetching note content (attempt ${attempt}): ${url}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.loadTimeout);
                
                const response = await fetch(url, {
                    signal: controller.signal,
                    cache: 'default'
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const content = await response.text();
                
                if (!content.trim()) {
                    throw new Error('Empty content received');
                }
                
                return content;
                
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt} failed:`, error.message);
                
                // 如果不是最后一次尝试，等待后重试
                if (attempt < this.config.retryAttempts) {
                    await this.delay(this.config.retryDelay * attempt);
                }
            }
        }
        
        throw lastError;
    }
    
    /**
     * 渲染笔记内容
     * @param {string} content - HTML内容
     * @param {HTMLElement} targetElement - 目标容器
     * @param {Object} note - 笔记对象
     */
    async renderNoteContent(content, targetElement, note) {
        // 检查是否为iframe渲染
        if (targetElement.tagName.toLowerCase() === 'iframe') {
            // 对于HTML文件，直接设置src而不是获取内容
            if (note.content && note.content.endsWith('.html')) {
                await this.renderToIframeDirectly(targetElement, note);
            } else {
                await this.renderToIframe(content, targetElement, note);
            }
        } else {
            await this.renderToElement(content, targetElement, note);
        }
    }
    
    /**
     * 渲染缓存内容
     * @param {string} content - 缓存的HTML内容
     * @param {HTMLElement} targetElement - 目标容器
     * @param {Object} note - 笔记对象
     */
    async renderCachedContent(content, targetElement, note) {
        await this.renderNoteContent(content, targetElement, note);
    }
    
    /**
     * 直接渲染HTML文件到iframe
     * @param {HTMLIFrameElement} iframe - iframe元素
     * @param {Object} note - 笔记对象
     */
    async renderToIframeDirectly(iframe, note) {
        return new Promise((resolve, reject) => {
            // 设置iframe加载完成处理
            const onLoad = async () => {
                try {
                    // 移除事件监听器避免重复触发
                    iframe.removeEventListener('load', onLoad);
                    iframe.removeEventListener('error', onError);
                    
                    await this.injectStylesToIframe(iframe, note);
                    this.emit('iframeStylesInjected', { note, iframe });
                    resolve();
                } catch (error) {
                    console.error('Failed to inject styles to iframe:', error);
                    reject(error);
                }
            };
            
            const onError = (error) => {
                console.error('Iframe load error:', error);
                // 移除事件监听器
                iframe.removeEventListener('load', onLoad);
                iframe.removeEventListener('error', onError);
                reject(new Error('Failed to load content in iframe'));
            };
            
            // 绑定事件
            iframe.addEventListener('load', onLoad);
            iframe.addEventListener('error', onError);
            
            // 直接设置src加载HTML文件
            try {
                iframe.src = note.content;
            } catch (error) {
                console.error('Failed to set iframe src:', error);
                reject(error);
            }
        });
    }

    /**
     * 渲染内容到iframe
     * @param {string} content - HTML内容
     * @param {HTMLIFrameElement} iframe - iframe元素
     * @param {Object} note - 笔记对象
     */
    async renderToIframe(content, iframe, note) {
        return new Promise((resolve, reject) => {
            // 设置iframe加载完成处理
            const onLoad = async () => {
                try {
                    // 移除事件监听器避免重复触发
                    iframe.removeEventListener('load', onLoad);
                    iframe.removeEventListener('error', onError);
                    
                    await this.injectStylesToIframe(iframe, note);
                    this.emit('iframeStylesInjected', { note, iframe });
                    resolve();
                } catch (error) {
                    console.error('Failed to inject styles to iframe:', error);
                    reject(error);
                }
            };
            
            const onError = (error) => {
                console.error('Iframe load error:', error);
                // 移除事件监听器
                iframe.removeEventListener('load', onLoad);
                iframe.removeEventListener('error', onError);
                reject(new Error('Failed to load content in iframe'));
            };
            
            // 绑定事件 - 使用addEventListener而不是onload属性
            iframe.addEventListener('load', onLoad);
            iframe.addEventListener('error', onError);
            
            // 设置iframe内容
            try {
                // 对于从URL加载的内容，直接设置src
                if (note.content && (note.content.endsWith('.html') || note.content.startsWith('http'))) {
                    iframe.src = note.content;
                } else {
                    // 对于直接的HTML内容，使用srcdoc
                    iframe.srcdoc = content;
                    
                    // 如果srcdoc不支持，回退到blob URL
                    if (!iframe.srcdoc) {
                        const blob = new Blob([content], { type: 'text/html' });
                        iframe.src = URL.createObjectURL(blob);
                    }
                }
                
            } catch (error) {
                console.error('Failed to set iframe content:', error);
                reject(error);
            }
        });
    }
    
    /**
     * 渲染内容到普通元素
     * @param {string} content - HTML内容
     * @param {HTMLElement} element - 目标元素
     * @param {Object} note - 笔记对象
     */
    async renderToElement(content, element, note) {
        try {
            // 解析HTML内容
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            
            // 提取body内容
            const bodyContent = doc.body ? doc.body.innerHTML : content;
            
            // 创建容器并应用统一样式
            const container = document.createElement('div');
            container.innerHTML = bodyContent;
            
            // 应用统一样式
            const styledContent = this.styleProcessor.applyUnifiedStyles(container);
            
            // 替换目标元素内容
            element.innerHTML = '';
            element.appendChild(styledContent);
            
            // 处理内容中的特殊元素
            this.processContentElements(element, note);
            
        } catch (error) {
            console.error('Failed to render content to element:', error);
            throw error;
        }
    }
    
    /**
     * 向iframe注入统一样式
     * @param {HTMLIFrameElement} iframe - iframe元素
     * @param {Object} note - 笔记对象
     */
    async injectStylesToIframe(iframe, note) {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (!iframeDoc) {
                console.warn('Cannot access iframe document, skipping style injection');
                return;
            }
            
            // 等待iframe文档完全加载
            if (iframeDoc.readyState !== 'complete') {
                await new Promise((resolve) => {
                    const checkReady = () => {
                        if (iframeDoc.readyState === 'complete') {
                            resolve();
                        } else {
                            setTimeout(checkReady, 50);
                        }
                    };
                    checkReady();
                });
            }
            
            const iframeBody = iframeDoc.body;
            if (!iframeBody) {
                console.warn('No body found in iframe document, skipping style injection');
                return;
            }
            
            // 应用统一样式到iframe的body
            const styledContent = this.styleProcessor.applyUnifiedStyles(iframeBody);
            
            // 注入CSS变量到iframe
            const iframeRoot = iframeDoc.documentElement;
            Object.entries(this.styleProcessor.themeConfig.cssVariables).forEach(([property, value]) => {
                iframeRoot.style.setProperty(property, value);
            });
            
            // 移除现有的统一样式表
            const existingStyles = iframeDoc.querySelectorAll('#unified-styles, #code-highlight-styles');
            existingStyles.forEach(style => style.remove());
            
            // 注入统一样式表
            const styleElement = iframeDoc.createElement('style');
            styleElement.id = 'unified-styles';
            styleElement.textContent = this.styleProcessor.generateUnifiedCSS();
            iframeDoc.head.appendChild(styleElement);
            
            // 注入代码高亮样式表
            const codeStyleElement = iframeDoc.createElement('style');
            codeStyleElement.id = 'code-highlight-styles';
            codeStyleElement.textContent = this.styleProcessor.generateCodeHighlightCSS();
            iframeDoc.head.appendChild(codeStyleElement);
            
            // 替换iframe的body内容
            iframeBody.innerHTML = styledContent.innerHTML;
            iframeBody.className = styledContent.className;
            
            // 处理iframe内容中的特殊元素
            this.processIframeContent(iframeDoc, note);
            
            console.log(`Styles injected to iframe for: ${note.title}`);
            
        } catch (error) {
            console.error('Failed to inject styles to iframe:', error);
            // Don't throw the error, just log it to avoid breaking the loading process
        }
    }
    
    /**
     * 处理内容中的特殊元素
     * @param {HTMLElement} container - 内容容器
     * @param {Object} note - 笔记对象
     */
    processContentElements(container, note) {
        // 处理图片懒加载
        this.setupImageLazyLoading(container);
        
        // 处理链接
        this.processLinks(container);
        
        // 处理代码块
        this.processCodeBlocks(container);
        
        // 生成目录
        this.generateTableOfContents(container, note);
    }
    
    /**
     * 处理iframe内容
     * @param {Document} iframeDoc - iframe文档
     * @param {Object} note - 笔记对象
     */
    processIframeContent(iframeDoc, note) {
        // 处理图片懒加载
        this.setupImageLazyLoading(iframeDoc.body);
        
        // 处理链接
        this.processLinks(iframeDoc.body);
        
        // 处理代码块
        this.processCodeBlocks(iframeDoc.body);
        
        // 生成目录
        this.generateTableOfContents(iframeDoc.body, note);
    }
    
    /**
     * 设置图片懒加载
     * @param {HTMLElement} container - 容器元素
     */
    setupImageLazyLoading(container) {
        const images = container.querySelectorAll('img');
        
        images.forEach(img => {
            // 添加加载错误处理
            img.addEventListener('error', () => {
                img.style.display = 'none';
                
                // 创建错误提示
                const errorDiv = document.createElement('div');
                errorDiv.className = 'image-error';
                errorDiv.style.cssText = `
                    padding: 20px;
                    background-color: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    text-align: center;
                    color: #6c757d;
                    margin: 10px 0;
                `;
                errorDiv.textContent = `图片加载失败: ${img.src}`;
                
                img.parentNode.insertBefore(errorDiv, img);
            });
            
            // 添加加载成功处理
            img.addEventListener('load', () => {
                img.style.opacity = '1';
            });
            
            // 设置初始透明度
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease';
        });
    }
    
    /**
     * 处理链接
     * @param {HTMLElement} container - 容器元素
     */
    processLinks(container) {
        const links = container.querySelectorAll('a');
        
        links.forEach(link => {
            // 为外部链接添加新窗口打开
            if (link.href && (link.href.startsWith('http://') || link.href.startsWith('https://'))) {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            }
        });
    }
    
    /**
     * 处理代码块
     * @param {HTMLElement} container - 容器元素
     */
    processCodeBlocks(container) {
        const codeBlocks = container.querySelectorAll('pre code');
        
        codeBlocks.forEach(codeBlock => {
            // 添加复制按钮
            this.addCopyButton(codeBlock);
        });
    }
    
    /**
     * 添加代码复制按钮
     * @param {HTMLElement} codeBlock - 代码块元素
     */
    addCopyButton(codeBlock) {
        const pre = codeBlock.closest('pre');
        if (!pre || pre.querySelector('.copy-button')) return;
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.textContent = '复制';
        copyButton.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            z-index: 1;
        `;
        
        copyButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(codeBlock.textContent);
                copyButton.textContent = '已复制';
                setTimeout(() => {
                    copyButton.textContent = '复制';
                }, 2000);
            } catch (error) {
                console.error('Failed to copy code:', error);
                copyButton.textContent = '复制失败';
                setTimeout(() => {
                    copyButton.textContent = '复制';
                }, 2000);
            }
        });
        
        pre.style.position = 'relative';
        pre.appendChild(copyButton);
    }
    
    /**
     * 生成目录结构
     * @param {HTMLElement|HTMLIFrameElement} contentElement - 内容容器或iframe
     * @param {Object} note - 笔记对象
     */
    generateTableOfContents(contentElement, note) {
        if (!this.tableOfContents) {
            console.warn('TableOfContents component not available');
            this.emit('tocGenerated', { note, toc: [] });
            return;
        }
        
        try {
            // 使用新的TableOfContents组件生成目录
            const toc = this.tableOfContents.generateFromContent(note, contentElement);
            
            // 触发目录生成事件（保持向后兼容）
            this.emit('tocGenerated', { note, toc });
            
            console.log(`Generated table of contents with ${toc.length} headings for: ${note.title}`);
        } catch (error) {
            console.error('Failed to generate table of contents:', error);
            this.emit('tocGenerated', { note, toc: [] });
        }
    }
    
    /**
     * 显示加载指示器
     * @param {HTMLElement} targetElement - 目标元素
     * @param {string} title - 笔记标题
     */
    showLoadingIndicator(targetElement, title) {
        const loadingHTML = `
            <div class="note-loading" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: #666;
                font-size: 16px;
            ">
                <div class="loading-spinner" style="
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 16px;
                "></div>
                <div>正在加载 "${title}"...</div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        if (targetElement.tagName.toLowerCase() === 'iframe') {
            targetElement.srcdoc = `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"><title>Loading...</title></head>
                <body>${loadingHTML}</body>
                </html>
            `;
        } else {
            targetElement.innerHTML = loadingHTML;
        }
    }
    
    /**
     * 显示错误内容
     * @param {HTMLElement} targetElement - 目标元素
     * @param {Object} note - 笔记对象
     * @param {Error} error - 错误对象
     */
    showErrorContent(targetElement, note, error) {
        const errorHTML = `
            <div class="note-error" style="
                padding: 40px 20px;
                text-align: center;
                color: #dc3545;
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                margin: 20px;
            ">
                <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                <h3 style="margin: 0 0 16px 0; color: #dc3545;">加载失败</h3>
                <p style="margin: 0 0 16px 0; color: #666;">
                    无法加载笔记: <strong>${note.title}</strong>
                </p>
                <p style="margin: 0 0 24px 0; color: #999; font-size: 14px;">
                    错误信息: ${error.message}
                </p>
                <button onclick="window.noteRenderer?.retryLoadNote?.('${note.id}')" style="
                    padding: 8px 16px;
                    background-color: #3498db;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                ">重试加载</button>
            </div>
        `;
        
        if (targetElement.tagName.toLowerCase() === 'iframe') {
            targetElement.srcdoc = `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"><title>Error</title></head>
                <body>${errorHTML}</body>
                </html>
            `;
        } else {
            targetElement.innerHTML = errorHTML;
        }
    }
    
    /**
     * 重试加载笔记
     * @param {string} noteId - 笔记ID
     */
    async retryLoadNote(noteId) {
        if (!this.currentNote || this.currentNote.id != noteId) {
            console.warn('Cannot retry: note not found or different note is current');
            return;
        }
        
        // 清除错误状态和缓存
        this.clearErrorState(noteId);
        this.contentCache.delete(noteId);
        
        // 重新加载
        const targetElement = document.getElementById('contentFrame') || document.getElementById('contentArea');
        if (targetElement) {
            try {
                await this.loadNote(this.currentNote, targetElement);
            } catch (error) {
                console.error('Retry failed:', error);
            }
        }
    }
    
    /**
     * 设置加载状态
     * @param {string} noteId - 笔记ID
     * @param {boolean} loading - 是否正在加载
     */
    setLoadingState(noteId, loading) {
        this.loadingStates.set(noteId, loading);
    }
    
    /**
     * 获取加载状态
     * @param {string} noteId - 笔记ID
     * @returns {boolean} 是否正在加载
     */
    getLoadingState(noteId) {
        return this.loadingStates.get(noteId) || false;
    }
    
    /**
     * 设置错误状态
     * @param {string} noteId - 笔记ID
     * @param {Error} error - 错误对象
     */
    setErrorState(noteId, error) {
        this.errorStates.set(noteId, {
            error: error,
            timestamp: Date.now()
        });
    }
    
    /**
     * 清除错误状态
     * @param {string} noteId - 笔记ID
     */
    clearErrorState(noteId) {
        this.errorStates.delete(noteId);
    }
    
    /**
     * 获取错误状态
     * @param {string} noteId - 笔记ID
     * @returns {Object|null} 错误状态对象
     */
    getErrorState(noteId) {
        return this.errorStates.get(noteId) || null;
    }
    
    /**
     * 清除内容缓存
     * @param {string} noteId - 可选，指定笔记ID，不指定则清除所有缓存
     */
    clearCache(noteId) {
        if (noteId) {
            this.contentCache.delete(noteId);
        } else {
            this.contentCache.clear();
        }
    }
    
    /**
     * 获取当前笔记
     * @returns {Object|null} 当前笔记对象
     */
    getCurrentNote() {
        return this.currentNote;
    }
    
    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 事件发射器 - 触发自定义事件
     * @param {string} eventName - 事件名称
     * @param {Object} data - 事件数据
     */
    emit(eventName, data) {
        const event = new CustomEvent(`noteRenderer:${eventName}`, {
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
        window.addEventListener(`noteRenderer:${eventName}`, callback);
    }
    
    /**
     * 移除事件监听器
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(eventName, callback) {
        window.removeEventListener(`noteRenderer:${eventName}`, callback);
    }
    
    /**
     * 销毁渲染器
     */
    destroy() {
        // 清除所有状态
        this.loadingStates.clear();
        this.errorStates.clear();
        this.contentCache.clear();
        this.listeners.clear();
        
        // 重置当前笔记
        this.currentNote = null;
        
        console.log('NoteRenderer destroyed');
    }
}

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NoteRenderer;
}

// 全局实例（用于错误重试等功能）
window.NoteRenderer = NoteRenderer;