#!/bin/bash

# This script has been integrated into dev.sh
# The new dev.sh automatically configures Codespaces ports

echo "⚠️  This script is no longer needed!"
echo ""
echo "The dev.sh script now automatically:"
echo "  • Detects GitHub Codespaces environment"
echo "  • Configures port visibility"
echo "  • Sets up correct URLs for frontend/backend"
echo ""
echo "Just run: bash dev.sh"
echo ""
echo "If you still have port issues, you can manually set ports:"
echo ""
echo "1. Open VS Code PORTS tab (bottom panel)"
echo "2. Find ports 3000 and 5173"
echo "3. Right-click each → Port Visibility → Public"
echo ""
echo "Or use GitHub CLI:"
echo "  gh codespace ports visibility 3000:public"
echo "  gh codespace ports visibility 5173:public"
echo ""

if command -v gh >/dev/null 2>&1; then
    echo "Current port status:"
    gh codespace ports 2>/dev/null || echo "  (Not in a Codespace)"
fi
