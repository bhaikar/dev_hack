# Vercel Deployment Checklist ✅

## Pre-Deployment Steps

### 1. **Verify Git is clean**
```bash
git status
git add .
git commit -m "Ready for Vercel deployment"
git push
```

### 2. **Set Environment Variables in Vercel**
Go to your Vercel project dashboard → Settings → Environment Variables

Add:
- **MONGODB_URI**: Your MongoDB Atlas connection string (already set in `.env`)
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/database?appName=hackmce`
  - Make sure whitelist includes Vercel IP ranges or use `0.0.0.0/0`

### 3. **Verify Configuration Files**
All critical files are in place:
- ✅ `vercel.json` - Configured with rewrites for API routes
- ✅ `backend/server.js` - Exports Express app correctly
- ✅ `api/index.js` - Simplified to pass requests to Express app
- ✅ `script.js` - Auto-detects localhost vs deployed environment
- ✅ `admin.js` - Auto-detects localhost vs deployed environment

### 4. **Test Locally Before Deploying**
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Open in browser
# Registration: http://localhost:3000/
# Admin Panel: http://localhost:3000/admin.html
# API Health: http://localhost:3000/api/health
```

Verify:
- ✅ Registration form loads and accepts check-ins
- ✅ Admin panel loads teams without "loading..." spinner
- ✅ Stats update in real-time
- ✅ Teams can be checked in and marked as pending/present
- ✅ API health endpoint responds: `http://localhost:3000/api/health`

---

## Deployment Steps

### Option A: Deploy via Git (Recommended)
1. Connect your GitHub repo to Vercel
2. Push changes to your branch
3. Vercel auto-deploys on push

### Option B: Deploy via CLI
```bash
# Install Vercel CLI (if not already done)
npm install -g vercel

# From project root
vercel --prod
```

---

## Post-Deployment Verification

### 1. **Check API Health**
Open in browser:
```
https://your-vercel-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "HACK.MCE 5.0 Backend is running",
  "database": {
    "status": "connected",
    "configured": true,
    "isAtlas": true
  }
}
```

### 2. **Test Frontend**
- Registration page: `https://your-vercel-domain.vercel.app/`
- Admin panel: `https://your-vercel-domain.vercel.app/admin.html`

### 3. **Test Check-In Flow**
1. Open registration page
2. Enter a valid Team ID (e.g., `DH-039`)
3. Verify success message
4. Check admin panel - team should appear checked in

### 4. **Check Vercel Logs**
- Vercel Dashboard → Deployments → Your deployment → Functions → Logs
- Look for connection messages and errors

---

## Common Issues & Fixes

### ❌ "Loading teams..." spinner on admin panel
**Cause**: API URL still pointing to localhost
**Fix**: Verify `admin.js` line 1-4 uses auto-detection (already fixed)

### ❌ MongoDB connection timeout
**Cause**: MONGODB_URI not set in Vercel environment variables or IP whitelist issue
**Fix**:
1. Verify `MONGODB_URI` is set in Vercel settings
2. Add Vercel IP ranges to MongoDB Atlas whitelist (or use 0.0.0.0/0)
3. Check Vercel function logs for connection errors

### ❌ CORS errors in browser console
**Cause**: Frontend making requests to wrong API URL
**Fix**: Verify `script.js` and `admin.js` use `/api` when not on localhost

### ❌ Teams not appearing or "Error loading teams"
**Cause**: MongoDB connection failed
**Fix**:
1. Check Vercel logs for MongoDB errors
2. Verify database has teams (run import script locally first)
3. Confirm MONGODB_URI environment variable is correct

### ❌ Import script not working on Vercel
**This is expected** - Import script runs locally only. To import teams on Vercel:
1. Run locally: `npm run import --prefix backend`
2. Teams are imported into MongoDB Atlas
3. Vercel deployment will access the same MongoDB database

---

## Database Persistence

✅ **Teams persist automatically** because MongoDB Atlas stores data in the cloud:
- Import teams locally (they go to MongoDB Atlas)
- Deploy to Vercel (accesses same MongoDB database)
- Teams are already there - no re-import needed

---

## Performance Tuning

**Current settings are optimized for Vercel:**
- ✅ MongoDB connection pooling configured for serverless
- ✅ Connection timeout: 10 seconds (sufficient for Atlas)
- ✅ Max pool size: 10 connections
- ✅ First-request connection (serverless-friendly)
- ✅ CORS enabled for all origins

---

## Final Checklist Before Deploy

- [ ] All code committed and pushed to Git
- [ ] `MONGODB_URI` set in Vercel environment variables
- [ ] Local testing passed (all features working)
- [ ] `vercel.json` is properly configured
- [ ] `api/index.js` correctly exports app
- [ ] `backend/server.js` checks for `process.env.VERCEL`
- [ ] Frontend files (`script.js`, `admin.js`) use auto-detection

---

## Deployment Summary

Your app is **ready for Vercel deployment**! 

**Key Points:**
- ✅ API auto-routes via `vercel.json`
- ✅ Express app runs as serverless function
- ✅ MongoDB Atlas connection handles first request
- ✅ Frontend auto-detects environment
- ✅ Static files served automatically

**Expected URL after deployment:**
```
https://your-project-name.vercel.app/
https://your-project-name.vercel.app/admin.html
https://your-project-name.vercel.app/api/health
```

---

**Questions?** Check Vercel Deployment Guide in root folder or Vercel docs: https://vercel.com/docs
