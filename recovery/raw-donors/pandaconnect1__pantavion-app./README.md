# Pantavion Landing v1

Next.js + TailwindCSS + simple i18n (EN/EL/ES).  
Server-side locale detection (Accept-Language) + manual switch (dropdown).

## Scripts
- `npm install`
- `npm run dev` → http://localhost:3000
- `npm run build && npm start`

## Deploy (AWS Amplify Hosting)
1. Push this folder to a GitHub repo (e.g., `pantavion-app`).
2. In AWS Console → **Amplify** → **Host web app** → Connect GitHub → select repo → Deploy.
3. After deploy, map your domain (e.g., `app.pantavion.com`) in Amplify Domain management.

## Notes
- Translations live under `public/locales/{locale}/common.json`.
- Add more locales by creating new folders and adding them to `next.config.js` i18n locales.
- This starter does **not** yet include Cognito/Auth. We'll wire it next so buttons become fully functional.
