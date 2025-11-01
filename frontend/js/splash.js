// الانتقال للصفحة الرئيسية بعد انتهاء التحميل
document.addEventListener('DOMContentLoaded', function() {
    // محاكاة بعض العمليات الخلفية
    setTimeout(function() {
        window.location.href = '/home';
    }, 2500);
});

// إظهار حالة التحميل
let progress = 0;
const bar = document.querySelector('.bar');
const loadingText = document.querySelector('.loading-text');

const interval = setInterval(() => {
    progress += 1;
    if (progress <= 100) {
        bar.style.width = progress + '%';
        
        if (progress < 30) {
            loadingText.textContent = 'جاري تهيئة النظام...';
        } else if (progress < 60) {
            loadingText.textContent = 'جاري تحميل الوحدات...';
        } else if (progress < 90) {
            loadingText.textContent = 'جاري التحضير...';
        } else {
            loadingText.textContent = 'جاهز!';
        }
    } else {
        clearInterval(interval);
    }
}, 20);
