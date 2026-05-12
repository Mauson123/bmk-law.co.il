import sys
import os
import shutil
import platform
from datetime import datetime

def get_detailed_status():
    # הגדרות עיצוב
    line = "=" * 50
    header = "דוח מצב מערכת ואחסון מקיף"

    print(line)
    print(header.center(50))
    print(line)

    # 1. בדיקת סביבת הטרמינל
    is_tty = sys.stdin.isatty()
    conn_type = "חיבור טרמינל ישיר (Interactive)" if is_tty else "ריצה כסקריפט/רקע"

    print(f"[*] סוג חיבור:    {conn_type}")
    print(f"[*] זמן בדיקה:    {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"[*] מערכת הפעלה:  {platform.system()} {platform.release()}")
    print(f"[*] משתמש פעיל:   {os.environ.get('USER', 'N/A')}")
    print(line)

    # 2. ניתוח אחסון (Storage Optimization)
    print("נתוני אחסון בנתיב הנוכחי:")
    path = os.getcwd()
    total, used, free = shutil.disk_usage(path)

    print(f"[-] נתיב:         {path}")
    print(f"[-] סך הכל נפח:   {total // (2**30)} GB")
    print(f"[-] בשימוש:       {used // (2**30)} GB ({ (used/total)*100:.1f}%)")
    print(f"[-] פנוי:         {free // (2**30)} GB")
    print(line)

    # 3. בדיקת קבצים בתיקייה (Refactoring Check)
    files = os.listdir(path)
    print(f"סיכום תיקייה: ({len(files)} פריטים)")

    # מיון מהיר של סיומות
    extensions = {}
    for f in files:
        ext = f.split('.')[-1] if '.' in f else 'ללא סיומת'
        extensions[ext] = extensions.get(ext, 0) + 1

    for ext, count in list(extensions.items())[:5]: # מציג עד 5 סוגים
        print(f" • קבצי {ext}: {count}")

    print(line)
    print("סטטוס: המערכת מוכנה לעבודה.")
    print(line)

if __name__ == "__main__":
    get_detailed_status()
