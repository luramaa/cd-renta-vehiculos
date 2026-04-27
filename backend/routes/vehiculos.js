const express = require('express');
const Vehiculo = require('../models/Vehiculo');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los vehículos
router.get('/', auth, async (req, res) => {
  try {
    const vehiculos = await Vehiculo.find();
    res.json(vehiculos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener vehículo por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findById(req.params.id);
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    res.json(vehiculo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear vehículo (admin)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { nombre, placa, anio, color, tipo, transmision, combustible, km, precio, estado } = req.body;
    
    if (!nombre || !placa) {
      return res.status(400).json({ error: 'Nombre y placa requeridos' });
    }
    
    const vehiculoExist = await Vehiculo.findOne({ placa });
    if (vehiculoExist) {
      return res.status(400).json({ error: 'La placa ya existe' });
    }
    
    const vehiculo = new Vehiculo({
      nombre, placa, anio, color, tipo, transmision, combustible, km, precio, estado
    });
    
    await vehiculo.save();
    res.status(201).json({ message: 'Vehículo creado', vehiculo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar vehículo (admin)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    res.json({ message: 'Vehículo actualizado', vehiculo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar vehículo (admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByIdAndDelete(req.params.id);
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    res.json({ message: 'Vehículo eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
