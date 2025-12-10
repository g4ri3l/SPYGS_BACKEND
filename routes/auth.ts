import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database.config';
import { User } from '../entities/User';
import { JWT_SECRET } from '../middleware/auth';

const router = express.Router();

// Registro
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const userRepository = AppDataSource.getRepository(User);

    // Verificar si el usuario ya existe
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = userRepository.create({
      name,
      email,
      password: hashedPassword
    });

    await userRepository.save(newUser);

    // Generar token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const userRepository = AppDataSource.getRepository(User);

    // Buscar usuario
    const user = await userRepository.findOne({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Login con Google
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de Google requerido' });
    }

    // Verificar el token de Google y obtener información del usuario
    // Usar el endpoint correcto de Google OAuth2 v3
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!googleResponse.ok) {
      const errorData = await googleResponse.json().catch(() => ({})) as { error_description?: string };
      console.error('Error de Google API:', errorData);
      return res.status(401).json({ 
        error: 'Token de Google inválido o expirado',
        details: errorData.error_description || 'No se pudo verificar el token con Google'
      });
    }

    const googleUser = await googleResponse.json() as {
      email: string;
      name?: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
    };

    // Validar que tenemos la información necesaria
    if (!googleUser.email) {
      return res.status(400).json({ error: 'No se pudo obtener el email de Google' });
    }

    const userRepository = AppDataSource.getRepository(User);

    // Buscar si el usuario ya existe
    let user = await userRepository.findOne({ where: { email: googleUser.email } });

    if (!user) {
      // Crear nuevo usuario si no existe
      const newUser = userRepository.create({
        name: googleUser.name || googleUser.given_name || googleUser.email.split('@')[0],
        email: googleUser.email,
        password: null // No hay contraseña para usuarios de Google
      });
      await userRepository.save(newUser);
      user = newUser;
    }

    // Generar token JWT
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login con Google exitoso',
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Error en login con Google:', error);
    res.status(500).json({ 
      error: 'Error al iniciar sesión con Google',
      details: error.message 
    });
  }
});

// Verificar token
router.get('/verify', async (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }

    const decodedToken = decoded as { userId: string; email: string };
    
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: decodedToken.userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({
        valid: true,
        user: {
          userId: user.id,
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error al verificar token:', error);
      res.status(500).json({ error: 'Error al verificar token' });
    }
  });
});

export default router;

