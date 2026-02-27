#!/usr/bin/env bash
set -euo pipefail

# Antfarm installer
# Usage: curl -fsSL https://raw.githubusercontent.com/snarktank/antfarm/v0.5.1/scripts/install.sh | bash

REPO="https://github.com/snarktank/antfarm.git"
DEST="${HOME}/.openclaw/workspace/antfarm"

echo "Installing Antfarm..."

# Clone or pull
if [ -d "$DEST/.git" ]; then
  echo "Updating existing install..."
  git -C "$DEST" pull --ff-only origin main
else
  echo "Cloning repository..."
  git clone "$REPO" "$DEST"
fi

cd "$DEST"

# Build
echo "Installing dependencies..."
if command -v pnpm &>/dev/null; then
  pnpm install --frozen-lockfile
else
  echo "pnpm not found — installing via corepack..."
  corepack enable && corepack prepare pnpm@latest --activate
  pnpm install --frozen-lockfile
fi

echo "Building..."
pnpm run build

# Link CLI globally
echo "Linking CLI..."
pnpm link --global

# Install workflows — use linked CLI or fall back to direct node
ANTFARM="$(command -v antfarm 2>/dev/null || echo "")"
if [ -z "$ANTFARM" ]; then
  ANTFARM="node $DEST/dist/cli/cli.js"
fi

echo "Installing workflows..."
$ANTFARM install

echo ""
echo "Antfarm installed! Run 'antfarm workflow list' to see available workflows."
