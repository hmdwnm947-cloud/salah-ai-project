// إدارة صفحة استخراج البرومبتات
document.addEventListener('DOMContentLoaded', function() {
    initializeExtractPage();
});

function initializeExtractPage() {
    // تهيئة منطقة الرفع
    initializeUploadArea();
    
    // إدارة أنواع الاستخراج
    setupPromptTypes();
    
    // إدارة عداد الأحرف
    setupCharCounter();
    
    // إعداد الخيارات المتقدمة
    setupAdvancedOptions();
    
    // إعداد زر الاستخراج
    setupExtractButton();
    
    // إعداد أزرار النتيجة
    setupResultActions();
    
    // تحميل السجل
    loadExtractHistory();
}

let uploadedFiles = [];
let currentPromptType = 'basic';
let currentPromptText = 'describe this picture';

function initializeUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const uploadedImages = document.getElementById('uploadedImages');
    
    // النقر على منطقة الرفع
    uploadArea.addEventListener('click', function() {
        imageInput.click();
    });
    
    // تغيير الملفات المختارة
    imageInput.addEventListener('change', function(e) {
        handleFileSelection(e.target.files);
    });
    
    // دعم سحب وإفلات الملفات
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        handleFileSelection(files);
    });
}

function handleFileSelection(files) {
    if (files.length === 0) return;
    
    // التحقق من الحد الأقصى
    if (uploadedFiles.length + files.length > 10) {
        window.appUtils.showNotification('يمكنك رفع 10 صور كحد أقصى', 'error');
        return;
    }
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // التحقق من نوع الملف
        if (!file.type.startsWith('image/')) {
            window.appUtils.showNotification(`الملف ${file.name} ليس صورة`, 'warning');
            continue;
        }
        
        // التحقق من حجم الملف (5MB كحد أقصى)
        if (file.size > 5 * 1024 * 1024) {
            window.appUtils.showNotification(`الصورة ${file.name} كبيرة جداً (الحد الأقصى 5MB)`, 'warning');
            continue;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const fileData = {
                id: Date.now() + i,
                file: file,
                url: e.target.result,
                name: file.name,
                size: file.size
            };
            
            uploadedFiles.push(fileData);
            displayUploadedFiles();
            updateExtractButton();
        };
        
        reader.readAsDataURL(file);
    }
}

