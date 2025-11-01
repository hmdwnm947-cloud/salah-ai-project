// إدارة صفحة تعديل الصور
document.addEventListener('DOMContentLoaded', function() {
    initializeEditPage();
});

// متغير عالمي للاحتفاظ ببيانات آخر تعديل
let currentEditData = null; 

function initializeEditPage() {
    // تهيئة منطقة الرفع
    initializeUploadArea();
    
    // إدارة عداد الأحرف
    setupCharCounter();
    
    // إعداد الأزرار السريعة
    setupQuickActions();
    
    // إعداد زر التعديل
    setupEditButton();
    
    // إعداد أزرار الصور
    setupImageActions();
    
    // تحميل السجل
    loadEditHistory();
}

let uploadedFiles = [];

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
    const uploadedImages = document.getElementById('uploadedImages');
    
    // مسح الصور المرفوعة سابقاً
    uploadedFiles = [];
    uploadedImages.innerHTML = '';
    
    if (files.length === 0) return;
    
    Array.from(files).slice(0, 10).forEach(file => {
        uploadedFiles.push(file);
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'uploaded-image-container';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = file.name;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-image-btn';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', function(event) {
                event.stopPropagation(); // منع النقر على منطقة الرفع
                removeFile(file, imgContainer);
            });
            
            imgContainer.appendChild(img);
            imgContainer.appendChild(removeBtn);
            uploadedImages.appendChild(imgContainer);
        };
        reader.readAsDataURL(file);
    });
    
    // تحديث حالة منطقة الرفع
    document.getElementById('uploadAreaText').style.display = 'none';
    document.getElementById('uploadedImages').style.display = 'flex';
}

function removeFile(fileToRemove, container) {
    uploadedFiles = uploadedFiles.filter(file => file !== fileToRemove);
    container.remove();
    
    if (uploadedFiles.length === 0) {
        document.getElementById('uploadAreaText').style.display = 'block';
        document.getElementById('uploadedImages').style.display = 'none';
        document.getElementById('imageInput').value = ''; // إعادة تعيين الحقل
    }
}

function setupCharCounter() {
    const promptInput = document.getElementById('edit-prompt-input');
    const charCount = document.getElementById('char-count');
    
    if (promptInput && charCount) {
        promptInput.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            if (count > 500) {
                charCount.style.color = 'var(--error-color)';
            } else {
                charCount.style.color = 'var(--text-secondary-color)';
            }
        });
    }
}

function setupQuickActions() {
    document.getElementById('clearImagesBtn').addEventListener('click', function() {
        if (uploadedFiles.length > 0) {
            if (confirm('هل أنت متأكد من مسح جميع الصور المرفوعة؟')) {
                removeFile(null, document.getElementById('uploadedImages'));
            }
        }
    });
    
    document.getElementById('quickPrompts').addEventListener('change', function() {
        const promptInput = document.getElementById('edit-prompt-input');
        if (promptInput) {
            promptInput.value = this.value;
            // إطلاق حدث الإدخال لتحديث العداد
            promptInput.dispatchEvent(new Event('input'));
        }
    });
}

function setupEditButton() {
    const editBtn = document.getElementById('editBtn');
    editBtn.addEventListener('click', handleImageEditing);
}

function handleImageEditing() {
    const prompt = document.getElementById('edit-prompt-input').value.trim();
    const resultArea = document.getElementById('resultArea');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (uploadedFiles.length === 0) {
        alert('الرجاء رفع صورة واحدة على الأقل لتعديلها.');
        return;
    }
    
    if (!prompt) {
        alert('الرجاء إدخال وصف التعديل المطلوب.');
        return;
    }

    // عرض شاشة التحميل
    resultArea.style.display = 'none';
    loadingIndicator.style.display = 'flex';

    const formData = new FormData();
    formData.append('prompt', prompt);
    uploadedFiles.forEach(file => {
        formData.append('images', file);
    });

    fetch('/api/edit', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        loadingIndicator.style.display = 'none';
        
        if (data.success && data.data) {
            currentEditData = data.data; // حفظ البيانات للتحميل والمشاركة
            displayEditResult(data.data);
            saveEditHistory(data.data);
        } else {
            alert('فشل التعديل: ' + (data.error || 'خطأ غير معروف'));
            resultArea.style.display = 'none';
        }
    })
    .catch(error => {
        loadingIndicator.style.display = 'none';
        resultArea.style.display = 'none';
        alert('حدث خطأ في الاتصال بالخادم: ' + error.message);
    });
}

function displayEditResult(editData) {
    const resultArea = document.getElementById('resultArea');
    const editedImage = document.getElementById('editedImage');
    const promptDisplay = document.getElementById('promptDisplay');
    
    // تحديث الصورة وعرضها
    editedImage.src = editData.edited_image;
    promptDisplay.textContent = editData.prompt;
    
    resultArea.style.display = 'block';
    // التمرير إلى منطقة النتيجة
    resultArea.scrollIntoView({ behavior: 'smooth' });
}

function setupImageActions() {
    const resultArea = document.getElementById('resultArea');

    // زر التحميل (تم تعديله لاستدعاء دالة الحفظ الجديدة)
    resultArea.querySelector('.download-btn').addEventListener('click', function() {
        if (currentEditData && currentEditData.edited_image) {
            downloadImage(currentEditData.edited_image);
        } else {
            alert('لا توجد صورة معدلة جاهزة للتحميل.');
        }
    });

    // زر التعديل آخر
    resultArea.querySelector('.reedit-btn').addEventListener('click', function() {
        document.getElementById('resultArea').style.display = 'none';
        document.getElementById('edit-prompt-input').value = currentEditData.prompt || '';
        document.getElementById('edit-prompt-input').dispatchEvent(new Event('input')); // لتحديث العداد
    });

    // زر العرض الكامل
    document.getElementById('editedImage').addEventListener('click', function() {
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


function saveEditHistory(editData) {
    const history = JSON.parse(localStorage.getItem('editHistory') || '[]');
    
    // التأكد من أننا نحفظ فقط البيانات التي نحتاجها للعرض
    const dataToSave = {
        prompt: editData.prompt,
        edited_image: editData.edited_image,
        date: editData.date,
        timestamp: editData.timestamp
    };
    
    history.unshift(dataToSave); // إضافة في البداية
    history.splice(12); // الحفاظ على آخر 12 عنصر للعرض السريع
    
    localStorage.setItem('editHistory', JSON.stringify(history));
    
    // إعادة تحميل السجل
    loadEditHistory();
}

function loadEditHistory() {
    const history = JSON.parse(localStorage.getItem('editHistory') || '[]');
    const historyGrid = document.getElementById('historyGrid');
    const emptyHistory = historyGrid.querySelector('.empty-history');
    
    // تنظيف السجل الحالي
    historyGrid.innerHTML = '';
    historyGrid.appendChild(emptyHistory);
    
    if (history.length === 0) {
        emptyHistory.style.display = 'block';
        return;
    }
    
    emptyHistory.style.display = 'none';
    
    // عرض آخر 12 صورة
    history.slice(0, 12).forEach(editData => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <img src="${editData.edited_image}" alt="صورة معدلة">
            <div class="history-overlay">
                <p>${editData.prompt.substring(0, 30)}${editData.prompt.length > 30 ? '...' : ''}</p>
            </div>
        `;
        
        historyItem.addEventListener('click', function() {
            displayEditResult(editData);
            currentEditData = editData; // تحديث بيانات التعديل الحالية
        });
        
        historyGrid.appendChild(historyItem);
    });
}

function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}
