-- Script SQL para actualizar usuario a admin
-- Ejecutar en PostgreSQL

-- Actualizar usuario existente a admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@pedidospro.com';

-- Verificar que se actualizó correctamente
SELECT id, name, email, role 
FROM users 
WHERE email = 'admin@pedidospro.com';

-- Si el usuario no existe, crear uno nuevo
-- (Descomentar las siguientes líneas si necesitas crear el usuario)
/*
INSERT INTO users (id, name, email, password, role, "createdAt")
VALUES (
  gen_random_uuid(),
  'Administrador',
  'admin@pedidospro.com',
  '$2b$10$hashed_password_here', -- Reemplazar con hash de contraseña
  'admin',
  NOW()
);
*/

