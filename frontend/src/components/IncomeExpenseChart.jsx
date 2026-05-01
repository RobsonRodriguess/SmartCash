import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-700 border border-dark-600 rounded-xl p-3 shadow-xl text-sm">
        <p className="text-slate-300 font-medium mb-2">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.color }} className="font-semibold">
            {entry.name}: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function IncomeExpenseChart({ transactions }) {
  // Agrupa transações por mês
  const monthData = transactions.reduce((acc, t) => {
    const date = new Date(t.date);
    const key = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

    if (!acc[key]) acc[key] = { month: key, Entradas: 0, Saídas: 0 };

    if (t.type === 'income') acc[key].Entradas += t.amount;
    else acc[key].Saídas += t.amount;

    return acc;
  }, {});

  // Ordena pelos 6 meses mais recentes
  const data = Object.values(monthData).slice(-6);

  if (!data.length) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-slate-400 text-sm">Nenhum dado para exibir.</p>
          <p className="text-slate-500 text-xs mt-1">Adicione transações para ver o gráfico.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
          <span className="text-xl">📊</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Entradas vs Saídas</h2>
          <p className="text-xs text-slate-400">Comparativo mensal</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79,110,247,0.05)' }} />
          <Legend
            wrapperStyle={{ fontSize: '13px', color: '#94a3b8', paddingTop: '16px' }}
          />
          <Bar dataKey="Entradas" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
          <Bar dataKey="Saídas" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
