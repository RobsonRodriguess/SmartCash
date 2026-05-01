import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
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
  // Agrupa transações por dia (para não ficar travado no mês)
  const dailyData = transactions.reduce((acc, t) => {
    const date = new Date(t.date);
    // Formato: 01/05
    const key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    if (!acc[key]) acc[key] = { dateKey: key, Entradas: 0, Saídas: 0, timestamp: date.getTime() };

    if (t.type === 'income') acc[key].Entradas += t.amount;
    else acc[key].Saídas += t.amount;

    return acc;
  }, {});

  // Ordena por data (crescente) e pega os últimos 14 dias com movimento
  const data = Object.values(dailyData)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-14);

  if (!data.length) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="flex justify-center mb-2 text-slate-400">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <p className="text-slate-400 text-sm">Nenhum dado para exibir.</p>
          <p className="text-slate-500 text-xs mt-1">Adicione transações para ver o gráfico.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Fluxo Diário</h2>
          <p className="text-xs text-slate-400">Entradas vs Saídas por dia</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={6}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="dateKey"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79,110,247,0.05)' }} />
          <Legend
            wrapperStyle={{ fontSize: '13px', color: '#94a3b8', paddingTop: '16px' }}
          />
          <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
