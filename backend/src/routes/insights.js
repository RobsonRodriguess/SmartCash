const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user._id;

    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const currentMonthExpenses = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const previousMonthExpenses = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const currentTotal = currentMonthExpenses[0]?.total || 0;
    const previousTotal = previousMonthExpenses[0]?.total || 0;

    if (currentTotal === 0 && previousTotal === 0) {
      return res.status(200).json({
        alert: false,
        noData: true,
        message: 'Adicione transações para ativar o InsightFlow.',
        details: { currentMonthTotal: 0, previousMonthTotal: 0, percentageChange: '0.00' },
      });
    }

    let percentageChange = 0;
    if (previousTotal > 0) {
      percentageChange = ((currentTotal - previousTotal) / previousTotal) * 100;
    }

    const ALERT_THRESHOLD = 20;

    if (previousTotal > 0 && percentageChange > ALERT_THRESHOLD) {
      return res.status(200).json({
        alert: true,
        message: `Atenção: Suas despesas subiram mais de 20% em relação ao mês passado. Recomendamos revisão.`,
        details: {
          currentMonthTotal: currentTotal,
          previousMonthTotal: previousTotal,
          percentageChange: percentageChange.toFixed(2),
        },
      });
    }

    return res.status(200).json({
      alert: false,
      message: 'Fluxo de caixa saudável.',
      details: {
        currentMonthTotal: currentTotal,
        previousMonthTotal: previousTotal,
        percentageChange: percentageChange.toFixed(2),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
