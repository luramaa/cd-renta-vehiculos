const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }
    
    const userExist = await User.findOne({ username });
    if (userExist) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    
    const user = new User({
      username,
      password,
      email,
      role: 'user'
    });
    
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login exitoso',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener información del usuario actual
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar todos los usuarios (solo admin)
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear nuevo usuario (solo admin)
router.post('/users', auth, adminOnly, async (req, res) => {
  try {
    const { username, password, role, email, nombre, apellido } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }
    
    const userExist = await User.findOne({ username });
    if (userExist) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    
    const user = new User({
      username,
      password,
      email,
      nombre,
      apellido,
      role: role || 'user'
    });
    
    await user.save();
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: user.toJSON()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar usuario
router.put('/users/:id', auth, async (req, res) => {
  try {
    // Solo admin puede actualizar otros usuarios, o el usuario a sí mismo
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    
    const { email, nombre, apellido, password } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    if (email) user.email = email;
    if (nombre) user.nombre = nombre;
    if (apellido) user.apellido = apellido;
    if (password) user.password = password;
    
    await user.save();
    
    res.json({
      message: 'Usuario actualizado exitosamente',
      user: user.toJSON()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar usuario (solo admin)
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
