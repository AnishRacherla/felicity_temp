# 🚀 Quick Deployment Checklist

## ✅ Pre-Deployment
- [ ] Code is tested and working locally
- [ ] All environment variables documented
- [ ] .gitignore includes .env files
- [ ] Git repository created and code pushed to GitHub

## 📦 Backend Deployment (Render.com)

### Setup
- [ ] Create account on Render.com
- [ ] Connect GitHub repository
- [ ] Create new Web Service
- [ ] Set Root Directory: `backend`
- [ ] Set Build Command: `npm install`
- [ ] Set Start Command: `npm start`

### Environment Variables (Add in Render)
Copy these exact values:
- [ ] `MONGO_URI` = `mongodb+srv://racherlaanish_db_user:Ani1234@felicity-cluster.5ljrjx9.mongodb.net/felicity_db?retryWrites=true&w=majority`
- [ ] `JWT_SECRET` = `felicity_super_secret_key`
- [ ] `JWT_EXPIRES_IN` = `7d`
- [ ] `NODE_ENV` = `production`
- [ ] `EMAIL_SERVICE` = `gmail`
- [ ] `EMAIL_USER` = `racherlaanish@gmail.com`
- [ ] `EMAIL_PASSWORD` = `wesq topf fwil hhoh`
- [ ] `EMAIL_FROM` = `Felicity Events <racherlaanish@gmail.com>`
- [ ] `PORT` = `5000` (Note: Render may auto-assign this, but 5000 matches your setup)
- [ ] `FRONTEND_URL` = `https://felicity-temp.vercel.app`

### After Deployment
- [ ] Copy backend URL (e.g., `https://felicity-backend.onrender.com`)
- [ ] Test backend health: `https://your-backend-url.onrender.com/`
- [ ] Check logs for errors

## 🎨 Frontend Deployment (Vercel)

### Setup
- [ ] Create account on Vercel
- [ ] Import GitHub repository
- [ ] Set Framework Preset: `Vite`
- [ ] Set Root Directory: `frontend`
- [ ] Build Command: `npm run build` (auto-detected)
- [ ] Output Directory: `dist` (auto-detected)

### Environment Variables (Add in Vercel)
- [ ] `VITE_API_URL` = `https://felicity-temp.onrender.com`

**Note:** Make sure this is set in Vercel > Settings > Environment Variables, then redeploy!

### After Deployment
- [ ] Copy frontend URL (e.g., `https://your-project.vercel.app`)
- [ ] Test the application
- [ ] Check browser console for errors

## 🔄 Post-Deployment

### Update Backend
- [ ] Add `FRONTEND_URL` to Render environment variables (use Vercel URL)
- [ ] Trigger redeploy on Render to apply CORS changes

### Test Everything
- [ ] Visit frontend URL
- [ ] Register a new account
- [ ] Login
- [ ] Test event creation (if organizer)
- [ ] Test event registration
- [ ] Check email functionality

## 🔒 Security Final Check
- [ ] JWT_SECRET is strong and unique
- [ ] Email password is App Password (not main password)
- [ ] .env files are NOT in GitHub
- [ ] CORS is configured with your actual frontend URL
- [ ] MongoDB allows connections (0.0.0.0/0 or specific IP)

## 📝 Optional Improvements
- [ ] Set up custom domain on Vercel
- [ ] Upgrade Render to paid plan (no sleep)
- [ ] Set up monitoring/alerts
- [ ] Add error tracking (e.g., Sentry)
- [ ] Set up CI/CD pipelines

## 🐛 If Something Goes Wrong

### Backend Issues
1. Check Render logs
2. Verify all environment variables
3. Test MongoDB connection
4. Check if PORT is set correctly

### Frontend Issues
1. Check browser console
2. Verify VITE_API_URL is correct
3. Check Network tab for API calls
4. Look for CORS errors

### CORS Errors
1. Ensure FRONTEND_URL is set in Render
2. Make sure it matches your Vercel URL exactly
3. Redeploy backend after changing CORS settings

---

## 📖 Need Help?
Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.
