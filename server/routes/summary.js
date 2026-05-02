const express = require('express');
const router = express.Router();
const { EggDistribution, FeedUsage, MedicineUsage, Labour, MiscExpense } = require('../models');

router.get('/', async (req, res) => {
  try {
    const today = new Date();
    
    // Support custom date range via query params, default to current month
    const startDate = req.query.start
      ? new Date(req.query.start)
      : new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = req.query.end
      ? new Date(new Date(req.query.end).setHours(23, 59, 59, 999))
      : new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const dateFilter = { date: { $gte: startDate, $lte: endDate } };

    const [dist, feed, med, labour, misc, allMisc] = await Promise.all([
      EggDistribution.find(dateFilter),
      FeedUsage.find(dateFilter),
      MedicineUsage.find(dateFilter),
      Labour.find(),
      MiscExpense.find(dateFilter).sort({ date: -1 }),
      MiscExpense.find().sort({ date: -1 }).limit(30),
    ]);

    const totalEggRevenue = dist.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalFeedCost = feed.reduce((acc, curr) => acc + curr.cost, 0);
    const totalMedCost = med.reduce((acc, curr) => acc + curr.cost, 0);
    const totalSalaries = labour.reduce((acc, curr) => acc + curr.salary, 0);
    const totalMisc = misc.reduce((acc, curr) => acc + curr.amount, 0);
    const netProfit = totalEggRevenue - totalFeedCost - totalMedCost - totalSalaries - totalMisc;

    // Group revenue by day for chart
    const chartDataMap = {};
    dist.forEach(d => {
      const date = new Date(d.date);
      const day = date.getDate();
      const month = date.toLocaleString('en-GB', { month: 'long' });
      const year = date.getFullYear();
      const dateStr = `${day}/${month}/${year}`;
      chartDataMap[dateStr] = (chartDataMap[dateStr] || 0) + d.totalAmount;
    });
    const chartData = Object.keys(chartDataMap).map(k => ({ name: k, revenue: chartDataMap[k] }));

    res.json({
      metrics: { totalEggRevenue, totalFeedCost, totalMedCost, totalSalaries, totalMisc, netProfit },
      chartData,
      misc: allMisc, // always return recent 30 for the table
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Misc Expenses CRUD
router.post('/misc', async (req, res) => {
  try {
    const expense = await MiscExpense.create(req.body);
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/misc/:id', async (req, res) => {
  try {
    await MiscExpense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
