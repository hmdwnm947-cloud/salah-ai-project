from flask import Blueprint, request, jsonify, current_app
import requests
import json
from datetime import datetime

generation_bp = Blueprint('generation', __name__)

@generation_bp.route('/', methods=['POST'])
def generate_image():
    """
    توليد صورة جديدة بناءً على الوصف المقدم
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        prompt = data.get('prompt', '').strip()
        style = data.get('style', 'realistic')
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        current_app.logger.info(f"🎨 Generating image with prompt: {prompt}, style: {style}")
        
        # إضافة النمط إلى الـ prompt إذا تم تحديده
        style_mappings = {
            'realistic': '',
            'artistic': 'artistic style, ',
            'abstract': 'abstract style, ',
            'cartoon': 'cartoon style, '
        }
        
        styled_prompt = f"{style_mappings.get(style, '')}{prompt}"
        
        # استدعاء API التوليد الخارجي
        api_url = "https://sii3.top/api/nano-banana.php"
        
        try:
            response = requests.post(api_url, data={'text': styled_prompt}, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            current_app.logger.info(f"✅ Image generated successfully: {result.get('image', 'Unknown URL')}")
            
            # حفظ معلومات الصورة المولدة
            generation_data = {
                'prompt': prompt,
                'style': style,
                'image_url': result.get('image'),
                'date': result.get('date', datetime.now().strftime('%d/%m/%Y')),
                'timestamp': datetime.now().isoformat(),
                'dev_note': result.get('dev', '')
            }
            
            return jsonify({
                'success': True,
                'message': 'Image generated successfully',
                'data': generation_data
            })
            
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"❌ API request failed: {e}")
            return jsonify({
                'error': 'Failed to connect to image generation service',
                'details': str(e)
            }), 503
            
    except Exception as e:
        current_app.logger.error(f"❌ Generation error: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@generation_bp.route('/history', methods=['GET'])
def get_generation_history():
    """
    الحصول على سجل الصور المولدة
    """
    try:
        # في الإصدار المستقبلي، يمكن جلب البيانات من قاعدة البيانات
        # حالياً نعيد مصفوفة فارغة
        return jsonify({
            'success': True,
            'data': {
                'history': []
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
