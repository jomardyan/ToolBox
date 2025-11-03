# CSV Converter - Complete Documentation

**Last Updated**: November 3, 2025  
**Status**: Production Ready ✅  
**Current Version**: 1.0.0

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Overview](#project-overview)
3. [Features](#features)
4. [Architecture](#architecture)
5. [Technology Stack](#technology-stack)
6. [Installation](#installation)
7. [Development Setup](#development-setup)
8. [API Reference](#api-reference)
9. [Frontend Components](#frontend-components)
10. [Backend Utilities](#backend-utilities)
11. [Security](#security)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [Troubleshooting](#troubleshooting)
15. [Project Status](#project-status)

---

## Quick Start

### Docker (Recommended)
```bash
docker-compose up
```

Access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

### Local Development

**Start both backend and frontend**:
```bash
npm run dev:all
```

**Or start individually**:
```bash
# Terminal 1 - Backend
cd backend && npm install && npm run dev

# Terminal 2 - Frontend
cd frontend && npm install && npm run dev
```

---

## Project Overview

CSV Converter is a modern, production-ready web application that provides bidirectional conversion between CSV and multiple data formats. It features a beautiful React UI, comprehensive REST API, and production-grade security and error handling.

### Key Capabilities

- **8+ Format Conversions**: CSV ↔ JSON, XML, YAML, HTML, TSV, KML, TXT, SQL
- **Batch Processing**: Convert up to 100 files simultaneously
- **Conversion Presets**: Save and reuse conversion configurations
- **Column Extraction**: Filter and extract specific columns from CSV
- **Conversion History**: Track all conversions with timestamps and results
- **Dark/Light Mode**: Themeable UI with user preference persistence
- **Rate Limiting**: API protection with configurable rate limits
- **Input Validation**: Comprehensive validation for all inputs
- **Error Recovery**: Graceful error handling with user-friendly messages

---

## Features

### ✨ Format Support

| Source | Targets | Type |
|--------|---------|------|
| CSV | JSON, XML, YAML, HTML, TSV, KML, TXT, SQL | Bidirectional |
| JSON | CSV, XML, YAML | Bidirectional |
| XML | CSV, JSON, YAML | Bidirectional |
| YAML | CSV, JSON, XML | Bidirectional |
| All | And reverse conversions | Supported |

### 🎨 User Experience

- **Drag-and-drop** file upload with visual feedback
- **Real-time** conversion preview
- **One-click** copy to clipboard
- **Direct** file download
- **Dark/Light mode** toggle with persistence
- **Responsive design** (mobile, tablet, desktop)
- **Conversion history** with details
- **Batch processing** for multiple files

### ⚡ Performance

- Sub-2 second conversions for most files
- Optimized streaming for large files
- Efficient memory usage
- Gzipped responses

### 🔒 Security

- Rate limiting (100 req/15 min per IP)
- File size validation (max 10MB)
- File type validation
- Input sanitization
- CORS protection
- Request logging

---

## Architecture

### System Overview

```
┌─────────────────┐
│   React UI      │
│   (Vite)        │
│  • Components   │
│  • Pages        │
│  • State (Zustand)
└────────┬────────┘
         │ HTTP/JSON
         ↓
┌─────────────────────────────┐
│   Express.js Backend        │
│   • API Routes              │
│   • Conversion Services     │
│   • File Processing         │
│   • Validation              │
│   • Error Handling          │
└────────┬────────────────────┘
         │
    ┌────┴─────┬──────────┬─────────┐
    ↓          ↓          ↓         ↓
  CSV→JSON   CSV→XML   CSV→YAML   CSV→HTML
  and more reverse conversions
```

### Directory Structure

```
.
├── backend/
│   ├── src/
│   │   ├── converters/      # Format conversion services
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Utility functions (150+ functions)
│   │   ├── types/           # TypeScript interfaces
│   │   └── server.ts        # Express app setup
│   ├── tests/               # Unit tests (25+ test cases)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── stores/         # Zustand stores
│   │   ├── types/          # TypeScript types
│   │   └── main.tsx        # Entry point
│   ├── index.html          # HTML template
│   └── package.json
│
├── docker-compose.yml      # Local dev containers
├── Dockerfile.backend.dev  # Backend dev image
├── Dockerfile.frontend.dev # Frontend dev image
└── DOCUMENTATION.md        # This file
```

---

## Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.0+
- **Data Processing**: 
  - PapaParse (CSV)
  - xml2js (XML)
  - js-yaml (YAML)
  - ExcelJS (Excel)
  - jsdom (HTML)
- **Testing**: Jest
- **Utilities**: 
  - express-rate-limit (Rate limiting)
  - multer (File upload)
  - dotenv (Environment variables)

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Language**: TypeScript 5.0+
- **Styling**: Bootstrap 5.3.3 (CSS)
- **UI Components**: Bootstrap utilities
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Dark Mode**: CSS custom properties + localStorage

### DevOps
- **Containerization**: Docker & Docker Compose
- **Development**: nodemon + ts-node for backend, Vite dev server for frontend

---

## Installation

### Prerequisites
- Node.js 20 or higher
- npm or yarn
- Docker and Docker Compose (optional, for containerized setup)

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ToolBox
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Configure environment variables** (optional)
   ```bash
   # backend/.env
   PORT=3000
   NODE_ENV=development
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX=100
   ```

---

## Development Setup

### Option 1: Using Development Script (Recommended)

```bash
npm run dev:all
```

This script:
- Installs dependencies if needed
- Kills any existing processes on ports 3000 and 5173
- Starts both backend and frontend
- Shows real-time logs

**Requirements**: Node.js, npm

### Option 2: Docker Compose

```bash
docker-compose up --build
```

**Requirements**: Docker, Docker Compose

### Option 3: Manual Setup

**Terminal 1 - Backend**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend**
```bash
cd frontend
npm install
npm run dev
```

### Running Tests

```bash
cd backend
npm test
```

Expected output: 25/25 tests passing ✓

### Building for Production

**Backend**
```bash
cd backend
npm run build
```

**Frontend**
```bash
cd frontend
npm run build
```

---

## API Reference

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### 1. Convert CSV to JSON
```http
POST /api/convert/csv-to-json
Content-Type: multipart/form-data

Body: 
  file: (CSV file)
  delimiter: (optional, default: ',')
```

**Response**:
```json
{
  "success": true,
  "data": {
    "result": [{"field1": "value1", "field2": "value2"}],
    "inputSize": 125,
    "outputSize": 256,
    "executionTime": 45
  }
}
```

#### 2. Convert CSV to XML
```http
POST /api/convert/csv-to-xml
```

**Response**:
```json
{
  "success": true,
  "data": {
    "result": "<root><row>...</row></root>",
    "executionTime": 32
  }
}
```

#### 3. Convert CSV to YAML
```http
POST /api/convert/csv-to-yaml
```

#### 4. Convert CSV to HTML
```http
POST /api/convert/csv-to-html
```

#### 5. Extract CSV Columns
```http
POST /api/extract/csv-columns
Content-Type: multipart/form-data

Body:
  file: (CSV file)
  columns: (JSON array of column names)
  includeHeader: (boolean, default: true)
```

**Response**:
```json
{
  "success": true,
  "data": {
    "result": [["col1", "col2"], ["val1", "val2"]],
    "columnCount": 2,
    "rowCount": 10
  }
}
```

#### 6. Batch Convert
```http
POST /api/batch/convert
Content-Type: multipart/form-data

Body:
  files: (multiple CSV files)
  targetFormat: (JSON|XML|YAML|HTML|TSV|KML|TXT|SQL)
```

**Response**:
```json
{
  "success": true,
  "data": {
    "results": [
      {"file": "file1.csv", "status": "success", "outputSize": 256},
      {"file": "file2.csv", "status": "success", "outputSize": 512}
    ],
    "totalProcessed": 2,
    "totalFailed": 0
  }
}
```

#### 7. Get Presets
```http
GET /api/presets
```

**Response**:
```json
{
  "success": true,
  "data": {
    "presets": [
      {"id": "1", "name": "CSV to JSON", "sourceFormat": "CSV", "targetFormat": "JSON"}
    ],
    "count": 1
  }
}
```

### Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {"field": "email"}
  },
  "timestamp": "2025-11-03T10:30:00.000Z"
}
```

**HTTP Status Codes**:
- 200: Success
- 400: Bad Request (validation error)
- 404: Not Found
- 429: Too Many Requests (rate limit)
- 500: Server Error

---

## Frontend Components

### Page Structure

#### Home Page (`HomePage.tsx`)
- Main interface for conversions
- Format selector
- File upload area
- Conversion results display
- Download button

#### History Page (`HistoryPage.tsx`)
- List of recent conversions
- Timestamps and format pairs
- Status indicators (success/failed)
- Conversion details

#### Advanced Features Page (`AdvancedFeaturesPage.tsx`)
- Batch processing
- Column extraction
- Presets management
- Advanced options

#### Settings Page (`SettingsPage.tsx`)
- Theme selection (dark/light)
- Rate limit settings
- API configuration
- Reset options

### Key Components

**FileUpload.tsx**
- Drag-and-drop zone
- File validation
- Upload progress
- Error display

**FormatSelector.tsx**
- Format buttons
- Source/target selection
- Format validation

**ConversionResults.tsx**
- Result display
- Copy to clipboard
- Download file
- Error messages

**ThemeSwitcher.tsx**
- Dark/light mode toggle
- Automatic persistence
- System preference detection

---

## Backend Utilities

### Available Utilities (150+ functions)

#### Authentication (`authUtils.ts`)
- Password hashing and validation
- Email validation
- API key generation
- Session management
- JWT token helpers

#### File Handling (`fileUtils.ts`)
- File metadata extraction
- CSV validation
- Safe file operations
- Directory scanning
- Streaming file reading

#### Data Validation (`validationUtils.ts`)
- Email, URL, phone validation
- Date and numeric validation
- CSV format validation
- Generic validation rule engine
- Input sanitization

#### Error Handling (`errorUtils.ts`)
- 12 error types with HTTP status codes
- Logger with multiple levels
- Error tracking
- Retry logic
- Circuit breaker pattern

#### Helpers (`helperUtils.ts`)
- Object manipulation (merge, pick, omit)
- Array operations (group, flatten, unique)
- String case conversion
- CSV line parsing
- UUID generation

#### Advanced Processing (`advancedUtils.ts`)
- Header normalization
- Delimiter auto-detection
- Column type detection
- Data transformation
- Merge, split, sample, paginate

#### Database Support (`databaseUtils.ts`)
- Record interfaces
- Statistics calculation
- Data export
- PostgreSQL migrations

---

## Security

### Implemented Protections

1. **Rate Limiting**
   - 100 requests per 15 minutes per IP
   - Returns 429 status when exceeded
   - Tracked via express-rate-limit

2. **File Validation**
   - Maximum file size: 10 MB
   - Allowed types: CSV, JSON, XML, YAML, XLSX
   - Extension validation
   - Content type checking

3. **Input Sanitization**
   - Remove null bytes
   - Escape special characters
   - Validate delimiter
   - Check encoding

4. **CORS Protection**
   - Restricted origins
   - Allowed methods: GET, POST, OPTIONS
   - Credentials support

5. **Error Logging**
   - All errors logged with context
   - Error tracking for monitoring
   - Stack traces (development only)

### Best Practices

- Use HTTPS in production
- Set environment variables for sensitive data
- Regularly update dependencies
- Monitor error logs
- Use strong passwords for any authentication
- Implement database encryption at rest

---

## Testing

### Running Tests

```bash
cd backend
npm test
```

### Test Coverage

- **Total Tests**: 25+
- **Coverage**: 56%
- **Passing**: 100% ✅

### Test Areas

- Converter functions (CSV ↔ JSON, XML, YAML, etc.)
- Validation utilities
- Error handling
- File operations
- Data transformations

### Adding New Tests

```typescript
import { csvToJson } from '../src/converters/csv-to-json';

describe('CSV to JSON', () => {
  it('should convert CSV to JSON', () => {
    const csv = 'name,age\nJohn,30\nAlice,25';
    const result = csvToJson(csv);
    
    expect(result).toEqual([
      { name: 'John', age: '30' },
      { name: 'Alice', age: '25' }
    ]);
  });
});
```

---

## Deployment

### Using Docker

1. **Build images**
   ```bash
   docker-compose build
   ```

2. **Run containers**
   ```bash
   docker-compose up -d
   ```

3. **View logs**
   ```bash
   docker-compose logs -f
   ```

### Deployment Options

#### Option 1: DigitalOcean App Platform
1. Connect GitHub repository
2. Set environment variables
3. Configure build and run commands
4. Deploy

#### Option 2: DigitalOcean Droplet
1. Create Ubuntu 22.04+ droplet
2. Install Docker and Docker Compose
3. Clone repository
4. Configure domain and SSL
5. Run `docker-compose up -d`

#### Option 3: Traditional VPS
1. Install Node.js 20+
2. Install dependencies
3. Configure nginx as reverse proxy
4. Use PM2 for process management
5. Set up SSL with Let's Encrypt

### Environment Variables

```bash
# Backend
PORT=3000
NODE_ENV=production
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Frontend
VITE_API_URL=https://api.example.com
```

---

## Troubleshooting

### Backend won't start

**Error**: `Port 3000 already in use`
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
npm run dev
```

**Error**: `Module not found`
```bash
cd backend
npm install
npm run build
npm run dev
```

### Frontend won't load

**Error**: `ECONNREFUSED` (can't reach API)
- Ensure backend is running on http://localhost:3000
- Check CORS configuration
- Check firewall rules

**Error**: `Vite dev server not responding`
```bash
cd frontend
npm install
npm run dev
```

### Tests failing

```bash
cd backend
npm test -- --verbose
npm test -- --coverage
```

### File upload issues

- Check file size (max 10MB)
- Verify file format (CSV, JSON, XML, YAML, XLSX)
- Check browser console for errors
- Ensure backend is accepting uploads

### Conversion errors

- Validate input format
- Check delimiter is correct
- Ensure headers are present
- Check for special characters
- Review error message in UI

---

## Project Status

### Completed ✅

**Core Implementation (Todos 1-9): 100%**
- Project setup and initialization
- Express.js backend with TypeScript
- Core data processing libraries
- Conversion service layer
- REST API endpoints
- React frontend scaffold
- UI components
- Main pages and routing
- File upload and conversion workflow

**Advanced Features (Todos 10-13): 100%**
- Advanced features (batch + presets)
- Security and validation
- Unit tests (25+ passing)
- Docker containerization

### In Progress / Next Steps ⏳

**Todos 11, 15-18: Optional Enhancements**
- Database integration (PostgreSQL)
- GitHub Actions CI/CD pipeline
- API documentation (Swagger)
- E2E tests and optimization

### Current Capabilities

- 8+ format conversions
- Bidirectional support
- Batch processing (100 files)
- Conversion presets
- Column extraction
- Rate limiting
- Input validation
- Conversion history
- Dark/light mode UI
- Responsive design
- 25+ passing tests
- Docker support

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev:all                    # Start both backend and frontend
cd backend && npm run dev         # Backend only
cd frontend && npm run dev        # Frontend only

# Testing
cd backend && npm test            # Run all tests
cd backend && npm test -- --watch # Watch mode

# Building
npm run build                     # Build all
cd backend && npm run build       # Backend build
cd frontend && npm run build      # Frontend build

# Docker
docker-compose up                # Start services
docker-compose down              # Stop services
docker-compose logs -f           # View logs
```

### File Locations

| Resource | Location |
|----------|----------|
| Backend API | src/server.ts |
| Routes | backend/src/routes/ |
| Converters | backend/src/converters/ |
| Frontend | frontend/src/ |
| Components | frontend/src/components/ |
| Pages | frontend/src/pages/ |
| Utilities | backend/src/utils/ |
| Tests | backend/tests/ |
| Docker Config | docker-compose.yml |

---

## Support & Contributing

For issues, questions, or feature requests, please refer to the relevant documentation files or contact the development team.

### Documentation Files

- `UTILITIES_REFERENCE.md` - Complete utility function reference
- `UTILITIES_QUICKSTART.md` - Utility usage examples
- `BUILD_STATUS.md` - Current build status
- `.github/workflows/` - CI/CD configuration (when added)

---

## License

MIT License - See LICENSE file for details

---

**Last Updated**: November 3, 2025  
**Status**: Production Ready ✅  
**Version**: 1.0.0
