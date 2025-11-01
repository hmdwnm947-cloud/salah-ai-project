from flask import Flask, render_template, send_from_directory, jsonify
from flask_cors import CORS
import os
import logging

def create_app():
    # الحصول على المسار الحالي
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # مسار الواجهة الأمامية: العودة للخلف خطوة ثم الدخول لمجلد frontend
    frontend_path = os.path.join(current_dir, '../frontend')
    
    app = Flask(__name__, 
                template_folder=frontend_path,
                static_folder=frontend_path)
    
    # تمكين CORS
    CORS(app)
    
    # إعدادات التطبيق
    app.config['SECRET_KEY'] = 'salah-ai-secret-key-2024'
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
    app.config['UPLOAD_FOLDER'] = os.path.join(current_dir, 'temp/uploads')
    app.config['GENERATED_FOLDER'] = os.path.join(current_dir, 'temp/generated')
    
    # إنشاء المجلدات إذا لم تكن موجودة
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['GENERATED_FOLDER'], exist_ok=True)
    
    # إعداد التسجيل
    logging.basicConfig(level=logging.INFO)
    
    # تسجيل الـ Blueprints
    try:
        from backend.api.image_generation import generation_bp
        from backend.api.image_editing import editing_bp
        from backend.api.prompt_extraction import extraction_bp
        # 💡 الإضافة الجديدة: مسار حفظ الصور على الأندرويد
        from backend.api.download_storage import download_storage_bp
        
        app.register_blueprint(generation_bp, url_prefix='/api/generate')
        app.register_blueprint(editing_bp, url_prefix='/api/edit')
        app.register_blueprint(extraction_bp, url_prefix='/api/extract')
        # 💡 تسجيل المسار الجديد لحفظ الصور (يستخدم مسار /api/download)
        app.register_blueprint(download_storage_bp, url_prefix='/api/download')
        
        app.logger.info("✅ All API blueprints registered successfully")
        
    except Exception as e:
        app.logger.error(f"❌ Failed to register one or more blueprints: {e}")
    
    # Routes للصفحات
    @app.route('/')
    def splash():
        return render_template('splash.html')
    
    @app.route('/home')
    def home():
        return render_template('index.html')
    
    @app.route('/generate')
    def generate_page():
        return render_template('generate.html')
    
    @app.route('/edit')
    def edit_page():
        return render_template('edit.html')
    
    @app.route('/extract')
    def extract_page():
        return render_template('extract.html')
    
    # خدمة الملفات الثابتة
    @app.route('/css/<path:filename>')
    def serve_css(filename):
        return send_from_directory(os.path.join(frontend_path, 'css'), filename)
    
    @app.route('/js/<path:filename>')
    def serve_js(filename):
        return send_from_directory(os.path.join(frontend_path, 'js'), filename)
    
    @app.route('/images/<path:filename>')
    def serve_images(filename):
        return send_from_directory(os.path.join(frontend_path, 'images'), filename)
    
    # Route لخدمة الملفات المرفوعة
    @app.route('/api/files/<filename>')
    def serve_uploaded_file(filename):
        # يخدم الملفات المرفوعة مؤقتاً من مجلد temp/uploads
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    
    # Route للصحة
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'Salah AI',
            'version': '1.0.0'
        })
    
    # معالج الأخطاء
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app
