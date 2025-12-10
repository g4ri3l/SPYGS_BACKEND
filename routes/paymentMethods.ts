import express, { Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database.config';
import { PaymentMethod } from '../entities/PaymentMethod';
import { AuthRequest } from '../types';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener métodos de pago del usuario
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const paymentMethodRepository = AppDataSource.getRepository(PaymentMethod);
    
    const userPaymentMethods = await paymentMethodRepository.find({
      where: { userId },
      order: { isDefault: 'DESC' }
    });

    res.json({ paymentMethods: userPaymentMethods });
  } catch (error) {
    console.error('Error al obtener métodos de pago:', error);
    res.status(500).json({ error: 'Error al obtener métodos de pago' });
  }
});

// Agregar método de pago
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { type, cardNumber, cardHolder, expiryDate, isDefault } = req.body;
    const paymentMethodRepository = AppDataSource.getRepository(PaymentMethod);

    // Validar campos según el tipo
    if (type === 'card') {
      if (!cardNumber || !cardHolder || !expiryDate) {
        return res.status(400).json({ 
          error: 'Para tarjetas, número de tarjeta, titular y fecha de expiración son requeridos' 
        });
      }
    } else if (type === 'cash') {
      // Para efectivo, no se requieren campos de tarjeta
      // cardNumber, cardHolder, expiryDate serán null o vacíos
    } else {
      return res.status(400).json({ 
        error: 'Tipo de método de pago inválido. Use "card" o "cash"' 
      });
    }

    // Enmascarar número de tarjeta si es tarjeta (solo mostrar últimos 4 dígitos)
    const maskedCardNumber = type === 'card' && cardNumber 
      ? `**** **** **** ${cardNumber.slice(-4)}` 
      : '';

    // Si es el método por defecto, quitar el default de los demás
    if (isDefault) {
      const existingMethods = await paymentMethodRepository.find({ where: { userId } });
      for (const method of existingMethods) {
        method.isDefault = false;
        await paymentMethodRepository.save(method);
      }
    }

    // Verificar si es el primer método
    const existingCount = await paymentMethodRepository.count({ where: { userId } });
    const shouldBeDefault = isDefault || existingCount === 0;

    const newPaymentMethod = paymentMethodRepository.create({
      userId,
      type,
      cardNumber: maskedCardNumber,
      cardHolder: cardHolder || '',
      expiryDate: expiryDate || '',
      isDefault: shouldBeDefault
    });

    await paymentMethodRepository.save(newPaymentMethod);

    res.status(201).json({
      message: 'Método de pago agregado exitosamente',
      paymentMethod: newPaymentMethod
    });
  } catch (error) {
    console.error('Error al agregar método de pago:', error);
    res.status(500).json({ error: 'Error al agregar método de pago' });
  }
});

// Actualizar método de pago
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { cardHolder, expiryDate, isDefault } = req.body;
    const paymentMethodRepository = AppDataSource.getRepository(PaymentMethod);

    const paymentMethod = await paymentMethodRepository.findOne({
      where: { id, userId }
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Método de pago no encontrado' });
    }

    if (cardHolder) paymentMethod.cardHolder = cardHolder;
    if (expiryDate) paymentMethod.expiryDate = expiryDate;
    
    if (isDefault !== undefined) {
      // Si se marca como default, quitar el default de los demás
      if (isDefault) {
        const existingMethods = await paymentMethodRepository.find({ where: { userId } });
        for (const method of existingMethods) {
          if (method.id !== id) {
            method.isDefault = false;
            await paymentMethodRepository.save(method);
          }
        }
      }
      paymentMethod.isDefault = isDefault;
    }

    await paymentMethodRepository.save(paymentMethod);

    res.json({
      message: 'Método de pago actualizado exitosamente',
      paymentMethod
    });
  } catch (error) {
    console.error('Error al actualizar método de pago:', error);
    res.status(500).json({ error: 'Error al actualizar método de pago' });
  }
});

// Eliminar método de pago
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const paymentMethodRepository = AppDataSource.getRepository(PaymentMethod);

    const paymentMethod = await paymentMethodRepository.findOne({
      where: { id, userId }
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Método de pago no encontrado' });
    }

    await paymentMethodRepository.remove(paymentMethod);

    res.json({ message: 'Método de pago eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar método de pago:', error);
    res.status(500).json({ error: 'Error al eliminar método de pago' });
  }
});

export default router;

