#!/bin/bash

# Script de instalación rápida para el Backend Laravel
# Hospital Dr. Benigno Sánchez - Quillacollo

echo "🚀 Instalando Backend Laravel..."

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

# Verificar directorio
if [ ! -f "artisan" ]; then
    print_error "Error: Este script debe ejecutarse desde el directorio backend/"
    exit 1
fi

# Paso 1: Instalar dependencias
print_info "Instalando dependencias de Composer..."
composer install --no-interaction
if [ $? -eq 0 ]; then
    print_success "Dependencias instaladas"
else
    print_error "Error instalando dependencias"
    exit 1
fi

# Paso 2: Copiar .env
if [ ! -f ".env" ]; then
    print_info "Copiando archivo .env..."
    cp .env.example .env
    print_success "Archivo .env creado"
else
    print_info "Archivo .env ya existe"
fi

# Paso 3: Generar clave
print_info "Generando clave de aplicación..."
php artisan key:generate --no-interaction
print_success "Clave generada"

# Paso 4: Configurar base de datos
print_info "Configuración de base de datos"
read -p "Nombre de la base de datos [hospital_mantenimiento]: " DB_NAME
DB_NAME=${DB_NAME:-hospital_mantenimiento}

read -p "Usuario de MySQL [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Contraseña de MySQL: " DB_PASS
echo ""

# Actualizar .env
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/DB_DATABASE=.*/DB_DATABASE=$DB_NAME/" .env
    sed -i '' "s/DB_USERNAME=.*/DB_USERNAME=$DB_USER/" .env
    sed -i '' "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASS/" .env
else
    # Linux
    sed -i "s/DB_DATABASE=.*/DB_DATABASE=$DB_NAME/" .env
    sed -i "s/DB_USERNAME=.*/DB_USERNAME=$DB_USER/" .env
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASS/" .env
fi

print_success "Configuración actualizada"

# Paso 5: Crear base de datos
print_info "Creando base de datos..."
mysql -u"$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
if [ $? -eq 0 ]; then
    print_success "Base de datos creada"
else
    print_error "Error creando base de datos. Verifica credenciales."
    exit 1
fi

# Paso 6: Ejecutar migraciones
print_info "Ejecutando migraciones..."
php artisan migrate --no-interaction
if [ $? -eq 0 ]; then
    print_success "Migraciones ejecutadas"
else
    print_error "Error en migraciones"
    exit 1
fi

# Paso 7: Seeders
read -p "¿Deseas cargar datos de prueba? (s/n) [s]: " LOAD_SEEDS
LOAD_SEEDS=${LOAD_SEEDS:-s}

if [ "$LOAD_SEEDS" = "s" ] || [ "$LOAD_SEEDS" = "S" ]; then
    print_info "Cargando datos de prueba..."
    php artisan db:seed --no-interaction
    print_success "Datos de prueba cargados"
fi

# Paso 8: Limpiar caché
print_info "Limpiando caché..."
php artisan config:clear
php artisan cache:clear
print_success "Caché limpiado"

# Mensaje final
echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 Backend instalado correctamente${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Para iniciar el servidor:"
echo -e "${BLUE}php artisan serve${NC}"
echo ""
echo "API disponible en: ${BLUE}http://localhost:8000${NC}"
echo ""
