import express, { Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database.config';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { CartItem } from '../entities/CartItem';
import { Product } from '../entities/Product';
import { AuthRequest } from '../types';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todos los pedidos del usuario
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const orderRepository = AppDataSource.getRepository(Order);
    
    const userOrders = await orderRepository.find({
      where: { userId },
      relations: ['items', 'address', 'paymentMethod'],
      order: { date: 'DESC' }
    });

    // Formatear para compatibilidad con el frontend
    const formattedOrders = userOrders.map((order: Order) => ({
      id: order.id,
      date: order.date.toISOString(),
      status: order.status,
      total: parseFloat(order.total.toString()),
      items: order.items.map((item: OrderItem) => ({
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price.toString())
      })),
      restaurant: order.restaurant
    }));

    res.json({ orders: formattedOrders });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

// Obtener un pedido por ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const orderRepository = AppDataSource.getRepository(Order);
    
    const order = await orderRepository.findOne({
      where: { id: req.params.id, userId },
      relations: ['items', 'address', 'paymentMethod']
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const formattedOrder = {
      id: order.id,
      date: order.date.toISOString(),
      status: order.status,
      total: parseFloat(order.total.toString()),
      items: order.items.map((item: OrderItem) => ({
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price.toString())
      })),
      restaurant: order.restaurant,
      address: order.address ? {
        name: order.address.name || null,
        street: order.address.street,
        city: order.address.city,
        state: order.address.state,
        zipCode: order.address.zipCode,
        country: order.address.country,
        reference: order.address.reference || null
      } : null,
      paymentMethod: order.paymentMethod ? {
        type: order.paymentMethod.type,
        cardNumber: order.paymentMethod.cardNumber || null,
        cardHolder: order.paymentMethod.cardHolder || null,
        expiryDate: order.paymentMethod.expiryDate || null
      } : null
    };
    
    res.json(formattedOrder);
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
});

// Crear un nuevo pedido
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { addressId, paymentMethodId } = req.body;

    if (!addressId || !paymentMethodId) {
      return res.status(400).json({ 
        error: 'Dirección y método de pago son requeridos' 
      });
    }

    const cartRepository = AppDataSource.getRepository(CartItem);
    const productRepository = AppDataSource.getRepository(Product);
    const orderRepository = AppDataSource.getRepository(Order);
    const orderItemRepository = AppDataSource.getRepository(OrderItem);

    const userCart = await cartRepository.find({
      where: { userId },
      relations: ['product']
    });

    if (userCart.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    // Calcular total y obtener información de productos
    let total = 0;
    const orderItems = [];
    let restaurant = '';

    for (const cartItem of userCart) {
      const product = await productRepository.findOne({ where: { id: cartItem.productId } });
      if (product) {
        const itemTotal = parseFloat(product.price.toString()) * cartItem.quantity;
        total += itemTotal;
        if (!restaurant) restaurant = product.provider;

        orderItems.push({
          name: product.title,
          quantity: cartItem.quantity,
          price: parseFloat(product.price.toString()),
          productId: product.id
        });
      }
    }

    // Crear pedido
    const newOrder = orderRepository.create({
      userId,
      status: 'Pendiente',
      total: parseFloat(total.toFixed(2)),
      restaurant,
      addressId,
      paymentMethodId
    });

    const savedOrder = await orderRepository.save(newOrder);

    // Crear items del pedido
    for (const item of orderItems) {
      const orderItem = orderItemRepository.create({
        orderId: savedOrder.id,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      });
      await orderItemRepository.save(orderItem);
    }

    // Vaciar carrito después de crear el pedido
    await cartRepository.delete({ userId });


    res.status(201).json({
      message: 'Pedido creado exitosamente',
      order: {
        id: savedOrder.id,
        date: savedOrder.date.toISOString(),
        status: savedOrder.status,
        total: parseFloat(savedOrder.total.toString()),
        items: orderItems,
        restaurant: savedOrder.restaurant
      }
    });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ error: 'Error al crear pedido' });
  }
});

// Actualizar estado de un pedido
router.put('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { status } = req.body;
    const orderRepository = AppDataSource.getRepository(Order);

    const validStatuses: Array<'Pendiente' | 'En preparación' | 'En camino' | 'Entregado' | 'Cancelado'> = 
      ['Pendiente', 'En preparación', 'En camino', 'Entregado', 'Cancelado'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const order = await orderRepository.findOne({
      where: { id: req.params.id, userId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    order.status = status;
    await orderRepository.save(order);

    res.json({
      message: 'Estado del pedido actualizado',
      order: {
        id: order.id,
        status: order.status,
        date: order.date.toISOString(),
        total: parseFloat(order.total.toString())
      }
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

export default router;

