#!/bin/bash

echo "🧹 Limpiando proyecto Next.js..."

# Eliminar node_modules y lockfiles
rm -rf node_modules
rm -f package-lock.json
rm -f pnpm-lock.yaml
rm -f yarn.lock

# Eliminar cache de Next.js
rm -rf .next

echo "📦 Instalando dependencias..."
npm install

echo "✅ Limpieza completada. Ahora ejecuta: npm run dev"
