# SPYGS_BACKEND - Sistema de Gestión de Pedidos

Backend REST API para el sistema de gestión de pedidos de comida, desarrollado con **TypeScript** y Express.

## Características

- ✅ Autenticación (Login/Registro) con JWT
- ✅ Gestión de productos/catálogo
- ✅ Carrito de compras
- ✅ Gestión de pedidos
- ✅ Favoritos
- ✅ Perfil de usuario
- ✅ Direcciones de entrega
- ✅ Métodos de pago

## Instalación

```bash
npm install
```

## Configuración

Crea un archivo `.env` en la raíz del proyecto (opcional):

```env
PORT=3000
JWT_SECRET=tu_secreto_super_seguro_cambiar_en_produccion
```

## Ejecución

### Modo desarrollo (con ts-node-dev)
```bash
npm run dev
```

### Compilar TypeScript
```bash
npm run build
```

### Modo producción
```bash
npm start
```

### Verificar tipos (sin compilar)
```bash
npm run type-check
```

El servidor estará disponible en `http://localhost:3000`

## Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/verify` - Verificar token

### Productos
- `GET /api/products` - Obtener todos los productos (con filtros y ordenamiento)
- `GET /api/products/:id` - Obtener un producto por ID

### Carrito
- `GET /api/cart` - Obtener carrito del usuario
- `POST /api/cart/add` - Agregar producto al carrito
- `PUT /api/cart/update/:productId` - Actualizar cantidad
- `DELETE /api/cart/remove/:productId` - Eliminar producto
- `DELETE /api/cart/clear` - Vaciar carrito

### Pedidos
- `GET /api/orders` - Obtener todos los pedidos del usuario
- `GET /api/orders/:id` - Obtener un pedido por ID
- `POST /api/orders` - Crear nuevo pedido
- `PUT /api/orders/:id/status` - Actualizar estado del pedido

### Favoritos
- `GET /api/favorites` - Obtener favoritos del usuario
- `POST /api/favorites/add/:productId` - Agregar a favoritos
- `DELETE /api/favorites/remove/:productId` - Eliminar de favoritos
- `GET /api/favorites/check/:productId` - Verificar si está en favoritos

### Perfil
- `GET /api/profile` - Obtener perfil del usuario
- `PUT /api/profile` - Actualizar perfil
- `PUT /api/profile/password` - Cambiar contraseña

### Direcciones
- `GET /api/addresses` - Obtener direcciones del usuario
- `POST /api/addresses` - Agregar dirección
- `PUT /api/addresses/:id` - Actualizar dirección
- `DELETE /api/addresses/:id` - Eliminar dirección

### Métodos de Pago
- `GET /api/payment-methods` - Obtener métodos de pago
- `POST /api/payment-methods` - Agregar método de pago
- `PUT /api/payment-methods/:id` - Actualizar método de pago
- `DELETE /api/payment-methods/:id` - Eliminar método de pago

## Autenticación

La mayoría de los endpoints requieren autenticación. Incluye el token JWT en el header:

```
Authorization: Bearer <token>
```

## Tecnologías

- **TypeScript** - Tipado estático para mayor seguridad y productividad
- **Express** - Framework web para Node.js
- **JWT** - Autenticación con tokens
- **bcryptjs** - Hash de contraseñas
- **CORS** - Habilitación de peticiones cross-origin

## Notas

- Este backend usa almacenamiento en memoria (arrays). En producción, deberías usar una base de datos real (MongoDB, PostgreSQL, etc.).
- Los datos se perderán al reiniciar el servidor.
- El JWT_SECRET debe ser cambiado en producción.
- El código TypeScript se compila a JavaScript en la carpeta `dist/`.

