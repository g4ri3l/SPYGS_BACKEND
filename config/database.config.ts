import 'reflect-metadata';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Product } from '../entities/Product';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { CartItem } from '../entities/CartItem';
import { Address } from '../entities/Address';
import { PaymentMethod } from '../entities/PaymentMethod';
import { Favorite } from '../entities/Favorite';
import { Delivery } from '../entities/Delivery';
import { DeliveryRating } from '../entities/DeliveryRating';

// Cargar variables de entorno
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'gestion_pedidos',
  entities: [User, Product, Order, OrderItem, CartItem, Address, PaymentMethod, Favorite, Delivery, DeliveryRating],
  synchronize: process.env.NODE_ENV !== 'production', // Solo en desarrollo
  logging: process.env.NODE_ENV === 'development',
});

