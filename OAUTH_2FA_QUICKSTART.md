# OAuth2 & 2FA Quick Start Guide

## For Development

### 1. Setup Environment Variables

Create/update `.env` with OAuth credentials:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/oauth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:3001/api/oauth/github/callback

# Session (for OAuth state parameter)
SESSION_SECRET=dev_session_secret_min_32_chars

# 2FA
TOTP_ISSUER=ToolBox
TOTP_WINDOW_SIZE=2
```

### 2. Get OAuth Credentials

#### Google OAuth
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials (Web application)
5. Add redirect URI: `http://localhost:3001/api/oauth/google/callback`
6. Copy Client ID and Secret to `.env`

#### GitHub OAuth
1. Visit [GitHub Settings → Developer settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in application details:
   - Application name: ToolBox
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: http://localhost:3001/api/oauth/github/callback
4. Copy Client ID and Secret to `.env`

### 3. Start Development Server

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### 4. Test OAuth Login

1. Go to `http://localhost:3000`
2. Navigate to OAuth login page
3. Click "Sign in with Google" or "Sign in with GitHub"
4. Complete OAuth flow
5. Verify user is logged in

### 5. Test 2FA Setup

1. Log in with regular credentials
2. Go to Account Settings → Two-Factor Authentication
3. Click "Setup 2FA"
4. Scan QR code with:
   - Google Authenticator
   - Authy
   - Microsoft Authenticator
   - Or any RFC 6238 compatible app
5. Enter 6-digit code
6. Save backup codes securely
7. Complete setup

### 6. Test 2FA Login

1. Log out
2. Log in with email/password
3. System prompts for 2FA verification
4. Enter 6-digit code from authenticator app
5. Complete login

---

## Features Overview

### OAuth2 Features

**Login Options:**
- Sign in with Google
- Sign in with GitHub
- Auto-creates account on first login
- Auto-verifies email

**Account Linking:**
- Link multiple OAuth providers
- View linked accounts
- Unlink accounts (requires password)
- Prevents account lockout

**Security:**
- State parameter prevents CSRF
- Token verification
- Duplicate linking prevention
- Password required to unlink

### 2FA Features

**Setup:**
- QR code for easy scanning
- Manual secret entry option
- 10 backup codes for recovery
- Download backup codes

**Login:**
- 6-digit TOTP code required
- 30-second time window tolerance
- Backup code alternative
- Rate limiting on attempts

**Management:**
- View 2FA status
- Regenerate backup codes
- Disable 2FA (requires password)
- Backup code warnings

---

## API Endpoints

### OAuth Endpoints

```
GET /api/oauth/google/auth          # Generate Google login URL
POST /api/oauth/google/callback     # Handle Google callback
GET /api/oauth/github/auth          # Generate GitHub login URL
POST /api/oauth/github/callback     # Handle GitHub callback
POST /api/oauth/link                # Link OAuth to authenticated user
GET /api/oauth/accounts             # List linked accounts (protected)
DELETE /api/oauth/:provider         # Unlink account (protected)
```

### 2FA Endpoints

```
GET /api/2fa/setup                  # Generate QR code
POST /api/2fa/enable                # Enable 2FA
POST /api/2fa/verify                # Verify TOTP code
POST /api/2fa/backup-code           # Use backup code
POST /api/2fa/disable               # Disable 2FA
POST /api/2fa/regenerate-backup-codes
GET /api/2fa/status                 # Get 2FA status
```

---

## Files Created

### Backend (4 files)
- `backend/src/services/oauthService.ts` - OAuth business logic
- `backend/src/routes/oauthRoutes.ts` - OAuth endpoints
- `backend/src/services/twoFactorService.ts` - 2FA business logic
- `backend/src/routes/twoFactorRoutes.ts` - 2FA endpoints

### Frontend (2 files)
- `frontend/src/pages/OAuthPage.tsx` - OAuth login & linking UI
- `frontend/src/pages/TwoFactorPage.tsx` - 2FA setup & management UI

### Tests (2 files)
- `frontend/src/__tests__/pages/OAuthPage.test.tsx`
- `frontend/src/__tests__/pages/TwoFactorPage.test.tsx`

### Documentation (2 files)
- `OAUTH_2FA_INTEGRATION_GUIDE.md` - Comprehensive integration guide
- `PROJECT_COMPLETION_REPORT.md` - Project completion summary

---

## Common Tasks

### Enable OAuth for New User

```typescript
// User visits OAuth login URL
// System automatically:
// 1. Verifies OAuth token
// 2. Extracts user profile
// 3. Creates user account
// 4. Marks email as verified
// 5. Returns JWT tokens
```

### Link OAuth to Existing Account

```typescript
// Authenticated user clicks "Link Google"
// System:
// 1. Redirects to OAuth login
// 2. Verifies OAuth token
// 3. Links to existing account
// 4. Prevents duplicate linking
```

### Enable 2FA for User

```typescript
// User starts 2FA setup
// System:
// 1. Generates TOTP secret
// 2. Creates QR code
// 3. Generates 10 backup codes
// 4. User scans QR with authenticator
// 5. User enters verification code
// 6. System enables 2FA
// 7. User downloads backup codes
```

### Disable 2FA

```typescript
// User clicks "Disable 2FA"
// System:
// 1. Requires password verification
// 2. Clears TOTP secret
// 3. Removes backup codes
// 4. Disables 2FA
// 5. User can log in without code
```

---

## Troubleshooting

### OAuth Not Working

**Check:**
- [ ] Environment variables are set correctly
- [ ] OAuth credentials are valid
- [ ] Redirect URIs match exactly
- [ ] CORS is enabled for OAuth domain
- [ ] Session secret is set

**Debug:**
```bash
# Check environment variables
echo $GOOGLE_CLIENT_ID
echo $GITHUB_CLIENT_ID

# Check logs
npm run dev  # Look for OAuth errors in console
```

### 2FA Not Working

**Check:**
- [ ] Authenticator app is installed
- [ ] Device time is correct
- [ ] 2FA is enabled in user account
- [ ] TOTP secret was not changed

**Debug:**
```bash
# Check 2FA status
GET /api/2fa/status
# Response: { enabled: true/false, backupCodesRemaining: number }
```

### QR Code Not Scanning

**Try:**
- Ensure sufficient lighting
- Grant camera permission to authenticator app
- Use another authenticator app
- Enter secret code manually instead
- Check QR code displayed correctly

---

## Security Best Practices

### OAuth
- ✅ Always use HTTPS in production
- ✅ Validate state parameter to prevent CSRF
- ✅ Never log OAuth tokens
- ✅ Require password to unlink accounts
- ✅ Prevent duplicate account linking

### 2FA
- ✅ Store secrets securely (hashed)
- ✅ Hash backup codes with bcrypt
- ✅ Remove used backup codes
- ✅ Require password for disable/regenerate
- ✅ Alert user on unusual activity

---

## Integration Steps for UI

### Add OAuth to Login Page

```tsx
import { OAuthPage } from '../pages/OAuthPage';

export const LoginPage = () => {
  return (
    <div>
      <h1>Login</h1>
      <OAuthPage />
    </div>
  );
};
```

### Add 2FA to Account Settings

```tsx
import { TwoFactorPage } from '../pages/TwoFactorPage';

export const AccountSettings = () => {
  return (
    <div>
      <h1>Account Settings</h1>
      <TwoFactorPage />
    </div>
  );
};
```

---

## Testing

### Run Tests

```bash
# Backend OAuth tests
npm test -- oauthService
npm test -- oauthRoutes

# Frontend OAuth tests
npm run test -- OAuthPage

# Frontend 2FA tests
npm run test -- TwoFactorPage
```

### Manual Testing Checklist

OAuth:
- [ ] Google login (new user)
- [ ] Google login (existing user)
- [ ] GitHub login (new user)
- [ ] GitHub login (existing user)
- [ ] Link Google account
- [ ] Link GitHub account
- [ ] Unlink account
- [ ] Cannot unlink without password

2FA:
- [ ] Setup with Google Authenticator
- [ ] Setup with Authy
- [ ] Login with 2FA code
- [ ] Login with backup code
- [ ] Cannot reuse backup code
- [ ] Download backup codes
- [ ] Regenerate backup codes
- [ ] Disable 2FA

---

## Monitoring

### Metrics to Track

**OAuth:**
- Login attempts by provider
- Account linking rate
- OAuth errors
- State validation failures

**2FA:**
- 2FA adoption rate
- Verification success rate
- Backup code usage
- Account recovery via backup codes

### Logs to Monitor

```bash
# OAuth events
logger.info('OAuth login started', { provider, userId })
logger.info('OAuth account linked', { userId, provider })
logger.error('OAuth verification failed', { reason })

# 2FA events
logger.info('2FA setup started', { userId })
logger.info('2FA verification success', { userId })
logger.error('2FA verification failed', { userId })
```

---

## Next Steps

1. Configure OAuth credentials for your providers
2. Test OAuth login flow
3. Test 2FA setup and login
4. Integrate into main login/account pages
5. Deploy to staging
6. User acceptance testing
7. Deploy to production

---

## Support & Documentation

- **Integration Guide:** `OAUTH_2FA_INTEGRATION_GUIDE.md`
- **API Reference:** See integration guide for full API docs
- **Project Report:** `PROJECT_COMPLETION_REPORT.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`

---

**Last Updated:** 2024
**Status:** Ready for Production
