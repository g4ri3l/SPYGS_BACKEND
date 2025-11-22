import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database.config';
import { User } from '../entities/User';
import { AuthRequest } from '../types';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener perfil del usuario
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userRepository = AppDataSource.getRepository(User);
    
    const user = await userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No enviar la contraseña
    const { password, ...userProfile } = user;
    res.json(userProfile);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Actualizar perfil del usuario
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, email } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (name) user.name = name;
    if (email) {
      // Verificar que el email no esté en uso por otro usuario
      const emailExists = await userRepository.findOne({ 
        where: { email, id: userId !== userId ? userId : undefined } 
      });
      if (emailExists && emailExists.id !== userId) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
      user.email = email;
    }

    await userRepository.save(user);

    const { password, ...userProfile } = user;
    res.json({
      message: 'Perfil actualizado exitosamente',
      user: userProfile
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// Cambiar contraseña
router.put('/password', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Contraseña actual y nueva contraseña son requeridas' 
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    if (!user.password) {
      return res.status(400).json({ error: 'Este usuario no tiene contraseña (inició sesión con Google)' });
    }
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await userRepository.save(user);

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

export default router;

