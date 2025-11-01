from flask import Blueprint, request, jsonify, current_app
import requests
from backend.utils.file_upload import upload_to_service
from datetime import datetime
import urllib.parse

extraction_bp = Blueprint('extraction', __name__)

@extraction_bp.route('/', methods=['POST'])
def extract_prompt():
    """
    استخراج وصف الصور المرفوعة
    """
    try:
        # التحقق من وجود الملفات
        if 'images' not in request.files:
            return jsonify({'error': 'No images provided'}), 400
        
        images = request.files.getlist('images')
        text_prompt = request.form.get('text_prompt', 'describe this picture').strip()
        prompt_type = request.form.get('prompt_type', 'basic')
        
        # تعيين نصوص الاستخراج بناءً على النوع
        prompt_texts = {
            'basic': 'describe this picture',
            'detailed': 'describe this picture in detail',
            'artistic': 'describe the artistic elements in this picture',
            'custom': text_prompt
        }
        
        final_prompt = prompt_texts.get(prompt_type, 'describe this picture')
        
        if prompt_type == 'custom' and not final_prompt:
            return jsonify({'error': 'Custom prompt is required'}), 400
        
        # التحقق من وجود صور صالحة
        valid_images = [img for img in images if img.filename]
        if not valid_images:
            return jsonify({'error': 'No valid images provided'}), 400
        
        if len(valid_images) > 10:
            return jsonify({'error': 'Maximum 10 images allowed'}), 400
        
        current_app.logger.info(f"🔍 Extracting prompts from {len(valid_images)} images with type: {prompt_type}")
        
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
        
        # استدعاء API الاستخراج الخارجي
        api_url = "https://sii3.top/api/OCR.php"
        links_string = ",".join(image_urls)
        
        try:
            # استخدام GET request
            full_url = f"{api_url}?text={urllib.parse.quote(final_prompt)}&link={urllib.parse.quote(links_string)}"
            
            response = requests.get(full_url, timeout=60)
            response.raise_for_status()
            
            result = response.json()
            current_app.logger.info("✅ Prompts extracted successfully")
            
            extraction_data = {
                'text_prompt': final_prompt,
                'prompt_type': prompt_type,
                'images': image_urls,
                'description': result.get('response', ''),
                'date': result.get('date', datetime.now().strftime('%d/%m/%Y')),
                'timestamp': datetime.now().isoformat(),
                'dev_note': result.get('dev', ''),
                'upload_errors': upload_errors
            }
            
            return jsonify({
                'success': True,
                'message': f'Successfully extracted prompts from {len(image_urls)} images',
                'data': extraction_data
            })
            
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"❌ API request failed: {e}")
            return jsonify({
                'error': 'Failed to connect to prompt extraction service',
                'details': str(e)
            }), 503
            
    except Exception as e:
        current_app.logger.error(f"❌ Extraction error: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@extraction_bp.route('/history', methods=['GET'])
def get_extraction_history():
    """
    الحصول على سجل الاستخراجات
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
