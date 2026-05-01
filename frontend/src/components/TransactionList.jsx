import { deleteTransaction } from '../services/api';
import { useState, useMemo } from 'react';

const formatCurrency = (val) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

const CATEGORIES = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde',
  'Educação', 'Lazer', 'Salário', 'Freelance', 'Investimentos', 'Outros',
];

const getWalletColor = (wallet) => {
  switch (wallet) {
    case 'Nubank': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'Itaú': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'Dinheiro': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'Mercado Pago': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    case 'PicPay': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'Banco Pan': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
};

export default function TransactionList({ transactions, onDeleted, onEdit }) {
  const [deletingId, setDeletingId] = useState(null);

  // Estados dos filtros
  const [filterMonth, setFilterMonth] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

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

  // Meses únicos disponíveis nas transações (para o select de meses)
  const uniqueMonths = useMemo(() => {
    const months = transactions.map((t) => t.date.substring(0, 7)); // "YYYY-MM"
    return [...new Set(months)].sort().reverse(); // Mais recentes primeiro
  }, [transactions]);

  // Aplica os filtros
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType && t.type !== filterType) return false;
      if (filterCategory && t.category !== filterCategory) return false;
      if (filterMonth && t.date.substring(0, 7) !== filterMonth) return false;
      if (filterSearch) {
        const searchLower = filterSearch.toLowerCase();
        const matchesDesc = t.description.toLowerCase().includes(searchLower);
        const matchesWallet = (t.wallet || 'Dinheiro').toLowerCase().includes(searchLower);
        if (!matchesDesc && !matchesWallet) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterCategory, filterMonth, filterSearch]);

  if (!transactions.length) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-40">
        <div className="text-center">
          <div className="flex justify-center mb-2 text-slate-400">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
          </div>
          <p className="text-slate-400 text-sm">Nenhuma transação registrada.</p>
        </div>
      </div>
    );
  }

  const selectClass = "bg-dark-700/80 border border-dark-600 text-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none w-full";

  return (
    <div className="glass-card p-6 fade-in-up">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
        </div>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Extrato</h2>
            <p className="text-xs text-slate-400">{filteredTransactions.length} de {transactions.length} transações</p>
          </div>
          {(filterMonth || filterType || filterCategory || filterSearch) && (
            <button
              onClick={() => { setFilterMonth(''); setFilterType(''); setFilterCategory(''); setFilterSearch(''); }}
              className="text-xs text-primary-400 hover:text-primary-300"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="space-y-3 mb-5">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nome da conta ou banco (ex: Luz, Nubank)..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="w-full bg-dark-700/80 border border-dark-600 text-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none placeholder-slate-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className={selectClass}>
            <option value="">Todos os meses</option>
            {uniqueMonths.map(m => {
              const [year, month] = m.split('-');
              const dateObj = new Date(year, month - 1);
              const label = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
              return <option key={m} value={m}>{label.charAt(0).toUpperCase() + label.slice(1)}</option>;
            })}
          </select>

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectClass}>
            <option value="">Todos os tipos</option>
            <option value="income">Entradas</option>
            <option value="expense">Saídas</option>
          </select>

          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={selectClass}>
            <option value="">Todas as categorias</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Nenhuma transação encontrada com estes filtros.
          </div>
        ) : (
          filteredTransactions.map((t) => (
            <div
              key={t._id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-dark-700/60 border border-dark-600/50 hover:border-primary-500/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className={`flex items-center justify-center w-8 h-8 rounded-full ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {t.type === 'income' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
                  )}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    {t.description}
                    {t.installment && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary-500/10 text-primary-400 border border-primary-500/20">
                        {t.installment.current}/{t.installment.total}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                    <span>{t.category} · {formatDate(t.date)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getWalletColor(t.wallet || 'Dinheiro')}`}>
                      {t.wallet || 'Dinheiro'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                >
                  {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                </span>
                <button
                  onClick={() => onEdit(t)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-blue-400 transition-all flex items-center justify-center"
                  title="Editar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
                <button
                  onClick={() => handleDelete(t._id)}
                  disabled={deletingId === t._id}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all disabled:opacity-50 flex items-center justify-center"
                  title="Remover"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