function displayUploadedFiles() {
    const container = document.getElementById('uploadedImages');
    const emptyUpload = container.querySelector('.empty-upload');
    
    if (uploadedFiles.length === 0) {
        emptyUpload.style.display = 'block';
        container.innerHTML = '';
        container.appendChild(emptyUpload);
        return;
    }
    
    emptyUpload.style.display = 'none';
    
    const imagesGrid = document.createElement('div');
    imagesGrid.className = 'images-grid';
    
    uploadedFiles.forEach(fileData => {
        const imageElement = document.createElement('div');
        imageElement.className = 'uploaded-image';
        imageElement.innerHTML = `
            <img src="${fileData.url}" alt="${fileData.name}">
            <button class="remove-image" data-id="${fileData.id}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        imagesGrid.appendChild(imageElement);
    });
    
    container.innerHTML = '';
    container.appendChild(imagesGrid);
    
    // إضافة أحداث إزالة الصور
    document.querySelectorAll('.remove-image').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(this.getAttribute('data-id'));
            removeFile(id);
        });
    });
}

function removeFile(id) {
    uploadedFiles = uploadedFiles.filter(file => file.id !== id);
    displayUploadedFiles();
    updateExtractButton();
}

function updateExtractButton() {
    const extractBtn = document.getElementById('extract-btn');
    extractBtn.disabled = uploadedFiles.length === 0;
}

function setupPromptTypes() {
    const typeButtons = document.querySelectorAll('.type-btn');
    const customPrompt = document.getElementById('customPrompt');
    
    typeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // إزالة النشاط من جميع الأزرار
            typeButtons.forEach(b => b.classList.remove('active'));
            
            // إضافة النشاط للزر المحدد
            this.classList.add('active');
            
            const type = this.dataset.type;
            currentPromptType = type;
            
            // إظهار/إخفاء حقل الإدخال المخصص
            if (type === 'custom') {
                customPrompt.style.display = 'block';
                currentPromptText = '';
            } else {
                customPrompt.style.display = 'none';
                currentPromptText = this.dataset.prompt;
            }
        });
    });
    
    // تحديد الزر الافتراضي
    typeButtons[0].classList.add('active');
}

function setupCharCounter() {
    const customPrompt = document.getElementById('custom-prompt-text');
    const charCount = document.getElementById('custom-char-count');
    
    if (customPrompt && charCount) {
        customPrompt.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            currentPromptText = this.value;
            
            // تغيير اللون إذا تجاوز الحد
            if (count > 200) {
                charCount.style.color = 'var(--error-color)';
            } else if (count > 150) {
                charCount.style.color = 'var(--warning-color)';
            } else {
                charCount.style.color = 'var(--gray-color)';
            }
        });
    }
}

function setupAdvancedOptions() {
    const toggleAdvanced = document.querySelector('.toggle-advanced');
    const advancedContent = document.querySelector('.advanced-content');
    
    if (toggleAdvanced && advancedContent) {
        toggleAdvanced.addEventListener('click', function() {
            const isHidden = advancedContent.style.display === 'none';
            advancedContent.style.display = isHidden ? 'block' : 'none';
            
            const icon = this.querySelector('i');
            icon.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
            
            this.innerHTML = isHidden ? 
                'إخفاء <i class="fas fa-chevron-up"></i>' : 
                'إظهار <i class="fas fa-chevron-down"></i>';
        });
    }
}

function setupExtractButton() {
    const extractBtn = document.getElementById('extract-btn');
    
    if (extractBtn) {
        extractBtn.addEventListener('click', handlePromptExtraction);
    }
}

async function handlePromptExtraction() {
    const extractBtn = document.getElementById('extract-btn');
    
    if (uploadedFiles.length === 0) {
        window.appUtils.showNotification('يرجى رفع صورة واحدة على الأقل', 'error');
        return;
    }
    
    if (currentPromptType === 'custom' && !currentPromptText.trim()) {
        window.appUtils.showNotification('يرجى إدخال طلب مخصص', 'error');
        document.getElementById('custom-prompt-text').focus();
        return;
    }
    
    // تعطيل الزر وعرض حالة التحميل
    const originalText = extractBtn.innerHTML;
    extractBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الاستخراج...';
    extractBtn.disabled = true;
    
    try {
        window.appUtils.showNotification('جاري استخراج الوصف، قد يستغرق ذلك بضع ثواني...', 'info');
        
        // إنشاء FormData لإرسال الملفات
        const formData = new FormData();
        formData.append('text_prompt', currentPromptText);
        formData.append('prompt_type', currentPromptType);
        
        // إضافة الملفات
        uploadedFiles.forEach(fileData => {
            formData.append('images', fileData.file);
        });
        
        // إضافة الخيارات المتقدمة
        const includeColors = document.getElementById('include-colors').checked;
        const includeComposition = document.getElementById('include-composition').checked;
        const includeMood = document.getElementById('include-mood').checked;
        
        formData.append('include_colors', includeColors);
        formData.append('include_composition', includeComposition);
        formData.append('include_mood', includeMood);
        
        const response = await fetch('/api/extract/', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'فشل في استخراج الوصف');
        }
        
        if (data.success) {
            displayExtractResult(data.data);
            addToHistory(data.data);
            window.appUtils.showNotification(data.message, 'success');
        } else {
            throw new Error(data.error || 'فشل في استخراج الوصف');
        }
        
    } catch (error) {
        console.error('Extraction error:', error);
        window.appUtils.showNotification(error.message, 'error');
    } finally {
        // إعادة تعيين الزر
        extractBtn.innerHTML = originalText;
        extractBtn.disabled = uploadedFiles.length === 0;
    }
}

function displayExtractResult(extractData) {
    const placeholder = document.getElementById('resultPlaceholder');
    const extractResult = document.getElementById('extractResult');
    const descriptionText = document.getElementById('description-text');
    const wordCount = document.getElementById('word-count');
    const readTime = document.getElementById('read-time');
    const imageCount = document.getElementById('image-count');
    const sourceImages = document.getElementById('sourceImages');
    const resultTime = document.getElementById('result-time');
    
    // تعيين بيانات الوصف
    descriptionText.textContent = extractData.description;
    wordCount.textContent = countWords(extractData.description);
    readTime.textContent = calculateReadTime(extractData.description);
    imageCount.textContent = extractData.images.length;
    resultTime.textContent = new Date().toLocaleString('ar-SA');
    
    // عرض الصور المصدر
    sourceImages.innerHTML = '';
    extractData.images.forEach(imageUrl => {
        const imageElement = document.createElement('div');
        imageElement.className = 'uploaded-image';
        imageElement.innerHTML = `<img src="${imageUrl}" alt="صورة مصدر">`;
        sourceImages.appendChild(imageElement);
    });
    
    // إظهار النتيجة وإخفاء placeholder
    placeholder.style.display = 'none';
    extractResult.style.display = 'block';
    
    // حفظ في localStorage
    saveToLocalStorage('currentExtract', extractData);
}

function countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
}

function calculateReadTime(text) {
    const words = countWords(text);
    const minutes = Math.ceil(words / 200); // متوسط قراءة 200 كلمة في الدقيقة
    return `${minutes} دقيقة`;
}

function setupResultActions() {
    // زر النسخ
    document.querySelector('.copy-btn').addEventListener('click', copyDescription);
    
    // زر الحفظ
    document.querySelector('.save-btn').addEventListener('click', saveDescription);
    
    // زر المشاركة
    document.querySelector('.share-btn').addEventListener('click', shareDescription);
    
    // زر الاستخراج الجديد
    document.querySelector('.reextract-btn').addEventListener('click', function() {
        // مسح النتيجة الحالية
        const placeholder = document.getElementById('resultPlaceholder');
        const extractResult = document.getElementById('extractResult');
        
        placeholder.style.display = 'flex';
        extractResult.style.display = 'none';
    });
}

function copyDescription() {
    const descriptionText = document.getElementById('description-text').textContent;
    
    navigator.clipboard.writeText(descriptionText).then(() => {
        window.appUtils.showNotification('تم نسخ الوصف إلى الحافظة', 'success');
    }).catch(() => {
        // طريقة بديلة إذا فشل clipboard
        const textArea = document.createElement('textarea');
        textArea.value = descriptionText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        window.appUtils.showNotification('تم نسخ الوصف', 'success');
    });
}

function saveDescription() {
    const descriptionText = document.getElementById('description-text').textContent;
    const blob = new Blob([descriptionText], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `salah-description-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    window.appUtils.showNotification('تم حفظ الوصف كملف', 'success');
}

async function shareDescription() {
    const descriptionText = document.getElementById('description-text').textContent;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'وصف الصورة من Salah AI',
                text: descriptionText
            });
        } catch (error) {
            console.error('Share error:', error);
            fallbackShare(descriptionText);
        }
    } else {
        fallbackShare(descriptionText);
    }
}

