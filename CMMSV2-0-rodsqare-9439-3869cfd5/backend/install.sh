#!/bin/bash

# Script de instalación del backend
# Hospital Dr. Benigno Sánchez - Quillacollo

set -e

echo "================================================"
echo "Instalación del Backend - Laravel"
echo "Hospital Dr. Benigno Sánchez"
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_section() {
    echo ""
    echo -e "${YELLOW}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "composer.json" ]; then
    echo -e "${RED}Error: composer.json no encontrado. Ejecuta este script desde el directorio backend.${NC}"
    exit 1
fi

print_section "Instalando dependencias"
composer install
print_success "Dependencias instaladas"

print_section "Configurando aplicación"

# Copiar .env si no existe
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_success "Archivo .env creado"
fi

# Generar clave
php artisan key:generate
print_success "Clave de aplicación generada"

print_section "Configurando base de datos"

read -p "Host MySQL (127.0.0.1): " db_host
db_host=${db_host:-127.0.0.1}

read -p "Puerto MySQL (3306): " db_port
db_port=${db_port:-3306}

read -p "Base de datos (hospital_mantenimiento): " db_name
db_name=${db_name:-hospital_mantenimiento}

read -p "Usuario MySQL (root): " db_user
db_user=${db_user:-root}

read -sp "Contraseña MySQL: " db_password
echo ""

# Actualizar .env
sed -i "s/DB_HOST=.*/DB_HOST=$db_host/" .env
sed -i "s/DB_PORT=.*/DB_PORT=$db_port/" .env
sed -i "s/DB_DATABASE=.*/DB_DATABASE=$db_name/" .env
sed -i "s/DB_USERNAME=.*/DB_USERNAME=$db_user/" .env
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$db_password/" .env

print_success "Configuración de base de datos actualizada"

# Crear base de datos
echo ""
read -p "¿Crear la base de datos $db_name? (s/n): " create_db
if [ "$create_db" = "s" ]; then
    mysql -h "$db_host" -u "$db_user" -p"$db_password" -e "CREATE DATABASE IF NOT EXISTS $db_name;" 2>/dev/null || \
    mysql -h "$db_host" -u "$db_user" -e "CREATE DATABASE IF NOT EXISTS $db_name;"
    print_success "Base de datos creada"
fi

print_section "Ejecutando migraciones"
php artisan migrate --force
print_success "Migraciones completadas"

print_section "Cargando datos de prueba"
php artisan db:seed --force
print_success "Datos de prueba cargados"

print_section "Instalación completada"

echo ""
echo -e "${GREEN}El backend ha sido configurado exitosamente.${NC}"
echo ""
echo "Para iniciar el servidor:"
echo -e "${YELLOW}php artisan serve${NC}"
echo ""
echo "El backend estará disponible en: http://localhost:8000"
echo ""
