import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getTransactions, getInsights } from '../services/api';
import { useAuth } from '../context/AuthContext';
import IncomeExpenseChart from './IncomeExpenseChart';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';


const formatCurrency = (val) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

function SummaryCard({ label, value, icon, colorClass }) {
  return (
    <div className="glass-card p-5 fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${colorClass}`}>{formatCurrency(value)}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [insight, setInsight] = useState(null);
  const [loadingTx, setLoadingTx] = useState(true);
  const [loadingInsight, setLoadingInsight] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setError('');
    try {
      const [txData, insightData] = await Promise.all([
        getTransactions(),
        getInsights(),
      ]);
      setTransactions(txData);
      setInsight(insightData);
    } catch (err) {
      setError('Não foi possível conectar à API. Verifique se o servidor está rodando.');
      console.error(err);
    } finally {
      setLoadingTx(false);
      setLoadingInsight(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calcula totais baseados SOMENTE até o dia de hoje (Saldo Real)
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const pastAndPresentTransactions = transactions.filter(t => new Date(t.date) <= today);

  const totalIncome = pastAndPresentTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = pastAndPresentTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="border-b border-dark-600/50 bg-dark-800/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.png" alt="Smart Cash Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-base font-bold gradient-text">Smart Cash Monitor</h1>
              <p className="text-xs text-slate-500">Dashboard Financeiro</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Avatar + Nome */}
            {user && (
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title="Configurações de Perfil">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border-2 border-primary-500/40 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-slate-300 hidden sm:block">{user.name}</span>
              </Link>
            )}
            {/* Botão Logout */}
            <button
              id="btn-logout"
              onClick={logout}
              title="Sair"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-dark-600 hover:border-red-500/30 transition-all"
            >
              Sair
            </button>
          </div>
        </div>
      </header>


      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Erro de conexão */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-5 py-4 text-sm flex items-center gap-3">
            <span className="text-xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </span>
            <div>
              <p className="font-semibold">Erro de Conexão</p>
              <p className="text-red-400 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="Saldo Total" value={balance} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>} colorClass={balance >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          <SummaryCard label="Total Entradas" value={totalIncome} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>} colorClass="text-emerald-400" />
          <SummaryCard label="Total Saídas" value={totalExpense} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>} colorClass="text-red-400" />
        </div>

        {/* Saldos por Carteira */}
        <div className="glass-card p-4 fade-in-up">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Saldos Reais por Carteira (Hoje)</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { name: 'Nubank', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
              { name: 'Itaú', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
              { name: 'Dinheiro', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
              { name: 'Mercado Pago', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
              { name: 'PicPay', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
              { name: 'Banco Pan', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
              { name: 'Outros', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' }
            ].map(w => {
              const wTx = pastAndPresentTransactions.filter(t => (t.wallet || 'Dinheiro') === w.name);
              const wInc = wTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
              const wExp = wTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
              const wBal = wInc - wExp;
              
              if (wTx.length === 0 && wBal === 0) return null; // Esconde se não tiver transações e saldo zero

              return (
                <div key={w.name} className={`px-4 py-2 rounded-xl border ${w.color} flex flex-col min-w-[120px]`}>
                  <span className="text-[10px] font-bold uppercase opacity-80">{w.name}</span>
                  <span className="text-sm font-medium">{formatCurrency(wBal)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfico */}
        {!loadingTx && <IncomeExpenseChart transactions={transactions} />}

        {/* Formulário + Lista */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <TransactionForm 
              onTransactionSaved={() => {
                setEditingTransaction(null);
                fetchData();
              }}
              editingTransaction={editingTransaction}
              onCancelEdit={() => setEditingTransaction(null)}
            />
          </div>
          <div className="lg:col-span-3">
            {loadingTx ? (
              <div className="glass-card p-6 animate-pulse h-40 flex items-center justify-center">
                <p className="text-slate-500 text-sm">Carregando transações...</p>
              </div>
            ) : (
              <TransactionList 
                transactions={transactions} 
                onDeleted={fetchData}
                onEdit={(tx) => setEditingTransaction(tx)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
