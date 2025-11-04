# ToolBox - Universal File Format Converter

A modern, production-ready **SaaS application** that converts files between 20+ formats with a beautiful, responsive UI. **Free public converter** + optional premium dashboard.

> 📚 **For Complete Documentation:** See [MASTER_DOCUMENTATION.md](./MASTER_DOCUMENTATION.md)

## Features

✨ **Format Support**
- CSV ↔ JSON, XML, YAML, HTML, TSV, KML, TXT
- Bidirectional conversions for all formats
- Column extraction and filtering

🎨 **User Experience**
- Drag-and-drop file upload
- Dark/Light mode theme switcher
- Copy-to-clipboard functionality
- Download converted files
- Conversion history tracking
- Responsive design (mobile-friendly)

⚡ **Performance**
- Sub-2 second conversions
- Optimized data processing

## Quick Start

### Docker Compose (Recommended)
```bash
docker-compose up
```

Backend: http://localhost:3000
Frontend: http://localhost:5173

### Manual Setup

**Backend:**
```bash
cd backend && npm install && npm run dev
```

**Frontend:**
```bash
cd frontend && npm install && npm run dev
```

## Project Structure

```
.
├── backend/              # Express.js TypeScript API
├── frontend/             # React + Vite + TypeScript
├── docker-compose.yml
└── documentation.md      # Full implementation plan
```

## Tech Stack

- **Backend**: Node.js 20+ with Express.js & TypeScript
- **Frontend**: React 18+ with Vite & TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand

## Features Implemented

- [x] CSV ↔ JSON, XML, YAML, HTML, TSV, KML, TXT conversions
- [x] Drag-and-drop file upload
- [x] Dark/Light mode
- [x] Copy-to-clipboard
- [x] Download results
- [x] Conversion history
- [x] Responsive UI

## Next Steps

1. Add database for persistent history
2. Implement user authentication
3. Add unit/E2E tests
4. GitHub Actions CI/CD
5. Deploy to DigitalOcean

See [documentation.md](documentation.md) for full implementation plan.

## License

MIT