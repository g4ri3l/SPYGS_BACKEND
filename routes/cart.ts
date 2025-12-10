import express, { Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database.config';
import { CartItem } from '../entities/CartItem';
import { Product } from '../entities/Product';
import { AuthRequest } from '../types';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener carrito del usuario
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const cartRepository = AppDataSource.getRepository(CartItem);
    const productRepository = AppDataSource.getRepository(Product);
    
    const cartItems = await cartRepository.find({
      where: { userId },
      relations: ['product']
    });

    const items = await Promise.all(cartItems.map(async (item: CartItem) => {
      const product = await productRepository.findOne({ where: { id: item.productId } });
      return {
        id: item.productId,
        name: product?.title || '',
        price: product ? parseFloat(product.price.toString()) : 0,
        quantity: item.quantity,
        image: product?.image || '',
        restaurant: product?.provider || ''
      };
    }));

    const total = items.reduce((sum: number, item: typeof items[0]) => sum + item.price * item.quantity, 0);
    
    res.json({
      items,
      cartItems: items, // Compatibilidad con frontend
      total: total.toFixed(2),
      count: items.reduce((sum: number, item: typeof items[0]) => sum + item.quantity, 0)
    });
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({ error: 'Error al obtener carrito' });
  }
});

// Agregar producto al carrito
router.post('/add', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'ID del producto es requerido' });
    }

    const productRepository = AppDataSource.getRepository(Product);
    const cartRepository = AppDataSource.getRepository(CartItem);

    const product = await productRepository.findOne({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const existingItem = await cartRepository.findOne({
      where: { userId, productId }
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      await cartRepository.save(existingItem);
    } else {
      const newCartItem = cartRepository.create({
        userId,
        productId,
        quantity
      });
      await cartRepository.save(newCartItem);
    }

    const cartItems = await cartRepository.find({
      where: { userId },
      relations: ['product']
    });

    res.json({
      message: 'Producto agregado al carrito',
      cart: cartItems
    });
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    res.status(500).json({ error: 'Error al agregar al carrito' });
  }
});

// Actualizar cantidad de un producto
router.put('/update/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;
    const { quantity } = req.body;

    const cartRepository = AppDataSource.getRepository(CartItem);

    const item = await cartRepository.findOne({
      where: { userId, productId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
    }

    if (quantity <= 0) {
      await cartRepository.remove(item);
    } else {
      item.quantity = quantity;
      await cartRepository.save(item);
    }

    const cartItems = await cartRepository.find({ where: { userId } });

    res.json({
      message: 'Carrito actualizado',
      cart: cartItems
    });
  } catch (error) {
    console.error('Error al actualizar carrito:', error);
    res.status(500).json({ error: 'Error al actualizar carrito' });
  }
});

// Eliminar producto del carrito
router.delete('/remove/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;

    const cartRepository = AppDataSource.getRepository(CartItem);

    const item = await cartRepository.findOne({
      where: { userId, productId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
    }

    await cartRepository.remove(item);

    const cartItems = await cartRepository.find({ where: { userId } });

    res.json({
      message: 'Producto eliminado del carrito',
      cart: cartItems
    });
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    res.status(500).json({ error: 'Error al eliminar del carrito' });
  }
});

// Vaciar carrito
router.delete('/clear', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const cartRepository = AppDataSource.getRepository(CartItem);
    
    await cartRepository.delete({ userId });
    
    res.json({ message: 'Carrito vaciado' });
  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    res.status(500).json({ error: 'Error al vaciar carrito' });
  }
});

export default router;

