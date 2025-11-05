# Development Setup Guide

## Quick Start

### Using dev.sh (Recommended)

Run the entire development environment with a single command:

```bash
bash dev.sh
```

This will:

- Set up SQLite database with demo users
- Start backend server on `http://localhost:3000`
- Start frontend dev server on `http://localhost:5173`
- Show health checks and verification

### Manual Setup

#### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up SQLite database with demo data
npm run dev:setup

# Start development server
npm run dev
```

The backend will run on `http://localhost:3000`

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend will run on `http://localhost:5173`

## Demo Credentials

After database initialization, you can log in with:

- **Admin Account:**
  - Email: `admin@demo.com`
  - Password: `Demo@12345`

- **Regular User Account:**
  - Email: `user@demo.com`
  - Password: `Demo@12345`

## Database

### Development

Development environment uses **SQLite** for simplicity:

- Database file: `backend/dev.db`
- Automatically created on first setup
- Can be reset with: `npm run dev:setup`

### Production

Production should use **PostgreSQL** or **MySQL**:

1. Set `DATABASE_URL` in `.env.production`
2. Example: `postgresql://user:password@localhost:5432/toolbox`
3. Run migrations: `npx prisma migrate deploy`

## Environment Files

- `.env` - Current environment (git-ignored)
- `.env.development` - Development defaults
- `.env.production` - Production template

## Available Scripts

### Backend

```bash
npm run dev           # Start development server with hot reload
npm run dev:setup     # Initialize database with migrations and demo data
npm run build         # Build TypeScript
npm run start         # Run production build
npm run test          # Run tests
npm run lint          # Run linter
```

### Frontend

```bash
npm run dev           # Start Vite dev server
npm run build         # Build for production
npm run preview       # Preview production build
npm run test          # Run tests
npm run lint          # Run linter
```

## API Documentation

When backend is running, visit:

- **Swagger UI:** `http://localhost:3000/api-docs`
- **OpenAPI JSON:** `http://localhost:3000/api-docs/json`

## Troubleshooting

### Backend won't start

1. Check if port 3000 is in use: `lsof -i :3000`
2. Kill process if needed: `lsof -ti:3000 | xargs kill -9`
3. Clear database: `rm backend/dev.db`
4. Run setup again: `npm run dev:setup`

### Frontend won't connect to backend

1. Ensure backend is running: `curl http://localhost:3000/api/health`
2. Check CORS settings in `backend/src/index.ts`
3. On Codespaces, frontend will auto-detect the correct backend URL

### Database issues

1. Reset database: `cd backend && rm dev.db && npm run dev:setup`
2. Check Prisma status: `npx prisma migrate status`
3. View database: Use SQLite browser or `sqlite3 backend/dev.db`

## GitHub Codespaces

When running on GitHub Codespaces:

- Frontend will be at: `https://<codespace-name>-5173.app.github.dev`
- Backend will be at: `https://<codespace-name>-3000.app.github.dev`
- Frontend automatically detects and routes to correct backend URL

## Next Steps

1. Start development with `bash dev.sh`
2. Log in with demo credentials
3. Explore the application
4. Check API documentation at `/api-docs`
5. Modify code - both servers use hot reload
