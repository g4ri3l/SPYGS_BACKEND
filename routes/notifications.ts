import express, { Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database.config';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Favorite } from '../entities/Favorite';
import { CartItem } from '../entities/CartItem';
import { Product } from '../entities/Product';
import { AuthRequest } from '../types';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Algoritmo para generar notificaciones personalizadas basadas en el consumo
async function generatePersonalizedNotifications(userId: string): Promise<Array<{
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  discount?: number;
  category?: string;
  provider?: string;
}>> {
  const notifications: Array<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning';
    discount?: number;
    category?: string;
    provider?: string;
  }> = [];

  try {
    // 1. Analizar pedidos del usuario
    const orderRepository = AppDataSource.getRepository(Order);
    const userOrders = await orderRepository.find({
      where: { userId },
      relations: ['items'],
      order: { date: 'DESC' },
      take: 20 // Últimos 20 pedidos
    });

    // 2. Analizar favoritos
    const favoriteRepository = AppDataSource.getRepository(Favorite);
    const userFavorites = await favoriteRepository.find({
      where: { userId },
      relations: ['product']
    });

    // 3. Analizar carrito actual
    const cartRepository = AppDataSource.getRepository(CartItem);
    const cartItems = await cartRepository.find({
      where: { userId },
      relations: ['product']
    });

    // 4. Obtener todos los productos para análisis
    const productRepository = AppDataSource.getRepository(Product);
    const allProducts = await productRepository.find();

    // Análisis de categorías más compradas
    const categoryCount: Record<string, number> = {};
    const providerCount: Record<string, number> = {};
    let totalSpent = 0;
    const lastOrderDate = userOrders.length > 0 ? new Date(userOrders[0].date) : null;
    const daysSinceLastOrder = lastOrderDate 
      ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Analizar pedidos para encontrar patrones
    // Cargar items de pedidos si no están cargados
    for (const order of userOrders) {
      totalSpent += parseFloat(order.total.toString());
      
      // Si los items no están cargados, cargarlos
      if (!order.items || order.items.length === 0) {
        const orderItemRepository = AppDataSource.getRepository(OrderItem);
        const items = await orderItemRepository.find({ where: { orderId: order.id } });
        order.items = items;
      }
      
      order.items?.forEach(item => {
        // Buscar el producto para obtener categoría y proveedor
        const product = allProducts.find(p => p.id === item.productId || p.title === item.name);
        if (product) {
          categoryCount[product.category] = (categoryCount[product.category] || 0) + item.quantity;
          providerCount[product.provider] = (providerCount[product.provider] || 0) + item.quantity;
        }
      });
    }

    // Encontrar categoría favorita
    const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, Object.keys(categoryCount)[0] || '');

    // Encontrar proveedor favorito
    const favoriteProvider = Object.keys(providerCount).reduce((a, b) => 
      providerCount[a] > providerCount[b] ? a : b, Object.keys(providerCount)[0] || '');

    // 5. Generar notificaciones personalizadas

    // Notificación 1: Descuento en categoría favorita
    if (favoriteCategory && categoryCount[favoriteCategory] >= 3) {
      const discount = Math.min(25, 10 + Math.floor(categoryCount[favoriteCategory] / 2));
      const categoryProducts = allProducts.filter(p => p.category === favoriteCategory);
      if (categoryProducts.length > 0) {
        notifications.push({
          title: `🎉 Descuento especial en ${favoriteCategory}`,
          message: `Por ser un cliente frecuente, tienes ${discount}% de descuento en todos los productos de ${favoriteCategory}. ¡Aprovecha esta oferta!`,
          type: 'info',
          discount,
          category: favoriteCategory
        });
      }
    }

    // Notificación 2: Descuento en proveedor favorito
    if (favoriteProvider && providerCount[favoriteProvider] >= 2) {
      const discount = Math.min(20, 10 + Math.floor(providerCount[favoriteProvider] / 2));
      notifications.push({
        title: `⭐ Oferta exclusiva de ${favoriteProvider}`,
        message: `Gracias por tu fidelidad, tienes ${discount}% de descuento en tu próximo pedido de ${favoriteProvider}. Válido por 7 días.`,
        type: 'info',
        discount,
        provider: favoriteProvider
      });
    }

    // Notificación 3: Productos en favoritos con descuento
    if (userFavorites.length > 0) {
      const favoriteProductIds = userFavorites.map(f => f.productId);
      const favoriteProducts = allProducts.filter(p => favoriteProductIds.includes(p.id));
      
      if (favoriteProducts.length > 0) {
        const randomFavorite = favoriteProducts[Math.floor(Math.random() * favoriteProducts.length)];
        notifications.push({
          title: `💝 Tu favorito está en oferta`,
          message: `¡${randomFavorite.title} está disponible con 15% de descuento! No te pierdas esta oportunidad.`,
          type: 'info',
          discount: 15
        });
      }
    }

    // Notificación 4: Si no ha pedido en mucho tiempo
    if (daysSinceLastOrder !== null && daysSinceLastOrder > 7) {
      const discount = Math.min(30, 15 + daysSinceLastOrder);
      notifications.push({
        title: `👋 ¡Te extrañamos!`,
        message: `Hace ${daysSinceLastOrder} días que no pedes. Te regalamos ${discount}% de descuento en tu próximo pedido. ¡Vuelve pronto!`,
        type: 'warning',
        discount
      });
    }

    // Notificación 5: Cliente VIP (muchos pedidos)
    if (userOrders.length >= 10) {
      const avgOrderValue = totalSpent / userOrders.length;
      if (avgOrderValue > 20) {
        notifications.push({
          title: `👑 Eres un cliente VIP`,
          message: `Con ${userOrders.length} pedidos realizados, tienes acceso a descuentos exclusivos. ¡Sigue así!`,
          type: 'success'
        });
      }
    }

    // Notificación 6: Productos similares a los que compra
    if (userOrders.length > 0 && favoriteCategory) {
      const categoryProducts = allProducts.filter(p => 
        p.category === favoriteCategory && 
        !userFavorites.some(f => f.productId === p.id)
      );
      
      if (categoryProducts.length > 0) {
        const recommendedProduct = categoryProducts[Math.floor(Math.random() * categoryProducts.length)];
        notifications.push({
          title: `🔍 Te puede interesar`,
          message: `Basado en tus compras anteriores, creemos que te gustará "${recommendedProduct.title}". ¡Échale un vistazo!`,
          type: 'info'
        });
      }
    }

    // Notificación 7: Carrito abandonado
    if (cartItems.length > 0) {
      const cartTotal = cartItems.reduce((sum, item) => {
        const product = allProducts.find(p => p.id === item.productId);
        return sum + (product ? parseFloat(product.price.toString()) * item.quantity : 0);
      }, 0);
      
      notifications.push({
        title: `🛒 Tienes items en tu carrito`,
        message: `Tienes ${cartItems.length} producto(s) esperando. Completa tu pedido y obtén 10% de descuento adicional.`,
        type: 'info',
        discount: 10
      });
    }

    // Notificación 8: Nuevo cliente (menos de 3 pedidos)
    if (userOrders.length > 0 && userOrders.length < 3) {
      notifications.push({
        title: `🎁 Bienvenido a SPYGS`,
        message: `Como nuevo cliente, tienes 15% de descuento en tu próximo pedido. ¡Aprovecha esta oferta especial!`,
        type: 'success',
        discount: 15
      });
    }

    // Limitar a 5 notificaciones más relevantes
    return notifications.slice(0, 5);

  } catch (error) {
    console.error('Error al generar notificaciones personalizadas:', error);
    return [];
  }
}

// Obtener notificaciones personalizadas del usuario
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Generar notificaciones personalizadas
    const personalizedNotifications = await generatePersonalizedNotifications(userId);

    // Formatear notificaciones para el frontend
    const formattedNotifications = personalizedNotifications.map((notif, index) => ({
      id: `notif-${userId}-${Date.now()}-${index}`,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: false,
      timestamp: new Date(Date.now() - index * 60000), // Espaciar timestamps
      discount: notif.discount,
      category: notif.category,
      provider: notif.provider
    }));

    res.json({ notifications: formattedNotifications });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

export default router;

