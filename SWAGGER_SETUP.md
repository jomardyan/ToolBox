# Swagger API Documentation Setup

## Overview

The backend API is now fully compatible with Swagger/OpenAPI 3.0 specification with interactive documentation.

## What Was Added

### 1. Swagger Packages Installed
- `swagger-ui-express` (v1.x) - Serves the interactive Swagger UI
- `swagger-jsdoc` (v6.x) - Generates OpenAPI spec from JSDoc comments
- `@types/swagger-ui-express` (dev) - TypeScript definitions
- `@types/swagger-jsdoc` (dev) - TypeScript definitions

### 2. Swagger Configuration File
**File**: `backend/src/swagger/swaggerConfig.ts`

Contains:
- OpenAPI 3.0.0 specification definition
- API info, servers, and contact information
- Complete component schemas for all request/response types:
  - ConversionRequest
  - ConversionResponse
  - ErrorResponse
  - BatchConversionRequest
  - BatchConversionResponse
  - ColumnExtractionRequest
  - PresetRequest
  - Preset
  - HealthResponse

### 3. Backend Integration
**File**: `backend/src/index.ts`

Added:
- Import for swagger-ui-express and swaggerConfig
- Swagger UI endpoint at `/api-docs`
- Raw OpenAPI JSON endpoint at `/api-docs/json`
- Updated root endpoint to include documentation link

### 4. Route Documentation
**File**: `backend/src/routes/index.ts`

Added JSDoc/Swagger annotations for:
- `POST /api/convert` - Convert data between formats
- `POST /api/batch-convert` - Batch conversion
- `POST /api/extract/csv-columns` - Column extraction
- `POST /api/presets` - Create preset
- `GET /api/presets` - Get presets
- `GET /api/health` - Health check

Each endpoint includes:
- Summary and description
- Request/response schemas
- Example values
- HTTP status codes
- Error responses

## How to Access

### Interactive Swagger UI
```
http://localhost:3000/api-docs
```

Features:
- Explore all endpoints
- View request/response schemas
- Try endpoints directly from the browser
- See real-time examples

### Raw OpenAPI Specification
```
http://localhost:3000/api-docs/json
```

Use this endpoint to:
- Download the OpenAPI spec
- Generate API clients (OpenAPI Generator, Swagger Codegen)
- Integrate with other tools
- Version control your API spec

### Health Check
```
http://localhost:3000/api/health
```

Returns: API status, timestamp, and uptime

## Testing the API

### Using Swagger UI
1. Navigate to `http://localhost:3000/api-docs`
2. Click on any endpoint
3. Click "Try it out"
4. Enter sample data
5. Click "Execute"

### Using curl
```bash
# Convert CSV to JSON
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "data": "name,age\nJohn,30\nJane,28",
    "sourceFormat": "csv",
    "targetFormat": "json"
  }'
```

## Documentation Features

### Complete Schema Documentation
- All request body schemas defined
- Response schemas with example values
- Error response schemas
- HTTP status code documentation

### Endpoint Coverage
All API endpoints are fully documented:
- Conversion endpoint
- Batch conversion endpoint
- Column extraction endpoint
- Preset management endpoints
- Health check endpoint

### Supported Formats Listed
All 17 supported formats are documented:
- CSV, JSON, XML, YAML, HTML
- Table, TSV, KML, TXT, Markdown
- JSONL, NDJSON, Lines, ICS, TOML
- Excel, SQL

## Files Modified

1. **backend/src/swagger/swaggerConfig.ts** (NEW)
   - Swagger specification configuration
   - 350+ lines of schema definitions

2. **backend/src/index.ts** (MODIFIED)
   - Added swagger-ui-express integration
   - Added Swagger endpoints
   - Updated root endpoint response

3. **backend/src/routes/index.ts** (MODIFIED)
   - Added JSDoc annotations to all endpoints
   - 80+ lines of documentation

4. **backend/package.json** (MODIFIED)
   - Added swagger-ui-express
   - Added swagger-jsdoc
   - Added TypeScript definitions

## Version Information

- **Version**: 1.2.1
- **Last Updated**: 2025-11-04
- **Status**: Production Ready ✅

## Next Steps

The API is now:
1. ✅ Fully documented with Swagger/OpenAPI
2. ✅ Interactive documentation available
3. ✅ Ready for client generation tools
4. ✅ Client-friendly for API integration

You can now:
- Share the API documentation at `/api-docs`
- Generate API clients using OpenAPI tools
- Integrate with API management platforms
- Use the spec for development and testing

## Troubleshooting

**Swagger UI not loading?**
```bash
# Check the backend is running
curl http://localhost:3000/

# View the spec directly
curl http://localhost:3000/api-docs/json
```

**Port 3000 already in use?**
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Start fresh
cd backend && npm run dev
```

**Missing types?**
```bash
# Reinstall types
npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc
```

---

For full API documentation, see `DOCUMENTATION.md` API Reference section.
