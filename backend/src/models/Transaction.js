const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    // cada transação pertence a um usuário — isolamento total de dados
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Usuário é obrigatório'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Descrição é obrigatória'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Valor é obrigatório'],
      min: [0.01, 'O valor deve ser positivo'],
    },
    category: {
      type: String,
      required: [true, 'Categoria é obrigatória'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense'],
        message: 'Tipo deve ser "income" ou "expense"',
      },
      required: [true, 'Tipo é obrigatório'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', TransactionSchema);
