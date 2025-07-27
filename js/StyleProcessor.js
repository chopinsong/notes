/**
 * StyleProcessor - 统一样式处理系统
 * 负责统一处理所有笔记内容的样式，确保一致的视觉体验
 */
class StyleProcessor {
    constructor() {
        this.baseStyles = new Map();
        this.themeConfig = this.initializeThemeConfig();
        this.codeHighlightConfig = this.initializeCodeHighlightConfig();
        this.initialized = false;
        
        // 初始化样式处理器
        this.initialize();
    }

    /**
     * 初始化主题配置
     */
    initializeThemeConfig() {
        return {
            // CSS变量定义
            cssVariables: {
                '--primary-color': '#3498db',
                '--secondary-color': '#2c3e50',
                '--background-color': '#ffffff',
                '--text-color': '#333333',
                '--border-color': '#e1e1e1',
                '--code-bg': '#f8f8f8',
                '--code-border': '#e1e1e1',
                '--sidebar-width': '320px',
                '--header-height': '60px',
                '--sidebar-bg': '#f8f9fa',
                
                // 字体配置
                '--font-family': '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
                '--code-font-family': '"Consolas", "Monaco", "Courier New", monospace',
                
                // 间距配置
                '--spacing-xs': '4px',
                '--spacing-sm': '8px',
                '--spacing-md': '16px',
                '--spacing-lg': '24px',
                '--spacing-xl': '32px',
                
                // 字体大小
                '--font-size-xs': '12px',
                '--font-size-sm': '14px',
                '--font-size-base': '16px',
                '--font-size-lg': '18px',
                '--font-size-xl': '20px',
                '--font-size-h1': '28px',
                '--font-size-h2': '24px',
                '--font-size-h3': '20px',
                '--font-size-h4': '18px',
                '--font-size-h5': '16px',
                '--font-size-h6': '14px',
                
                // 行高
                '--line-height-tight': '1.25',
                '--line-height-normal': '1.5',
                '--line-height-relaxed': '1.75',
                
                // 阴影
                '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
                '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
                '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
                
                // 圆角
                '--border-radius-sm': '4px',
                '--border-radius-md': '6px',
                '--border-radius-lg': '8px'
            },
            
            // 响应式断点
            breakpoints: {
                mobile: '768px',
                tablet: '1024px',
                desktop: '1200px'
            }
        };
    }

    /**
     * 初始化代码高亮配置
     */
    initializeCodeHighlightConfig() {
        return {
            // 代码高亮主题色彩
            colors: {
                comment: '#6a9955',
                string: '#ce9178',
                keyword: '#569cd6',
                function: '#dcdcaa',
                number: '#b5cea8',
                operator: '#d4d4d4',
                builtin: '#4ec9b0',
                variable: '#9cdcfe',
                property: '#92c5f7',
                punctuation: '#d4d4d4'
            },
            
            // 支持的语言
            supportedLanguages: [
                'javascript', 'java', 'python', 'html', 'css', 
                'sql', 'bash', 'json', 'xml', 'markdown'
            ]
        };
    }

    /**
     * 初始化样式处理器
     */
    initialize() {
        if (this.initialized) return;
        
        try {
            // 注入CSS变量到根元素
            this.injectCSSVariables();
            
            // 创建统一样式表
            this.createUnifiedStylesheet();
            
            // 初始化代码高亮
            this.initializeCodeHighlighting();
            
            this.initialized = true;
            console.log('StyleProcessor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize StyleProcessor:', error);
        }
    }

    /**
     * 注入CSS变量到根元素
     */
    injectCSSVariables() {
        const root = document.documentElement;
        
        Object.entries(this.themeConfig.cssVariables).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    }

    /**
     * 创建统一样式表
     */
    createUnifiedStylesheet() {
        // 检查是否已存在统一样式表
        let styleSheet = document.getElementById('unified-styles');
        if (styleSheet) {
            styleSheet.remove();
        }

        // 创建新的样式表
        styleSheet = document.createElement('style');
        styleSheet.id = 'unified-styles';
        styleSheet.textContent = this.generateUnifiedCSS();
        
        document.head.appendChild(styleSheet);
    }

