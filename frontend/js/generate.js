// إدارة صفحة توليد الصور
document.addEventListener('DOMContentLoaded', function() {
    initializeGeneratePage();
});

// متغير عالمي للاحتفاظ ببيانات آخر صورة مولدة
let currentGenerationData = null;

function initializeGeneratePage() {
    // تهيئة خيارات النمط
    initializeStyleOptions();
    
    // إدارة عداد الأحرف
    setupCharCounter();
    
    // إدارة الخيارات المتقدمة (لم يتم تضمينها هنا، لكنها مفترضة)
    setupAdvancedOptions();
    
    // إعداد زر التوليد
    setupGenerateButton();
    
    // إعداد أزرار الصور
    setupImageActions();
    
    // تحميل السجل
    loadGenerationHistory();
}

function initializeStyleOptions() {
    const styleOptions = document.querySelectorAll('.style-option');
    
    styleOptions.forEach(option => {
        option.addEventListener('click', function() {
            // إزالة النشاط من جميع الخيارات
            styleOptions.forEach(opt => opt.classList.remove('active'));
            
            // إضافة النشاط للخيار المحدد
            this.classList.add('active');
        });
    });
    
    // تحديد الخيار الافتراضي
    if (styleOptions.length > 0) {
        styleOptions[0].classList.add('active');
    }
}

function setupCharCounter() {
    const promptInput = document.getElementById('prompt-input');
    const charCount = document.getElementById('char-count');
    
    if (promptInput && charCount) {
        promptInput.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            // تغيير اللون إذا تجاوز الحد
            if (count > 500) {
                charCount.style.color = 'var(--error-color)';
            } else {
                charCount.style.color = 'var(--text-secondary-color)';
            }
        });
    }
}

function setupAdvancedOptions() {
    // Placeholder function for advanced options setup
    // يمكنك إضافة منطق إظهار/إخفاء أو تعيين القيم هنا
}

function getSelectedStyle() {
    const activeOption = document.querySelector('.style-option.active');
    return activeOption ? activeOption.getAttribute('data-style') : 'realistic';
}

function setupGenerateButton() {
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.addEventListener('click', handleImageGeneration);
}

function handleImageGeneration() {
    const prompt = document.getElementById('prompt-input').value.trim();
    const style = getSelectedStyle();
    const resultArea = document.getElementById('resultArea');
    const loadingIndicator = document.getElementById('loadingIndicator');

    if (!prompt) {
        alert('الرجاء إدخال وصف الصورة (البرومبت).');
        return;
    }

    // عرض شاشة التحميل
    resultArea.style.display = 'none';
    loadingIndicator.style.display = 'flex';

    fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt, style })
    })
    .then(response => response.json())
    .then(data => {
        loadingIndicator.style.display = 'none';
        
        if (data.success && data.data) {
            currentGenerationData = data.data; // حفظ البيانات للتحميل والمشاركة
            displayGeneratedImage(data.data);
            saveGenerationHistory(data.data);
        } else {
            alert('فشل التوليد: ' + (data.error || 'خطأ غير معروف'));
            resultArea.style.display = 'none';
        }
    })
    .catch(error => {
        loadingIndicator.style.display = 'none';
        resultArea.style.display = 'none';
        alert('حدث خطأ في الاتصال بالخادم: ' + error.message);
    });
}

function displayGeneratedImage(imageData) {
    const resultArea = document.getElementById('resultArea');
    const generatedImage = document.getElementById('generatedImage');
    const promptDisplay = document.getElementById('promptDisplay');

    // تحديث الصورة وعرضها
    generatedImage.src = imageData.image_url;
    promptDisplay.textContent = imageData.prompt;
    
    resultArea.style.display = 'block';
    // التمرير إلى منطقة النتيجة
    resultArea.scrollIntoView({ behavior: 'smooth' });
}

