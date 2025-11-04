# Deployment Checklist

This document outlines what needs to be manually configured when deploying this application.

## ✅ Already Included in Repository

- ✅ Database file (`data/database.sqlite`) - now included in git
- ✅ Database schema (`src/db/schema.ts`)
- ✅ Application code and components
- ✅ Configuration files (Next.js, Tailwind, Drizzle)
- ✅ Dependencies list (`package.json`)

## 🔧 Required Manual Setup

### 1. Environment Variables

Create a `.env` or `.env.local` file in the project root with the following variables:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
# For production, change to your deployed API URL

# OpenAI API Key for Real Estate Ad Generation
OPENAI_API_KEY=your_openai_api_key_here

# fal.ai API Key for Bria Image Expansion
FAL_KEY=your_fal_ai_api_key_here

# REBS CRM API Key for Agent Authentication
REBS_API_KEY=ee93793d23fb4cdfc27e581a300503bda245b7c8

# Document Converter API Key (if using external service)
DOCUMENT_CONVERTER_API_KEY=your_converter_api_key_here

# Database Configuration
# For SQLite (default), this is optional as it uses local file path
# If using a remote database, provide connection string
DATABASE_URL=your_database_url_here

# Authentication (if using NextAuth)
NEXTAUTH_SECRET=your_nextauth_secret_here
# Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
# For production, change to your deployed URL

# TowerImob Leaderboard URL (Google Apps Script)
NEXT_PUBLIC_LEADERBOARD_URL=https://script.google.com/macros/s/AKfycbyCnMD4GtwhFXywdeqLVvel8qON6xNZrXpVTGvV9HNmXtIdj8DuVATHaWn5mbJCi_J5VA/exec
```

**Critical Environment Variables:**
- `REBS_API_KEY` - Required for agent authentication
- `NEXT_PUBLIC_LEADERBOARD_URL` - Required for leaderboard data
- `OPENAI_API_KEY` - Required for real estate ad generation (optional if feature not used)
- `FAL_KEY` - Required for image expansion features (optional if feature not used)

### 2. Node.js Dependencies

Run the following commands after cloning:

```bash
npm install
```

This will install all dependencies listed in `package.json`, including:
- Next.js framework
- Drizzle ORM for database
- better-sqlite3 for SQLite database
- React and UI libraries
- Tailwind CSS and styling utilities

### 3. Database Setup

The database file (`data/database.sqlite`) is included in the repository. However, if you need to initialize or migrate:

```bash
# Generate migrations (if schema changes)
npm run db:generate

# Push schema to database (creates tables if needed)
npm run db:push

# Or run migrations
npm run db:migrate
```

**Note:** The database file path is hardcoded to `./data/database.sqlite` relative to the project root. Ensure the `data/` directory has write permissions on the deployment server.

### 4. Build Process

Build the application:

```bash
npm run build
```

This creates an optimized production build in the `.next/` directory.

### 5. Production Server

Start the production server:

```bash
npm run start
```

Or use a process manager like PM2:

```bash
pm2 start npm --name "agent-dashboard" -- start
```

### 6. Deployment Platform Specifics

#### Vercel
- Add environment variables in Vercel dashboard
- Ensure `.env` variables are configured in project settings
- Database file will be deployed with the application

#### Firebase / Other Platforms
- Configure environment variables in platform dashboard
- Ensure `data/` directory is writable (for SQLite)
- Consider using a persistent volume for the database file

#### Self-Hosted (VPS/Server)
- Create `.env.local` file on server
- Ensure Node.js 18+ is installed
- Set up reverse proxy (nginx) if needed
- Configure SSL certificates
- Set up process manager (PM2, systemd)

### 7. Optional: Database Migration

If deploying to a new environment and the database file doesn't exist or needs initialization:

1. Run the database initialization API endpoint:
   ```
   POST /api/db-init
   ```

2. Or use the migration script:
   ```bash
   npx tsx scripts/migrate-json-to-db.ts
   ```

### 8. Verify Deployment

After deployment, verify these endpoints work:

- ✅ `/` - Main dashboard
- ✅ `/admin` - Admin panel
- ✅ `/leaderboard` - Leaderboard page
- ✅ `/api/agents` - Agent list API
- ✅ `/api/transactions-local` - Transactions API
- ✅ `/api/leaderboard-local` - Leaderboard API

## 🔐 Security Notes

1. **Never commit `.env` files** - They contain sensitive API keys
2. **REBS_API_KEY** - Currently visible in code; consider moving to environment variable only
3. **Database file** - Contains transaction data; ensure proper file permissions (600 recommended)
4. **API Keys** - Rotate keys if exposed or compromised

## 📝 Post-Deployment

1. Test all features:
   - Agent authentication
   - Transaction creation
   - Leaderboard updates
   - Admin panel functions

2. Monitor logs for errors:
   - Check database connection
   - Verify API endpoints are working
   - Test external API integrations (REBS, OpenAI, fal.ai)

3. Set up monitoring:
   - Error tracking (Sentry, etc.)
   - Uptime monitoring
   - Database backup schedule

## 🆘 Troubleshooting

### Database Issues
- Ensure `data/` directory exists and is writable
- Check file permissions: `chmod 755 data/` and `chmod 644 data/database.sqlite`
- Verify SQLite3 binary is available on the server

### Environment Variable Issues
- Check `.env` file is in project root
- Verify variable names match exactly (case-sensitive)
- Restart server after adding/changing environment variables

### Build Issues
- Clear `.next` directory and rebuild
- Ensure Node.js version matches (check `package.json` engines if specified)
- Check for TypeScript errors: `npm run lint`




