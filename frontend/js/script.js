// إدارة القائمة الجانبية والتصميم المتجاوب
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // تهيئة القائمة الجانبية
    initializeSidebar();
    
    // إدارة التنقل النشط
    highlightActiveMenu();
    
    // التحقق من صحة الاتصال بالخادم
    checkServerHealth();
    
    // تحميل الإحصائيات
    loadQuickStats();
    
    // إعداد Service Worker للتطبيق (للتطبيقات المستقبلية)
    setupServiceWorker();
    
    // إدارة التصميم المتجاوب
    setupResponsiveDesign();
}

function initializeSidebar() {
    const toggleSidebar = document.querySelector('.toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (toggleSidebar && sidebar && mainContent) {
        toggleSidebar.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                // على الجوال، إظهار/إخفاء القائمة الجانبية
                sidebar.classList.toggle('mobile-visible');
                document.body.style.overflow = sidebar.classList.contains('mobile-visible') ? 'hidden' : 'auto';
            } else {
                // على الأجهزة الكبيرة، طي/فرد القائمة الجانبية
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('expanded');
                
                // حفظ الحالة في localStorage
                const isCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
            }
        });
        
        // تحميل الحالة المحفوظة للأجهزة الكبيرة فقط
        if (window.innerWidth > 768) {
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
            }
        }
        
        // إغلاق القائمة الجانبية عند النقر خارجها على الجوال
        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 768 && 
                sidebar.classList.contains('mobile-visible') &&
                !sidebar.contains(event.target) &&
                !toggleSidebar.contains(event.target)) {
                sidebar.classList.remove('mobile-visible');
                document.body.style.overflow = 'auto';
            }
        });
    }
}

function setupResponsiveDesign() {
    // إدارة تغيير حجم النافذة
    window.addEventListener('resize', handleResize);
    
    // التحقق الأولي
    handleResize();
    
    // إضافة فئة للجسم للإشارة إلى نوع الجهاز
    detectDeviceType();
}

function handleResize() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (window.innerWidth <= 768) {
        // وضع الجوال
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('expanded');
        mainContent.classList.add('full-width');
        
        // إخفاء القائمة الجانبية إذا كانت مفتوحة
        if (sidebar.classList.contains('mobile-visible')) {
            sidebar.classList.remove('mobile-visible');
            document.body.style.overflow = 'auto';
        }
    } else {
        // وضع سطح المكتب
        mainContent.classList.remove('full-width');
        
        // استعادة حالة القائمة الجانبية
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState === 'true') {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
        }
    }
}

function detectDeviceType() {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    const isDesktop = window.innerWidth > 1024;
    
    document.body.classList.remove('mobile-device', 'tablet-device', 'desktop-device');
    
    if (isMobile) {
        document.body.classList.add('mobile-device');
    } else if (isTablet) {
        document.body.classList.add('tablet-device');
    } else {
        document.body.classList.add('desktop-device');
    }
}

function highlightActiveMenu() {
    const currentPage = window.location.pathname;
    const menuLinks = document.querySelectorAll('.menu a');
    
    menuLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        
        if (currentPage === href || 
            (currentPage === '/' && href === '/home') ||
            (currentPage.includes(href) && href !== '/')) {
            link.classList.add('active');
        }
    });
}

async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        if (response.ok) {
            console.log('✅ Server is healthy');
            updateServiceStatus('all', true);
        } else {
            throw new Error('Server response not OK');
        }
    } catch (error) {
        console.error('❌ Server health check failed:', error);
        updateServiceStatus('all', false);
        showNotification('فقدان الاتصال بالخادم', 'error');
    }
}

function updateServiceStatus(service, isActive) {
    const statusIndicators = document.querySelectorAll('.status-indicator');
    const statusItems = document.querySelectorAll('.status-item');
    
    statusIndicators.forEach(indicator => {
        if (service === 'all') {
            indicator.classList.toggle('active', isActive);
        }
    });
    
    statusItems.forEach(item => {
        const small = item.querySelector('small');
        if (small) {
            small.textContent = isActive ? 'متصل' : 'غير متصل';
        }
    });
}

async function loadQuickStats() {
    try {
        // في الإصدار المستقبلي، يمكن جلب الإحصائيات الحقيقية من الخادم
        const stats = {
            generated: 0,
            edited: 0,
            extracted: 0
        };
        
        updateStatsDisplay(stats);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateStatsDisplay(stats) {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => {
        const icon = card.querySelector('i');
        const countElement = card.querySelector('h4');
        
        if (icon.classList.contains('fa-image')) {
            countElement.textContent = stats.generated;
        } else if (icon.classList.contains('fa-edit')) {
            countElement.textContent = stats.edited;
        } else if (icon.classList.contains('fa-search')) {
            countElement.textContent = stats.extracted;
        }
    });
}

function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    }
}

function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // إضافة الأنماط إذا لم تكن موجودة
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                left: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                border-right: 4px solid #6a11cb;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                z-index: 1000;
                animation: slideIn 0.3s ease;
                direction: ltr;
                max-width: 400px;
                margin: 0 auto;
            }
            
            .notification.success { border-right-color: var(--success-color); }
            .notification.error { border-right-color: var(--error-color); }
            .notification.warning { border-right-color: var(--warning-color); }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
            }
            
            .notification-close {
                background: none;
                border: none;
                cursor: pointer;
                color: var(--gray-color);
                padding: 5px;
                border-radius: 3px;
                flex-shrink: 0;
            }
            
            .notification-close:hover {
                background: var(--light-color);
            }
            
            @keyframes slideIn {
                from { transform: translateX(-100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @media (max-width: 768px) {
                .notification {
                    left: 10px;
                    right: 10px;
                    top: 10px;
                    padding: 12px 15px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // إضافة حدث الإغلاق
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    // إزالة تلقائية بعد 5 ثواني
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// وظائف مساعدة عامة
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// تصدير الوظائف للاستخدام في ملفات أخرى
window.appUtils = {
    showNotification,
    formatFileSize,
    debounce
};

// جعل وظائف التصميم المتجاوب متاحة عالمياً
window.responsiveUtils = {
    handleResize,
    detectDeviceType
};
