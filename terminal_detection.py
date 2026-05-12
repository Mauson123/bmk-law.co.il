import sys
import os

def display_status():
    # בדיקה האם מחובר לטרמינל אינטראקטיבי
    is_terminal = sys.stdin.isatty()

    print("-" * 30)
    print("בדיקת מערכת: סטטוס חיבור")
    print("-" * 30)

    if is_terminal:
        print("[V] חיבור: ישיר (Terminal)")
        print(f"[V] משתמש: {os.environ.get('USER', 'unknown')}")
        print(f"[V] נתיב נוכחי: {os.getcwd()}")
    else:
        print("[X] חיבור: לא מזוהה כטרמינל חי")

    print("-" * 30)
    print("הבדיקה הושלמה בהצלחה.")

if __name__ == "__main__":
    display_status()
