import express, { Response } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { AppDataSource } from '../../config/database.config';
import { Order } from '../../entities/Order';
import { Delivery } from '../../entities/Delivery';
import { Address } from '../../entities/Address';
import { AuthRequest } from '../../types';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

// Función para calcular distancia (Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distancia en km
}

// GET /api/admin/orders - Todos los pedidos
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const orders = await orderRepository.find({
      relations: ['user', 'address', 'paymentMethod', 'delivery', 'delivery.user', 'items'],
      order: { date: 'DESC' }
    });

    const formattedOrders = orders.map(order => ({
      id: order.id,
      date: order.date.toISOString(),
      status: order.status,
      total: parseFloat(order.total.toString()),
      customer: {
        name: order.user.name,
        phone: order.user.phone || 'No especificado'
      },
      address: {
        street: order.address.street,
        city: order.address.city || 'No especificado'
      },
      delivery: order.delivery ? {
        id: order.delivery.id,
        name: order.delivery.user.name,
        rating: parseFloat(order.delivery.rating.toString())
      } : null,
      estimatedTime: order.estimatedDeliveryTime,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price.toString())
      }))
    }));

    res.json({ orders: formattedOrders });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error al obtener lista de pedidos' });
  }
});

// PUT /api/admin/orders/:id/assign - Asignar delivery a pedido
router.put('/:id/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { deliveryId } = req.body;

    if (!deliveryId) {
      return res.status(400).json({ error: 'deliveryId es requerido' });
    }

    const orderRepository = AppDataSource.getRepository(Order);
    const deliveryRepository = AppDataSource.getRepository(Delivery);

    const order = await orderRepository.findOne({
      where: { id },
      relations: ['address', 'delivery']
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const delivery = await deliveryRepository.findOne({
      where: { id: deliveryId },
      relations: ['user']
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery no encontrado' });
    }

    if (delivery.status !== 'Disponible' && delivery.status !== 'En camino') {
      return res.status(400).json({ error: 'El delivery no está disponible' });
    }

    // Actualizar pedido
    order.deliveryId = deliveryId;
    order.assignedAt = new Date();
    
    // Calcular tiempo estimado si hay ubicación
    if (delivery.currentLatitude && delivery.currentLongitude && order.address.latitude && order.address.longitude) {
      const distance = calculateDistance(
        parseFloat(delivery.currentLatitude.toString()),
        parseFloat(delivery.currentLongitude.toString()),
        parseFloat(order.address.latitude.toString()),
        parseFloat(order.address.longitude.toString())
      );
      // Tiempo estimado: distancia * velocidad promedio (30 km/h en ciudad)
      order.estimatedDeliveryTime = Math.round((distance / 30) * 60); // minutos
    }

    await orderRepository.save(order);

    // Actualizar estado del delivery y contador
    if (delivery.status === 'Disponible') {
      delivery.status = 'En camino';
    }
    delivery.activeOrders += 1;
    await deliveryRepository.save(delivery);

    res.json({ 
      message: 'Pedido asignado exitosamente',
      order: {
        id: order.id,
        delivery: {
          id: delivery.id,
          name: delivery.user.name,
          rating: parseFloat(delivery.rating.toString())
        },
        estimatedTime: order.estimatedDeliveryTime
      }
    });
  } catch (error) {
    console.error('Error al asignar delivery:', error);
    res.status(500).json({ error: 'Error al asignar delivery al pedido' });
  }
});

// GET /api/admin/orders/:id/best-delivery - Calcular mejor delivery
router.get('/:id/best-delivery', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orderRepository = AppDataSource.getRepository(Order);
    const deliveryRepository = AppDataSource.getRepository(Delivery);

    const order = await orderRepository.findOne({
      where: { id },
      relations: ['address']
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (!order.address.latitude || !order.address.longitude) {
      return res.status(400).json({ error: 'La dirección del pedido no tiene coordenadas' });
    }

    // Obtener delivery disponibles
    const availableDeliveries = await deliveryRepository.find({
      where: { 
        status: 'Disponible',
        isActive: true 
      },
      relations: ['user']
    });

    const orderLat = parseFloat(order.address.latitude.toString());
    const orderLng = parseFloat(order.address.longitude.toString());

    // Calcular score para cada delivery
    const deliveryOptions = availableDeliveries
      .map(delivery => {
        if (!delivery.currentLatitude || !delivery.currentLongitude) {
          return null;
        }

        const deliveryLat = parseFloat(delivery.currentLatitude.toString());
        const deliveryLng = parseFloat(delivery.currentLongitude.toString());

        const distance = calculateDistance(deliveryLat, deliveryLng, orderLat, orderLng);
        const estimatedTime = (distance / 30) * 60; // minutos

        // Score: combinación de factores
        const timeScore = 1 / (estimatedTime + 1);
        const ratingScore = parseFloat(delivery.rating.toString()) / 5;
        const loadScore = 1 / (delivery.activeOrders + 1);
        const distanceScore = 1 / (distance + 1);

        const finalScore = 
          timeScore * 0.4 +      // 40% tiempo
          ratingScore * 0.3 +    // 30% calificación
          loadScore * 0.2 +       // 20% carga de trabajo
          distanceScore * 0.1;    // 10% distancia

        return {
          id: delivery.id,
          name: delivery.user.name,
          rating: parseFloat(delivery.rating.toString()),
          distance: parseFloat(distance.toFixed(2)),
          estimatedTime: Math.round(estimatedTime),
          status: delivery.status,
          currentOrders: delivery.activeOrders,
          score: finalScore
        };
      })
      .filter(d => d !== null)
      .sort((a, b) => (b?.score || 0) - (a?.score || 0));

    res.json({ deliveryOptions });
  } catch (error) {
    console.error('Error al calcular mejor delivery:', error);
    res.status(500).json({ error: 'Error al calcular mejor delivery' });
  }
});

export default router;

