#!/bin/bash

# Script to set GitHub Codespaces ports to public
# Run this if you're getting Network Error or CORS issues

echo "Setting GitHub Codespaces ports to PUBLIC..."
echo ""
echo "⚠️  IMPORTANT: This must be done in VS Code UI"
echo ""
echo "Steps to fix the Network Error:"
echo ""
echo "1. Look at the bottom of VS Code"
echo "2. Click on the 'PORTS' tab (next to TERMINAL)"
echo "3. Find port 3000 (Backend API)"
echo "4. Right-click → 'Port Visibility' → Select 'Public'"
echo "5. Find port 5173 (Frontend)"
echo "6. Right-click → 'Port Visibility' → Select 'Public'"
echo ""
echo "OR:"
echo ""
echo "1. In the PORTS tab"
echo "2. Click the 🔒 lock icon next to each port"
echo "3. Change it to 🌐 (public)"
echo ""
echo "After changing to public, refresh your frontend page!"
echo ""
echo "Current port status:"
gh codespace ports 2>/dev/null || echo "  (GitHub CLI not available)"
