# Kgotla Forum - Deployment Guide

This guide will walk you through deploying your separated Kgotla forum application with the backend on Render and frontend on Vercel.

## Architecture Overview

- **Backend**: Express.js API with authentication (deployed on Render)
- **Frontend**: React application with Vite (deployed on Vercel)
- **Database**: PostgreSQL (Render managed database)
- **Authentication**: JWT tokens + Google OAuth + Email/Password

## Prerequisites

Before deployment, ensure you have:
- GitHub repository with your code
- Google OAuth credentials
- Email service credentials (Gmail app password recommended)
- Render account
- Vercel account

## Part 1: Backend Deployment on Render

### Step 1: Database Setup

1. **Create PostgreSQL Database on Render**
   - Log into Render dashboard
   - Click "New" → "PostgreSQL"
   - Name: `kgotla-database`
   - Select region closest to your users
   - Choose plan (Free tier available)
   - Click "Create Database"
   - Save the connection details provided

### Step 2: Environment Variables Setup

Create these environment variables in Render:

#### Required Variables
```
NODE_ENV=production
PORT=10000
DATABASE_URL=[Render will auto-populate this]
JWT_SECRET=[Generate a strong 32+ character secret]
JWT_REFRESH_SECRET=[Generate another strong 32+ character secret]
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

#### Google OAuth Variables
```
GOOGLE_CLIENT_ID=[Your Google OAuth Client ID]
GOOGLE_CLIENT_SECRET=[Your Google OAuth Client Secret]
GOOGLE_CALLBACK_URL=https://your-backend-domain.onrender.com/api/auth/google/callback
```

#### Email Service Variables
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[Your Gmail address]
SMTP_PASS=[Your Gmail app password]
FROM_EMAIL=noreply@yourdomain.com
```

### Step 3: Deploy Backend Service

1. **Create Web Service on Render**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your backend code
   - Configure deployment:
     - **Name**: `kgotla-backend`
     - **Environment**: `Node`
     - **Region**: Same as your database
     - **Branch**: `main`
     - **Root Directory**: `backend`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`

2. **Add Environment Variables**
   - In the Render dashboard, go to your service
   - Navigate to "Environment" tab
   - Add all the variables listed above

3. **Connect Database**
   - In "Environment" tab, add:
   - `DATABASE_URL`: Select "Add from database" → Choose your PostgreSQL database

4. **Deploy**
   - Click "Create Web Service"
   - Wait for initial deployment to complete
   - Note your backend URL: `https://kgotla-backend.onrender.com`

### Step 4: Push Database Schema

After successful deployment:

1. **Access Render Shell** (or run locally with production DATABASE_URL):
   ```bash
   cd backend
   npm run db:push --force
   ```

## Part 2: Frontend Deployment on Vercel

### Step 1: Environment Variables Setup

Create `.env.production` in your frontend directory:

```
VITE_API_URL=https://kgotla-backend.onrender.com/api
VITE_APP_NAME=Kgotla Forum
VITE_APP_DESCRIPTION=A community discussion platform
```

### Step 2: Deploy Frontend

1. **Deploy via Vercel CLI** (Recommended):
   ```bash
   npm i -g vercel
   cd frontend
   vercel
   ```

2. **Or Deploy via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

