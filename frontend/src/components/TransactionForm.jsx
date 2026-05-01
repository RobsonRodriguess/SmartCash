import { useState } from 'react';
import { createTransaction } from '../services/api';

const CATEGORIES = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde',
  'Educação', 'Lazer', 'Salário', 'Freelance', 'Investimentos', 'Outros',
];

const defaultForm = {
  description: '',
  amount: '',
  category: '',
  type: 'expense',
  date: new Date().toISOString().split('T')[0],
};

export default function TransactionForm({ onTransactionAdded }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.description || !form.amount || !form.category) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      await createTransaction({
        ...form,
        amount: parseFloat(form.amount),
      });
      setForm(defaultForm);
      onTransactionAdded(); // Dispara refresh no Dashboard
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar transação.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-dark-700 border border-dark-600 text-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder-slate-500';

  return (
    <div className="glass-card p-6 fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
          <span className="text-xl">➕</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Nova Transação</h2>
          <p className="text-xs text-slate-400">Registre entradas e saídas</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" id="transaction-form">
        {/* Tipo */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            id="btn-income"
            onClick={() => setForm((p) => ({ ...p, type: 'income' }))}
            className={`py-3 rounded-xl text-sm font-medium transition-all ${
              form.type === 'income'
                ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                : 'bg-dark-700 border-2 border-dark-600 text-slate-400 hover:border-emerald-500/50'
            }`}
          >
            📈 Entrada
          </button>
          <button
            type="button"
            id="btn-expense"
            onClick={() => setForm((p) => ({ ...p, type: 'expense' }))}
            className={`py-3 rounded-xl text-sm font-medium transition-all ${
              form.type === 'expense'
                ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                : 'bg-dark-700 border-2 border-dark-600 text-slate-400 hover:border-red-500/50'
            }`}
          >
            📉 Saída
          </button>
        </div>

        {/* Descrição */}
        <div>
          <label className="text-xs font-medium text-slate-400 mb-1.5 block">Descrição *</label>
          <input
            id="input-description"
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Ex: Conta de luz"
            className={inputClass}
          />
        </div>

        {/* Valor + Categoria */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Valor (R$) *</label>
            <input
              id="input-amount"
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0,00"
              min="0.01"
              step="0.01"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Categoria *</label>
            <select
              id="select-category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Selecione...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data */}
        <div>
          <label className="text-xs font-medium text-slate-400 mb-1.5 block">Data</label>
          <input
            id="input-date"
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-4 py-2">
            ⚠️ {error}
          </div>
        )}

        <button
          id="btn-submit-transaction"
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/20"
        >
          {loading ? 'Salvando...' : 'Salvar Transação'}
        </button>
      </form>
    </div>
  );
}
