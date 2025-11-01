# mobile_main.py
# نقطة الدخول الرئيسية عند تشغيل التطبيق على الأندرويد باستخدام Buildozer/Kivy

import threading
import time
import os
import logging

# تهيئة Kivy لتشغيل الواجهة الرسومية
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.properties import StringProperty
from kivy.clock import Clock
from kivy.core.window import Window

# استخدام مكتبة Webview لعرض واجهة الويب
# يتطلب تثبيت kivy-garden: garden install webview
from kivymd.app import MDApp
from kivymd.uix.boxlayout import MDBoxLayout
from kivy.utils import platform

# استيراد دالة إنشاء تطبيق Flask
from backend.app import create_app

# ----------------------------------------------------------------------
# إعدادات متغيرة
# ----------------------------------------------------------------------
# عنوان السيرفر الذي سيعمل محلياً (يجب أن يكون 127.0.0.1 أو 0.0.0.0)
FLASK_HOST = '127.0.0.1' 
FLASK_PORT = 5000
# الرابط الذي ستبدأ منه واجهة الـ Webview
INITIAL_URL = f'http://{FLASK_HOST}:{FLASK_PORT}/' 
# ----------------------------------------------------------------------


class FlaskThread(threading.Thread):
    """خيط تشغيل منفصل لتطبيق Flask"""
    
    def __init__(self, app):
        super().__init__()
        self.app = app
        self.daemon = True # سيتم إيقافه عند إغلاق التطبيق الرئيسي

    def run(self):
        try:
            # إيقاف إظهار رسائل تشغيل Flask المزعجة في console
            # وتمرير الإعدادات اللازمة
            logging.getLogger('werkzeug').setLevel(logging.ERROR)
            
            # تشغيل Flask على الخادم المحلي
            self.app.run(host=FLASK_HOST, port=FLASK_PORT, debug=False, threaded=True)
        except Exception as e:
            print(f"❌ Flask server failed to start: {e}")

# ----------------------------------------------------------------------
# التطبيق الرئيسي (Kivy/Webview)
# ----------------------------------------------------------------------

class SalahAIApp(MDApp):
    # استخدام MDBoxLayout لدمج واجهة Webview بسهولة
    
    def build(self):
        # 1. تهيئة خادم Flask
        self.flask_app = create_app()
        self.flask_thread = FlaskThread(self.flask_app)
        
        # 2. بدء تشغيل الخادم
        self.flask_thread.start()

        # 3. إعداد واجهة المستخدم (Webview)
        
        # يجب استيراد Webview هنا لضمان أنه يتم تحميله بعد تهيئة Kivy
        if platform == 'android' or platform == 'ios':
            from kivy_garden.navigationdrawer import MDNavigationDrawer
            # نستخدم webview من kivy-garden
            from kivy_garden.mapview import MapView
            # يتم استبدال هذا الاستيراد الفعلي إذا كنت تستخدم garden install webview
            # حالياً، سنعتمد على أن Buildozer سيقوم بتضمين webview
            # For simplicity in this shell, we will assume a generic WebView is available
            # Buildozer will handle the actual embedding via python-for-android recipes.
            try:
                # محاولة استيراد Webview من مصدر شائع الاستخدام
                from kivy.uix.webview import WebView
                self.webview = WebView(url='about:blank')
            except ImportError:
                 # إذا فشل الاستيراد (مثلاً على سطح المكتب)، يمكن استخدام تخطيط بسيط
                print("⚠️ WebView not found, using simple layout.")
                self.webview = MDBoxLayout(orientation='vertical')
                self.webview.add_widget(MDLabel(text="WebView placeholder - Build on Android!", halign="center"))
        else:
            # على أنظمة التشغيل العادية نستخدم Webview المدمج في Kivy
            try:
                 from kivy.uix.webview import WebView
                 self.webview = WebView(url='about:blank')
            except ImportError:
                 from kivy.uix.label import Label as MDLabel # استخدام Label كبديل
                 self.webview = MDBoxLayout(orientation='vertical')
                 self.webview.add_widget(MDLabel(text="WebView placeholder - Build on Android!", halign="center"))

        self.root = MDBoxLayout(orientation='vertical')
        self.root.add_widget(self.webview)
        
        # 4. محاولة تحميل العنوان بعد فترة وجيزة (للسماح لسيرفر Flask بالبدء)
        Clock.schedule_once(self.load_url, 3) 
        
        return self.root

    def load_url(self, dt):
        """تحميل رابط Splash screen بمجرد بدء تشغيل Flask"""
        try:
            if hasattr(self.webview, 'url'):
                print(f"🚀 Loading URL: {INITIAL_URL}")
                self.webview.url = INITIAL_URL
            else:
                print(f"⚠️ Webview does not have 'url' property or failed to initialize.")
        except Exception as e:
            print(f"❌ Error loading URL: {e}")

    def on_stop(self):
        """تنظيف عند إغلاق التطبيق"""
        print("🛑 Shutting down Flask server...")
        # هنا يمكن إضافة منطق لإيقاف Flask بشكل أكثر سلاسة إذا لزم الأمر
        # لكن لأن الخيط هو daemon، فإنه سيتوقف بشكل عام عند إغلاق التطبيق.
        
if __name__ == '__main__':
    # تهيئة المسار لتمكين استيراد backend.app
    current_dir = os.path.dirname(os.path.abspath(__file__))
    import sys
    sys.path.insert(0, current_dir)
    
    # تحديد حجم النافذة للتطوير على سطح المكتب (اختياري)
    if not (platform == 'android' or platform == 'ios'):
        Window.size = (400, 700) 
        
    SalahAIApp().run()
