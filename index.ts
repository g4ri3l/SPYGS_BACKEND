import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database.config';
import authRoutes from './routes/auth';
import productsRoutes from './routes/products';
import cartRoutes from './routes/cart';
import ordersRoutes from './routes/orders';
import favoritesRoutes from './routes/favorites';
import profileRoutes from './routes/profile';
import addressesRoutes from './routes/addresses';
import paymentMethodsRoutes from './routes/paymentMethods';
import notificationsRoutes from './routes/notifications';
import adminDeliveriesRoutes from './routes/admin/deliveries';
import adminOrdersRoutes from './routes/admin/orders';
import adminSatisfactionRoutes from './routes/admin/satisfaction';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar conexión a la base de datos
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Base de datos PostgreSQL conectada');
  })
  .catch((error) => {
    console.error('❌ Error al conectar con la base de datos:', error);
  });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/payment-methods', paymentMethodsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin/deliveries', adminDeliveriesRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/admin/satisfaction', adminSatisfactionRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Backend funcionando correctamente' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

