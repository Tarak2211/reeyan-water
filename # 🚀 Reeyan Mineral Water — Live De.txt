# 🚀 Reeyan Mineral Water — Live Deploy Guide

## ✅ Option 1: Railway.app (RECOMMENDED — Free, Easy, Secure)

### Step 1: GitHub Upload
1. Go to https://github.com → Sign Up (free)
2. Click "New Repository" → Name: `reeyan-water` → Public → Create
3. Open Command Prompt in `water-plant-app` folder:
   ```
   git init
   git add .
   git commit -m "Reeyan Water Plant v2.0"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/reeyan-water.git
   git push -u origin main
   ```

### Step 2: Railway Deploy
1. Go to https://railway.app → Login with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `reeyan-water` → Deploy
4. Railway will automatically install and start the app!

### Step 3: Set Environment Variables on Railway
In Railway dashboard → Your project → Variables tab → Add these:
```
PORT=3000
NODE_ENV=production
JWT_SECRET=reeyan-super-secret-2024-xyz
APP_NAME=Reeyan Mineral Water
APP_ADDRESS=E-22, Govind Trade, Odhav, Ahmedabad-382415
APP_PHONE=+91 9712390525
APP_GSTIN=27AABCU9603R1ZX
UPI_ID=9712390525@okbizaxis
UPI_NAME=Reeyan Mineral Water
SERVER_URL=https://YOUR-APP.railway.app
WHATSAPP_API_TOKEN=your-token-when-ready
WHATSAPP_PHONE_NUMBER_ID=your-phone-id-when-ready
```

### Step 4: Get Your Live URL
Railway gives you a URL like: `https://reeyan-water.railway.app`
Share this with the client! ✅

---

## ✅ Option 2: Render.com (Also Free)

1. Go to https://render.com → Sign Up with GitHub
2. "New Web Service" → Connect `reeyan-water` repo
3. Build Command: `npm install`
4. Start Command: `node src/app.js`
5. Add same environment variables as above
6. Deploy! URL: `https://reeyan-water.onrender.com`

---

## 🔒 Security Checklist (Already Done)
- ✅ Helmet.js — HTTP security headers
- ✅ Rate limiting — 200 req/15min per IP
- ✅ HPP — HTTP Parameter Pollution protection
- ✅ Input validation — express-validator
- ✅ CORS configured
- ✅ Error messages hidden in production
- ✅ No sensitive data in frontend code
- ✅ .env excluded from git

## 💡 Admin Password
Default: `reeyan2024`
Change it in `public/app.js` line 7: `const ADMIN_PASSWORD = 'reeyan2024';`

## 📞 Support
If any issue, check Railway logs in dashboard.
