const express = require('express');
const router = express.Router();
const { Dealer, DealerLedger } = require('../models');

// Get all dealers
router.get('/', async (req, res) => {
  try {
    const dealers = await Dealer.find().sort({ createdAt: -1 });
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dealers' });
  }
});

// Create new dealer
router.post('/', async (req, res) => {
  try {
    const newDealer = await Dealer.create(req.body);
    res.status(201).json(newDealer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create dealer' });
  }
});

// Get dealer ledger
router.get('/:id/ledger', async (req, res) => {
  try {
    const ledger = await DealerLedger.find({ dealerId: req.params.id }).sort({ date: -1 });
    res.json(ledger);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ledger' });
  }
});

// Add ledger entry
router.post('/:id/ledger', async (req, res) => {
  try {
    const entry = await DealerLedger.create({ ...req.body, dealerId: req.params.id });
    
    // Update balance
    const dealer = await Dealer.findById(req.params.id);
    if (entry.type === 'CREDIT_GIVEN') {
      dealer.balance += entry.amount;
    } else {
      dealer.balance -= entry.amount;
    }
    await dealer.save();

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add ledger entry' });
  }
});

// Edit dealer
router.put('/:id', async (req, res) => {
  try {
    const dealer = await Dealer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(dealer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update dealer' });
  }
});

// Delete dealer
router.delete('/:id', async (req, res) => {
  try {
    await DealerLedger.deleteMany({ dealerId: req.params.id });
    await Dealer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete dealer' });
  }
});

// Delete ledger entry
router.delete('/:dealerId/ledger/:ledgerId', async (req, res) => {
  try {
    const entry = await DealerLedger.findById(req.params.ledgerId);
    if (!entry) return res.status(404).json({ error: 'Not found' });
    
    // Reverse balance
    const dealer = await Dealer.findById(req.params.dealerId);
    if (entry.type === 'CREDIT_GIVEN') {
      dealer.balance -= entry.amount;
    } else {
      dealer.balance += entry.amount;
    }
    await dealer.save();
    
    await DealerLedger.findByIdAndDelete(req.params.ledgerId);
    res.json({ message: 'Deleted ledger entry' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ledger entry' });
  }
});

module.exports = router;