function fallbackShare(text) {
    // نسخ النص إلى الحافظة
    navigator.clipboard.writeText(text).then(() => {
        window.appUtils.showNotification('تم نسخ الوصف إلى الحافظة', 'success');
    }).catch(() => {
        // طريقة بديلة إذا فشل clipboard
        prompt('انسخ النص:', text);
    });
}

function addToHistory(extractData) {
    const historyList = document.getElementById('historyList');
    const emptyHistory = historyList.querySelector('.empty-history');
    
    // إخفاء الرسالة إذا كانت موجودة
    if (emptyHistory) {
        emptyHistory.style.display = 'none';
    }
    
    // إنشاء عنصر التاريخ
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <div class="history-preview">
            <div class="history-image">
                <img src="${extractData.images[0]}" alt="صورة مستخرجة">
            </div>
            <div class="history-details">
                <p>${extractData.description.substring(0, 100)}${extractData.description.length > 100 ? '...' : ''}</p>
                <div class="history-meta">
                    <span>${extractData.date}</span>
                    <span>${new Date().toLocaleTimeString()}</span>
                </div>
            </div>
        </div>
    `;
    
    // إضافة حدث النقر
    historyItem.addEventListener('click', function() {
        displayExtractResult(extractData);
    });
    
    // إضافة في البداية
    historyList.insertBefore(historyItem, historyList.firstChild);
    
    // الحفاظ على 10 عناصر فقط في السجل
    const items = historyList.querySelectorAll('.history-item');
    if (items.length > 10) {
        historyList.removeChild(items[items.length - 1]);
    }
    
    // حفظ في localStorage
    saveHistoryToLocalStorage(extractData);
}

function saveHistoryToLocalStorage(extractData) {
    let history = JSON.parse(localStorage.getItem('extractHistory') || '[]');
    
    // إضافة المعرف والطابع الزمني
    const historyItem = {
        ...extractData,
        id: Date.now(),
        timestamp: new Date().toISOString()
    };
    
    history.unshift(historyItem);
    history = history.slice(0, 50); // حفظ آخر 50 عنصر فقط
    
    localStorage.setItem('extractHistory', JSON.stringify(history));
}

function loadExtractHistory() {
    const history = JSON.parse(localStorage.getItem('extractHistory') || '[]');
    const historyList = document.getElementById('historyList');
    const emptyHistory = historyList.querySelector('.empty-history');
    
    if (history.length === 0) {
        emptyHistory.style.display = 'block';
        return;
    }
    
    emptyHistory.style.display = 'none';
    
    // عرض آخر 10 استخراجات
    history.slice(0, 10).forEach(extractData => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-preview">
                <div class="history-image">
                    <img src="${extractData.images[0]}" alt="صورة مستخرجة">
                </div>
                <div class="history-details">
                    <p>${extractData.description.substring(0, 100)}${extractData.description.length > 100 ? '...' : ''}</p>
                    <div class="history-meta">
                        <span>${extractData.date}</span>
                        <span>${new Date(extractData.timestamp).toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>
        `;
        
        historyItem.addEventListener('click', function() {
            displayExtractResult(extractData);
        });
        
        historyList.appendChild(historyItem);
    });
}

function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// جعل الوظائف متاحة عالمياً للاستخدام في وحدة التحكم
window.extractApp = {
    handlePromptExtraction,
    copyDescription,
    saveDescription,
    shareDescription
};
