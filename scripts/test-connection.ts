import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from '../config/database.config';

// Cargar variables de entorno
dotenv.config();

async function testConnection() {
  try {
    console.log('🔄 Probando conexión a PostgreSQL...');
    console.log('Configuración:');
    console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  Puerto: ${process.env.DB_PORT || '5432'}`);
    console.log(`  Usuario: ${process.env.DB_USERNAME || 'postgres'}`);
    console.log(`  Base de datos: ${process.env.DB_NAME || 'gestion_pedidos'}`);
    console.log(`  Contraseña: ${process.env.DB_PASSWORD ? '***' : 'NO CONFIGURADA'}`);
    console.log('');

    await AppDataSource.initialize();
    console.log('✅ ¡Conexión exitosa a PostgreSQL!');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.code === '28P01') {
      console.error('\n💡 El problema es la AUTENTICACIÓN:');
      console.error('   - La contraseña en .env no coincide con la de PostgreSQL');
      console.error('   - O el usuario no existe');
      console.error('\n📝 Soluciones:');
      console.error('   1. Verifica tu contraseña de PostgreSQL en pgAdmin');
      console.error('   2. O cambia la contraseña en PostgreSQL:');
      console.error('      ALTER USER postgres WITH PASSWORD \'nueva_contraseña\';');
      console.error('   3. Actualiza DB_PASSWORD en el archivo .env');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 PostgreSQL NO está corriendo');
      console.error('   Inicia el servicio de PostgreSQL desde:');
      console.error('   - Servicios de Windows (services.msc)');
      console.error('   - O desde pgAdmin');
    } else if (error.code === '3D000') {
      console.error('\n💡 La base de datos no existe');
      console.error('   Ejecuta: CREATE DATABASE gestion_pedidos;');
    }
    
    process.exit(1);
  }
}

testConnection();

