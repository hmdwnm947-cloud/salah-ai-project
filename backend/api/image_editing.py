from flask import Blueprint, request, jsonify, current_app
import requests
import os
from backend.utils.file_upload import upload_to_service
from datetime import datetime

editing_bp = Blueprint('editing', __name__)

@editing_bp.route('/', methods=['POST'])
def edit_image():
    """
    تعديل الصور المرفوعة بناءً على الوصف المقدم
    """
    try:
        # التحقق من وجود الملفات
        if 'images' not in request.files:
            return jsonify({'error': 'No images provided'}), 400
        
        images = request.files.getlist('images')
        prompt = request.form.get('prompt', '').strip()
        
        if not prompt:
            return jsonify({'error': 'Edit prompt is required'}), 400
        
        # التحقق من وجود صور صالحة
        valid_images = [img for img in images if img.filename]
        if not valid_images:
            return jsonify({'error': 'No valid images provided'}), 400
        
        if len(valid_images) > 10:
            return jsonify({'error': 'Maximum 10 images allowed'}), 400
        
        current_app.logger.info(f"🎨 Editing {len(valid_images)} images with prompt: {prompt}")
        
        # رفع الصور للحصول على روابط
        image_urls = []
        upload_errors = []
        
        for image in valid_images:
            try:
                image_url = upload_to_service(image, current_app)
                if image_url:
                    image_urls.append(image_url)
                    current_app.logger.info(f"✅ Image uploaded: {image.filename}")
                else:
                    upload_errors.append(image.filename)
            except Exception as e:
                upload_errors.append(f"{image.filename}: {str(e)}")
        
        if not image_urls:
            return jsonify({
                'error': 'Failed to upload all images',
                'details': upload_errors
            }), 400
        
        # استدعاء API التعديل الخارجي
        api_url = "https://sii3.top/api/nano-banana.php"
        links_string = ",".join(image_urls)
        
        try:
            response = requests.post(api_url, data={
                'text': prompt,
                'links': links_string
            }, timeout=60)
            response.raise_for_status()
            
            result = response.json()
            current_app.logger.info("✅ Images edited successfully")
            
            edit_data = {
                'prompt': prompt,
                'original_images': image_urls,
                'edited_image': result.get('image'),
                'date': result.get('date', datetime.now().strftime('%d/%m/%Y')),
                'timestamp': datetime.now().isoformat(),
                'dev_note': result.get('dev', ''),
                'upload_errors': upload_errors
            }
            
            return jsonify({
                'success': True,
                'message': f'Successfully edited {len(image_urls)} images',
                'data': edit_data
            })
            
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"❌ API request failed: {e}")
            return jsonify({
                'error': 'Failed to connect to image editing service',
                'details': str(e)
            }), 503
            
    except Exception as e:
        current_app.logger.error(f"❌ Editing error: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@editing_bp.route('/history', methods=['GET'])
def get_editing_history():
    """
    الحصول على سجل الصور المعدلة
    """
    try:
        return jsonify({
            'success': True,
            'data': {
                'history': []
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
