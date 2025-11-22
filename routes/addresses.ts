import express, { Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database.config';
import { Address } from '../entities/Address';
import { AuthRequest } from '../types';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener direcciones del usuario
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const addressRepository = AppDataSource.getRepository(Address);
    
    const userAddresses = await addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC' }
    });

    res.json(userAddresses);
  } catch (error) {
    console.error('Error al obtener direcciones:', error);
    res.status(500).json({ error: 'Error al obtener direcciones' });
  }
});

// Agregar dirección
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { street, city, state, zipCode, country, isDefault } = req.body;
    const addressRepository = AppDataSource.getRepository(Address);

    if (!street || !city || !state || !zipCode || !country) {
      return res.status(400).json({ 
        error: 'Todos los campos de dirección son requeridos' 
      });
    }

    // Si es la dirección por defecto, quitar el default de las demás
    if (isDefault) {
      const existingAddresses = await addressRepository.find({ where: { userId } });
      for (const addr of existingAddresses) {
        addr.isDefault = false;
        await addressRepository.save(addr);
      }
    }

    // Verificar si es la primera dirección
    const existingCount = await addressRepository.count({ where: { userId } });
    const shouldBeDefault = isDefault || existingCount === 0;

    const newAddress = addressRepository.create({
      userId,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: shouldBeDefault
    });

    await addressRepository.save(newAddress);

    res.status(201).json({
      message: 'Dirección agregada exitosamente',
      address: newAddress
    });
  } catch (error) {
    console.error('Error al agregar dirección:', error);
    res.status(500).json({ error: 'Error al agregar dirección' });
  }
});

// Actualizar dirección
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { street, city, state, zipCode, country, isDefault } = req.body;
    const addressRepository = AppDataSource.getRepository(Address);

    const address = await addressRepository.findOne({
      where: { id, userId }
    });

    if (!address) {
      return res.status(404).json({ error: 'Dirección no encontrada' });
    }

    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (zipCode) address.zipCode = zipCode;
    if (country) address.country = country;
    
    if (isDefault !== undefined) {
      // Si se marca como default, quitar el default de las demás
      if (isDefault) {
        const existingAddresses = await addressRepository.find({ where: { userId } });
        for (const addr of existingAddresses) {
          if (addr.id !== id) {
            addr.isDefault = false;
            await addressRepository.save(addr);
          }
        }
      }
      address.isDefault = isDefault;
    }

    await addressRepository.save(address);

    res.json({
      message: 'Dirección actualizada exitosamente',
      address
    });
  } catch (error) {
    console.error('Error al actualizar dirección:', error);
    res.status(500).json({ error: 'Error al actualizar dirección' });
  }
});

// Eliminar dirección
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const addressRepository = AppDataSource.getRepository(Address);

    const address = await addressRepository.findOne({
      where: { id, userId }
    });

    if (!address) {
      return res.status(404).json({ error: 'Dirección no encontrada' });
    }

    await addressRepository.remove(address);

    res.json({ message: 'Dirección eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar dirección:', error);
    res.status(500).json({ error: 'Error al eliminar dirección' });
  }
});

export default router;

