# Kgotla - Deployment Guide

This guide covers deploying the separated Kgotla application with backend on Render and frontend on Vercel.

## Architecture Overview

- **Backend**: Node.js/Express API deployed on Render
- **Frontend**: React/TypeScript SPA deployed on Vercel  
- **Database**: PostgreSQL (can use Render's managed PostgreSQL or external providers like Neon/Supabase)
- **Authentication**: JWT tokens with Google OAuth and email/password

## Prerequisites

- GitHub repository with separated backend and frontend
- Render account for backend deployment
- Vercel account for frontend deployment
- Database provider (Render PostgreSQL, Neon, or Supabase)
- Google OAuth credentials
- Email service credentials (SendGrid, Mailgun, or SMTP)

## Backend Deployment (Render)

### 1. Database Setup

**Option A: Render PostgreSQL**
```bash
# Create PostgreSQL database on Render dashboard
# Note the connection string provided
```

**Option B: External Provider (Neon/Supabase)**
```bash
# Create database instance
# Configure connection pooling
# Note the connection string
```

### 2. Environment Variables

Configure these environment variables in Render:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secrets (generate secure random strings)
JWT_ACCESS_SECRET=your-super-secure-access-secret-at-least-32-characters
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-at-least-32-characters
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
NODE_ENV=production
PORT=10000
API_URL=https://your-backend-app.onrender.com
CLIENT_URL=https://your-frontend-app.vercel.app

# CORS Origins
CORS_ORIGINS=https://your-frontend-app.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend-app.onrender.com/api/auth/google/callback

# Email Service (choose one)
# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com

# Mailgun
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain

# SMTP
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

### 3. Build Configuration

Create `render.yaml` in backend root:

```yaml
services:
  - type: web
    name: kgotla-backend
    env: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
```

Update `backend/package.json`:

```json
{
  "scripts": {
    "build": "tsc && cp -r src/email-templates dist/",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts"
  }
}
```

### 4. Database Migration

```bash
# In backend directory
npm run db:push
```

## Frontend Deployment (Vercel)

### 1. Environment Variables

Configure in Vercel dashboard:

```env
VITE_API_URL=https://your-backend-app.onrender.com/api
VITE_CLIENT_URL=https://your-frontend-app.vercel.app
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 2. Build Configuration

Create `vercel.json` in frontend root:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/((?!api/.*).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## Google OAuth Setup

### 1. Google Cloud Console

1. Create project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Configure authorized origins:
   - `https://your-backend-app.onrender.com`
5. Configure authorized redirect URIs:
   - `https://your-backend-app.onrender.com/api/auth/google/callback`

### 2. Environment Variables

Update both backend and frontend with:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET` (backend only)

## Email Service Setup

### SendGrid (Recommended)

1. Create SendGrid account
2. Verify sender identity
3. Create API key with mail send permissions
4. Add to environment variables

### Mailgun Alternative

1. Create Mailgun account
2. Add and verify domain
3. Get API key and domain
4. Add to environment variables

## Deployment Steps

### 1. Backend Deployment

```bash
# 1. Push code to GitHub
git add .
git commit -m "Backend ready for deployment"
git push origin main

# 2. Connect repository to Render
# 3. Configure environment variables
# 4. Deploy automatically on push

# 5. Run database migrations
# Access Render shell and run:
npm run db:push
```

### 2. Frontend Deployment

```bash
# 1. Configure environment variables in Vercel
# 2. Connect GitHub repository to Vercel
# 3. Set build settings:
#    - Framework: Vite
#    - Root Directory: frontend/
#    - Build Command: npm run build
#    - Output Directory: dist

# 4. Deploy automatically on push
```

## Monitoring & Health Checks

### Backend Health Check

```bash
curl https://your-backend-app.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Frontend Health Check

```bash
curl https://your-frontend-app.vercel.app
```

Should return the React application.

## Database Backup & Recovery

### Automated Backups (Render PostgreSQL)

- Render automatically backs up databases
- Access backups through Render dashboard
- Can restore to point-in-time

### Manual Backup

```bash
# Export database
pg_dump $DATABASE_URL > kgotla_backup.sql

# Import database
psql $DATABASE_URL < kgotla_backup.sql
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to repository
2. **CORS**: Configure strict origins in production
3. **Rate Limiting**: Adjust limits based on usage patterns
4. **JWT Secrets**: Use cryptographically secure random strings
5. **Database**: Use connection pooling and SSL
6. **HTTPS**: Ensure all traffic is encrypted

## Performance Optimization

### Backend

- Enable gzip compression
- Use database connection pooling
- Implement caching headers
- Monitor response times

### Frontend

- Enable asset caching
- Optimize bundle size
- Use lazy loading for routes
- Implement service worker for caching

## Troubleshooting

### Common Backend Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check database server status
   - Ensure proper SSL configuration

2. **Authentication Errors**
   - Verify JWT secrets are set
   - Check Google OAuth configuration
   - Validate callback URLs

3. **CORS Errors**
   - Update CORS_ORIGINS environment variable
   - Verify frontend URL is correct

### Common Frontend Issues

1. **API Connection Errors**
   - Verify VITE_API_URL is correct
   - Check network requests in browser dev tools
   - Ensure backend is accessible

2. **Authentication Flow Issues**
   - Verify Google Client ID
   - Check OAuth redirect configuration
   - Test token refresh mechanism

## Scaling Considerations

### Horizontal Scaling

- Use Render's auto-scaling features
- Implement stateless authentication (JWT)
- Consider Redis for session storage

### Database Scaling

- Use read replicas for queries
- Implement connection pooling
- Consider database sharding for large datasets

### CDN Integration

- Use Vercel's built-in CDN for frontend
- Consider external CDN for API assets
- Implement proper cache headers

## Cost Optimization

### Render (Backend)

- Start with Starter plan ($7/month)
- Monitor resource usage
- Upgrade to Standard plan as needed

### Vercel (Frontend)

- Hobby plan supports personal projects
- Pro plan for commercial use
- Monitor bandwidth and function invocations

### Database

- Use shared instances for development
- Dedicated instances for production
- Regular cleanup of old data

## Maintenance

### Regular Tasks

1. Monitor application logs
2. Update dependencies monthly
3. Backup database regularly
4. Review security alerts
5. Monitor performance metrics

### Updates

1. Test updates in staging environment
2. Use feature flags for gradual rollouts
3. Implement automated testing
4. Monitor after deployments