    /**
     * 生成统一CSS样式
     */
    generateUnifiedCSS() {
        return `
            /* 统一笔记内容样式 */
            .unified-note-content {
                font-family: var(--font-family);
                font-size: var(--font-size-base);
                line-height: var(--line-height-normal);
                color: var(--text-color);
                background-color: var(--background-color);
                padding: var(--spacing-lg);
                max-width: 100%;
                overflow-wrap: break-word;
            }

            /* 标题样式 */
            .unified-note-content h1 {
                font-size: var(--font-size-h1);
                font-weight: 600;
                color: var(--secondary-color);
                margin: var(--spacing-xl) 0 var(--spacing-lg) 0;
                padding-bottom: var(--spacing-sm);
                border-bottom: 2px solid var(--border-color);
                line-height: var(--line-height-tight);
            }

            .unified-note-content h2 {
                font-size: var(--font-size-h2);
                font-weight: 600;
                color: var(--secondary-color);
                margin: var(--spacing-lg) 0 var(--spacing-md) 0;
                padding-bottom: var(--spacing-xs);
                border-bottom: 1px solid var(--border-color);
                line-height: var(--line-height-tight);
            }

            .unified-note-content h3 {
                font-size: var(--font-size-h3);
                font-weight: 500;
                color: var(--secondary-color);
                margin: var(--spacing-lg) 0 var(--spacing-sm) 0;
                line-height: var(--line-height-tight);
            }

            .unified-note-content h4 {
                font-size: var(--font-size-h4);
                font-weight: 500;
                color: var(--text-color);
                margin: var(--spacing-md) 0 var(--spacing-sm) 0;
                line-height: var(--line-height-tight);
            }

            .unified-note-content h5 {
                font-size: var(--font-size-h5);
                font-weight: 500;
                color: var(--text-color);
                margin: var(--spacing-md) 0 var(--spacing-xs) 0;
                line-height: var(--line-height-tight);
            }

            .unified-note-content h6 {
                font-size: var(--font-size-h6);
                font-weight: 500;
                color: var(--text-color);
                margin: var(--spacing-sm) 0 var(--spacing-xs) 0;
                line-height: var(--line-height-tight);
            }

            /* 段落样式 */
            .unified-note-content p {
                margin: var(--spacing-md) 0;
                line-height: var(--line-height-normal);
            }

            /* 列表样式 */
            .unified-note-content ul,
            .unified-note-content ol {
                margin: var(--spacing-md) 0;
                padding-left: var(--spacing-lg);
            }

            .unified-note-content li {
                margin: var(--spacing-xs) 0;
                line-height: var(--line-height-normal);
            }

            .unified-note-content li ul,
            .unified-note-content li ol {
                margin: var(--spacing-xs) 0;
            }

            /* 代码块样式 */
            .unified-note-content pre {
                background-color: var(--code-bg);
                border: 1px solid var(--code-border);
                border-radius: var(--border-radius-lg);
                padding: var(--spacing-md);
                margin: var(--spacing-md) 0;
                overflow-x: auto;
                font-family: var(--code-font-family);
                font-size: var(--font-size-sm);
                line-height: var(--line-height-normal);
            }

            .unified-note-content code {
                font-family: var(--code-font-family);
                font-size: var(--font-size-sm);
                background-color: var(--code-bg);
                padding: 2px 4px;
                border-radius: var(--border-radius-sm);
                border: 1px solid var(--code-border);
            }

            .unified-note-content pre code {
                background-color: transparent;
                padding: 0;
                border: none;
                border-radius: 0;
            }

            /* 表格样式 */
            .unified-note-content table {
                width: 100%;
                border-collapse: collapse;
                margin: var(--spacing-md) 0;
                background-color: var(--background-color);
                border-radius: var(--border-radius-md);
                overflow: hidden;
                box-shadow: var(--shadow-sm);
            }

            .unified-note-content th,
            .unified-note-content td {
                padding: var(--spacing-sm) var(--spacing-md);
                text-align: left;
                border-bottom: 1px solid var(--border-color);
                line-height: var(--line-height-normal);
            }

            .unified-note-content th {
                background-color: var(--sidebar-bg);
                font-weight: 600;
                color: var(--secondary-color);
            }

            .unified-note-content tr:hover {
                background-color: rgba(52, 152, 219, 0.05);
            }

            /* 引用样式 */
            .unified-note-content blockquote {
                margin: var(--spacing-md) 0;
                padding: var(--spacing-md);
                border-left: 4px solid var(--primary-color);
                background-color: rgba(52, 152, 219, 0.05);
                border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
            }

            .unified-note-content blockquote p {
                margin: 0;
                font-style: italic;
            }

            /* 链接样式 */
            .unified-note-content a {
                color: var(--primary-color);
                text-decoration: none;
                border-bottom: 1px solid transparent;
                transition: all 0.2s ease;
            }

            .unified-note-content a:hover {
                border-bottom-color: var(--primary-color);
            }

            /* 图片样式 */
            .unified-note-content img {
                max-width: 100%;
                height: auto;
                border-radius: var(--border-radius-md);
                box-shadow: var(--shadow-sm);
                margin: var(--spacing-md) 0;
            }

            /* 分隔线样式 */
            .unified-note-content hr {
                border: none;
                height: 1px;
                background-color: var(--border-color);
                margin: var(--spacing-xl) 0;
            }

            /* 强调样式 */
            .unified-note-content strong {
                font-weight: 600;
                color: var(--secondary-color);
            }

            .unified-note-content em {
                font-style: italic;
                color: var(--text-color);
            }

            /* 特殊内容块样式 */
            .unified-note-content .step,
            .unified-note-content .note,
            .unified-note-content .warning {
                margin: var(--spacing-md) 0;
                padding: var(--spacing-md);
                border-radius: var(--border-radius-md);
                border-left: 4px solid;
            }

            .unified-note-content .step {
                background-color: rgba(52, 152, 219, 0.05);
                border-left-color: var(--primary-color);
            }

            .unified-note-content .note {
                background-color: rgba(255, 193, 7, 0.1);
                border-left-color: #ffc107;
            }

            .unified-note-content .warning {
                background-color: rgba(220, 53, 69, 0.05);
                border-left-color: #dc3545;
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .unified-note-content {
                    padding: var(--spacing-md);
                    font-size: var(--font-size-sm);
                }

                .unified-note-content h1 {
                    font-size: var(--font-size-xl);
                }

                .unified-note-content h2 {
                    font-size: var(--font-size-lg);
                }

                .unified-note-content h3 {
                    font-size: var(--font-size-base);
                }

                .unified-note-content pre {
                    padding: var(--spacing-sm);
                    font-size: var(--font-size-xs);
                }

                .unified-note-content table {
                    font-size: var(--font-size-xs);
                }

                .unified-note-content th,
                .unified-note-content td {
                    padding: var(--spacing-xs) var(--spacing-sm);
                }
            }
        `;
    }

