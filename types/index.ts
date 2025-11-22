import { Request } from 'express';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  provider: string;
  rating: number;
  deliveryTime: string;
  distance: string;
  image: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  restaurant: string;
}

export interface Order {
  id: string;
  userId: string;
  date: string;
  status: 'Pendiente' | 'En preparación' | 'En camino' | 'Entregado' | 'Cancelado';
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  restaurant: string;
  addressId: string;
  paymentMethodId: string;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  type: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  isDefault: boolean;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}



