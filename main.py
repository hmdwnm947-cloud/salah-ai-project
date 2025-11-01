#!/usr/bin/env python3
"""
نقطة الدخول الرئيسية لتطبيق Salah AI
"""

import os
import sys
from backend.app import create_app

if __name__ == "__main__":
    # إضافة المسار الحالي إلى Python path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)
    
    app = create_app()
    
    print("=" * 50)
    print("🚀 Salah AI Application Started!")
    print("📍 Running on: http://localhost:5000")
    print("📁 Frontend: http://localhost:5000/home")
    print("🛠️  APIs are ready at /api/*")
    print("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
