[app]
# (str) اسم التطبيق المرئي للمستخدم
title = Salah AI - Photos

# (str) اسم الحزمة (Package name)
package.name = salahai.app

# (str) اسم نطاق الحزمة (يجب تغييره إلى نطاق خاص بك إذا كنت تخطط للرفع على المتجر)
package.domain = com.salah

# (str) إصدار التطبيق (رقم الإصدار المرئي)
version = 1.0.0

# (str) نقطة الدخول الرئيسية للتطبيق (يجب أن يكون ملف الغلاف الجديد)
# تأكد من أن هذا الملف موجود: mobile_main.py
source.dir = .
main.py = mobile_main.py 

# (list) المكتبات المطلوبة لتشغيل التطبيق
# تم حذف 'python-for-android' و'plyer' (لأنها مدمجة عادةً)
# وتم إضافة 'setuptools' و 'certifi' لضمان عمل مكتبة requests بشكل سليم.
requirements = python3, setuptools, kivy==2.3.0, flask, flask-cors, requests, pillow, python-dotenv, werkzeug, certifi

# (list) مجلدات البايثون الإضافية التي يجب تضمينها (الخلفية والواجهة)
# هذا يضمن تضمين مجلدات backend و frontend بالكامل
source.include_dirs = backend, frontend

# (list) الملفات أو المجلدات التي يجب استثناؤها من الحزمة
source.exclude_dirs = venv, .git, __pycache__, logs, backend/temp

# (str) إصدار حزمة Android API (يجب أن يكون 33 أو أعلى)
android.api = 33

# (str) إصدار SDK الأدنى
android.minapi = 21

# (list) صلاحيات الأندرويد الضرورية
# INTERNET: ضرورية للاتصال بـ APIs الخارجية وتشغيل الخادم المحلي.
# READ_EXTERNAL_STORAGE: لقراءة الصور من الجهاز (للتحميل والتعديل).
# WRITE_EXTERNAL_STORAGE: للكتابة وحفظ الصور المولدة في مجلد Salah_AI.
android.permissions = INTERNET, READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE

# (str) اتجاه التطبيق (عمودي)
android.orientation = portrait

# (str) اسم ملف الأيقونة (إذا كان لديك)
# icon.filename = frontend/images/logo.png 


[buildozer]

log_level = 2

# (str) هل سيتم إنشاء ملف AAB لمتجر Play
# android.release_artifact = aab