3. **Add Environment Variables in Vercel**:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.production`

4. **Configure Custom Domain** (Optional):
   - In Vercel dashboard, go to "Domains"
   - Add your custom domain
   - Update `FRONTEND_URL` in Render backend environment

## Part 3: Google OAuth Setup

### Step 1: Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Set authorized redirect URIs:
   ```
   https://kgotla-backend.onrender.com/api/auth/google/callback
   ```

### Step 2: Update Environment Variables

Update your Render backend environment with:
- `GOOGLE_CLIENT_ID`: From Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: From Google Cloud Console

## Part 4: Email Service Setup (Gmail)

### Step 1: Generate App Password

1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings
3. Security → 2-Step Verification → App passwords
4. Generate app password for "Mail"
5. Use this password for `SMTP_PASS` environment variable

### Step 2: Configure Email Templates

The backend includes pre-built email templates for:
- Email verification
- Password reset
- Welcome emails

## Part 5: Testing Deployment

### Step 1: Health Checks

1. **Backend Health Check**:
   ```
   GET https://kgotla-backend.onrender.com/health
   ```
   Should return: `{"status": "OK", "service": "Kgotla Backend API"}`

2. **Frontend Access**:
   Visit your Vercel URL and ensure the app loads

### Step 2: Authentication Flow Testing

1. **Registration**:
   - Try registering with email/password
   - Check email for verification link
   - Verify email verification works

2. **Login**:
   - Test email/password login
   - Test Google OAuth login

3. **API Communication**:
   - Ensure frontend can communicate with backend
   - Check browser console for CORS errors

## Part 6: Custom Domain Setup (Optional)

### Backend Custom Domain (Render)

1. In Render dashboard, go to your service
2. Navigate to "Settings" → "Custom Domains"
3. Add your domain (e.g., `api.yourdomain.com`)
4. Update DNS records as instructed
5. Update `GOOGLE_CALLBACK_URL` environment variable

### Frontend Custom Domain (Vercel)

1. In Vercel dashboard, go to "Domains"
2. Add your domain (e.g., `yourdomain.com`)
3. Configure DNS records
4. Update `FRONTEND_URL` in backend environment

## Part 7: Security Considerations

### Production Security Checklist

- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS only (handled by Render/Vercel)
- [ ] Set proper CORS origins
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting (already configured)
- [ ] Regularly rotate JWT secrets
- [ ] Monitor authentication logs

### Environment Variables Security

Never commit these to your repository:
- JWT secrets
- Database URLs
- Google OAuth credentials
- Email service credentials

## Part 8: Monitoring and Maintenance

### Render Monitoring

- Monitor service logs in Render dashboard
- Set up service health checks
- Configure auto-deploy on git push

### Vercel Monitoring

- Monitor deployment logs
- Set up performance monitoring
- Configure preview deployments for pull requests

### Database Maintenance

- Regular backups (automatic with Render PostgreSQL)
- Monitor database performance
- Plan for scaling as user base grows

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure `FRONTEND_URL` is correctly set in backend
   - Check CORS configuration in backend

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` is correct
   - Ensure database schema is pushed
   - Check database connection limits

3. **Google OAuth Failures**:
   - Verify callback URL matches Google Console settings
   - Check client ID and secret are correct
   - Ensure OAuth consent screen is configured

4. **Email Service Issues**:
   - Verify Gmail app password is correct
   - Check SMTP settings
   - Ensure 2FA is enabled on Gmail account

### Debug Commands

```bash
# Check backend health
curl https://kgotla-backend.onrender.com/health

# Test API endpoint
curl https://kgotla-backend.onrender.com/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check database connection
# (Run in Render shell or locally with production DATABASE_URL)
npm run db:push
```

## Scaling Considerations

### Backend Scaling
- Render auto-scales within plan limits
- Consider upgrading to paid plans for better performance
- Implement database connection pooling for higher loads

### Frontend Scaling
- Vercel handles CDN and global distribution automatically
- Consider implementing service worker for offline functionality
- Optimize bundle size for faster loading

### Database Scaling
- Monitor database performance metrics
- Consider read replicas for high-traffic applications
- Plan for data archiving strategies

## Cost Estimation

### Free Tier Limits
- **Render**: 750 hours/month (sufficient for always-on service)
- **Vercel**: 100GB bandwidth, unlimited requests
- **Render PostgreSQL**: 1GB storage, 97 connection hours

### Paid Plans
- **Render Starter**: $7/month (always-on, better performance)
- **Vercel Pro**: $20/month (advanced features, more bandwidth)
- **Render PostgreSQL**: $7/month (1GB), scales with usage

This deployment setup provides a robust, scalable foundation for your Kgotla forum application with separate backend and frontend deployments.