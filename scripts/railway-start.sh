#!/bin/bash
set -e

echo "🚀 Starting Railway deployment..."

# Verificar que DATABASE_URL esté configurada
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL no está configurada"
  exit 1
fi

echo "✅ DATABASE_URL configurada"

# Generar cliente Prisma
echo "⚙️  Generando cliente Prisma..."
npx prisma generate

# Crear/actualizar todas las tablas automáticamente
echo "📦 Creando/actualizando tablas en la base de datos..."
npx prisma db push --accept-data-loss --skip-generate

# Verificar si las tablas están vacías y ejecutar seed
echo "🔍 Verificando si necesita seed inicial..."
USUARIO_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM usuarios;" 2>/dev/null || echo "0")

if [ "$USUARIO_COUNT" = "0" ] || [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Ejecutando seed de base de datos (usuarios de prueba)..."
  npm run db:seed || echo "⚠️  Seed falló, continuando de todas formas..."
else
  echo "✅ Base de datos ya tiene datos, omitiendo seed"
fi

echo "🎉 Deployment exitoso, iniciando servidor..."
npm run start
