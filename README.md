# bmk-law.co.il

אתר משרד עורכי הדין BMK עם **עוזר משפטי מבוסס Gemini** (Google AI).
שרת Node.js / Express מגיש את האתר ומספק API מאובטח שמדבר עם Gemini —
מפתח ה-API נשמר **בצד שרת בלבד** ואינו נחשף לדפדפן.

## דרישות

- Node.js 18 ומעלה
- מפתח API של Gemini — מתקבל בחינם ב-[Google AI Studio](https://aistudio.google.com/apikey)

## התקנה והרצה

```bash
# 1. התקנת תלויות
npm install

# 2. הגדרת מפתח ה-API
cp .env.example .env
#    ערכו את .env והכניסו את ה-GEMINI_API_KEY שלכם

# 3. הרצה
npm start          # פרודקשן
npm run dev        # פיתוח (טעינה מחדש אוטומטית)
```

האתר יעלה בכתובת http://localhost:3000

## סיכום תיקים מקומי (CLI)

כלי שורת-פקודה שסורק תיקייה של מסמכים, מסכם כל אחד באמצעות Gemini, ובונה
טבלת ריכוז. **הכל רץ מקומית אצלך** — המסמכים אינם נדחפים ל-git.

```bash
# מניחים את המסמכים בתיקייה private_cases/ (מוחרגת מ-git), ואז:
npm run summarize

# או סריקת תיקייה אחרת:
npm run summarize -- --in "/נתיב/לתיקיית/התיקים" --out summaries
```

**סוגי קבצים נתמכים:** TXT, MD, DOCX, PDF, ותמונות (PNG/JPG/TIFF/WEBP...).
PDF סרוק ותמונות עוברים **OCR** אוטומטי דרך יכולת הראייה של Gemini.

**פלט** (בתיקייה `summaries/`, מוחרגת מ-git):
- `index.csv` — טבלה מרכזת: שורה לכל תיק (צדדים, נושא, סטטוס, סכומים, תאריכים)
- `<שם>.summary.md` — סיכום מפורט לכל מסמך
- הרצה חוזרת מדלגת על מה שכבר סוכם (resume)

> ⚠️ פרטיות: תוכן המסמכים נשלח ל-Gemini API של Google לצורך הסיכום. ודאו
> שהשימוש תואם את חובת הסודיות וההסכמות מול לקוחותיכם.

## מבנה הפרויקט

```
src/
  server.js          אתחול Express והגשת האתר
  gemini.js          חיבור הצ'אט ל-Gemini
  genaiClient.js     client משותף של Gemini
  summarizer.js      סיכום מסמך לפלט מובנה
  ocr.js             OCR לתמונות/PDF סרוק (Gemini Vision)
  summarize-cli.js   סורק תיקייה ומסכם (npm run summarize)
  routes/chat.js     POST /api/chat
public/
  index.html         דף הבית + ווידג'ט צ'אט (RTL)
  style.css          עיצוב
  chat.js            לוגיקת הצ'אט בצד הלקוח
```

## ה-API

**POST `/api/chat`**

```json
{ "messages": [{ "role": "user", "content": "שלום" }] }
```

תשובה:

```json
{ "reply": "..." }
```

## אבטחה

- מפתח ה-API נמצא רק ב-`.env` שאינו נכלל ב-git (`.gitignore`).
- כל קריאה ל-Gemini עוברת דרך השרת — הדפדפן לעולם לא רואה את המפתח.
- **אין** לחשוף את המפתח בקוד ה-frontend.

## הערה משפטית

העוזר הווירטואלי מספק מידע כללי בלבד ואינו מהווה ייעוץ משפטי מחייב.
