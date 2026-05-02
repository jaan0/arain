const express = require('express');
const router = express.Router();
const { Labour, LabourLedger } = require('../models');

router.get('/', async (req, res) => {
  try {
    const labour = await Labour.find().sort({ createdAt: -1 });
    res.json(labour);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/', async (req, res) => {
  try {
    const newLabour = await Labour.create(req.body);
    res.status(201).json(newLabour);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const l = await Labour.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(l);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await LabourLedger.deleteMany({ labourId: req.params.id });
    await Labour.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Ledger
router.get('/:id/ledger', async (req, res) => {
  try {
    const ledger = await LabourLedger.find({ labourId: req.params.id }).sort({ date: -1 });
    res.json(ledger);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/:id/ledger', async (req, res) => {
  try {
    const entry = await LabourLedger.create({ ...req.body, labourId: req.params.id });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/:id/ledger/:ledgerId', async (req, res) => {
  try {
    await LabourLedger.findByIdAndDelete(req.params.ledgerId);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
