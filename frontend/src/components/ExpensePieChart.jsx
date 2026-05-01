import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#f43f5e', // rose
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-dark-700 border border-dark-600 rounded-xl p-3 shadow-xl text-sm">
        <p className="text-slate-300 font-medium mb-1">{data.name}</p>
        <p className="font-semibold text-red-400">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function ExpensePieChart({ transactions }) {
  // Pega apenas as despesas até a data de hoje (para não distorcer com o futuro)
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const expenses = transactions.filter(t => t.type === 'expense' && new Date(t.date) <= today);

  const categoryData = expenses.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = 0;
    acc[t.category] += t.amount;
    return acc;
  }, {});

  const data = Object.keys(categoryData)
    .map(key => ({ name: key, value: categoryData[key] }))
    .sort((a, b) => b.value - a.value); // Ordena do maior para o menor

  if (!data.length) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-80 fade-in-up">
        <div className="text-center">
          <p className="text-4xl mb-2">🍕</p>
          <p className="text-slate-400 text-sm">Nenhuma despesa para exibir.</p>
          <p className="text-slate-500 text-xs mt-1">Seus gastos por categoria aparecerão aqui.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 fade-in-up flex flex-col h-full">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <span className="text-xl">🍕</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Para onde vai o dinheiro?</h2>
          <p className="text-xs text-slate-400">Distribuição de gastos por categoria</p>
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
