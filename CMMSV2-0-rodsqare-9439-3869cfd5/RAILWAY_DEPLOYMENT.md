# Guía de Despliegue en Railway

Esta guía te ayudará a desplegar tu aplicación CMMS Biomédico en Railway con una base de datos MySQL.

## Prerequisitos

- Cuenta en [Railway](https://railway.app)
- Código del proyecto en un repositorio Git (GitHub, GitLab, etc.)

## Paso 1: Crear un Nuevo Proyecto en Railway

1. Ve a [Railway.app](https://railway.app) e inicia sesión
2. Haz clic en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway para acceder a tu repositorio
5. Selecciona el repositorio de tu proyecto

## Paso 2: Agregar Base de Datos MySQL

1. En tu proyecto de Railway, haz clic en "+ New"
2. Selecciona "Database" → "Add MySQL"
3. Railway creará automáticamente una base de datos MySQL
4. Espera a que la base de datos esté lista (verás un ícono verde)

## Paso 3: Conectar la Base de Datos a tu Aplicación

Railway genera automáticamente variables de entorno para la conexión. Necesitas configurar:

1. Haz clic en tu servicio Next.js
2. Ve a la pestaña "Variables"
3. Agrega las siguientes variables de entorno:

### Variables Requeridas:

```bash
# Railway proporciona automáticamente MYSQL_URL
# Cópiala y úsala como DATABASE_URL
DATABASE_URL=${{MySQL.DATABASE_URL}}

# JWT Secret (genera una clave segura)
JWT_SECRET=tu-secreto-super-seguro-de-al-menos-32-caracteres

# Opcional: Forzar seed incluso si ya hay datos (déjalo en false normalmente)
# El seed se ejecuta automáticamente si la base de datos está vacía
RUN_SEED=false
```

### Generar JWT_SECRET

Puedes generar un JWT_SECRET seguro con:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O usa un generador online como [RandomKeygen](https://randomkeygen.com/)

## Paso 4: Configurar el Dominio (Opcional)

1. En tu servicio Next.js, ve a "Settings" → "Networking"
2. Railway generará automáticamente un dominio público
3. También puedes agregar tu dominio personalizado aquí

## Paso 5: Desplegar

1. Railway detectará automáticamente el `railway.json` y `nixpacks.toml`
2. El primer despliegue se iniciará automáticamente
3. Puedes ver los logs en tiempo real en la pestaña "Deployments"

### El proceso de despliegue hará automáticamente:

- Instalar dependencias (`npm ci`)
- Generar cliente Prisma (`npx prisma generate`)
- Compilar Next.js (`npm run build`)
- **Crear TODAS las tablas automáticamente** en MySQL (`npx prisma db push`)
- Poblar la base de datos con usuarios de prueba (si está vacía o `RUN_SEED=true`)
- Iniciar la aplicación

**No necesitas ejecutar scripts SQL manualmente**, Railway creará todas las tablas al desplegar.

## Paso 6: Verificar el Despliegue

1. Una vez completado, accede a tu URL de Railway
2. Ve a `/api/health` para verificar que la API y la base de datos funcionen
3. Deberías ver: `{"status":"healthy","timestamp":"...","database":"connected"}`

## Paso 7: Primer Login

La primera vez que se despliega, el sistema detecta automáticamente que la base de datos está vacía y crea usuarios de prueba:

**Admin:**
- Email: `admin@hospital.com`
- Password: `admin123`

**Técnico:**
- Email: `tecnico@hospital.com`
- Password: `tecnico123`

**IMPORTANTE:** Cambia estas contraseñas inmediatamente después del primer login en producción.

## Comandos Útiles

### Ver Logs en Tiempo Real
```bash
# Desde tu proyecto en Railway, ve a Deployments → View Logs
```

### Acceder a la Base de Datos
```bash
# En la pestaña de MySQL, haz clic en "Connect" para obtener credenciales
# Puedes conectarte con cualquier cliente MySQL como MySQL Workbench o DBeaver
```

### Ejecutar Migraciones Manualmente
```bash
# Si necesitas ejecutar migraciones después del despliegue:
# 1. Conéctate a Railway CLI: railway login
# 2. Vincula tu proyecto: railway link
# 3. Ejecuta: railway run npx prisma db push
```

## Estructura de Variables de Entorno en Railway

Railway proporciona estas variables automáticamente desde MySQL:

- `MYSQL_URL`: URL de conexión completa
- `MYSQLHOST`: Host de la base de datos
- `MYSQLPORT`: Puerto (generalmente 3306)
- `MYSQLDATABASE`: Nombre de la base de datos
- `MYSQLUSER`: Usuario
- `MYSQLPASSWORD`: Contraseña

Usa `DATABASE_URL=${{MySQL.DATABASE_URL}}` para referenciar la URL de MySQL.

## Solución de Problemas

### Error: "Cannot connect to database"
- Verifica que `DATABASE_URL` esté configurada correctamente
- Asegúrate de que el servicio MySQL esté funcionando (ícono verde)
- Revisa los logs en Railway para más detalles

### Error: "Prisma Client not found"
- El build debería ejecutar `npx prisma generate` automáticamente
- Si persiste, verifica que `nixpacks.toml` esté en la raíz del proyecto

### Error: "JWT_SECRET is not defined"
- Asegúrate de haber agregado `JWT_SECRET` en las variables de entorno
- El valor debe tener al menos 32 caracteres

### Tabla no existe
- Asegúrate de que `prisma db push` se ejecute en el script de inicio
- Revisa los logs de despliegue para ver si hubo errores en la migración

## Actualizaciones Automáticas

Railway está configurado para redesplegar automáticamente cuando:
- Haces push a la rama principal de tu repositorio
- Cambias variables de entorno
- Actualizas la configuración del servicio

## Monitoreo

Railway proporciona métricas básicas:
- CPU y Memoria en la pestaña "Metrics"
- Logs en tiempo real en "Deployments"
- Health checks automáticos en `/api/health`

## Costos

Railway ofrece:
- $5 USD de crédito gratis mensual
- Plan Hobby: $5/mes por servicio después del crédito gratuito
- Plan Pro: Desde $20/mes con más recursos

Verifica los precios actuales en [railway.app/pricing](https://railway.app/pricing)

## Soporte

- Documentación de Railway: [docs.railway.app](https://docs.railway.app)
- Discord de Railway: [discord.gg/railway](https://discord.gg/railway)
- Guía de Prisma 7: [prisma.io/docs](https://prisma.io/docs)