    /**
     * 初始化代码高亮
     */
    initializeCodeHighlighting() {
        // 创建代码高亮样式
        const codeHighlightStyles = this.generateCodeHighlightCSS();
        
        let codeStyleSheet = document.getElementById('code-highlight-styles');
        if (codeStyleSheet) {
            codeStyleSheet.remove();
        }

        codeStyleSheet = document.createElement('style');
        codeStyleSheet.id = 'code-highlight-styles';
        codeStyleSheet.textContent = codeHighlightStyles;
        
        document.head.appendChild(codeStyleSheet);
    }

    /**
     * 生成代码高亮CSS
     */
    generateCodeHighlightCSS() {
        const colors = this.codeHighlightConfig.colors;
        
        return `
            /* 代码高亮样式 */
            .unified-note-content .token.comment,
            .unified-note-content .token.prolog,
            .unified-note-content .token.doctype,
            .unified-note-content .token.cdata {
                color: ${colors.comment};
                font-style: italic;
            }

            .unified-note-content .token.punctuation {
                color: ${colors.punctuation};
            }

            .unified-note-content .token.property,
            .unified-note-content .token.tag,
            .unified-note-content .token.boolean,
            .unified-note-content .token.number,
            .unified-note-content .token.constant,
            .unified-note-content .token.symbol,
            .unified-note-content .token.deleted {
                color: ${colors.number};
            }

            .unified-note-content .token.selector,
            .unified-note-content .token.attr-name,
            .unified-note-content .token.string,
            .unified-note-content .token.char,
            .unified-note-content .token.builtin,
            .unified-note-content .token.inserted {
                color: ${colors.string};
            }

            .unified-note-content .token.operator,
            .unified-note-content .token.entity,
            .unified-note-content .token.url,
            .unified-note-content .language-css .token.string,
            .unified-note-content .style .token.string {
                color: ${colors.operator};
            }

            .unified-note-content .token.atrule,
            .unified-note-content .token.attr-value,
            .unified-note-content .token.keyword {
                color: ${colors.keyword};
                font-weight: 500;
            }

            .unified-note-content .token.function,
            .unified-note-content .token.class-name {
                color: ${colors.function};
            }

            .unified-note-content .token.regex,
            .unified-note-content .token.important,
            .unified-note-content .token.variable {
                color: ${colors.variable};
            }

            .unified-note-content .token.important,
            .unified-note-content .token.bold {
                font-weight: bold;
            }

            .unified-note-content .token.italic {
                font-style: italic;
            }

            .unified-note-content .token.entity {
                cursor: help;
            }
        `;
    }

