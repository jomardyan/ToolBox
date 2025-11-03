#!/bin/bash

echo "======================================"
echo "CSV Conversion Web App - Status Check"
echo "======================================"
echo ""

echo "📁 Backend Status:"
cd backend
if [ -f "dist/index.js" ]; then
    echo "✅ Backend compiled successfully"
else
    echo "⚠️  Backend not yet compiled"
fi

echo ""
echo "📁 Frontend Status:"
cd ../frontend
if [ -d "dist" ]; then
    echo "✅ Frontend built successfully"
else
    echo "⚠️  Frontend not yet built"
fi

echo ""
echo "======================================"
echo "🚀 Quick Start Commands"
echo "======================================"
echo ""
echo "Option 1: Using Docker Compose"
echo "  cd /workspaces/ToolBox"
echo "  docker-compose up"
echo ""
echo "Option 2: Manual Development"
echo "  Terminal 1 - Backend:"
echo "    cd /workspaces/ToolBox/backend"
echo "    npm run dev"
echo ""
echo "  Terminal 2 - Frontend:"
echo "    cd /workspaces/ToolBox/frontend"
echo "    npm run dev"
echo ""
echo "======================================"
echo "📍 Access Points"
echo "======================================"
echo "Backend API:  http://localhost:3000"
echo "Frontend UI:  http://localhost:5173"
echo ""
echo "======================================"
echo "📚 Documentation"
echo "======================================"
echo "- Main README: README.md"
echo "- Full Plan: documentation.md"
echo "- Summary: IMPLEMENTATION_SUMMARY.md"
echo ""
