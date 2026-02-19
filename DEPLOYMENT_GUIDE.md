# Deployment Guide

## Backend Deployment (Render.com)

### Prerequisites
- GitHub account
- Render.com account
- MongoDB Atlas database (already configured)

### Steps

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Prepare for deployment"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Create Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: `felicity-backend` (or your preferred name)
     - **Region**: Choose closest to you
     - **Branch**: `main`
     - **Root Directory**: `backend`
     - **Runtime**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free (or paid for better performance)

3. **Add Environment Variables in Render**
   Go to Environment tab and add these variables:
   ```
   MONGO_URI=mongodb+srv://racherlaanish_db_user:<password>@felicity-cluster.5ljrjx9.mongodb.net/
   JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   EMAIL_SERVICE=gmail
   EMAIL_USER=racherlaanish@gmail.com
   EMAIL_PASSWORD=<your-app-password>
   EMAIL_FROM=Felicity Events racherlaanish@gmail.com
   PORT=3000
   FRONTEND_URL=<your-vercel-frontend-url>
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy your backend
   - Copy the backend URL (e.g., `https://felicity-backend.onrender.com`)

---

## Frontend Deployment (Vercel)

### Prerequisites
- GitHub account
- Vercel account

### Steps

1. **Ensure code is pushed to GitHub** (if not done already)

2. **Deploy to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Configure the project:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build` (auto-detected)
     - **Output Directory**: `dist` (auto-detected)
     - **Install Command**: `npm install` (auto-detected)

3. **Add Environment Variables in Vercel**
   Go to Settings → Environment Variables and add:
   ```
   VITE_API_URL=<your-render-backend-url>
   ```
   Example: `https://felicity-backend.onrender.com`

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Your app will be live at `https://your-project.vercel.app`

---

## Post-Deployment Configuration

### 1. Update Backend CORS
After getting your Vercel URL, update the CORS configuration in your backend to allow requests from your frontend:

In `backend/src/app.js`, update the CORS configuration:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

Then add `FRONTEND_URL` to your Render environment variables.

### 2. Update Frontend Environment
Make sure you added the correct backend URL to Vercel environment variables.

### 3. Redeploy Both Services
- Backend: Push changes to GitHub, Render will auto-deploy
- Frontend: Vercel will auto-redeploy when you push to GitHub

---

## Important Notes

### For Render.com (Backend)
- **Free tier sleeps after 15 minutes of inactivity** - first request may take 30-60 seconds
- Consider using a paid plan for production ($7/month for always-on)
- Logs are available in the Render dashboard
- Set up health check endpoint (already available at `/`)

### For Vercel (Frontend)
- Free tier is generous for personal projects
- Auto-deploys on every push to main branch
- Custom domains available
- Environment variables need to be added separately

### Security Checklist
- ✅ Change JWT_SECRET to a strong random string
- ✅ Use App Passwords for Gmail (not your main password)
- ✅ Never commit .env files to GitHub
- ✅ Configure CORS to only allow your frontend domain
- ✅ Keep MongoDB connection string secure
- ✅ Enable MongoDB IP whitelist or use 0.0.0.0/0 for any IP

---

## Testing Your Deployment

1. Visit your Vercel frontend URL
2. Try to register/login
3. Check if API calls are working
4. Monitor Render logs for any backend errors

---

## Troubleshooting

### Backend Issues
- Check Render logs for errors
- Verify all environment variables are set correctly
- Test backend directly: `https://your-backend.onrender.com/`
- Ensure MongoDB allows connections from anywhere (0.0.0.0/0)

### Frontend Issues
- Check browser console for errors
- Verify VITE_API_URL is set correctly
- Check Network tab to see if API calls are reaching backend
- Ensure CORS is configured correctly on backend

### CORS Errors
- Update backend CORS to include your Vercel URL
- Add credentials: true if using cookies/auth
- Redeploy backend after CORS changes

---

## Monitoring

### Backend (Render)
- Check metrics in Render dashboard
- Set up health check alerts
- Monitor logs for errors

### Frontend (Vercel)
- Check analytics in Vercel dashboard
- Monitor build logs
- Check function logs if using Vercel functions

---

## Cost Estimate

### Free Tier
- **Render**: Free (with sleep after inactivity)
- **Vercel**: Free (generous limits)
- **MongoDB Atlas**: Free (512MB)
- **Total**: $0/month

### Production Tier
- **Render**: $7/month (always-on)
- **Vercel**: $20/month (Pro features)
- **MongoDB Atlas**: $9/month (or stay on free)
- **Total**: ~$27-36/month
