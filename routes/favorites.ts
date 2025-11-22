import express, { Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database.config';
import { Favorite } from '../entities/Favorite';
import { Product } from '../entities/Product';
import { AuthRequest } from '../types';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener favoritos del usuario
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const favoriteRepository = AppDataSource.getRepository(Favorite);
    
    const favorites = await favoriteRepository.find({
      where: { userId },
      relations: ['product']
    });

    const favoriteProducts = favorites.map((fav: Favorite) => fav.product);

    res.json(favoriteProducts);
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    res.status(500).json({ error: 'Error al obtener favoritos' });
  }
});

// Agregar producto a favoritos
router.post('/add/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;

    const productRepository = AppDataSource.getRepository(Product);
    const favoriteRepository = AppDataSource.getRepository(Favorite);

    const product = await productRepository.findOne({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar si ya existe
    const existingFavorite = await favoriteRepository.findOne({
      where: { userId, productId }
    });

    if (!existingFavorite) {
      const newFavorite = favoriteRepository.create({
        userId,
        productId
      });
      await favoriteRepository.save(newFavorite);
    }

    const favorites = await favoriteRepository.find({
      where: { userId }
    });

    res.json({
      message: 'Producto agregado a favoritos',
      favorites: favorites.map((f: Favorite) => f.productId)
    });
  } catch (error) {
    console.error('Error al agregar a favoritos:', error);
    res.status(500).json({ error: 'Error al agregar a favoritos' });
  }
});

// Eliminar producto de favoritos
router.delete('/remove/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;

    const favoriteRepository = AppDataSource.getRepository(Favorite);

    const favorite = await favoriteRepository.findOne({
      where: { userId, productId }
    });

    if (!favorite) {
      return res.status(404).json({ error: 'Producto no encontrado en favoritos' });
    }

    await favoriteRepository.remove(favorite);

    const favorites = await favoriteRepository.find({ where: { userId } });

    res.json({
      message: 'Producto eliminado de favoritos',
      favorites: favorites.map((f: Favorite) => f.productId)
    });
  } catch (error) {
    console.error('Error al eliminar de favoritos:', error);
    res.status(500).json({ error: 'Error al eliminar de favoritos' });
  }
});

// Verificar si un producto está en favoritos
router.get('/check/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;
    const favoriteRepository = AppDataSource.getRepository(Favorite);
    
    const favorite = await favoriteRepository.findOne({
      where: { userId, productId }
    });
    
    res.json({
      isFavorite: !!favorite
    });
  } catch (error) {
    console.error('Error al verificar favorito:', error);
    res.status(500).json({ error: 'Error al verificar favorito' });
  }
});

export default router;

