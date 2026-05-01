/**
 * InsightFlow Card
 * Exibe o status do fluxo de caixa baseado na resposta da API de insights.
 * - alert: true  → Fundo vermelho + mensagem de alerta pulsante
 * - alert: false → Fundo verde + mensagem de saúde financeira
 */
export default function InsightCard({ insight, loading }) {
  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-dark-600"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-dark-600 rounded w-1/3"></div>
            <div className="h-6 bg-dark-600 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!insight) return null;

  const isAlert = insight.alert;

  return (
    <div
      id="insight-flow-card"
      className={`relative overflow-hidden rounded-2xl p-6 fade-in-up transition-all duration-500 ${
        isAlert
          ? 'bg-gradient-to-r from-red-900/60 to-red-800/40 border border-red-500/40 alert-pulse'
          : 'bg-gradient-to-r from-emerald-900/60 to-emerald-800/40 border border-emerald-500/40'
      }`}
    >
      {/* Glow background */}
      <div
        className={`absolute inset-0 opacity-10 ${
          isAlert ? 'bg-red-500' : 'bg-emerald-500'
        }`}
        style={{ filter: 'blur(40px)' }}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Ícone */}
        <div
          className={`w-16 h-16 flex-shrink-0 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${
            isAlert ? 'bg-red-500/20' : 'bg-emerald-500/20'
          }`}
        >
          {isAlert ? '🚨' : '✅'}
        </div>

        {/* Texto */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-bold uppercase tracking-widest ${
                isAlert ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              InsightFlow
            </span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                isAlert
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {isAlert ? 'ALERTA' : 'SAUDÁVEL'}
            </span>
          </div>
          <p className={`text-lg font-semibold ${isAlert ? 'text-red-100' : 'text-emerald-100'}`}>
            {insight.message}
          </p>
          {insight.details && (
            <div className="mt-3 flex flex-wrap gap-4">
              <div>
                <p className="text-xs text-slate-400">Este mês</p>
                <p className={`text-sm font-bold ${isAlert ? 'text-red-300' : 'text-emerald-300'}`}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insight.details.currentMonthTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Mês anterior</p>
                <p className="text-sm font-bold text-slate-300">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insight.details.previousMonthTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Variação</p>
                <p className={`text-sm font-bold ${parseFloat(insight.details.percentageChange) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {parseFloat(insight.details.percentageChange) > 0 ? '+' : ''}
                  {insight.details.percentageChange}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
