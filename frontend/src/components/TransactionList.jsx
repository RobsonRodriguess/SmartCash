import { deleteTransaction } from '../services/api';
import { useState } from 'react';

const formatCurrency = (val) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function TransactionList({ transactions, onDeleted }) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm('Remover esta transação?')) return;
    setDeletingId(id);
    try {
      await deleteTransaction(id);
      onDeleted();
    } catch (err) {
      console.error('Erro ao deletar:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!transactions.length) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-40">
        <div className="text-center">
          <p className="text-3xl mb-2">💳</p>
          <p className="text-slate-400 text-sm">Nenhuma transação registrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 fade-in-up">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
          <span className="text-xl">💳</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Extrato</h2>
          <p className="text-xs text-slate-400">{transactions.length} transações</p>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {transactions.map((t) => (
          <div
            key={t._id}
            className="flex items-center justify-between p-3.5 rounded-xl bg-dark-700/60 border border-dark-600/50 hover:border-primary-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {t.type === 'income' ? '📈' : '📉'}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-200">{t.description}</p>
                <p className="text-xs text-slate-500">
                  {t.category} · {formatDate(t.date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-bold ${
                  t.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
              </span>
              <button
                onClick={() => handleDelete(t._id)}
                disabled={deletingId === t._id}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 text-xs transition-all disabled:opacity-50"
                title="Remover"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
