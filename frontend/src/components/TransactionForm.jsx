import { useState, useEffect } from 'react';
import { createTransaction, updateTransaction } from '../services/api';

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
  wallet: 'Dinheiro',
  recurrenceType: 'none', // 'none', 'installment', 'subscription'
  installmentsCount: 2,
};

export default function TransactionForm({ onTransactionSaved, editingTransaction, onCancelEdit }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setForm({
        description: editingTransaction.description,
        amount: editingTransaction.amount,
        category: editingTransaction.category,
        type: editingTransaction.type,
        date: new Date(editingTransaction.date).toISOString().split('T')[0],
        wallet: editingTransaction.wallet || 'Dinheiro',
        recurrenceType: 'none', // não editamos recorrência de transações já criadas
        installmentsCount: 2,
      });
      setError('');
    } else {
      setForm(defaultForm);
    }
  }, [editingTransaction]);

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
      const dataToSave = {
        ...form,
        amount: parseFloat(form.amount),
        installmentsCount: parseInt(form.installmentsCount) || 1,
      };

      if (editingTransaction) {
        // ao editar, enviamos apenas dados básicos, não geramos novas parcelas
        const { recurrenceType, installmentsCount, ...updateData } = dataToSave;
        await updateTransaction(editingTransaction._id, updateData);
      } else {
        await createTransaction(dataToSave);
      }

      setForm(defaultForm);
      if (onTransactionSaved) onTransactionSaved();
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingTransaction ? 'bg-blue-500/20 text-blue-400' : 'bg-primary-500/20 text-primary-400'}`}>
            <span className="flex items-center justify-center">
              {editingTransaction ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              )}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </h2>
            <p className="text-xs text-slate-400">Registre entradas e saídas</p>
          </div>
        </div>
        {editingTransaction && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg bg-dark-600 hover:bg-dark-500"
          >
            Cancelar
          </button>
        )}
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
            <span className="flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              Entrada
            </span>
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
            <span className="flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
              Saída
            </span>
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

        {/* Data + Carteira */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Data inicial</label>
            <input
              id="input-date"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Carteira / Banco</label>
            <select
              name="wallet"
              value={form.wallet}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="Dinheiro">Dinheiro</option>
              <option value="Nubank">Nubank</option>
              <option value="Itaú">Itaú</option>
              <option value="Mercado Pago">Mercado Pago</option>
              <option value="PicPay">PicPay</option>
              <option value="Banco Pan">Banco Pan</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
        </div>

        {/* Recorrência (Apenas na criação) */}
        {!editingTransaction && (
          <div className="bg-dark-800/50 p-4 rounded-xl border border-dark-600/50 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.recurrenceType !== 'none'}
                onChange={(e) =>
                  setForm((p) => ({ ...p, recurrenceType: e.target.checked ? 'installment' : 'none' }))
                }
                className="w-4 h-4 rounded border-dark-500 bg-dark-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-800"
              />
              <span className="text-sm font-medium text-slate-300">Repetir transação?</span>
            </label>

            {form.recurrenceType !== 'none' && (
              <div className="pl-6 space-y-3 mt-2 border-l-2 border-dark-600">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="recurrenceType"
                      value="installment"
                      checked={form.recurrenceType === 'installment'}
                      onChange={handleChange}
                      className="text-primary-500 bg-dark-700 border-dark-500 focus:ring-primary-500"
                    />
                    Parcelado
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="recurrenceType"
                      value="subscription"
                      checked={form.recurrenceType === 'subscription'}
                      onChange={handleChange}
                      className="text-primary-500 bg-dark-700 border-dark-500 focus:ring-primary-500"
                    />
                    Assinatura (Fixo)
                  </label>
                </div>

                {form.recurrenceType === 'installment' && (
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Número de parcelas</label>
                    <input
                      type="number"
                      name="installmentsCount"
                      value={form.installmentsCount}
                      onChange={handleChange}
                      min="2"
                      max="72"
                      className="w-full bg-dark-700 border border-dark-600 text-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      O valor total será dividido por {form.installmentsCount || 1}.
                    </p>
                  </div>
                )}
                {form.recurrenceType === 'subscription' && (
                  <p className="text-[10px] text-slate-500">
                    O mesmo valor será repetido por 12 meses.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-4 py-2 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>{error}</span>
          </div>
        )}

        <button
          id="btn-submit-transaction"
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg ${
            editingTransaction 
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-500/20'
              : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-primary-500/20'
          }`}
        >
          {loading ? 'Salvando...' : (editingTransaction ? 'Salvar Alterações' : 'Salvar Transação')}
        </button>
      </form>
    </div>
  );
}
