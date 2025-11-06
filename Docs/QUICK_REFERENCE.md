# ToolBox Development - Quick Reference

## 🚀 Start Development Environment
```bash
bash dev.sh
```

**Output:**
- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- API Docs: http://localhost:3000/api-docs

## 👤 Demo Credentials
```
Admin:  admin@demo.com / Demo@12345
User:   user@demo.com  / Demo@12345
```

## 🔄 Reset & Start Fresh
```bash
bash dev.sh --reset
```

## 🧪 Run Tests
```bash
cd backend && npm test
```

## 📋 Environment Files
- **Development:** `.env.development` (no secrets needed)
- **Production:** `.env.production` (strict secret requirements)

## 📡 API Endpoints

### Webhooks (Stripe)
```
POST /api/stripe/webhook
```

### OAuth
```
GET  /api/oauth/connect/<provider>
GET  /api/oauth/callback/<provider>
POST /api/oauth/disconnect/<provider>
```

### Two-Factor Authentication
```
POST   /api/2fa/setup
POST   /api/2fa/verify
PUT    /api/2fa/disable
```

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Kill process: `lsof -i :3000 \| tail -1 \| awk '{print $2}' \| xargs kill -9` |
| Database errors | Reset: `bash dev.sh --reset` |
| Tests failing | Check logs: `cat logs/backend.log` |
| JWT errors (shouldn't happen) | Verify NODE_ENV=development in terminal |

## 📝 Logs
```bash
# Backend
tail -f logs/backend.log

# Frontend  
tail -f logs/frontend.log

# Combined
tail -f logs/*.log
```

## 🔑 Key Configuration

### Development Mode (default)
- JWT secrets: PROVIDED (no setup needed)
- Database: SQLite (`dev.db`)
- Stripe: Optional
- Email: Optional

### Production Mode
- JWT secrets: REQUIRED (32+ chars)
- Database: PostgreSQL (required)
- Stripe: REQUIRED (if enabled)
- Email: Configurable

## 📚 Full Documentation
- Development guide: `Docs/DEV_ENVIRONMENT_FINAL.md`
- Implementation summary: `Docs/IMPLEMENTATION_SESSION_COMPLETE.md`
- Setup details: `Docs/DEV_SETUP.md`

## ✅ Enabled Routes
- ✅ Webhook routes (`/api/stripe/webhook`)
- ✅ OAuth routes (`/api/oauth`)
- ✅ 2FA routes (`/api/2fa`)

## 🧠 Remember
- Development mode prioritizes **functionality** over **security**
- No JWT secrets required in development
- Database auto-initializes on first run
- Demo data pre-loaded and ready
- Tests run with `npm test` in backend folder

---

**Status:** ✅ Production Ready | Development Optimized | Tests Passing

**Ready to develop?** Run `bash dev.sh` 🚀
