import json
import os
from datetime import datetime

def save_to_history(data, history_type):
    """
    حفظ البيانات إلى سجل المحفوظات
    """
    try:
        history_file = f"backend/temp/{history_type}_history.json"
        
        # تحميل السجل الحالي إذا كان موجوداً
        history = []
        if os.path.exists(history_file):
            with open(history_file, 'r', encoding='utf-8') as f:
                try:
                    history = json.load(f)
                except json.JSONDecodeError:
                    history = []
        
        # إضافة البيانات الجديدة
        data['history_id'] = len(history) + 1
        data['saved_at'] = datetime.now().isoformat()
        
        history.insert(0, data)  # إضافة في البداية
        
        # الحفاظ على آخر 50 عنصر فقط
        history = history[:50]
        
        # حفظ السجل المحدث
        with open(history_file, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
        
        return True
    except Exception as e:
        print(f"Error saving to history: {e}")
        return False

def load_from_history(history_type, limit=10):
    """
    تحميل البيانات من سجل المحفوظات
    """
    try:
        history_file = f"backend/temp/{history_type}_history.json"
        
        if not os.path.exists(history_file):
            return []
        
        with open(history_file, 'r', encoding='utf-8') as f:
            try:
                history = json.load(f)
                return history[:limit]
            except json.JSONDecodeError:
                return []
    except Exception as e:
        print(f"Error loading from history: {e}")
        return []
