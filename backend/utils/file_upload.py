import requests
import os
import uuid
from PIL import Image
import io

def upload_to_service(file, app):
    """
    رفع ملف إلى خدمة مجانية وإرجاع الرابط
    """
    try:
        # المحاولة مع freeimage.host أولاً
        try:
            # إعادة تعيين مؤشر الملف
            file.seek(0)
            
            form_data = {
                'action': (None, 'upload'),
                'source': (file.filename, file.read(), file.content_type)
            }
            file.seek(0)  # إعادة تعيين المؤشر
            
            response = requests.post(
                'https://freeimage.host/api/1/upload',
                files=form_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('image', {}).get('url'):
                    app.logger.info(f"✅ Uploaded to freeimage.host: {file.filename}")
                    return data['image']['url']
        except Exception as e:
            app.logger.warning(f"⚠️ freeimage.host failed: {e}")
        
        # المحاولة مع tmpfiles.org كبديل
        try:
            file.seek(0)  # إعادة تعيين المؤشر
            
            form_data = {
                'file': (file.filename, file.read(), file.content_type)
            }
            file.seek(0)  # إعادة تعيين المؤشر
            
            response = requests.post(
                'https://tmpfiles.org/api/v1/upload',
                files=form_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('data', {}).get('url'):
                    # تحويل الرابط إلى صيغة مباشرة
                    direct_url = data['data']['url'].replace('tmpfiles.org/', 'tmpfiles.org/dl/')
                    app.logger.info(f"✅ Uploaded to tmpfiles.org: {file.filename}")
                    return direct_url
        except Exception as e:
            app.logger.warning(f"⚠️ tmpfiles.org failed: {e}")
        
        # إذا فشلت جميع الخدمات، حفظ محلياً
        app.logger.info("📁 Falling back to local storage")
        return save_locally(file, app)
        
    except Exception as e:
        app.logger.error(f"❌ All upload services failed: {e}")
        return save_locally(file, app)

def save_locally(file, app):
    """
    حفظ الملف محلياً وإرجاع رابط نسبي
    """
    try:
        upload_folder = app.config['UPLOAD_FOLDER']
        
        # إنشاء اسم فريد للملف
        file_ext = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(upload_folder, unique_filename)
        
        # حفظ الملف
        file.save(file_path)
        
        app.logger.info(f"💾 Saved locally: {unique_filename}")
        
        # إرجاع رابط نسبي يمكن للـ frontend الوصول إليه
        return f"/api/files/{unique_filename}"
        
    except Exception as e:
        app.logger.error(f"❌ Local save failed: {e}")
        return None

def validate_image(file):
    """
    التحقق من أن الملف صورة صالحة
    """
    try:
        # التحقق من امتداد الملف
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
        file_ext = os.path.splitext(file.filename.lower())[1]
        
        if file_ext not in allowed_extensions:
            return False, "File type not allowed"
        
        # التحقق من أن الملف صورة حقيقية باستخدام Pillow
        try:
            file.seek(0)
            image = Image.open(file)
            image.verify()
            file.seek(0)
            return True, "Valid image"
        except Exception:
            return False, "Invalid image file"
            
    except Exception as e:
        return False, f"Validation error: {str(e)}"
