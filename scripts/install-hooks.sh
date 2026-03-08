#!/usr/bin/env bash
#
# install-hooks.sh — install git hooks for this repo
#
# Run once after cloning (or any time hooks are updated):
#   bash scripts/install-hooks.sh
#
# What it does:
#   - Symlinks scripts/pre-commit → .git/hooks/pre-commit
#   - Checks if gitleaks is available and prints install hint if not

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"
SCRIPT="$REPO_ROOT/scripts/pre-commit"

if [[ ! -f "$SCRIPT" ]]; then
  echo "❌ scripts/pre-commit not found. Run from repo root."
  exit 1
fi

chmod +x "$SCRIPT"

# Symlink (overwrite if stale)
ln -sf "$SCRIPT" "$HOOKS_DIR/pre-commit"

echo "✅ pre-commit hook installed → .git/hooks/pre-commit"

# Check gitleaks
if command -v gitleaks &>/dev/null; then
  echo "✅ gitleaks $(gitleaks version 2>/dev/null || echo 'installed') — full secret scanning active"
else
  echo ""
  echo "⚠  gitleaks not found. The hook will use a grep fallback with limited coverage."
  echo "   Install gitleaks for best protection:"
  echo ""
  echo "   macOS:   brew install gitleaks"
  echo "   Linux:   https://github.com/gitleaks/gitleaks/releases"
  echo "            or: sudo apt install gitleaks  (if available)"
  echo "   WSL2:    download the linux binary from releases, place in /usr/local/bin/"
  echo ""
fi

echo ""
echo "The hook blocks commits containing API keys, tokens, and credentials."
echo "To bypass in a genuine emergency: git commit --no-verify"
echo "(This should almost never be needed — secrets don't belong in code.)"