function setupImageActions() {
    const resultArea = document.getElementById('resultArea');

    // زر التحميل (تم تعديله لاستدعاء دالة الحفظ الجديدة)
    resultArea.querySelector('.download-btn').addEventListener('click', function() {
        if (currentGenerationData && currentGenerationData.image_url) {
            downloadImage(currentGenerationData.image_url);
        } else {
            alert('لا توجد صورة مولدة جاهزة للتحميل.');
        }
    });

    // زر إعادة التوليد
    resultArea.querySelector('.regenerate-btn').addEventListener('click', function() {
        document.getElementById('resultArea').style.display = 'none';
        handleImageGeneration(); // إعادة تشغيل التوليد بنفس البرومبت
    });
    
    // زر العرض الكامل
    document.getElementById('generatedImage').addEventListener('click', function() {
        const modal = document.getElementById('fullscreenModal');
        const img = document.getElementById('fullscreen-image');
        img.src = this.src;
        modal.style.display = 'flex';
    });

    // إغلاق العرض الكامل
    document.querySelector('.close-fullscreen').addEventListener('click', function() {
        document.getElementById('fullscreenModal').style.display = 'none';
    });
}


// =======================================================================
// 💡 الوظيفة الجديدة: حفظ الصورة باستخدام API الـ Python (plyer)
// =======================================================================
function downloadImage(imageUrl) {
    // نستخدم API Flask الجديد للحفظ على الجهاز (مسار /api/download/save_image)
    
    // إظهار مؤشر أو رسالة (اختياري)
    alert('جاري حفظ الصورة في مجلد Salah_AI...'); 

    fetch('/api/download/save_image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image_url: imageUrl })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('🎉 تم حفظ الصورة بنجاح في مجلد Salah_AI!');
            console.log('Saved Path:', data.file_path);
        } else {
            alert('❌ فشل الحفظ: ' + (data.error || 'خطأ غير معروف'));
            console.error('Save error:', data.error);
        }
    })
    .catch(error => {
        alert('حدث خطأ في الاتصال بخدمة الحفظ.');
        console.error('Fetch error:', error);
    });
}
// =======================================================================


function saveGenerationHistory(imageData) {
    const history = JSON.parse(localStorage.getItem('generationHistory') || '[]');
    
    // التأكد من أننا نحفظ فقط البيانات التي نحتاجها للعرض
    const dataToSave = {
        prompt: imageData.prompt,
        style: imageData.style,
        image_url: imageData.image_url,
        date: imageData.date,
        timestamp: imageData.timestamp
    };
    
    history.unshift(dataToSave); // إضافة في البداية
    history.splice(12); // الحفاظ على آخر 12 عنصر للعرض السريع
    
    localStorage.setItem('generationHistory', JSON.stringify(history));
    
    // إعادة تحميل السجل
    loadGenerationHistory();
}

function loadGenerationHistory() {
    const history = JSON.parse(localStorage.getItem('generationHistory') || '[]');
    const historyGrid = document.getElementById('historyGrid');
    const emptyHistory = historyGrid.querySelector('.empty-history');
    
    // تنظيف السجل الحالي
    historyGrid.innerHTML = '';
    
    if (historyGrid.querySelector('.empty-history')) {
        historyGrid.querySelector('.empty-history').remove();
    }
    
    if (history.length === 0) {
        // إذا كان فارغاً، نعيد إضافة الرسالة الفارغة (إذا لم تكن موجودة)
        if (!emptyHistory) {
            historyGrid.innerHTML = `<div class="empty-history">
                <i class="fas fa-history"></i>
                <p>لا توجد صور مولدة سابقاً</p>
                <small>سيتم عرض الصور التي تقوم بتوليدها هنا</small>
            </div>`;
        } else {
             historyGrid.appendChild(emptyHistory);
             emptyHistory.style.display = 'block';
        }
        return;
    }
    
    // عرض آخر 12 صورة
    history.slice(0, 12).forEach(imageData => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <img src="${imageData.image_url}" alt="صورة مولدة">
            <div class="history-overlay">
                <p>${imageData.prompt.substring(0, 30)}${imageData.prompt.length > 30 ? '...' : ''}</p>
            </div>
        `;
        
        historyItem.addEventListener('click', function() {
            displayGeneratedImage(imageData);
            currentGenerationData = imageData; // تحديث بيانات الصورة الحالية
        });
        
        historyGrid.appendChild(historyItem);
    });
}

// دالة مساعدة لحفظ البيانات محلياً (ليست مستخدمة مباشرة في هذا الكود، لكنها كانت موجودة في ملفاتك)
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}
