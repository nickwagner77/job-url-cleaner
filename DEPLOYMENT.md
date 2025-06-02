# 🚀 Deployment Guide

This guide covers deploying the Job URL Cleaner app to Vercel with PostgreSQL.

## 📋 Prerequisites

- Vercel account
- PostgreSQL database (Neon, Supabase, or any PostgreSQL provider)
- GitHub repository

## 🗄️ Database Setup

### Option 1: Neon (Recommended)

1. Go to [Neon](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string from the dashboard
4. The format will be: `postgresql://username:password@host/database?sslmode=require`

### Option 2: Supabase

1. Go to [Supabase](https://supabase.com) and create a project
2. Go to Settings > Database
3. Copy the connection string
4. Replace `[YOUR-PASSWORD]` with your actual password

### Option 3: Railway

1. Go to [Railway](https://railway.app) and create a PostgreSQL service
2. Copy the connection string from the service variables

## 🔧 Vercel Deployment

### 1. Connect Repository

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Select the repository and click "Import"

### 2. Configure Environment Variables

In your Vercel project settings, add these environment variables:

```bash
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=production
```

### 3. Configure Build Settings

Vercel should automatically detect the configuration from `vercel.json`, but verify:

- **Framework Preset**: Other
- **Root Directory**: Leave empty (monorepo)
- **Build Command**: `npm run build`
- **Output Directory**: `frontend/dist`

### 4. Deploy

Click "Deploy" and wait for the build to complete.

## 🔄 Database Migration

After deployment, you need to run the database migration:

### Option 1: Vercel CLI (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link project: `vercel link`
4. Run migration: `vercel env pull .env.local && cd backend && npx prisma migrate deploy`

### Option 2: Manual Migration

1. Clone your repository locally
2. Set the `DATABASE_URL` environment variable
3. Run: `cd backend && npx prisma migrate deploy`

## 🧪 Testing the Deployment

1. Visit your Vercel URL
2. Try uploading some test URLs
3. Verify the cleaning and deduplication works
4. Test the export functionality

## 🔍 Troubleshooting

### Build Errors

- Check the build logs in Vercel dashboard
- Ensure all dependencies are properly installed
- Verify TypeScript compilation passes locally

### Database Connection Issues

- Verify the `DATABASE_URL` is correct
- Check if the database allows connections from Vercel's IP ranges
- Ensure SSL is properly configured

### API Errors

- Check the Vercel function logs
- Verify environment variables are set correctly
- Test API endpoints individually

## 📊 Monitoring

- Use Vercel Analytics for frontend monitoring
- Monitor database performance through your provider's dashboard
- Set up error tracking (optional: Sentry integration)

## 🔄 Updates

To update the deployment:

1. Push changes to your main branch
2. Vercel will automatically redeploy
3. For database schema changes, run migrations manually

## 💡 Tips

- Use Vercel's preview deployments for testing
- Set up branch protection rules
- Consider using Vercel's edge functions for better performance
- Monitor your database usage to avoid hitting limits 