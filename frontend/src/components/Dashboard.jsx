import { useState, useEffect, useCallback } from 'react';
import { getTransactions, getInsights } from '../services/api';
import { useAuth } from '../context/AuthContext';
import InsightCard from './InsightCard';
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

  // Calcula totais
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="border-b border-dark-600/50 bg-dark-800/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-base">💹</span>
            </div>
            <div>
              <h1 className="text-base font-bold gradient-text">Smart Cash Monitor</h1>
              <p className="text-xs text-slate-500">Dashboard Financeiro</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Avatar + Nome */}
            {user && (
              <div className="flex items-center gap-2">
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
              </div>
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
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Erro de Conexão</p>
              <p className="text-red-400 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* InsightFlow Card */}
        <InsightCard insight={insight} loading={loadingInsight} />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="Saldo Total" value={balance} icon="💰" colorClass={balance >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          <SummaryCard label="Total Entradas" value={totalIncome} icon="📈" colorClass="text-emerald-400" />
          <SummaryCard label="Total Saídas" value={totalExpense} icon="📉" colorClass="text-red-400" />
        </div>

        {/* Gráfico */}
        {!loadingTx && <IncomeExpenseChart transactions={transactions} />}

        {/* Formulário + Lista */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <TransactionForm onTransactionAdded={fetchData} />
          </div>
          <div className="lg:col-span-3">
            {loadingTx ? (
              <div className="glass-card p-6 animate-pulse h-40 flex items-center justify-center">
                <p className="text-slate-500 text-sm">Carregando transações...</p>
              </div>
            ) : (
              <TransactionList transactions={transactions} onDeleted={fetchData} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
