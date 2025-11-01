# backend/api/download_storage.py
from flask import Blueprint, request, jsonify
import requests
import os
import uuid
# Plyer يجب أن تكون ضمن requirements.txt
from plyer import storagepath 

download_storage_bp = Blueprint('download_storage', __name__)

@download_storage_bp.route('/save_image', methods=['POST'])
def save_image_to_device():
    """تنزيل الصورة من رابط خارجي وحفظها في مجلد Salah_AI على التخزين العام"""
    data = request.get_json()
    image_url = data.get('image_url')

    if not image_url:
        return jsonify({'error': 'Image URL is required'}), 400

    try:
        # 1. تنزيل الصورة من الرابط الخارجي
        response = requests.get(image_url, stream=True, timeout=30)
        response.raise_for_status() 

        # 2. تحديد مسار التخزين العام (مجلد الصور)
        # Note: هذا المسار يعمل في بيئات الأندرويد لـ Buildozer
        # يمكنك أيضاً استخدام get_external_storage_dir()
        public_path = storagepath.get_pictures_dir() 
        
        # 3. إنشاء المجلد الفرعي "Salah_AI"
        app_folder = os.path.join(public_path, 'Salah_AI')
        os.makedirs(app_folder, exist_ok=True)
        
        # 4. حفظ الملف باسم فريد
        # استخراج الامتداد من الرابط أو افتراض png
        file_ext = os.path.splitext(image_url.split('/')[-1])[1] if '.' in image_url.split('/')[-1] else '.png'
        unique_filename = f"Salah_AI_{uuid.uuid4().hex}{file_ext}"
        destination_path = os.path.join(app_folder, unique_filename)

        with open(destination_path, 'wb') as out_file:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    out_file.write(chunk)
        
        return jsonify({
            'success': True,
            'message': f'تم حفظ الصورة بنجاح في Salah_AI',
            'file_path': destination_path
        })
            
    except Exception as e:
        # هنا يمكن إضافة رسالة خطا مخصصة
        return jsonify({'error': f'فشل في الحفظ: {str(e)}'}), 500
