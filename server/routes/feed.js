const express = require('express');
const router = express.Router();
const { FeedStock, FeedUsage } = require('../models');

// Stock Routes
router.get('/stock', async (req, res) => {
  try {
    const stock = await FeedStock.find().sort({ dateAdded: -1 });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

router.post('/stock', async (req, res) => {
  try {
    const { name, quantityBori, pricePerBori, dateAdded } = req.body;
    let stock = await FeedStock.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    
    if (stock) {
      stock.quantityBori += Number(quantityBori);
      if (pricePerBori) stock.pricePerBori = Number(pricePerBori);
      if (dateAdded) stock.dateAdded = dateAdded;
      await stock.save();
      return res.status(200).json(stock);
    }
    
    const newStock = await FeedStock.create(req.body);
    res.status(201).json(newStock);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create' });
  }
});

router.delete('/stock/:id', async (req, res) => {
  try {
    await FeedStock.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Usage Routes
router.get('/usage', async (req, res) => {
  try {
    const usage = await FeedUsage.find().populate('feedId').sort({ date: -1 });
    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

router.post('/usage', async (req, res) => {
  try {
    const usage = await FeedUsage.create(req.body);
    // Deduct stock
    const stock = await FeedStock.findById(req.body.feedId);
    if (stock) {
      stock.quantityBori -= req.body.boriUsed;
      await stock.save();
    }
    res.status(201).json(usage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create usage' });
  }
});

router.delete('/usage/:id', async (req, res) => {
  try {
    const usage = await FeedUsage.findById(req.params.id);
    if (usage) {
      const stock = await FeedStock.findById(usage.feedId);
      if (stock) {
        stock.quantityBori += usage.boriUsed;
        await stock.save();
      }
      await FeedUsage.findByIdAndDelete(req.params.id);
    }
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete usage' });
  }
});

module.exports = router;
