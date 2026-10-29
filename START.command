#!/bin/bash
set -e
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  npm install
fi
echo ""
echo "  官网预览：  http://localhost:4173"
echo "  管理后台：  http://localhost:4173/admin"
echo ""
npm run dev
