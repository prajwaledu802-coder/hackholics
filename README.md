# Hackholics — AI Student Assistant (Prototype)

## What is included
- Voice-enabled assistant (wake word: 'hackholics') using browser SpeechRecognition + SpeechSynthesis
- Client-side PDF extraction (pdf.js) and extractive summarizer
- Firestore backend for auth and small file storage (Base64) — works on Firebase Spark plan
- Admin panel for resources/FAQs
- Animated robotic UI (neon theme)
- Ready for GitHub Pages deployment

## Quick start (local)
1. Paste your Firebase web config in assets/js/firebase-config.js (already set if you provided it)
2. Move your robot image into assets/images/robot.png (already included if you uploaded)
3. Run a local server:
   python -m http.server 8000
   Open http://localhost:8000

## Deploy to GitHub Pages
1. Create a public repo
2. Push files
3. Enable Pages: Settings → Pages → main branch → root

## Important notes
- Firestore rules must be open during testing (see project console). Switch to secure rules before production.
- Base64 in Firestore is for prototype only (small files).