    /**
     * 统一处理笔记内容样式
     * @param {HTMLElement|string} content - 要处理的内容元素或HTML字符串
     * @returns {HTMLElement} 处理后的内容元素
     */
    applyUnifiedStyles(content) {
        try {
            let contentElement;
            
            // 处理输入参数
            if (typeof content === 'string') {
                contentElement = document.createElement('div');
                contentElement.innerHTML = content;
            } else if (content && content.nodeType === Node.ELEMENT_NODE) {
                // 更宽松的HTMLElement检查，兼容iframe中的元素
                contentElement = content.cloneNode(true);
            } else if (content instanceof HTMLElement) {
                contentElement = content.cloneNode(true);
            } else {
                console.warn('Invalid content type, creating fallback element:', typeof content, content);
                contentElement = document.createElement('div');
                if (content && content.innerHTML) {
                    contentElement.innerHTML = content.innerHTML;
                } else if (content && content.textContent) {
                    contentElement.textContent = content.textContent;
                } else {
                    contentElement.innerHTML = '<p>内容加载失败</p>';
                }
            }

            // 应用统一样式类
            contentElement.classList.add('unified-note-content');

            // 处理标题
            this.processHeadings(contentElement);

            // 处理代码块
            this.processCodeBlocks(contentElement);

            // 处理表格
            this.processTables(contentElement);

            // 处理列表
            this.processLists(contentElement);

            // 处理链接
            this.processLinks(contentElement);

            // 处理图片
            this.processImages(contentElement);

            return contentElement;
        } catch (error) {
            console.error('Failed to apply unified styles:', error);
            return content instanceof HTMLElement ? content : document.createElement('div');
        }
    }

    /**
     * 处理标题样式
     * @param {HTMLElement} contentElement 
     */
    processHeadings(contentElement) {
        const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headings.forEach(heading => {
            // 确保标题有适当的ID用于锚点链接
            if (!heading.id && heading.textContent) {
                heading.id = this.generateHeadingId(heading.textContent);
            }
            
            // 添加标题级别类
            heading.classList.add(`heading-${heading.tagName.toLowerCase()}`);
        });
    }

