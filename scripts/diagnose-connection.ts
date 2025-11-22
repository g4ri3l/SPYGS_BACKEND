import 'reflect-metadata';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function diagnose() {
  console.log('🔍 Diagnóstico de conexión PostgreSQL\n');
  console.log('Configuración actual:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  Puerto: ${process.env.DB_PORT || '5432'}`);
  console.log(`  Usuario: ${process.env.DB_USERNAME || 'postgres'}`);
  console.log(`  Base de datos: ${process.env.DB_NAME || 'gestion_pedidos'}`);
  console.log(`  Contraseña configurada: ${process.env.DB_PASSWORD ? 'Sí' : 'No'}\n`);

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'gestion_pedidos',
  });

  try {
    console.log(' Intentando conectar...');
    await client.connect();
    console.log(' ¡Conexión exitosa!\n');
    
    const result = await client.query('SELECT version();');
    console.log('Versión de PostgreSQL:');
    console.log(result.rows[0].version);
    
    await client.end();
    process.exit(0);
  } catch (error: any) {
    console.error(' Error de conexión:', error.message);
    
    if (error.code === '28P01') {
      console.error('\n💡 Error de autenticación');
      console.error('   La contraseña no es correcta.');
      console.error('\n Soluciones:');
      console.error('   1. Verifica en pgAdmin qué contraseña usas para conectarte');
      console.error('   2. O cambia la contraseña en PostgreSQL:');
      console.error('      ALTER USER postgres WITH PASSWORD \'postgres123\';');
      console.error('   3. Actualiza DB_PASSWORD en el archivo .env');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n PostgreSQL no está corriendo');
      console.error('   Inicia el servicio desde Services (services.msc)');
    } else if (error.code === '3D000') {
      console.error('\n La base de datos no existe');
      console.error('   Crea la base de datos: CREATE DATABASE gestion_pedidos;');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n No se puede encontrar el servidor');
      console.error('   Verifica que DB_HOST sea correcto');
    }
    
    process.exit(1);
  }
}

diagnose();



