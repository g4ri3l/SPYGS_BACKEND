import express, { Response } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { AppDataSource } from '../../config/database.config';
import { Delivery } from '../../entities/Delivery';
import { User } from '../../entities/User';
import { AuthRequest } from '../../types';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/deliveries - Listar todos los delivery
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const deliveryRepository = AppDataSource.getRepository(Delivery);
    const deliveries = await deliveryRepository.find({
      relations: ['user'],
      order: { rating: 'DESC' }
    });

    const formattedDeliveries = deliveries.map(delivery => ({
      id: delivery.id,
      name: delivery.user.name,
      email: delivery.user.email,
      phone: delivery.user.phone || 'No especificado',
      status: delivery.status,
      currentLocation: delivery.currentLatitude && delivery.currentLongitude ? {
        lat: parseFloat(delivery.currentLatitude.toString()),
        lng: parseFloat(delivery.currentLongitude.toString())
      } : null,
      rating: parseFloat(delivery.rating.toString()),
      totalDeliveries: delivery.totalDeliveries,
      activeOrders: delivery.activeOrders,
      lastUpdate: delivery.lastLocationUpdate?.toISOString()
    }));

    res.json({ deliveries: formattedDeliveries });
  } catch (error) {
    console.error('Error al obtener delivery:', error);
    res.status(500).json({ error: 'Error al obtener lista de delivery' });
  }
});

// GET /api/admin/deliveries/:id - Detalles de un delivery
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deliveryRepository = AppDataSource.getRepository(Delivery);
    const delivery = await deliveryRepository.findOne({
      where: { id },
      relations: ['user', 'ratings', 'ratings.user']
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery no encontrado' });
    }

    res.json({
      id: delivery.id,
      name: delivery.user.name,
      email: delivery.user.email,
      phone: delivery.user.phone || 'No especificado',
      status: delivery.status,
      currentLocation: delivery.currentLatitude && delivery.currentLongitude ? {
        lat: parseFloat(delivery.currentLatitude.toString()),
        lng: parseFloat(delivery.currentLongitude.toString())
      } : null,
      rating: parseFloat(delivery.rating.toString()),
      totalDeliveries: delivery.totalDeliveries,
      activeOrders: delivery.activeOrders,
      lastUpdate: delivery.lastLocationUpdate?.toISOString(),
      ratings: delivery.ratings?.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        userName: r.user.name,
        createdAt: r.createdAt
      })) || []
    });
  } catch (error) {
    console.error('Error al obtener delivery:', error);
    res.status(500).json({ error: 'Error al obtener detalles del delivery' });
  }
});

// PUT /api/admin/deliveries/:id/status - Actualizar estado
router.put('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Disponible', 'En camino', 'Ocupado', 'Fuera de servicio'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const deliveryRepository = AppDataSource.getRepository(Delivery);
    const delivery = await deliveryRepository.findOne({ where: { id } });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery no encontrado' });
    }

    delivery.status = status as any;
    await deliveryRepository.save(delivery);

    res.json({ message: 'Estado actualizado exitosamente', delivery });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado del delivery' });
  }
});

// GET /api/admin/deliveries/:id/location - Ubicación actual
router.get('/:id/location', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deliveryRepository = AppDataSource.getRepository(Delivery);
    const delivery = await deliveryRepository.findOne({ where: { id } });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery no encontrado' });
    }

    if (!delivery.currentLatitude || !delivery.currentLongitude) {
      return res.status(404).json({ error: 'Ubicación no disponible' });
    }

    res.json({
      lat: parseFloat(delivery.currentLatitude.toString()),
      lng: parseFloat(delivery.currentLongitude.toString()),
      lastUpdate: delivery.lastLocationUpdate?.toISOString()
    });
  } catch (error) {
    console.error('Error al obtener ubicación:', error);
    res.status(500).json({ error: 'Error al obtener ubicación del delivery' });
  }
});

export default router;

