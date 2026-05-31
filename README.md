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

## מבנה הפרויקט

```
src/
  server.js          אתחול Express והגשת האתר
  gemini.js          חיבור ל-Gemini דרך @google/genai
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
