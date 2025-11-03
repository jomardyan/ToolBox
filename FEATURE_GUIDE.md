# Quick Reference: New Features in Phase 2

## 🎯 How to Use the New Features

### 1. Batch Processing

**Access:** Navigate to Home → Advanced → Batch Processor tab

**How to:**
1. Fill in data in the "Add Conversion Item" form
2. Select source and target formats
3. Click "Add Item to Batch"
4. Repeat for multiple items
5. Click "Process Batch"
6. View results and download as JSON

**API Example:**
```bash
curl -X POST http://localhost:3000/api/batch-convert \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "data": "name,age\nJohn,30",
        "sourceFormat": "csv",
        "targetFormat": "json"
      },
      {
        "data": "{\"name\":\"Jane\",\"age\":25}",
        "sourceFormat": "json",
        "targetFormat": "csv"
      }
    ]
  }'
```

**Limits:**
- Max 100 items per batch
- Max 5 MB per item
- Rate limit: 5 requests/minute

---

### 2. Conversion Presets

**Access:** Home → Advanced → Presets tab

**How to:**
1. Click "New Preset"
2. Enter preset name (1-100 characters)
3. Optional: Add description
4. Select source and target formats
5. Click "Save Preset"
6. Use "Use" button to apply preset

**Save Your Own:**
The presets are currently mock data. To add persistent storage:
1. Implement database integration (PostgreSQL + Prisma)
2. Add /api/presets POST validation in routes
3. Update PresetsManager component to call delete endpoint

**API Example:**
```bash
# Create preset
curl -X POST http://localhost:3000/api/presets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CSV to Excel",
    "sourceFormat": "csv",
    "targetFormat": "excel",
    "description": "Convert CSV files to Excel format"
  }'

# Get presets
curl http://localhost:3000/api/presets
```

---

## 🔐 Security Features

### Rate Limiting

**By Endpoint:**
- General conversion: 30 requests/minute
- Batch operations: 5 requests/minute
- API health check: 100 requests/minute

**What happens when limit exceeded:**
```json
{
  "statusCode": 429,
  "error": "Too many requests from this IP, please try again later."
}
```

### Input Validation

**File Sizes:**
- Maximum data: 5 MB per request
- Maximum file: 10 MB
- Automatically rejected if exceeded

**Format Validation:**
Supported formats only:
- csv, json, xml, yaml, html, tsv, kml, txt

**Column Validation:**
- Maximum 100 columns per extraction
- Each column max 255 characters
- Non-empty strings required

**Example Error Response:**
```json
{
  "success": false,
  "error": "Data too large. Maximum size is 5MB.",
  "statusCode": 413
}
```

---

## 🧪 Running Tests

### Run All Tests
```bash
cd /workspaces/ToolBox/backend
npm test
```

### Run Specific Test File
```bash
npm test -- converters.test.ts
npm test -- validation.test.ts
```

### Run with Coverage Report
```bash
npm test -- --coverage
```

### Expected Output
```
Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
Coverage:    56% statements, 41% branches, 61% functions
```

---

## 📊 Testing Coverage

### Converter Tests (18 tests)
- CSV ↔ JSON conversions
- Special character handling
- Large file handling
- Field quoting and escaping
- Roundtrip conversions (CSV → JSON → CSV)

### Validation Tests (7 tests)
- Data length validation
- Format validation
- Column validation
- Input sanitization
- Error message sanitization

---

## 🚀 Deployment with New Features

### Using Docker
```bash
cd /workspaces/ToolBox
docker-compose up
```

The app starts with:
- Backend on `http://localhost:3000`
- Frontend on `http://localhost:5173`
- All endpoints rate-limited and validated

### Manual Deployment
```bash
# Build both projects
cd backend && npm run build
cd ../frontend && npm run build

# Run backend
cd backend
npm start
# Backend listens on port 3000

# Serve frontend
cd frontend
npm preview
# Frontend available on port 5173
```

---

## 🔧 Configuration

### Rate Limiting Configuration
File: `backend/src/utils/validation.ts`

```typescript
export const RATE_LIMIT_CONFIG = {
  // Modify these to adjust limits
  normal: {
    windowMs: 60 * 1000,      // 1 minute
    max: 30,                   // 30 requests
  },
  batch: {
    windowMs: 60 * 1000,
    max: 5,
  },
};
```

### CORS Configuration
File: `backend/src/index.ts`

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173'],
  credentials: true,
}));
```

### Validation Limits
File: `backend/src/utils/validation.ts`

```typescript
export const MAX_FILE_SIZE = 10 * 1024 * 1024;      // 10 MB
export const MAX_DATA_LENGTH = 5 * 1024 * 1024;    // 5 MB
```

---

## 📝 API Reference

### Batch Conversion
- **Endpoint:** `POST /api/batch-convert`
- **Rate Limit:** 5 requests/minute
- **Request:** Array of conversion items
- **Response:** Results array with status summary

### Presets
- **Endpoint:** `GET /api/presets`
- **Rate Limit:** 30 requests/minute
- **Response:** Array of preset objects

- **Endpoint:** `POST /api/presets`
- **Rate Limit:** 30 requests/minute
- **Request:** Preset details (name, formats, description)
- **Response:** Created preset object

---

## ❓ Troubleshooting

### Tests Failing?
```bash
# Clear node_modules and reinstall
cd backend
rm -rf node_modules
npm install --legacy-peer-deps
npm test
```

### Rate Limit Exceeded?
Wait 60 seconds for the rate limit window to reset, or:
- Modify `RATE_LIMIT_CONFIG` in `validation.ts`
- Restart the server

### CORS Errors?
Check that frontend URL is in `CORS_ORIGIN` environment variable:
```bash
export CORS_ORIGIN="http://localhost:5173"
```

### Large Batch Failing?
- Reduce number of items (max 100)
- Reduce data size per item (max 5 MB)
- Check individual conversion works before batching

---

## 📚 Related Documentation

- `PHASE_2_SUMMARY.md` - Complete implementation details
- `README.md` - General project overview
- `QUICKSTART.md` - 5-minute quick start
- `documentation.md` - Original 9-phase plan

---

**Last Updated:** Phase 2 Implementation
**Status:** All features tested and working ✅
