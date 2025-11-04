# Swagger API Documentation Setup

## Overview

The ToolBox SaaS API is now fully documented with Swagger/OpenAPI 3.0 specification featuring comprehensive interactive documentation covering all API endpoints including authentication, OAuth, subscriptions, billing, 2FA, API key management, usage tracking, data conversion, and admin operations.

## Version

**Current Version**: 2.0.0  
**Last Updated**: November 4, 2025  
**Status**: ✅ Production Ready

## What's Documented

### Complete API Coverage

The Swagger documentation includes **100+ endpoints** across 16 categories:

**Authentication & Security**
- User registration and login
- Password reset and email verification
- JWT token refresh and session management
- OAuth 2.0 (Google, GitHub)
- Two-factor authentication (TOTP, backup codes)

**Account Management**
- User profile management
- Avatar upload
- Email and password changes
- Account deletion

**Subscription & Billing**
- Subscription plans and pricing
- Upgrade/downgrade subscriptions
- Billing history and invoices
- Payment methods (add, remove, set default)
- Stripe webhook handlers

**API Access**
- API key creation and management
- API key rotation and revocation
- Usage tracking and analytics
- Quota monitoring

**Data Conversion**
- Multi-format conversion (17 formats)
- Batch conversion
- CSV column extraction
- Conversion presets

**Admin Operations**
- User management (suspend, reactivate, roles)
- Plan management (create, update, archive)
- Revenue and usage analytics
- Top users by usage

## Swagger Packages

Installed dependencies:
```json
{
  "swagger-ui-express": "^5.0.0",
  "swagger-jsdoc": "^6.2.8",
  "@types/swagger-ui-express": "^4.1.6",
  "@types/swagger-jsdoc": "^6.0.4"
}
```

## Configuration

### Swagger Config
**File**: `backend/src/swagger/swaggerConfig.ts`

Features:
- OpenAPI 3.0.0 specification
- JWT Bearer authentication
- API Key authentication
- 16 tagged endpoint categories
- Comprehensive schema definitions
- Multiple server configurations

### Security Schemes

**Bearer Authentication**
```yaml
bearerAuth:
  type: http
  scheme: bearer
  bearerFormat: JWT
```

**API Key Authentication**
```yaml
apiKey:
  type: apiKey
  in: header
  name: X-API-Key
```

## Accessing Documentation

### Interactive Swagger UI
```
http://localhost:3000/api-docs
```

Features:
- Browse all 100+ endpoints
- View detailed request/response schemas
- Try endpoints directly from browser
- See authentication requirements
- View real-time examples

### OpenAPI JSON Specification
```
http://localhost:3000/api-docs/json
```

Use for:
- Client code generation (OpenAPI Generator, Swagger Codegen)
- API testing tools (Postman, Insomnia)
- Documentation hosting
- Version control

### Health Check
```
http://localhost:3000/api/health
```

Returns API status, timestamp, and uptime.

## Supported Data Formats

All 17 conversion formats are documented:
- **Structured**: CSV, JSON, XML, YAML, TOML
- **Spreadsheet**: Excel, TSV
- **Markup**: HTML, Markdown, Table
- **Database**: SQL
- **Streaming**: JSONL, NDJSON, Lines
- **Geographic**: KML
- **Calendar**: ICS
- **Plain**: TXT

## API Endpoint Categories

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### OAuth Endpoints
- `GET /api/oauth/google/auth` - Google OAuth URL
- `POST /api/oauth/google/callback` - Google OAuth callback
- `GET /api/oauth/github/auth` - GitHub OAuth URL
- `POST /api/oauth/github/callback` - GitHub OAuth callback
- `POST /api/oauth/link` - Link OAuth account
- `GET /api/oauth/accounts` - Get linked accounts
- `DELETE /api/oauth/:provider` - Unlink OAuth account

### 2FA Endpoints
- `GET /api/2fa/setup` - Generate 2FA setup
- `POST /api/2fa/enable` - Enable 2FA
- `POST /api/2fa/verify` - Verify TOTP token
- `POST /api/2fa/backup-code` - Verify backup code
- `POST /api/2fa/disable` - Disable 2FA
- `POST /api/2fa/regenerate-backup-codes` - Regenerate backup codes
- `GET /api/2fa/status` - Get 2FA status

### Account Endpoints
- `GET /api/user/account/profile` - Get profile
- `PUT /api/user/account/profile` - Update profile
- `POST /api/user/account/avatar` - Upload avatar
- `POST /api/user/account/change-email` - Change email
- `POST /api/user/account/change-password` - Change password
- `DELETE /api/user/account` - Delete account
- `GET /api/user/account/settings` - Get settings

### Subscription Endpoints
- `GET /api/user/subscription` - Get subscription
- `GET /api/user/subscription/plans` - Get available plans
- `POST /api/user/subscription/upgrade` - Upgrade subscription
- `POST /api/user/subscription/downgrade` - Downgrade subscription
- `POST /api/user/subscription/cancel` - Cancel subscription

### Billing Endpoints
- `GET /api/user/billing/invoices` - Get invoices
- `GET /api/user/billing/payment-methods` - Get payment methods
- `POST /api/user/billing/payment-methods` - Add payment method
- `DELETE /api/user/billing/payment-methods/:id` - Delete payment method
- `POST /api/user/billing/payment-methods/:id/set-default` - Set default
- `GET /api/user/billing/overview` - Get billing overview

### API Key Endpoints
- `GET /api/user/api-keys` - List API keys
- `POST /api/user/api-keys` - Create API key
- `DELETE /api/user/api-keys/:id` - Revoke API key
- `POST /api/user/api-keys/:id/rotate` - Rotate API key

