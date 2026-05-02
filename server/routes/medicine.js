const express = require('express');
const router = express.Router();
const { MedicineStock, MedicineUsage } = require('../models');

router.get('/stock', async (req, res) => {
  try {
    const stock = await MedicineStock.find().sort({ dateAdded: -1 });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/stock', async (req, res) => {
  try {
    const { name, quantity, pricePerUnit, dateAdded } = req.body;
    let stock = await MedicineStock.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    
    if (stock) {
      stock.quantity += Number(quantity);
      if (pricePerUnit) stock.pricePerUnit = Number(pricePerUnit);
      if (dateAdded) stock.dateAdded = dateAdded;
      await stock.save();
      return res.status(200).json(stock);
    }
    
    const newStock = await MedicineStock.create(req.body);
    res.status(201).json(newStock);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/stock/:id', async (req, res) => {
  try {
    await MedicineStock.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/usage', async (req, res) => {
  try {
    const usage = await MedicineUsage.find().populate('medicineId').sort({ date: -1 });
    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/usage', async (req, res) => {
  try {
    const usage = await MedicineUsage.create(req.body);
    const stock = await MedicineStock.findById(req.body.medicineId);
    if (stock) {
      stock.quantity -= req.body.unitsUsed;
      await stock.save();
    }
    res.status(201).json(usage);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/usage/:id', async (req, res) => {
  try {
    const usage = await MedicineUsage.findById(req.params.id);
    if (usage) {
      const stock = await MedicineStock.findById(usage.medicineId);
      if (stock) {
        stock.quantity += usage.unitsUsed;
        await stock.save();
      }
      await MedicineUsage.findByIdAndDelete(req.params.id);
    }
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
