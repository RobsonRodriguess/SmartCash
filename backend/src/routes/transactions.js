const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', async (req, res) => {
  try {
    const { description, amount, category, type, date, recurrenceType, installmentsCount, wallet } = req.body;
    // Evita fuso horário jogando a data para o dia anterior (adicionando T12:00:00Z garante meio-dia UTC)
    const baseDate = date ? new Date(date.includes('T') ? date : date + 'T12:00:00Z') : new Date();
    
    if (!recurrenceType || recurrenceType === 'none') {
      const transaction = await Transaction.create({
        userId: req.user._id,
        description,
        amount,
        category,
        type,
        date: baseDate,
        wallet,
      });
      return res.status(201).json({ success: true, data: transaction });
    }

    const mongoose = require('mongoose');
    const groupId = new mongoose.Types.ObjectId().toString();
    const transactions = [];

    if (recurrenceType === 'installment') {
      const count = parseInt(installmentsCount) || 1;
      const installmentAmount = amount / count;

      for (let i = 1; i <= count; i++) {
        const txDate = new Date(baseDate);
        txDate.setMonth(txDate.getMonth() + (i - 1));

        transactions.push({
          userId: req.user._id,
          description,
          amount: installmentAmount,
          category,
          type,
          date: txDate,
          wallet,
          groupId,
          installment: { current: i, total: count },
        });
      }
    } else if (recurrenceType === 'subscription') {
      // Projeta 12 meses para o futuro
      for (let i = 1; i <= 12; i++) {
        const txDate = new Date(baseDate);
        txDate.setMonth(txDate.getMonth() + (i - 1));

        transactions.push({
          userId: req.user._id,
          description,
          amount,
          category,
          type,
          date: txDate,
          wallet,
          groupId,
          installment: { current: i, total: 12 }, // Marcamos a assinatura como 1 a 12 para controle visual opcional
        });
      }
    }

    const createdTransactions = await Transaction.insertMany(transactions);
    res.status(201).json({ success: true, data: createdTransactions });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1 });
    res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transação não encontrada.' });
    }
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.date) {
      updateData.date = new Date(updateData.date.includes('T') ? updateData.date : updateData.date + 'T12:00:00Z');
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transação não encontrada.' });
    }
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transação não encontrada.' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
