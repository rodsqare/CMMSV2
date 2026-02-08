#!/bin/bash

# Script de instalación completa del proyecto
# Hospital Dr. Benigno Sánchez - Quillacollo

set -e

echo "================================================"
echo "Instalación del Sistema de Gestión de Equipos"
echo "Hospital Dr. Benigno Sánchez"
echo "================================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir títulos
print_section() {
    echo ""
    echo -e "${YELLOW}=== $1 ===${NC}"
    echo ""
}

# Función para imprimir éxito
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Función para imprimir error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Verificar requisitos
print_section "Verificando requisitos previos"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Descárgalo de https://nodejs.org/"
    exit 1
fi
print_success "Node.js $(node --version) encontrado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi
print_success "npm $(npm --version) encontrado"

# Verificar PHP
if ! command -v php &> /dev/null; then
    print_error "PHP no está instalado. Descárgalo de https://www.php.net/downloads.php"
    exit 1
fi
print_success "PHP $(php --version | head -n 1) encontrado"

# Verificar Composer
if ! command -v composer &> /dev/null; then
    print_error "Composer no está instalado. Descárgalo de https://getcomposer.org/"
    exit 1
fi
print_success "Composer encontrado"

# Verificar MySQL
if ! command -v mysql &> /dev/null; then
    print_error "MySQL no está instalado. Descárgalo de https://www.mysql.com/"
    exit 1
fi
print_success "MySQL encontrado"

# Instalar Frontend
print_section "Instalando Frontend (Next.js)"

if [ -f "package.json" ]; then
    print_success "Encontrado package.json"
    npm install
    print_success "Dependencias del frontend instaladas"
else
    print_error "No se encontró package.json en el directorio raíz"
    exit 1
fi

# Configurar Backend
print_section "Configurando Backend (Laravel)"

if [ -d "backend" ]; then
    cd backend
    
    # Copiar archivo .env
    if [ ! -f ".env" ]; then
        cp .env.example .env
        print_success "Archivo .env creado"
    else
        print_success "Archivo .env ya existe"
    fi
    
    # Instalar dependencias
    composer install
    print_success "Dependencias de composer instaladas"
    
    # Generar APP_KEY
    php artisan key:generate
    print_success "Clave de aplicación generada"
    
    # Preguntar por credenciales de MySQL
    echo ""
    read -p "Ingresa el nombre de usuario de MySQL (por defecto: root): " db_user
    db_user=${db_user:-root}
    
    read -sp "Ingresa la contraseña de MySQL: " db_password
    echo ""
    
    # Actualizar .env con credenciales
    sed -i "s/DB_USERNAME=.*/DB_USERNAME=$db_user/" .env
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$db_password/" .env
    
    print_success "Credenciales de MySQL configuradas"
    
    # Crear base de datos
    echo ""
    read -p "¿Deseas crear la base de datos? (s/n): " create_db
    if [ "$create_db" = "s" ]; then
        mysql -u "$db_user" -p"$db_password" -e "CREATE DATABASE IF NOT EXISTS hospital_mantenimiento;"
        print_success "Base de datos 'hospital_mantenimiento' creada"
    fi
    
    # Ejecutar migraciones
    php artisan migrate --force
    print_success "Migraciones ejecutadas"
    
    # Ejecutar seeders
    php artisan db:seed --force
    print_success "Datos de prueba cargados"
    
    cd ..
else
    print_error "No se encontró el directorio 'backend'"
    exit 1
fi

# Mostrar instrucciones finales
print_section "Instalación completada"

echo -e "${GREEN}El sistema ha sido instalado exitosamente.${NC}"
echo ""
echo "Para iniciar la aplicación:"
echo ""
echo -e "${YELLOW}Terminal 1 - Frontend:${NC}"
echo "  npm run dev"
echo "  Disponible en: http://localhost:3000"
echo ""
echo -e "${YELLOW}Terminal 2 - Backend:${NC}"
echo "  cd backend"
echo "  php artisan serve"
echo "  Disponible en: http://localhost:8000"
echo ""
echo -e "${GREEN}Usuarios de prueba disponibles en el login.${NC}"
echo ""
