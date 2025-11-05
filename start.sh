#!/bin/bash

# This script has been deprecated in favor of the unified dev.sh
# Redirecting to dev.sh...

echo "⚠️  This script is deprecated. Use dev.sh instead."
echo ""
echo "Starting development environment..."
echo ""

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Execute the main dev script
exec "$SCRIPT_DIR/dev.sh" "$@"