### Usage Endpoints
- `GET /api/user/usage/summary` - Usage summary
- `GET /api/user/usage/detailed` - Detailed usage logs
- `GET /api/user/usage/monthly/:year/:month` - Monthly usage
- `GET /api/user/usage/quota` - Quota status
- `GET /api/user/usage/by-endpoint` - Usage by endpoint

### Conversion Endpoints
- `POST /api/convert` - Convert data
- `POST /api/batch-convert` - Batch conversion
- `POST /api/extract/csv-columns` - Extract CSV columns
- `POST /api/presets` - Create preset
- `GET /api/presets` - Get presets

### Admin User Endpoints
- `GET /api/admin/users` - List users
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users/:id/suspend` - Suspend user
- `POST /api/admin/users/:id/reactivate` - Reactivate user
- `POST /api/admin/users/:id/make-admin` - Make admin
- `POST /api/admin/users/:id/remove-admin` - Remove admin
- `DELETE /api/admin/users/:id` - Delete user

### Admin Plan Endpoints
- `GET /api/admin/plans` - List plans
- `GET /api/admin/plans/:id` - Get plan details
- `POST /api/admin/plans` - Create plan
- `PUT /api/admin/plans/:id` - Update plan
- `DELETE /api/admin/plans/:id` - Archive plan

### Admin Analytics Endpoints
- `GET /api/admin/analytics/revenue` - Revenue analytics
- `GET /api/admin/analytics/api` - API usage analytics
- `GET /api/admin/analytics/users` - User analytics
- `GET /api/admin/analytics/top-users` - Top users by usage

### Webhook Endpoints
- `POST /api/stripe/webhook` - Stripe webhook handler

## Using the API

### Authentication

**JWT Bearer Token**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**API Key**
```bash
curl -X POST http://localhost:3000/api/convert \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"data":"name,age\nJohn,30","sourceFormat":"csv","targetFormat":"json"}'
```

### Example: Convert CSV to JSON

```bash
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "data": "name,age,city\nJohn,30,NYC\nJane,28,LA",
    "sourceFormat": "csv",
    "targetFormat": "json"
  }'
```

### Example: Get Usage Summary

```bash
curl -X GET http://localhost:3000/api/user/usage/summary?days=30 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example: Create API Key

```bash
curl -X POST http://localhost:3000/api/user/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Production API Key"}'
```

## Client Code Generation

### Using OpenAPI Generator

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:3000/api-docs/json \
  -g typescript-axios \
  -o ./generated-client

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:3000/api-docs/json \
  -g python \
  -o ./python-client
```

### Using Swagger Codegen

```bash
swagger-codegen generate \
  -i http://localhost:3000/api-docs/json \
  -l javascript \
  -o ./js-client
```

## Files Modified

1. **backend/src/swagger/swaggerConfig.ts** - Complete rewrite with all schemas
2. **backend/src/routes/index.ts** - Added Swagger annotations
3. **backend/src/index.ts** - Swagger UI integration
4. **backend/package.json** - Added Swagger dependencies

## Schema Definitions

The Swagger config includes complete schema definitions for:
- Authentication (RegisterRequest, LoginRequest, AuthResponse)
- Subscriptions (SubscriptionPlan, Subscription)
- API Keys (ApiKey, CreateApiKeyResponse)
- Usage (UsageSummary, QuotaStatus)
- Billing (Invoice, PaymentMethod)
- 2FA (TwoFactorSetup)
- Account (UserProfile)
- Admin (UserList, Analytics)
- Conversion (ConversionRequest, ConversionResponse, etc.)

## Testing the Documentation

### Start the Backend
```bash
cd backend
npm run dev
```

### Access Swagger UI
Open browser: `http://localhost:3000/api-docs`

### Try an Endpoint
1. Click on any endpoint
2. Click "Try it out"
3. Fill in parameters
4. Click "Execute"
5. View response

## Troubleshooting

**Swagger UI not loading?**
```bash
# Check backend is running
curl http://localhost:3000/

# View spec directly
curl http://localhost:3000/api-docs/json | jq
```

**Port 3000 in use?**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Start backend
cd backend && npm run dev
```

**Missing dependencies?**
```bash
cd backend
npm install swagger-ui-express swagger-jsdoc
npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc
```

**Schema errors?**
```bash
# Validate OpenAPI spec
npx swagger-cli validate http://localhost:3000/api-docs/json
```

## Integration with Tools

### Postman
1. Import OpenAPI spec: `http://localhost:3000/api-docs/json`
2. Postman will create a full collection with all endpoints

### Insomnia
1. Create new request collection
2. Import from URL: `http://localhost:3000/api-docs/json`

### VS Code REST Client
Use the OpenAPI spec to auto-generate REST client requests

## Security Notes

- JWT tokens expire after 1 hour
- Refresh tokens expire after 7 days
- API keys never expire but can be revoked
- Rate limits apply per plan tier
- Admin endpoints require ADMIN role

## Rate Limits

Documented in each plan:
- Free: 1,000 calls/month
- Basic: 10,000 calls/month
- Pro: 100,000 calls/month
- Enterprise: Unlimited

## Support

For API documentation issues:
- GitHub: https://github.com/jomardyan/ToolBox/issues
- Email: support@toolbox.com

## Links

- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs/json
- **Health Check**: http://localhost:3000/api/health
- **GitHub**: https://github.com/jomardyan/ToolBox

---

**Last Updated**: November 4, 2025  
**API Version**: 2.0.0  
**OpenAPI Version**: 3.0.0
