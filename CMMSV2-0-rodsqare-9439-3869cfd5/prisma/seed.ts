import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed de la base de datos...')
  
  // Crear usuario admin por defecto
  const adminPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@cmms.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@cmms.com',
      password: adminPassword,
      rol: 'admin',
      activo: true,
    },
  })
  
  console.log('✓ Usuario admin creado:', admin.email)
  
  // Crear usuario técnico de ejemplo
  const tecnicoPassword = await bcrypt.hash('tecnico123', 10)
  
  const tecnico = await prisma.usuario.upsert({
    where: { email: 'tecnico@cmms.com' },
    update: {},
    create: {
      nombre: 'Técnico de Ejemplo',
      email: 'tecnico@cmms.com',
      password: tecnicoPassword,
      rol: 'tecnico',
      activo: true,
    },
  })
  
  console.log('✓ Usuario técnico creado:', tecnico.email)
  
  // Crear equipo de ejemplo
  const equipo = await prisma.equipo.upsert({
    where: { codigo: 'EQ-001' },
    update: {},
    create: {
      codigo: 'EQ-001',
      nombre: 'Electrocardiografo',
      tipo: 'Diagnóstico',
      marca: 'Philips',
      modelo: 'PageWriter TC70',
      numero_serie: 'PW-2024-001',
      ubicacion: 'Sala de Cardiología',
      fecha_adquisicion: new Date('2023-01-15'),
      vida_util_anos: 10,
      valor_adquisicion: 25000,
      estado: 'operativo',
      criticidad: 'alta',
      descripcion: 'Electrocardiógrafo de 12 derivaciones con pantalla táctil',
      especificaciones: {
        derivaciones: 12,
        pantalla: '15 pulgadas',
        conectividad: 'WiFi, Ethernet',
      },
      horas_operacion: 1250,
    },
  })
  
  console.log('✓ Equipo de ejemplo creado:', equipo.nombre)
  
  console.log('Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
