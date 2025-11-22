import express, { Request, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Product } from '../entities/Product';

const router = express.Router();

// Obtener todos los productos
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, category, sort } = req.query;
    const productRepository = AppDataSource.getRepository(Product);
    let filteredProducts = await productRepository.find();

    // Filtrar por búsqueda
    if (search && typeof search === 'string') {
      const query = search.toLowerCase();
      filteredProducts = filteredProducts.filter((product: Product) =>
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.provider.toLowerCase().includes(query)
      );
    }

    // Filtrar por categoría
    if (category && category !== 'Todos' && typeof category === 'string') {
      filteredProducts = filteredProducts.filter((product: Product) =>
        product.category === category
      );
    }

    // Ordenar
    if (sort && typeof sort === 'string') {
      switch (sort) {
        case 'Mejor valorados':
          filteredProducts.sort((a: Product, b: Product) => 
            parseFloat(b.rating.toString()) - parseFloat(a.rating.toString())
          );
          break;
        case 'Menor precio':
          filteredProducts.sort((a: Product, b: Product) => 
            parseFloat(a.price.toString()) - parseFloat(b.price.toString())
          );
          break;
        case 'Mayor precio':
          filteredProducts.sort((a: Product, b: Product) => 
            parseFloat(b.price.toString()) - parseFloat(a.price.toString())
          );
          break;
        case 'Más cercanos':
          filteredProducts.sort((a: Product, b: Product) => {
            const distA = parseFloat(a.distance.replace(' km', ''));
            const distB = parseFloat(b.distance.replace(' km', ''));
            return distA - distB;
          });
          break;
        default:
          break;
      }
    }

    res.json({
      products: filteredProducts,
      total: filteredProducts.length
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Obtener un producto por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const productRepository = AppDataSource.getRepository(Product);
    const product = await productRepository.findOne({ where: { id: req.params.id } });
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

export default router;

