const express = require('express');
const router = express.Router();
const { EggProduction, EggDistribution, Dealer } = require('../models');

// --- Production ---
router.get('/production', async (req, res) => {
  try {
    const prod = await EggProduction.find().sort({ date: -1 });
    res.json(prod);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/production', async (req, res) => {
  try {
    const newProd = await EggProduction.create(req.body);
    res.status(201).json(newProd);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed' });
  }
});

router.delete('/production/:id', async (req, res) => {
  try {
    await EggProduction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// --- Distribution ---
router.get('/distribution', async (req, res) => {
  try {
    const filter = req.query.dealerId ? { dealerId: req.query.dealerId } : {};
    const dist = await EggDistribution.find(filter).populate('dealerId').sort({ date: -1 });
    res.json(dist);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Mark distribution entry as paid → reduce dealer balance
router.patch('/distribution/:id/pay', async (req, res) => {
  try {
    const dist = await EggDistribution.findById(req.params.id);
    if (!dist) return res.status(404).json({ error: 'Not found' });
    if (dist.paid) return res.status(400).json({ error: 'Already marked paid' });

    dist.paid = true;
    await dist.save();

    // Reduce dealer balance by the amount paid
    const dealer = await Dealer.findById(dist.dealerId);
    if (dealer) {
      dealer.balance -= dist.totalAmount;
      await dealer.save();
    }

    res.json(dist);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Unmark paid (undo) → restore dealer balance
router.patch('/distribution/:id/unpay', async (req, res) => {
  try {
    const dist = await EggDistribution.findById(req.params.id);
    if (!dist) return res.status(404).json({ error: 'Not found' });
    if (!dist.paid) return res.status(400).json({ error: 'Not marked paid' });

    dist.paid = false;
    await dist.save();

    const dealer = await Dealer.findById(dist.dealerId);
    if (dealer) {
      dealer.balance += dist.totalAmount;
      await dealer.save();
    }

    res.json(dist);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/distribution', async (req, res) => {
  try {
    const dist = await EggDistribution.create(req.body);
    // Update dealer balance if it's credit (assuming eggs given are credit until paid)
    // For simplicity, we just add to balance as amount owed
    const dealer = await Dealer.findById(req.body.dealerId);
    if (dealer) {
      dealer.balance += req.body.totalAmount;
      await dealer.save();
    }
    res.status(201).json(dist);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/distribution/:id', async (req, res) => {
  try {
    const dist = await EggDistribution.findById(req.params.id);
    if (dist) {
      const dealer = await Dealer.findById(dist.dealerId);
      if (dealer) {
        dealer.balance -= dist.totalAmount;
        await dealer.save();
      }
      await EggDistribution.findByIdAndDelete(req.params.id);
    }
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
