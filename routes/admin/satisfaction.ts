import express, { Response } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { AppDataSource } from '../../config/database.config';
import { DeliveryRating } from '../../entities/DeliveryRating';
import { Delivery } from '../../entities/Delivery';
import { AuthRequest } from '../../types';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/satisfaction - Estadísticas generales
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const ratingRepository = AppDataSource.getRepository(DeliveryRating);
    const deliveryRepository = AppDataSource.getRepository(Delivery);

    // Obtener todas las calificaciones
    const allRatings = await ratingRepository.find({
      relations: ['delivery', 'user', 'order']
    });

    // Obtener todos los delivery
    const allDeliveries = await deliveryRepository.find({
      relations: ['user', 'ratings']
    });

    // Calcular estadísticas generales
    const totalRatings = allRatings.length;
    const overallAverage = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : 0;

    // Distribución por rating
    const ratingCounts: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allRatings.forEach(rating => {
      ratingCounts[rating.rating] = (ratingCounts[rating.rating] || 0) + 1;
    });

    const byRating = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: ratingCounts[rating],
      percentage: totalRatings > 0 ? (ratingCounts[rating] / totalRatings) * 100 : 0
    }));

    // Top y bottom delivery
    const sortedDeliveries = [...allDeliveries].sort((a, b) => 
      parseFloat(b.rating.toString()) - parseFloat(a.rating.toString())
    );
    const topDeliveries = sortedDeliveries.slice(0, 3).map(d => ({
      deliveryId: d.id,
      deliveryName: d.user.name,
      averageRating: parseFloat(d.rating.toString()),
      totalRatings: d.ratings?.length || 0
    }));
    const bottomDeliveries = sortedDeliveries.slice(-3).reverse().map(d => ({
      deliveryId: d.id,
      deliveryName: d.user.name,
      averageRating: parseFloat(d.rating.toString()),
      totalRatings: d.ratings?.length || 0
    }));

    res.json({
      overallAverage: parseFloat(overallAverage.toFixed(2)),
      totalRatings,
      byRating,
      topDeliveries,
      bottomDeliveries,
      totalDeliveries: allDeliveries.length
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de satisfacción:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de satisfacción' });
  }
});

// GET /api/admin/deliveries/:id/ratings - Calificaciones de un delivery
router.get('/deliveries/:id/ratings', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deliveryRepository = AppDataSource.getRepository(Delivery);
    const ratingRepository = AppDataSource.getRepository(DeliveryRating);

    const delivery = await deliveryRepository.findOne({
      where: { id },
      relations: ['user', 'ratings', 'ratings.user', 'ratings.order']
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery no encontrado' });
    }

    const ratings = await ratingRepository.find({
      where: { deliveryId: id },
      relations: ['user', 'order'],
      order: { createdAt: 'DESC' }
    });

    // Distribución de ratings
    const ratingCounts: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(rating => {
      ratingCounts[rating.rating] = (ratingCounts[rating.rating] || 0) + 1;
    });

    const ratingDistribution = [5, 4, 3, 2, 1].map(value => ({
      value,
      count: ratingCounts[value]
    }));

    res.json({
      deliveryId: delivery.id,
      deliveryName: delivery.user.name,
      averageRating: parseFloat(delivery.rating.toString()),
      totalRatings: ratings.length,
      ratings: ratingDistribution,
      recentComments: ratings.slice(0, 10).map(r => ({
        orderId: r.orderId,
        rating: r.rating,
        comment: r.comment,
        userName: r.user.name,
        date: r.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error al obtener calificaciones del delivery:', error);
    res.status(500).json({ error: 'Error al obtener calificaciones del delivery' });
  }
});

export default router;