    /**
     * 生成标题ID
     * @param {string} text 
     * @returns {string}
     */
    generateHeadingId(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fff\s-]/g, '') // 保留中文、英文、数字、空格和连字符
            .replace(/\s+/g, '-') // 空格替换为连字符
            .replace(/-+/g, '-') // 多个连字符合并为一个
            .replace(/^-|-$/g, ''); // 去除首尾连字符
    }

    /**
     * 处理代码块样式和语法高亮
     * @param {HTMLElement} contentElement 
     */
    processCodeBlocks(contentElement) {
        const codeBlocks = contentElement.querySelectorAll('pre code, code');
        
        codeBlocks.forEach(codeBlock => {
            // 添加统一的代码样式类
            codeBlock.classList.add('unified-code');
            
            // 检测语言类型
            const language = this.detectCodeLanguage(codeBlock);
            if (language) {
                codeBlock.classList.add(`language-${language}`);
            }
            
            // 应用语法高亮
            this.applySyntaxHighlighting(codeBlock, language);
        });
    }

    /**
     * 检测代码语言类型
     * @param {HTMLElement} codeBlock 
     * @returns {string|null}
     */
    detectCodeLanguage(codeBlock) {
        // 检查现有的语言类
        const existingClasses = Array.from(codeBlock.classList);
        for (const className of existingClasses) {
            if (className.startsWith('language-')) {
                return className.replace('language-', '');
            }
        }
        
        // 根据内容特征检测语言
        const content = codeBlock.textContent || '';
        
        if (content.includes('SELECT') || content.includes('INSERT') || content.includes('UPDATE')) {
            return 'sql';
        }
        if (content.includes('function') && content.includes('{')) {
            return 'javascript';
        }
        if (content.includes('def ') || content.includes('import ')) {
            return 'python';
        }
        if (content.includes('public class') || content.includes('System.out.println')) {
            return 'java';
        }
        if (content.includes('<html>') || content.includes('<!DOCTYPE')) {
            return 'html';
        }
        if (content.includes('sudo ') || content.includes('apt ') || content.includes('cd ')) {
            return 'bash';
        }
        
        return null;
    }

    /**
     * 应用语法高亮
     * @param {HTMLElement} codeBlock 
     * @param {string} language 
     */
    applySyntaxHighlighting(codeBlock, language) {
        if (!language || !this.codeHighlightConfig.supportedLanguages.includes(language)) {
            return;
        }

        // 简单的语法高亮实现
        let content = codeBlock.innerHTML;
        
        // 根据语言类型应用不同的高亮规则
        switch (language) {
            case 'javascript':
                content = this.highlightJavaScript(content);
                break;
            case 'java':
                content = this.highlightJava(content);
                break;
            case 'python':
                content = this.highlightPython(content);
                break;
            case 'sql':
                content = this.highlightSQL(content);
                break;
            case 'html':
                content = this.highlightHTML(content);
                break;
            case 'bash':
                content = this.highlightBash(content);
                break;
        }
        
        codeBlock.innerHTML = content;
    }

    /**
     * JavaScript语法高亮
     * @param {string} content 
     * @returns {string}
     */
    highlightJavaScript(content) {
        const keywords = ['function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'return', 'class', 'extends', 'import', 'export'];
        const colors = this.codeHighlightConfig.colors;
        
        // 高亮关键字
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            content = content.replace(regex, `<span class="token keyword" style="color: ${colors.keyword}">${keyword}</span>`);
        });
        
        // 高亮字符串
        content = content.replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, `<span class="token string" style="color: ${colors.string}">$1$2$1</span>`);
        
        // 高亮注释
        content = content.replace(/(\/\/.*$)/gm, `<span class="token comment" style="color: ${colors.comment}">$1</span>`);
        content = content.replace(/(\/\*[\s\S]*?\*\/)/g, `<span class="token comment" style="color: ${colors.comment}">$1</span>`);
        
        return content;
    }

    /**
     * Java语法高亮
     * @param {string} content 
     * @returns {string}
     */
    highlightJava(content) {
        const keywords = ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'final', 'void', 'int', 'String', 'boolean', 'if', 'else', 'for', 'while', 'return', 'new', 'this', 'super'];
        const colors = this.codeHighlightConfig.colors;
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            content = content.replace(regex, `<span class="token keyword" style="color: ${colors.keyword}">${keyword}</span>`);
        });
        
        // 高亮字符串
        content = content.replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, `<span class="token string" style="color: ${colors.string}">$1$2$1</span>`);
        
        // 高亮注释
        content = content.replace(/(\/\/.*$)/gm, `<span class="token comment" style="color: ${colors.comment}">$1</span>`);
        
        return content;
    }

    /**
     * Python语法高亮
     * @param {string} content 
     * @returns {string}
     */
    highlightPython(content) {
        const keywords = ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'return', 'try', 'except', 'finally', 'with', 'as', 'pass', 'break', 'continue'];
        const colors = this.codeHighlightConfig.colors;
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            content = content.replace(regex, `<span class="token keyword" style="color: ${colors.keyword}">${keyword}</span>`);
        });
        
        // 高亮字符串
        content = content.replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, `<span class="token string" style="color: ${colors.string}">$1$2$1</span>`);
        
        // 高亮注释
        content = content.replace(/(#.*$)/gm, `<span class="token comment" style="color: ${colors.comment}">$1</span>`);
        
        return content;
    }

    /**
     * SQL语法高亮
     * @param {string} content 
     * @returns {string}
     */
    highlightSQL(content) {
        const keywords = ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT'];
        const colors = this.codeHighlightConfig.colors;
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            content = content.replace(regex, `<span class="token keyword" style="color: ${colors.keyword}">${keyword}</span>`);
        });
        
        // 高亮字符串
        content = content.replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, `<span class="token string" style="color: ${colors.string}">$1$2$1</span>`);
        
        // 高亮注释
        content = content.replace(/(--.*$)/gm, `<span class="token comment" style="color: ${colors.comment}">$1</span>`);
        
        return content;
    }

    /**
     * HTML语法高亮
     * @param {string} content 
     * @returns {string}
     */
    highlightHTML(content) {
        const colors = this.codeHighlightConfig.colors;
        
        // 高亮标签
        content = content.replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)(.*?)(&gt;)/g, 
            `$1<span class="token keyword" style="color: ${colors.keyword}">$2</span>$3$4`);
        
        // 高亮属性
        content = content.replace(/(\s)([a-zA-Z-]+)(=)/g, 
            `$1<span class="token property" style="color: ${colors.property}">$2</span>$3`);
        
        // 高亮属性值
        content = content.replace(/(=)(["'])(.*?)\2/g, 
            `$1<span class="token string" style="color: ${colors.string}">$2$3$2</span>`);
        
        return content;
    }

    /**
     * Bash语法高亮
     * @param {string} content 
     * @returns {string}
     */
    highlightBash(content) {
        const keywords = ['sudo', 'apt', 'yum', 'cd', 'ls', 'mkdir', 'rm', 'cp', 'mv', 'chmod', 'chown', 'grep', 'find', 'sed', 'awk'];
        const colors = this.codeHighlightConfig.colors;
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            content = content.replace(regex, `<span class="token keyword" style="color: ${colors.keyword}">${keyword}</span>`);
        });
        
        // 高亮注释
        content = content.replace(/(#.*$)/gm, `<span class="token comment" style="color: ${colors.comment}">$1</span>`);
        
        return content;
    }

    /**
     * 处理表格样式
     * @param {HTMLElement} contentElement 
     */
    processTables(contentElement) {
        const tables = contentElement.querySelectorAll('table');
        
        tables.forEach(table => {
            // 添加统一表格样式类
            table.classList.add('unified-table');
            
            // 为表格添加响应式包装器
            if (!table.parentElement.classList.contains('table-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.classList.add('table-wrapper');
                wrapper.style.overflowX = 'auto';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        });
    }

    /**
     * 处理列表样式
     * @param {HTMLElement} contentElement 
     */
    processLists(contentElement) {
        const lists = contentElement.querySelectorAll('ul, ol');
        
        lists.forEach(list => {
            list.classList.add('unified-list');
            
            // 处理嵌套列表
            const nestedLists = list.querySelectorAll('ul, ol');
            nestedLists.forEach(nestedList => {
                nestedList.classList.add('nested-list');
            });
        });
    }

    /**
     * 处理链接样式
     * @param {HTMLElement} contentElement 
     */
    processLinks(contentElement) {
        const links = contentElement.querySelectorAll('a');
        
        links.forEach(link => {
            link.classList.add('unified-link');
            
            // 为外部链接添加标识
            if (link.href && (link.href.startsWith('http://') || link.href.startsWith('https://'))) {
                link.classList.add('external-link');
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    /**
     * 处理图片样式
     * @param {HTMLElement} contentElement 
     */
    processImages(contentElement) {
        const images = contentElement.querySelectorAll('img');
        
        images.forEach(img => {
            img.classList.add('unified-image');
            
            // 添加图片加载错误处理
            img.addEventListener('error', () => {
                img.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.className = 'image-placeholder';
                placeholder.textContent = '图片加载失败';
                placeholder.style.cssText = `
                    padding: var(--spacing-md);
                    background-color: var(--sidebar-bg);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-md);
                    text-align: center;
                    color: #666;
                    font-style: italic;
                `;
                img.parentNode.insertBefore(placeholder, img);
            });
        });
    }

    /**
     * 更新主题配置
     * @param {Object} newTheme 
     */
    updateTheme(newTheme) {
        try {
            // 合并新主题配置
            this.themeConfig = {
                ...this.themeConfig,
                cssVariables: {
                    ...this.themeConfig.cssVariables,
                    ...newTheme.cssVariables
                }
            };
            
            // 重新注入CSS变量
            this.injectCSSVariables();
            
            // 重新创建样式表
            this.createUnifiedStylesheet();
            
            console.log('Theme updated successfully');
        } catch (error) {
            console.error('Failed to update theme:', error);
        }
    }

    /**
     * 获取当前主题配置
     * @returns {Object}
     */
    getThemeConfig() {
        return { ...this.themeConfig };
    }

    /**
     * 重置为默认主题
     */
    resetToDefaultTheme() {
        this.themeConfig = this.initializeThemeConfig();
        this.injectCSSVariables();
        this.createUnifiedStylesheet();
        console.log('Theme reset to default');
    }
}

// 导出StyleProcessor类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StyleProcessor;
} else if (typeof window !== 'undefined') {
    window.StyleProcessor = StyleProcessor;
}