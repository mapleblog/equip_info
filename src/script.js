// 产品管理类
class ProductManager {
    constructor() {
        this.products = [];
        this.currentEditId = null;
        this.currentDeleteId = null;
        this.filteredProducts = [];
        this.renderCache = new Map();
        this.virtualScrollEnabled = false;
        this.visibleRange = { start: 0, end: 20 };
        this.itemHeight = 300; // 估算的产品卡片高度
        this.performanceMonitor = {
            renderTimes: [],
            lastCleanup: Date.now()
        };
        this.isFirebaseReady = false;
        this.pendingOperations = [];
        this.eventListeners = new Map(); // 存储事件监听器引用
        this.abortController = new AbortController(); // 用于清理事件监听器
        this.init();
    }

    // 防抖函数 - 优化搜索性能
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) {
                    try {
                        func.apply(this, args);
                    } catch (error) {
                        console.error('防抖函数执行错误:', error);
                    }
                }
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) {
                try {
                    func.apply(this, args);
                } catch (error) {
                    console.error('防抖函数立即执行错误:', error);
                }
            }
        };
    }

    // 节流函数 - 优化滚动性能
    throttle(func, limit) {
        let inThrottle;
        let lastFunc;
        let lastRan;
        return function () {
            const context = this;
            const args = arguments;
            if (!inThrottle) {
                try {
                    func.apply(context, args);
                } catch (error) {
                    console.error('节流函数执行错误:', error);
                }
                lastRan = Date.now();
                inThrottle = true;
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(
                    function () {
                        if (Date.now() - lastRan >= limit) {
                            try {
                                func.apply(context, args);
                            } catch (error) {
                                console.error('节流函数延迟执行错误:', error);
                            }
                            lastRan = Date.now();
                        }
                    },
                    limit - (Date.now() - lastRan)
                );
            }
        };
    }

    // 缓存清理
    cleanupCache() {
        const now = Date.now();

        // 每5分钟清理一次缓存
        if (now - this.performanceMonitor.lastCleanup > 300000) {
            // 清理渲染缓存
            if (this.renderCache.size > 100) {
                const keysToDelete = Array.from(this.renderCache.keys()).slice(
                    0,
                    50
                );
                keysToDelete.forEach(key => this.renderCache.delete(key));
            }

            // 清理产品的保修缓存
            this.products.forEach(product => {
                if (product._warrantyCache) {
                    delete product._warrantyCache;
                }
            });

            this.performanceMonitor.lastCleanup = now;
            console.log('缓存清理完成');
        } else if (this.renderCache.size > 200) {
            // 紧急清理
            const keysToDelete = Array.from(this.renderCache.keys()).slice(
                0,
                100
            );
            keysToDelete.forEach(key => this.renderCache.delete(key));
        }
    }

    // 性能监控
    monitorPerformance(operation, duration) {
        this.performanceMonitor.renderTimes.push({
            operation,
            duration,
            timestamp: Date.now()
        });

        // 只保留最近100次记录
        if (this.performanceMonitor.renderTimes.length > 100) {
            this.performanceMonitor.renderTimes.shift();
        }

        // 如果渲染时间过长，显示警告
        if (duration > 100) {
            console.warn(`性能警告: ${operation} 耗时 ${duration}ms`);
        }
    }

    // 获取性能统计
    getPerformanceStats() {
        const times = this.performanceMonitor.renderTimes;
        if (times.length === 0) {
            return null;
        }

        const durations = times.map(t => t.duration);
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const max = Math.max(...durations);
        const min = Math.min(...durations);

        return {
            average: Math.round(avg),
            maximum: max,
            minimum: min,
            samples: times.length,
            cacheSize: this.renderCache.size
        };
    }

    // 初始化应用 - Firebase版本
    init() {
        const startTime = performance.now();
        console.log('[Firebase Debug] 开始初始化应用...');

        // 等待Firebase初始化
        this.waitForFirebase()
            .then(() => {
                console.log('[Firebase Debug] Firebase初始化成功，开始应用初始化...');
                // 使用requestAnimationFrame分批初始化
                requestAnimationFrame(() => {
                    console.log('[Firebase Debug] 绑定事件监听器...');
                    this.bindEvents();
                    this.initWarrantyPresets();

                    requestAnimationFrame(() => {
                        console.log('[Firebase Debug] 初始化主题系统和Firebase监听器...');
                        this.initThemeSystem();
                        this.setupFirebaseListeners();

                        requestAnimationFrame(async () => {
                            console.log('[Firebase Debug] 开始加载产品数据...');
                            // 加载产品数据
                            this.products = await this.loadProducts();
                            console.log(`[Firebase Debug] 产品数据加载完成，共 ${this.products.length} 个产品`);
                            
                            this.renderProducts();
                            this.updateStats();

                            // 处理待处理的操作
                            this.processPendingOperations();

                            // 初始化完成后的性能监控
                            const endTime = performance.now();
                            this.monitorPerformance(
                                'initialization',
                                endTime - startTime
                            );
                            console.log(`[Firebase Debug] 应用初始化完成，耗时 ${endTime - startTime}ms`);

                            // 启动定期缓存清理
                            setInterval(() => this.cleanupCache(), 60000); // 每分钟检查一次

                            // 页面加载后滚动到顶部
                            window.scrollTo(0, 0);
                        });
                    });
                });
            })
            .catch(error => {
                console.error('[Firebase Debug] Firebase初始化失败:', error);
                console.error('[Firebase Debug] 错误详情:', {
                    message: error.message,
                    stack: error.stack,
                    firebaseAvailable: typeof firebase !== 'undefined',
                    firebaseApps: typeof firebase !== 'undefined' ? firebase.apps.length : 'N/A',
                    windowFirebaseDB: !!window.firebaseDB
                });
            });
    }

    // 等待Firebase初始化
    async waitForFirebase(maxWait = 10000) {
        const startTime = Date.now();
        console.log('[Firebase Debug] 等待Firebase初始化...');
        console.log('[Firebase Debug] 检查状态:', {
            firebaseExists: typeof firebase !== 'undefined',
            firebaseApps: typeof firebase !== 'undefined' ? firebase.apps.length : 0,
            windowFirebaseDB: !!window.firebaseDB
        });

        let checkCount = 0;
        while (!window.firebaseDB && Date.now() - startTime < maxWait) {
            checkCount++;
            if (checkCount % 10 === 0) { // 每秒记录一次
                console.log(`[Firebase Debug] 等待中... (${checkCount * 100}ms)`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!window.firebaseDB) {
            console.error('[Firebase Debug] Firebase初始化超时，最终状态:', {
                firebaseExists: typeof firebase !== 'undefined',
                firebaseApps: typeof firebase !== 'undefined' ? firebase.apps.length : 0,
                windowFirebaseDB: !!window.firebaseDB,
                waitTime: Date.now() - startTime
            });
            throw new Error('Firebase初始化超时');
        }

        console.log('[Firebase Debug] Firebase初始化成功！');
        console.log('[Firebase Debug] Firebase配置:', {
            projectId: firebase.apps[0]?.options?.projectId,
            databaseURL: firebase.apps[0]?.options?.databaseURL,
            authDomain: firebase.apps[0]?.options?.authDomain
        });
        
        this.isFirebaseReady = true;
        return true;
    }

    // 设置Firebase实时监听器
    setupFirebaseListeners() {
        console.log('[Firebase Debug] 设置Firebase实时监听器...');
        
        if (!window.firebaseDB) {
            console.error('[Firebase Debug] 无法设置监听器：window.firebaseDB 不存在');
            return;
        }

        console.log('[Firebase Debug] Firebase数据库引用:', {
            productsRef: !!window.firebaseDB.productsRef,
            database: !!window.firebaseDB.database
        });

        // 监听产品数据变化
        window.firebaseDB.productsRef.on('value', snapshot => {
            console.log('[Firebase Debug] 实时监听器触发');
            const data = snapshot.val();
            console.log('[Firebase Debug] 监听器接收到数据:', {
                hasData: !!data,
                dataType: typeof data,
                dataKeys: data ? Object.keys(data).length : 0
            });

            if (data) {
                const products = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                console.log(`[Firebase Debug] 解析产品数据：${products.length} 个产品`);

                // 按创建时间排序
                products.sort(
                    (a, b) =>
                        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                );

                // 只有在数据真正变化时才更新
                const currentProductsStr = JSON.stringify(this.products);
                const newProductsStr = JSON.stringify(products);
                
                if (currentProductsStr !== newProductsStr) {
                    console.log('[Firebase Debug] 检测到数据变化，更新本地产品列表');
                    this.products = products;
                    this.renderCache.clear();
                    this.filteredProducts = null;
                    this.filterProducts();
                    this.updateStats();
                } else {
                    console.log('[Firebase Debug] 数据未变化，跳过更新');
                }
            } else {
                console.log('[Firebase Debug] 数据库为空或无数据');
                // 数据库为空
                if (this.products.length > 0) {
                    console.log('[Firebase Debug] 清空本地产品列表');
                    this.products = [];
                    this.renderProducts();
                    this.updateStats();
                }
            }
        }, error => {
            console.error('[Firebase Debug] 监听器错误:', error);
            console.error('[Firebase Debug] 错误详情:', {
                code: error.code,
                message: error.message,
                details: error.details
            });
        });
        
        console.log('[Firebase Debug] 实时监听器设置完成');
    }

    // 处理待处理的操作
    async processPendingOperations() {
        if (this.pendingOperations.length === 0) {
            return;
        }

        console.log(`处理${this.pendingOperations.length}个待处理操作`);

        for (const operation of this.pendingOperations) {
            try {
                if (operation.type === 'save') {
                    await this.saveProduct(operation.product);
                } else if (operation.type === 'delete') {
                    await this.deleteProductFromFirebase(operation.productId);
                }
            } catch (error) {
                console.error('处理待处理操作失败:', error);
            }
        }

        this.pendingOperations = [];
    }

    // 初始化保修期预设按钮
    initWarrantyPresets() {
        const presetButtons = document.querySelectorAll('.warranty-preset');
        presetButtons.forEach(button => {
            button.addEventListener('click', e => {
                e.preventDefault();
                const months = parseInt(button.dataset.months);
                const warrantyField =
                    document.getElementById('editWarrantyPeriod');
                warrantyField.value = months;

                // 触发保修信息更新
                const purchaseDateField =
                    document.getElementById('editPurchaseDate');
                if (purchaseDateField.value) {
                    const mockProduct = {
                        purchaseDate: purchaseDateField.value,
                        warrantyPeriod: months
                    };
                    this.updateWarrantyInfo(mockProduct);
                }

                // 更新按钮状态
                presetButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

    // 初始化主题系统
    initThemeSystem() {
        // 从本地存储加载保存的主题
        const savedTheme = localStorage.getItem('selectedTheme') || 'nature';
        this.applyTheme(savedTheme);

        // 设置主题选择器的值
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = savedTheme;

            // 绑定主题切换事件
            themeSelect.addEventListener('change', e => {
                const selectedTheme = e.target.value;
                this.applyTheme(selectedTheme);
                localStorage.setItem('selectedTheme', selectedTheme);
                this.showNotification(
                    `已切换到${this.getThemeName(selectedTheme)}主题`,
                    'success'
                );
            });
        }
    }

    // 应用主题
    applyTheme(theme) {
        const body = document.body;

        // 移除所有主题类
        body.removeAttribute('data-theme');

        // 应用新主题
        body.setAttribute('data-theme', theme);

        // 添加主题切换动画
        body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            body.style.transition = '';
        }, 300);
    }

    // 获取主题名称
    getThemeName(theme) {
        const themeNames = {
            nature: '自然绿色',
            purple: '优雅紫色',
            orange: '活力橙色',
            pink: '温馨粉色'
        };
        return themeNames[theme] || '未知主题';
    }

    // 添加事件监听器清理方法
    addEventListenerWithCleanup(element, event, handler, options = {}) {
        const signal = this.abortController.signal;
        const finalOptions = { ...options, signal };

        element.addEventListener(event, handler, finalOptions);

        // 存储引用以便手动清理（如果需要）
        const key = `${element.constructor.name}_${event}_${Date.now()}`;
        this.eventListeners.set(key, { element, event, handler });

        return key;
    }

    // 清理所有事件监听器
    cleanup() {
        this.abortController.abort();
        this.eventListeners.clear();
        this.renderCache.clear();
    }

    // 绑定事件监听器
    bindEvents() {
        // 表单提交事件
        this.addEventListenerWithCleanup(
            document.getElementById('productForm'),
            'submit',
            e => {
                e.preventDefault();
                this.addProduct();
            }
        );

        this.addEventListenerWithCleanup(
            document.getElementById('editProductForm'),
            'submit',
            e => {
                e.preventDefault();
                this.updateProduct();
            }
        );

        // 重置编辑表单
        const resetEditFormBtn = document.getElementById('resetEditForm');
        if (resetEditFormBtn) {
            resetEditFormBtn.addEventListener('click', e => {
                e.preventDefault();
                this.resetEditForm();
            });
        }

        // 搜索和筛选事件 - 使用防抖优化性能
        this.addEventListenerWithCleanup(
            document.getElementById('searchInput'),
            'input',
            this.debounce(() => this.filterProducts(), 300)
        );

        this.addEventListenerWithCleanup(
            document.getElementById('categoryFilter'),
            'change',
            () => this.filterProducts()
        );

        this.addEventListenerWithCleanup(
            document.getElementById('warrantyFilter'),
            'change',
            () => this.filterProducts()
        );

        // 使用事件委托优化产品卡片事件处理
        this.addEventListenerWithCleanup(
            document.getElementById('productsList'),
            'click',
            e => {
                const button = e.target.closest('button');
                if (!button) {
                    return;
                }

                const productCard = button.closest('.product-card');
                if (!productCard) {
                    return;
                }

                const productId = productCard.dataset.id;

                // 处理复制按钮
                if (button.classList.contains('copy-btn')) {
                    const textToCopy = button.dataset.copy;
                    this.copyToClipboard(textToCopy, button);
                    return;
                }

                // 处理展开/收起按钮
                if (button.dataset.action === 'toggle') {
                    this.toggleProductDetails(productCard);
                    return;
                }

                if (button.textContent.includes('编辑')) {
                    this.editProduct(productId);
                } else if (button.textContent.includes('删除')) {
                    this.deleteProduct(productId);
                }
            }
        );

        // 模态框事件
        this.addEventListenerWithCleanup(document, 'click', e => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });

        // 键盘事件
        this.addEventListenerWithCleanup(document, 'keydown', e => {
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });

        // 导入导出事件
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            this.addEventListenerWithCleanup(exportBtn, 'click', () =>
                this.exportData()
            );
        }

        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            this.addEventListenerWithCleanup(importBtn, 'click', () => {
                const importFile = document.getElementById('importFile');
                if (importFile) {
                    importFile.click();
                }
            });
        }

        const importFile = document.getElementById('importFile');
        if (importFile) {
            this.addEventListenerWithCleanup(importFile, 'change', e => {
                if (e.target.files[0]) {
                    this.importData(e.target.files[0]);
                }
            });
        }

        // 清空数据事件
        const clearDataBtn = document.getElementById('clearDataBtn');
        if (clearDataBtn) {
            this.addEventListenerWithCleanup(clearDataBtn, 'click', () =>
                this.clearAllData()
            );
        }

        // 页面卸载时清理资源
        this.addEventListenerWithCleanup(window, 'beforeunload', () =>
            this.cleanup()
        );

        // 页面隐藏时清理缓存
        this.addEventListenerWithCleanup(document, 'visibilitychange', () => {
            if (document.hidden) {
                this.cleanupCache();
            }
        });

        // 全局错误处理
        this.addEventListenerWithCleanup(window, 'error', event => {
            console.error('全局错误:', event.error);
            this.showNotification('应用发生错误，请刷新页面', 'error');
        });

        // 未处理的Promise拒绝
        this.addEventListenerWithCleanup(
            window,
            'unhandledrejection',
            event => {
                console.error('未处理的Promise拒绝:', event.reason);
                this.showNotification('数据处理错误，请重试', 'error');
                event.preventDefault();
            }
        );
    }

    // 重置编辑表单
    resetEditForm() {
        if (this.currentEditId) {
            const product = this.products.find(
                p => p.id === this.currentEditId
            );
            if (product) {
                // 重新填充原始数据
                this.editProduct(this.currentEditId);
                this.showNotification('表单已重置', 'info');
            }
        }
    }

    // 显示字段错误
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) {
            return;
        }

        let errorDiv = field.parentNode.querySelector('.field-error');

        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.style.cssText =
                'color: var(--danger-color); font-size: 0.875rem; margin-top: 0.25rem; display: none;';
            field.parentNode.appendChild(errorDiv);
        }

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        field.classList.add('error');
        field.focus();
    }

    // 清除字段错误
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) {
            return;
        }

        const errorDiv = field.parentNode.querySelector('.field-error');

        if (errorDiv) {
            errorDiv.style.display = 'none';
        }

        field.classList.remove('error');
    }

    // 清除所有字段错误
    clearAllFieldErrors() {
        document.querySelectorAll('.field-error').forEach(error => {
            error.style.display = 'none';
        });
        document
            .querySelectorAll(
                '.form-input.error, input.error, textarea.error, select.error'
            )
            .forEach(input => {
                input.classList.remove('error');
            });
    }

    // 从Firebase加载产品数据
    async loadProducts() {
        console.log('[Firebase Debug] 开始加载产品数据...');
        
        try {
            if (!window.firebaseDB) {
                console.warn('[Firebase Debug] Firebase未初始化，等待初始化完成...');
                return [];
            }

            console.log('[Firebase Debug] Firebase数据库实例可用，开始读取数据');
            console.log('[Firebase Debug] 数据库引用:', {
                productsRef: !!window.firebaseDB.productsRef,
                refPath: window.firebaseDB.productsRef.toString()
            });

            const snapshot = await window.firebaseDB.productsRef.once('value');
            console.log('[Firebase Debug] 数据快照获取完成:', {
                exists: snapshot.exists(),
                hasChildren: snapshot.hasChildren(),
                numChildren: snapshot.numChildren(),
                key: snapshot.key
            });
            
            const data = snapshot.val();
            console.log('[Firebase Debug] 原始数据:', {
                hasData: !!data,
                dataType: typeof data,
                isNull: data === null,
                isUndefined: data === undefined,
                keysCount: data ? Object.keys(data).length : 0
            });

            if (data) {
                console.log('[Firebase Debug] 开始解析产品数据...');
                const products = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                console.log(`[Firebase Debug] 产品数据解析完成，共 ${products.length} 个产品`);
                
                // 记录前几个产品的基本信息
                if (products.length > 0) {
                    console.log('[Firebase Debug] 前3个产品预览:', 
                        products.slice(0, 3).map(p => ({
                            id: p.id,
                            name: p.productName,
                            brand: p.brand,
                            createdAt: p.createdAt
                        }))
                    );
                }

                // 按创建时间排序（最新的在前）
                console.log('[Firebase Debug] 开始排序产品数据...');
                products.sort(
                    (a, b) =>
                        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                );
                console.log('[Firebase Debug] 产品数据排序完成');

                // 清理缓存，因为数据已更新
                console.log('[Firebase Debug] 清理缓存...');
                this.renderCache && this.renderCache.clear();
                this.filteredProducts = null;
                this.lastFilterKey = null;

                console.log(`[Firebase Debug] 产品数据加载成功，返回 ${products.length} 个产品`);
                return products;
            } else {
                console.log('[Firebase Debug] 数据库中没有产品数据');
                return [];
            }
        } catch (error) {
            console.error('[Firebase Debug] 从Firebase加载产品数据失败:', error);
            console.error('[Firebase Debug] 错误详情:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            return [];
        }
    }

    // 保存单个产品到Firebase
    async saveProduct(product) {
        try {
            if (!window.firebaseDB) {
                console.warn('Firebase未初始化，操作已加入队列');
                this.pendingOperations.push({ type: 'save', product });
                return;
            }

            const productData = { ...product };
            delete productData.id; // 移除id，因为它将作为key使用

            await window.firebaseDB.productsRef
                .child(product.id)
                .set(productData);
            console.log('产品保存成功:', product.id);
        } catch (error) {
            console.error('保存产品到Firebase失败:', error);
            throw error;
        }
    }

    // 从Firebase删除产品
    async deleteProductFromFirebase(productId) {
        try {
            if (!window.firebaseDB) {
                console.warn('Firebase未初始化，操作已加入队列');
                this.pendingOperations.push({ type: 'delete', productId });
                return;
            }

            await window.firebaseDB.productsRef.child(productId).remove();
            console.log('产品删除成功:', productId);
        } catch (error) {
            console.error('从Firebase删除产品失败:', error);
            throw error;
        }
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 添加新产品 - Firebase版本
    async addProduct() {
        try {
            // 清除之前的错误
            this.clearAllFieldErrors();

            const formData = this.getFormData('productForm');

            if (!this.validateProduct(formData, false)) {
                this.showNotification(
                    '产品信息验证失败，请检查表单。',
                    'error'
                );
                return;
            }

            // 检查重复产品
            if (this.isDuplicateProduct(formData)) {
                this.showNotification(
                    '检测到相似产品，请确认是否重复添加',
                    'warning'
                );
                return;
            }

            const product = {
                id: this.generateId(),
                ...formData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 保存到Firebase
            await this.saveProduct(product);

            // 本地也添加（实时监听器会处理同步）
            this.products.unshift(product);

            // 清理缓存
            this.renderCache.clear();
            this.filteredProducts = null;
            this.lastFilterKey = null;

            this.resetForm('productForm');
            this.clearAllFieldErrors();
            this.showNotification('产品添加成功！', 'success');
        } catch (error) {
            console.error('添加产品失败:', error);
            this.showNotification(
                `添加产品失败: ${error.message || '请重试'}`,
                'error'
            );
        }
    }

    // 获取表单数据
    getFormData(formId) {
        const form = document.getElementById(formId);

        if (formId === 'editProductForm') {
            return {
                name: document.getElementById('editProductName').value || '',
                brand: document.getElementById('editBrand').value || '',
                model: document.getElementById('editModel').value || '',
                category: document.getElementById('editCategory').value || '',
                serialNumber:
                    document.getElementById('editSerialNumber').value || '',
                purchaseDate:
                    document.getElementById('editPurchaseDate').value || '',
                warrantyPeriod:
                    parseInt(
                        document.getElementById('editWarrantyPeriod').value
                    ) || 0,
                price:
                    parseFloat(document.getElementById('editPrice').value) || 0,
                store: document.getElementById('editStore').value || '',
                notes: document.getElementById('editNotes').value || ''
            };
        } else {
            const formData = new FormData(form);
            return {
                name: formData.get('productName') || '',
                brand: formData.get('brand') || '',
                model: formData.get('model') || '',
                category: formData.get('category') || '',
                serialNumber: formData.get('serialNumber') || '',
                purchaseDate: formData.get('purchaseDate') || '',
                warrantyPeriod: parseInt(formData.get('warrantyPeriod')) || 0,
                price: parseFloat(formData.get('price')) || 0,
                store: formData.get('store') || '',
                notes: formData.get('notes') || ''
            };
        }
    }

    // 检查重复产品
    isDuplicateProduct(newProduct) {
        return this.products.some(existingProduct => {
            // 检查名称、品牌、型号是否完全匹配
            const nameMatch =
                existingProduct.name.toLowerCase().trim() ===
                newProduct.name.toLowerCase().trim();
            const brandMatch =
                (existingProduct.brand || '').toLowerCase().trim() ===
                (newProduct.brand || '').toLowerCase().trim();
            const modelMatch =
                (existingProduct.model || '').toLowerCase().trim() ===
                (newProduct.model || '').toLowerCase().trim();

            // 如果名称、品牌、型号都匹配，则认为是重复产品
            return nameMatch && brandMatch && modelMatch;
        });
    }

    // 验证产品数据
    validateProduct(product, isEdit = false) {
        const errors = [];

        // 清除之前的错误
        this.clearAllFieldErrors();

        if (!product.name || product.name.trim() === '') {
            errors.push({
                field: isEdit ? 'editProductName' : 'productName',
                message: '产品名称不能为空'
            });
        }

        if (!product.purchaseDate) {
            errors.push({
                field: isEdit ? 'editPurchaseDate' : 'purchaseDate',
                message: '购买日期不能为空'
            });
        } else {
            const purchaseDate = new Date(product.purchaseDate);
            const today = new Date();
            if (purchaseDate > today) {
                errors.push({
                    field: isEdit ? 'editPurchaseDate' : 'purchaseDate',
                    message: '购买日期不能是未来日期'
                });
            }
        }

        if (
            product.warrantyPeriod &&
            (isNaN(product.warrantyPeriod) || product.warrantyPeriod < 0)
        ) {
            errors.push({
                field: isEdit ? 'editWarrantyPeriod' : 'warrantyPeriod',
                message: '保修期必须是非负数'
            });
        }

        if (product.price && (isNaN(product.price) || product.price < 0)) {
            errors.push({
                field: isEdit ? 'editPrice' : 'price',
                message: '价格必须是非负数'
            });
        }

        if (product.notes && product.notes.length > 500) {
            errors.push({
                field: isEdit ? 'editNotes' : 'notes',
                message: '备注不能超过500个字符'
            });
        }

        // 显示字段错误
        errors.forEach(error => {
            this.showFieldError(error.field, error.message);
        });

        return errors.length === 0;
    }

    // 重置表单
    resetForm(formId) {
        document.getElementById(formId).reset();
    }

    // 计算保修状态
    getWarrantyStatus(product) {
        if (!product.warrantyPeriod || product.warrantyPeriod <= 0) {
            return {
                status: 'unknown',
                text: '无保修信息',
                class: 'warranty-expired'
            };
        }

        const purchaseDate = new Date(product.purchaseDate);
        const warrantyEndDate = new Date(purchaseDate);
        warrantyEndDate.setMonth(
            warrantyEndDate.getMonth() + product.warrantyPeriod
        );

        const today = new Date();
        const daysLeft = Math.ceil(
            (warrantyEndDate - today) / (1000 * 60 * 60 * 24)
        );

        if (daysLeft < 0) {
            return {
                status: 'expired',
                text: '已过期',
                class: 'warranty-expired',
                endDate: warrantyEndDate
            };
        } else if (daysLeft <= 30) {
            return {
                status: 'expiring',
                text: `${daysLeft}天后过期`,
                class: 'warranty-expiring',
                endDate: warrantyEndDate
            };
        } else {
            return {
                status: 'valid',
                text: `${daysLeft}天后过期`,
                class: 'warranty-valid',
                endDate: warrantyEndDate
            };
        }
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    // 格式化价格
    formatPrice(price) {
        const numPrice = parseFloat(price);
        if (!numPrice || numPrice === 0 || isNaN(numPrice)) {
            return '-';
        }
        return `RM ${numPrice.toFixed(2)}`;
    }

    // 渲染产品列表 - 优化性能版本
    renderProducts(productsToRender = null) {
        const startTime = performance.now();

        const productsList = document.getElementById('productsList');
        const emptyState = document.getElementById('emptyState');
        const products = productsToRender || this.products;

        if (products.length === 0) {
            productsList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // 如果产品数量超过50个，启用虚拟滚动
        if (products.length > 50 && !this.virtualScrollEnabled) {
            this.enableVirtualScroll(productsList);
        }

        if (this.virtualScrollEnabled && products.length > 50) {
            this.renderVirtualProducts(products, productsList);
        } else {
            this.renderAllProducts(products, productsList);
        }

        // 性能监控
        const endTime = performance.now();
        this.monitorPerformance('renderProducts', endTime - startTime);
    }

    // 渲染所有产品（非虚拟滚动）
    renderAllProducts(products, container) {
        // 使用DocumentFragment批量操作DOM
        const fragment = document.createDocumentFragment();

        // 批量渲染产品卡片
        const productCards = products.map(product =>
            this.createProductCard(product)
        );
        productCards.forEach(card => fragment.appendChild(card));

        // 一次性更新DOM
        container.innerHTML = '';
        container.appendChild(fragment);
    }

    // 虚拟滚动渲染
    renderVirtualProducts(products, container) {
        const { start, end } = this.visibleRange;
        const visibleProducts = products.slice(
            start,
            Math.min(end, products.length)
        );

        // 创建容器
        const scrollContainer =
            container.querySelector('.virtual-scroll-container') ||
            document.createElement('div');
        scrollContainer.className = 'virtual-scroll-container';
        scrollContainer.style.height = `${products.length * this.itemHeight}px`;
        scrollContainer.style.position = 'relative';

        // 创建可视区域
        const viewport =
            container.querySelector('.virtual-viewport') ||
            document.createElement('div');
        viewport.className = 'virtual-viewport';
        viewport.style.transform = `translateY(${start * this.itemHeight}px)`;

        // 渲染可视产品
        const fragment = document.createDocumentFragment();
        visibleProducts.forEach(product => {
            const card = this.createProductCard(product);
            card.style.position = 'relative';
            card.style.height = `${this.itemHeight}px`;
            fragment.appendChild(card);
        });

        viewport.innerHTML = '';
        viewport.appendChild(fragment);

        if (!container.querySelector('.virtual-scroll-container')) {
            scrollContainer.appendChild(viewport);
            container.innerHTML = '';
            container.appendChild(scrollContainer);
        }
    }

    // 启用虚拟滚动
    enableVirtualScroll(container) {
        this.virtualScrollEnabled = true;

        // 添加滚动监听
        const scrollHandler = this.throttle(() => {
            const scrollTop = container.scrollTop || window.pageYOffset;
            const containerHeight =
                container.clientHeight || window.innerHeight;

            const start = Math.floor(scrollTop / this.itemHeight);
            const visibleCount =
                Math.ceil(containerHeight / this.itemHeight) + 5; // 额外渲染5个
            const end = start + visibleCount;

            if (
                start !== this.visibleRange.start ||
                end !== this.visibleRange.end
            ) {
                this.visibleRange = { start, end };
                // 重新渲染当前筛选的产品
                const currentProducts = this.filteredProducts || this.products;
                this.renderVirtualProducts(currentProducts, container);
            }
        }, 16); // 60fps

        container.addEventListener('scroll', scrollHandler);
        window.addEventListener('scroll', scrollHandler);
    }

    // 创建单个产品卡片 - 使用缓存优化
    createProductCard(product) {
        // 检查缓存
        const cacheKey = `${product.id}_${product.updatedAt || product.createdAt}`;
        if (this.renderCache.has(cacheKey)) {
            return this.renderCache.get(cacheKey).cloneNode(true);
        }

        const warranty = this.getWarrantyStatus(product);

        const cardElement = document.createElement('div');
        cardElement.className = 'product-card';
        cardElement.dataset.id = product.id;

        cardElement.innerHTML = `
            <div class="product-header">
                <div class="product-title-section">
                    <h3 class="product-title">${this.escapeHtml(product.name)}</h3>
                    ${
                        product.brand ||
                        product.model ||
                        product.serialNumber ||
                        product.category
                            ? `
                        <div class="product-meta-grid">
                            ${
                                product.brand
                                    ? `
                                <div class="meta-card brand-card">
                                    <div class="meta-icon">
                                        <i class="fas fa-building"></i>
                                    </div>
                                    <div class="meta-content">
                                        <div class="meta-label">品牌</div>
                                        <div class="meta-value">${this.escapeHtml(product.brand)}</div>
                                    </div>
                                </div>
                            `
                                    : ''
                            }
                            ${
                                product.category
                                    ? `
                                <div class="meta-card category-card">
                                    <div class="meta-icon">
                                        <i class="fas fa-tags"></i>
                                    </div>
                                    <div class="meta-content">
                                        <div class="meta-label">分类</div>
                                        <div class="meta-value">${this.escapeHtml(product.category)}</div>
                                    </div>
                                </div>
                            `
                                    : ''
                            }
                            ${
                                product.model
                                    ? `
                                <div class="meta-card model-card">
                                    <div class="meta-icon">
                                        <i class="fas fa-microchip"></i>
                                    </div>
                                    <div class="meta-content">
                                        <div class="meta-label">型号</div>
                                        <div class="meta-value">${this.escapeHtml(product.model)}</div>
                                    </div>
                                </div>
                            `
                                    : ''
                            }
                            ${
                                product.serialNumber
                                    ? `
                                 <div class="meta-card serial-card">
                                     <div class="meta-icon">
                                         <i class="fas fa-barcode"></i>
                                     </div>
                                     <div class="meta-content">
                                         <div class="meta-label">序列号</div>
                                         <div class="meta-value" data-serial="${this.escapeHtml(product.serialNumber)}">${this.escapeHtml(product.serialNumber)}</div>
                                     </div>
                                     <button class="copy-btn" data-copy="${this.escapeHtml(product.serialNumber)}" title="复制序列号">
                                         <i class="fas fa-copy"></i>
                                     </button>
                                 </div>
                             `
                                    : ''
                            }
                        </div>
                    `
                            : ''
                    }
                </div>
                <div class="warranty-badge">
                    <span class="warranty-status ${warranty.class}">
                        <i class="fas fa-shield-alt"></i>
                        ${warranty.text}
                    </span>
                </div>
            </div>
            
            <!-- 详细信息区域，默认隐藏 -->
            <div class="product-details" style="display: none;">
                <div class="product-info-grid">
                    <div class="info-section purchase-info">
                        <div class="section-title">
                            <i class="fas fa-shopping-cart"></i>
                            <span>购买信息</span>
                        </div>
                        <div class="info-content">
                            <div class="info-item">
                                <span class="info-label">购买日期</span>
                                <span class="info-value">${this.formatDate(product.purchaseDate)}</span>
                            </div>
                            ${
                                product.price
                                    ? `
                                <div class="info-item price-highlight">
                                    <span class="info-label">购买价格</span>
                                    <span class="info-value price-value">${this.formatPrice(product.price)}</span>
                                </div>
                            `
                                    : ''
                            }
                            ${
                                product.store
                                    ? `
                                <div class="info-item">
                                    <span class="info-label">购买商店</span>
                                    <span class="info-value">${this.escapeHtml(product.store)}</span>
                                </div>
                            `
                                    : ''
                            }
                        </div>
                    </div>
                    
                    ${
                        warranty.endDate
                            ? `
                        <div class="info-section warranty-info">
                            <div class="section-title">
                                <i class="fas fa-calendar-check"></i>
                                <span>保修信息</span>
                            </div>
                            <div class="info-content">
                                <div class="info-item">
                                    <span class="info-label">保修到期</span>
                                    <span class="info-value warranty-date">${this.formatDate(warranty.endDate)}</span>
                                </div>
                                ${
                                    product.warrantyPeriod
                                        ? `
                                    <div class="info-item">
                                        <span class="info-label">保修期限</span>
                                        <span class="info-value">${product.warrantyPeriod} 个月</span>
                                    </div>
                                `
                                        : ''
                                }
                            </div>
                        </div>
                    `
                            : ''
                    }
                </div>
                
                ${
                    product.notes
                        ? `
                    <div class="product-notes">
                        <div class="notes-title">
                            <i class="fas fa-sticky-note"></i>
                            <span>备注</span>
                        </div>
                        <div class="notes-content">${this.escapeHtml(product.notes)}</div>
                    </div>
                `
                        : ''
                }
            </div>
            
            <!-- 展开/收起按钮和操作按钮 -->
            <div class="expand-toggle">
                <button class="expand-btn" data-action="toggle">
                    <span class="expand-text">查看详情</span>
                    <i class="fas fa-chevron-down expand-icon"></i>
                </button>
                <div class="product-actions">
                    <button class="btn btn-secondary btn-sm" data-action="edit">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="btn btn-danger btn-sm" data-action="delete">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </div>
        `;

        // 缓存渲染结果
        this.renderCache.set(cacheKey, cardElement.cloneNode(true));

        // 清理过期缓存
        this.cleanupCache();

        return cardElement;
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 筛选产品 - 优化性能版本
    filterProducts() {
        const startTime = performance.now();

        const searchTerm = document
            .getElementById('searchInput')
            .value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const warrantyFilter = document.getElementById('warrantyFilter').value;

        // 创建筛选条件缓存键
        const filterKey = `${searchTerm}_${categoryFilter}_${warrantyFilter}`;

        // 检查是否有缓存的筛选结果
        if (this.filteredProducts && this.lastFilterKey === filterKey) {
            return;
        }

        // 预编译搜索正则表达式
        const searchRegex = searchTerm
            ? new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
            : null;

        const filteredProducts = this.products.filter(product => {
            // 搜索词匹配 - 使用正则表达式优化
            const matchesSearch =
                !searchRegex ||
                searchRegex.test(product.name) ||
                (product.brand && searchRegex.test(product.brand)) ||
                (product.model && searchRegex.test(product.model)) ||
                (product.category && searchRegex.test(product.category)) ||
                (product.serialNumber &&
                    searchRegex.test(product.serialNumber)) ||
                (product.store && searchRegex.test(product.store)) ||
                (product.notes && searchRegex.test(product.notes));

            // 分类筛选
            const matchesCategory =
                !categoryFilter || product.category === categoryFilter;

            // 保修状态筛选 - 缓存保修状态
            let matchesWarranty = true;
            if (warrantyFilter) {
                if (!product._warrantyCache) {
                    product._warrantyCache = this.getWarrantyStatus(product);
                }
                matchesWarranty =
                    product._warrantyCache.status === warrantyFilter;
            }

            return matchesSearch && matchesCategory && matchesWarranty;
        });

        // 缓存筛选结果
        this.filteredProducts = filteredProducts;
        this.lastFilterKey = filterKey;

        this.renderProducts(filteredProducts);
        this.updateStats(filteredProducts.length);

        // 性能监控
        const endTime = performance.now();
        this.monitorPerformance('filterProducts', endTime - startTime);
    }

    // 更新统计信息
    updateStats(filteredCount = null) {
        const totalProducts = document.getElementById('totalProducts');
        const count =
            filteredCount !== null ? filteredCount : this.products.length;
        totalProducts.textContent = `总计: ${count} 件产品`;
    }

    // 编辑产品
    editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) {
            return;
        }

        this.currentEditId = id;

        // 填充编辑表单
        document.getElementById('editProductId').value = id;
        document.getElementById('editProductName').value = product.name || '';
        document.getElementById('editBrand').value = product.brand || '';
        document.getElementById('editModel').value = product.model || '';
        document.getElementById('editCategory').value = product.category || '';
        document.getElementById('editSerialNumber').value =
            product.serialNumber || '';
        document.getElementById('editPurchaseDate').value =
            product.purchaseDate || '';
        document.getElementById('editWarrantyPeriod').value =
            product.warrantyPeriod || '';
        document.getElementById('editPrice').value = product.price || '';
        document.getElementById('editStore').value = product.store || '';
        document.getElementById('editNotes').value = product.notes || '';

        // 初始化字符计数器
        this.updateCharCounter('editNotes', 'editNotesCounter', 500);

        // 显示保修信息
        this.updateWarrantyInfo(product);

        // 绑定实时更新事件
        this.bindEditFormEvents();

        this.showModal('editModal');
    }

    // 绑定编辑表单的实时更新事件
    bindEditFormEvents() {
        const notesField = document.getElementById('editNotes');
        const warrantyField = document.getElementById('editWarrantyPeriod');
        const purchaseDateField = document.getElementById('editPurchaseDate');

        // 字符计数器
        notesField.addEventListener('input', () => {
            this.updateCharCounter('editNotes', 'editNotesCounter', 500);
        });

        // 保修信息实时更新
        const updateWarranty = () => {
            const purchaseDate = purchaseDateField.value;
            const warrantyPeriod = parseInt(warrantyField.value) || 0;

            if (purchaseDate && warrantyPeriod > 0) {
                const mockProduct = {
                    purchaseDate: purchaseDate,
                    warrantyPeriod: warrantyPeriod
                };
                this.updateWarrantyInfo(mockProduct);
            } else {
                document.getElementById('editWarrantyInfo').innerHTML = '';
            }
        };

        warrantyField.addEventListener('input', updateWarranty);
        purchaseDateField.addEventListener('change', updateWarranty);
    }

    // 更新字符计数器
    updateCharCounter(fieldId, counterId, maxLength) {
        const field = document.getElementById(fieldId);
        const counter = document.getElementById(counterId);
        const currentLength = field.value.length;

        counter.textContent = currentLength;

        // 根据字符数量改变颜色
        if (currentLength > maxLength * 0.9) {
            counter.style.color = 'var(--danger-color)';
        } else if (currentLength > maxLength * 0.7) {
            counter.style.color = 'var(--warning-color)';
        } else {
            counter.style.color = 'var(--text-secondary)';
        }

        // 限制最大长度
        if (currentLength > maxLength) {
            field.value = field.value.substring(0, maxLength);
            counter.textContent = maxLength;
        }
    }

    // 更新保修信息显示
    updateWarrantyInfo(product) {
        const warrantyInfoDiv = document.getElementById('editWarrantyInfo');

        if (!product.warrantyPeriod || product.warrantyPeriod <= 0) {
            warrantyInfoDiv.innerHTML = '';
            return;
        }

        const warranty = this.getWarrantyStatus(product);
        const purchaseDate = new Date(product.purchaseDate);
        const warrantyEndDate = new Date(purchaseDate);
        warrantyEndDate.setMonth(
            warrantyEndDate.getMonth() + product.warrantyPeriod
        );

        warrantyInfoDiv.innerHTML = `
            <div class="warranty-details">
                <div class="warranty-status ${warranty.class}">
                    <i class="fas fa-shield-alt"></i>
                    <strong>保修状态：${warranty.text}</strong>
                </div>
                <div class="warranty-dates">
                    <p><i class="fas fa-calendar-alt"></i> 购买日期：${this.formatDate(product.purchaseDate)}</p>
                    <p><i class="fas fa-calendar-check"></i> 保修到期：${this.formatDate(warrantyEndDate)}</p>
                    <p><i class="fas fa-clock"></i> 保修期限：${product.warrantyPeriod} 个月</p>
                </div>
            </div>
        `;
    }

    // 更新产品 - Firebase版本
    async updateProduct() {
        const formData = this.getFormData('editProductForm');

        if (!this.validateProduct(formData, true)) {
            return;
        }

        const productIndex = this.products.findIndex(
            p => p.id === this.currentEditId
        );
        if (productIndex === -1) {
            this.showNotification('产品不存在', 'error');
            return;
        }

        // 清理相关缓存
        const oldProduct = this.products[productIndex];
        if (oldProduct._warrantyCache) {
            delete oldProduct._warrantyCache;
        }

        // 更新产品数据
        const updatedProduct = {
            ...this.products[productIndex],
            ...formData,
            updatedAt: new Date().toISOString()
        };

        try {
            // 保存到Firebase
            await this.saveProduct(updatedProduct);

            // 本地也更新（实时监听器会处理同步）
            this.products[productIndex] = updatedProduct;

            // 清理渲染缓存
            for (const [key] of this.renderCache) {
                if (key.startsWith(this.currentEditId)) {
                    this.renderCache.delete(key);
                }
            }

            // 清理筛选缓存
            this.filteredProducts = null;
            this.lastFilterKey = null;

            this.closeEditModal();
            this.showNotification('产品更新成功！', 'success');
        } catch (error) {
            console.error('更新产品失败:', error);
            this.showNotification('更新产品失败，请重试', 'error');
        }
    }

    // 删除产品
    deleteProduct(id) {
        this.currentDeleteId = id;
        this.showModal('deleteModal');
    }

    // 确认删除 - Firebase版本
    async confirmDelete() {
        if (!this.currentDeleteId) {
            return;
        }

        try {
            // 从Firebase删除
            await this.deleteProductFromFirebase(this.currentDeleteId);

            // 本地也删除（实时监听器会处理同步）
            const productIndex = this.products.findIndex(
                p => p.id === this.currentDeleteId
            );
            if (productIndex !== -1) {
                this.products.splice(productIndex, 1);
            }

            // 清理相关缓存
            for (const [key] of this.renderCache) {
                if (key.startsWith(this.currentDeleteId)) {
                    this.renderCache.delete(key);
                }
            }

            // 清理筛选缓存
            this.filteredProducts = null;
            this.lastFilterKey = null;

            this.filterProducts(); // 重新筛选而不是全量渲染
            this.updateStats();
            this.closeDeleteModal();
            this.showNotification('产品删除成功！', 'success');
        } catch (error) {
            console.error('删除产品失败:', error);
            this.showNotification('删除产品失败，请重试', 'error');
        }

        this.currentDeleteId = null;
    }

    // 显示模态框
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // 关闭所有模态框
    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = '';
    }

    // 关闭编辑模态框
    closeEditModal() {
        this.closeModals();
        this.currentEditId = null;
    }

    // 关闭删除模态框
    closeDeleteModal() {
        this.closeModals();
        this.currentDeleteId = null;
    }

    // 显示通知
    showNotification(message, type = 'info', duration = 3000) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // 获取通知图标
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // 获取通知颜色
    getNotificationColor(type) {
        const colors = {
            success: '#059669',
            error: '#dc2626',
            warning: '#d97706',
            info: '#2563eb'
        };
        return colors[type] || colors.info;
    }

    // 导出数据
    exportData() {
        try {
            const dataStr = JSON.stringify(this.products, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `产品记录_${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            URL.revokeObjectURL(url);
            this.showNotification('数据导出成功！', 'success');
        } catch (error) {
            console.error('导出失败:', error);
            this.showNotification('导出失败，请重试', 'error');
        }
    }

    // 导入数据 - Firebase版本
    importData(file) {
        const reader = new FileReader();
        reader.onload = async e => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    // 等待Firebase初始化
                    await this.waitForFirebase();

                    // 清空现有数据
                    await this.clearAllDataFromFirebase();

                    // 批量保存到Firebase
                    const savePromises = importedData.map(product => {
                        // 确保产品有ID
                        if (!product.id) {
                            product.id = this.generateId();
                        }
                        return this.saveProduct(product);
                    });

                    await Promise.all(savePromises);

                    this.showNotification('数据导入成功！', 'success');
                } else {
                    throw new Error('无效的数据格式');
                }
            } catch (error) {
                console.error('导入失败:', error);
                this.showNotification('导入失败，请检查文件格式', 'error');
            }
        };
        reader.readAsText(file);
    }

    // 清空所有数据 - Firebase版本
    async clearAllData() {
        if (confirm('确定要删除所有产品数据吗？此操作无法撤销！')) {
            try {
                await this.clearAllDataFromFirebase();
                this.showNotification('所有数据已清空！', 'success');
            } catch (error) {
                console.error('清空数据失败:', error);
                this.showNotification('清空数据失败，请重试', 'error');
            }
        }
    }

    // 从Firebase清空所有数据
    async clearAllDataFromFirebase() {
        await this.waitForFirebase();
        await window.firebaseDB.productsRef.remove();

        // 清空本地数据
        this.products = [];

        // 清理缓存
        this.renderCache.clear();
        this.filteredProducts = null;
        this.lastFilterKey = null;

        this.renderProducts();
        this.updateStats();
    }

    // 切换产品详情显示
    toggleProductDetails(productCard) {
        const detailsSection = productCard.querySelector('.product-details');
        const expandBtn = productCard.querySelector('.expand-btn');
        const expandText = expandBtn.querySelector('.expand-text');
        const expandIcon = expandBtn.querySelector('.expand-icon');

        if (detailsSection.style.display === 'none') {
            // 展开详情
            detailsSection.style.display = 'block';
            expandText.textContent = '收起详情';
            expandIcon.classList.remove('fa-chevron-down');
            expandIcon.classList.add('fa-chevron-up');
            productCard.classList.add('expanded');

            // 自动滚动到详情部分
            setTimeout(() => {
                detailsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });
            }, 100); // 延迟100ms确保DOM更新完成
        } else {
            // 收起详情
            detailsSection.style.display = 'none';
            expandText.textContent = '查看详情';
            expandIcon.classList.remove('fa-chevron-up');
            expandIcon.classList.add('fa-chevron-down');
            productCard.classList.remove('expanded');
        }
    }

    // 复制到剪贴板
    async copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);

            // 显示复制成功状态
            const originalIcon = button.innerHTML;
            button.classList.add('copied');
            button.innerHTML = '<i class="fas fa-check"></i>';

            // 显示通知
            this.showNotification('序列号已复制到剪贴板', 'success');

            // 2秒后恢复原状
            setTimeout(() => {
                button.classList.remove('copied');
                button.innerHTML = originalIcon;
            }, 2000);
        } catch (err) {
            console.error('复制失败:', err);

            // 降级方案：使用传统的复制方法
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);

                this.showNotification('序列号已复制到剪贴板', 'success');

                // 显示复制成功状态
                const originalIcon = button.innerHTML;
                button.classList.add('copied');
                button.innerHTML = '<i class="fas fa-check"></i>';

                setTimeout(() => {
                    button.classList.remove('copied');
                    button.innerHTML = originalIcon;
                }, 2000);
            } catch (fallbackErr) {
                console.error('降级复制方法也失败:', fallbackErr);
                this.showNotification('复制失败，请手动选择文本', 'error');
            }
        }
    }
}

// 全局函数（供HTML调用）
function closeEditModal() {
    productManager.closeEditModal();
}

function closeDeleteModal() {
    productManager.closeDeleteModal();
}

function confirmDelete() {
    productManager.confirmDelete();
}

function setWarrantyPeriod(months) {
    const warrantyField = document.getElementById('editWarrantyPeriod');
    if (warrantyField) {
        warrantyField.value = months;

        // 触发保修信息更新
        const purchaseDateField = document.getElementById('editPurchaseDate');
        if (purchaseDateField && purchaseDateField.value) {
            const mockProduct = {
                purchaseDate: purchaseDateField.value,
                warrantyPeriod: months
            };
            productManager.updateWarrantyInfo(mockProduct);
        }

        // 更新按钮状态
        document
            .querySelectorAll('.preset-btn')
            .forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    }
}

function resetEditForm() {
    if (productManager) {
        productManager.resetEditForm();
    }
}

// 初始化应用
let productManager;

document.addEventListener('DOMContentLoaded', () => {
    productManager = new ProductManager();

    // 添加键盘快捷键
    document.addEventListener('keydown', e => {
        // Ctrl+S 保存（阻止浏览器默认行为）
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            productManager.showNotification('数据已自动保存到本地存储', 'info');
        }

        // Ctrl+E 导出数据
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            productManager.exportData();
        }
    });

    // 添加拖拽导入功能
    document.addEventListener('dragover', e => {
        e.preventDefault();
    });

    document.addEventListener('drop', e => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/json') {
            productManager.importData(files[0]);
        }
    });
});

// 添加服务工作者支持（PWA功能）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
