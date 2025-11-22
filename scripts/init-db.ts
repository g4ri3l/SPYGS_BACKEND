import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from '../config/database.config';
import { Product } from '../entities/Product';

// Cargar variables de entorno ANTES de importar AppDataSource
dotenv.config();

async function initializeDatabase() {
  try {
    console.log('🔄 Inicializando conexión a la base de datos...');
    await AppDataSource.initialize();
    console.log('✅ Base de datos conectada');

    // Insertar productos iniciales
    const productRepository = AppDataSource.getRepository(Product);
    const existingProducts = await productRepository.count();

    if (existingProducts === 0) {
      console.log('📦 Insertando productos iniciales...');
      
      const initialProducts = [
        {
          id: '1',
          title: 'Sushi Variado (20 piezas)',
          price: 28.00,
          description: 'Selección de nigiri, maki y rolls premium',
          category: 'Comida',
          provider: 'Sushi Express',
          rating: 4.9,
          deliveryTime: '30-40 min',
          distance: '2.1 km',
          image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop&q=80'
        },
        {
          id: '2',
          title: 'Pizza Margherita',
          price: 12.50,
          description: 'Pizza clásica con tomate, mozzarella y albahaca fresca',
          category: 'Comida',
          provider: 'Pizzería Roma',
          rating: 4.8,
          deliveryTime: '25-35 min',
          distance: '1.2 km',
          image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop&q=80'
        },
        {
          id: '3',
          title: 'Hamburguesa Clásica',
          price: 15.00,
          description: 'Carne 100% res, queso, lechuga, tomate y nuestra salsa especial',
          category: 'Comida',
          provider: 'Burger House',
          rating: 4.6,
          deliveryTime: '20-30 min',
          distance: '0.8 km',
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80'
        },
        {
          id: '4',
          title: 'Tacos al Pastor (5 unidades)',
          price: 18.00,
          description: 'Tacos tradicionales con carne al pastor, piña, cebolla y cilantro',
          category: 'Comida',
          provider: 'Taquería El Mexicano',
          rating: 4.7,
          deliveryTime: '15-25 min',
          distance: '1.5 km',
          image: 'https://elcomercio.pe/resizer/v2/3BHJSBWBLBDTLKWVODRQGC3QLE.jpg?auth=dc2e70c4640d711be3496d7a4657e79d91e9b26f1b0446274ba56481c635561e&width=1200&height=803&quality=75&smart=true'
        },
        {
          id: '5',
          title: 'Pasta Carbonara',
          price: 22.00,
          description: 'Pasta italiana con panceta, huevo, queso parmesano y pimienta negra',
          category: 'Comida',
          provider: 'Trattoria Italiana',
          rating: 4.8,
          deliveryTime: '30-40 min',
          distance: '2.8 km',
          image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop&q=80'
        },
        {
          id: '6',
          title: 'Pollo a la Brasa (1/4)',
          price: 16.00,
          description: 'Pollo marinado y asado a la brasa con papas fritas y ensalada',
          category: 'Comida',
          provider: 'Brasas del Norte',
          rating: 4.9,
          deliveryTime: '35-45 min',
          distance: '3.2 km',
          image: 'https://laestacion.la/wp-content/uploads/2024/06/pollo-a-la-brasa-1024x576-1.webp'
        },
        {
          id: '7',
          title: 'Ramen Tonkotsu',
          price: 24.00,
          description: 'Sopa de fideos japoneses con cerdo, huevo, algas y cebollín',
          category: 'Comida',
          provider: 'Ramen House',
          rating: 4.7,
          deliveryTime: '25-35 min',
          distance: '2.5 km',
          image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&q=80'
        },
        {
          id: '8',
          title: 'Ensalada César',
          price: 14.00,
          description: 'Lechuga romana, pollo a la parrilla, crutones, parmesano y aderezo césar',
          category: 'Comida',
          provider: 'Salad Bar',
          rating: 4.5,
          deliveryTime: '15-20 min',
          distance: '1.0 km',
          image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop&q=80'
        }
      ];

      await productRepository.save(initialProducts);
      console.log('✅ Productos iniciales insertados');
    } else {
      console.log('ℹ️  Los productos ya existen en la base de datos');
    }

    console.log('✅ Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

initializeDatabase();

