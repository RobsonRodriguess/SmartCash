import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword, verifyResetCode, resetPassword } from '../services/api';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const HAS_SPECIAL = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;

function PasswordStrength({ password }) {
  const checks = {
    length: password.length >= 6,
    special: HAS_SPECIAL.test(password),
    upper: /[A-Z]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const bars = [
    { threshold: 1, color: '#ef4444', label: 'Fraca' },
    { threshold: 2, color: '#f59e0b', label: 'Média' },
    { threshold: 3, color: '#10b981', label: 'Forte' },
  ];
  const active = bars.find((b) => score <= b.threshold) || bars[2];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: score >= i ? active.color : 'rgba(79,110,247,0.1)' }}
          />
        ))}
      </div>
      <div className="flex gap-4 text-xs text-slate-500">
        <span style={{ color: checks.length ? '#10b981' : undefined }}>
          {checks.length ? '✓' : '○'} Mín. 6 caracteres
        </span>
        <span style={{ color: checks.special ? '#10b981' : undefined }}>
          {checks.special ? '✓' : '○'} 1 caractere especial
        </span>
      </div>
    </div>
  );
}

/* ─── OTP Input (6 caixas individuais) ────────────────────────────────────── */
function OtpInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.padEnd(6, '').split('');

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = [...digits];
      if (next[i]) {
        next[i] = '';
        onChange(next.join('').trim());
      } else if (i > 0) {
        inputs.current[i - 1]?.focus();
      }
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const next = [...digits];
    next[i] = e.key;
    onChange(next.join('').replace(' ', ''));
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] === ' ' ? '' : digits[i]}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="w-12 h-14 text-center text-2xl font-bold rounded-xl border transition-all outline-none"
          style={{
            background: 'rgba(26,30,42,0.9)',
            border: digits[i] && digits[i] !== ' '
              ? '2px solid #4f6ef7'
              : '1px solid rgba(79,110,247,0.2)',
            color: '#e2e8f0',
            caretColor: '#4f6ef7',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Backgrounds decorativos ─────────────────────────────────────────────── */
function Blobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #4f6ef7, transparent 70%)' }} />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
    </div>
  );
}

/* ─── Componente principal ────────────────────────────────────────────────── */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep]           = useState(1); // 1 | 2 | 3
  const [email, setEmail]         = useState('');
  const [code, setCode]           = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPass, setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const inputCls =
    'w-full bg-dark-700/80 border border-dark-600 text-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder-slate-500 outline-none';

  /* ── Passo 1: enviar e-mail ── */
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) { setError('Informe seu e-mail.'); return; }
    setLoading(true); setError('');
    try {
      await forgotPassword(email);
      setSuccess('Código enviado! Verifique sua caixa de entrada.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao enviar o código.');
    } finally { setLoading(false); }
  };

  /* ── Passo 2: verificar código ── */
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (code.length !== 6) { setError('Digite os 6 dígitos do código.'); return; }
    setLoading(true); setError('');
    try {
      const { resetToken: token } = await verifyResetCode(email, code);
      setResetToken(token);
      setSuccess('Código verificado! Agora defina sua nova senha.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Código inválido ou expirado.');
    } finally { setLoading(false); }
  };

  /* ── Passo 3: nova senha ── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPass.length < 6) { setError('A senha deve ter no mínimo 6 caracteres.'); return; }
    if (!HAS_SPECIAL.test(newPass)) { setError('A senha deve conter pelo menos 1 caractere especial.'); return; }
    if (newPass !== confirmPass) { setError('As senhas não coincidem.'); return; }
    setLoading(true);
    try {
      await resetPassword(resetToken, newPass);
      navigate('/login', { state: { successMsg: 'Senha alterada com sucesso! Faça login com a nova senha.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao redefinir a senha.');
    } finally { setLoading(false); }
  };

  /* ── Steps info ── */
  const steps = [
    { n: 1, label: 'E-mail' },
    { n: 2, label: 'Código' },
    { n: 3, label: 'Nova senha' },
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      <Blobs />

      <div className="relative w-full max-w-md fade-in-up">
        <div
          className="rounded-2xl p-8 border border-dark-600/50 shadow-2xl"
          style={{ background: 'rgba(15,23,42,0.88)', backdropFilter: 'blur(24px)' }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/30 mb-3">
              <span className="text-2xl">💹</span>
            </div>
            <h1 className="text-xl font-bold gradient-text">Smart Cash Monitor</h1>
            <p className="text-slate-400 text-sm mt-1">Recuperar senha</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-7">
            {steps.map((s, idx) => (
              <div key={s.n} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                    style={{
                      background: step >= s.n
                        ? 'linear-gradient(135deg,#4f6ef7,#a78bfa)'
                        : 'rgba(79,110,247,0.1)',
                      color: step >= s.n ? '#fff' : '#475569',
                      boxShadow: step === s.n ? '0 0 16px rgba(79,110,247,0.5)' : 'none',
                    }}
                  >
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span className="text-[10px] text-slate-500">{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className="w-10 h-px mb-4 transition-all duration-500"
                    style={{ background: step > s.n ? '#4f6ef7' : 'rgba(79,110,247,0.2)' }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* ── Alerts ── */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}
          {success && step > 1 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
              <span>✅</span><span>{success}</span>
            </div>
          )}

          {/* ══════════ PASSO 1 — E-mail ══════════ */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4 fade-in-up">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                  E-mail cadastrado
                </label>
                <input
                  id="input-forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="seu@email.com"
                  className={inputCls}
                  autoFocus
                />
                <p className="text-xs text-slate-600 mt-1.5">
                  Enviaremos um código de 6 dígitos para este endereço.
                </p>
              </div>
              <button
                id="btn-send-code"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/20"
              >
                {loading ? 'Enviando...' : 'Enviar código →'}
              </button>
            </form>
          )}

          {/* ══════════ PASSO 2 — Código OTP ══════════ */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-5 fade-in-up">
              <div>
                <p className="text-xs text-slate-400 text-center mb-4">
                  Digite o código de 6 dígitos enviado para{' '}
                  <strong className="text-primary-400">{email}</strong>
                </p>
                <OtpInput value={code} onChange={(v) => { setCode(v); setError(''); }} />
                <p className="text-xs text-slate-600 text-center mt-3">⏱ Válido por 15 minutos</p>
              </div>
              <button
                id="btn-verify-code"
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/20"
              >
                {loading ? 'Verificando...' : 'Verificar código →'}
              </button>
              <button
                type="button"
                onClick={() => { setStep(1); setCode(''); setError(''); setSuccess(''); }}
                className="w-full text-xs text-slate-500 hover:text-primary-400 transition-colors"
              >
                ← Não recebi o código — tentar novamente
              </button>
            </form>
          )}

          {/* ══════════ PASSO 3 — Nova senha ══════════ */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4 fade-in-up">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    id="input-new-password"
                    type={showPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={(e) => { setNewPass(e.target.value); setError(''); }}
                    placeholder="Mínimo 6 caracteres + 1 especial"
                    className={inputCls + ' pr-11'}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                <PasswordStrength password={newPass} />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                  Confirmar nova senha
                </label>
                <input
                  id="input-confirm-password"
                  type={showPass ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={(e) => { setConfirmPass(e.target.value); setError(''); }}
                  placeholder="Repita a nova senha"
                  className={inputCls}
                />
                {confirmPass && newPass !== confirmPass && (
                  <p className="text-xs text-red-400 mt-1">As senhas não coincidem.</p>
                )}
                {confirmPass && newPass === confirmPass && confirmPass.length > 0 && (
                  <p className="text-xs text-emerald-400 mt-1">✓ As senhas coincidem.</p>
                )}
              </div>

              <button
                id="btn-reset-password"
                type="submit"
                disabled={loading || !newPass || !confirmPass}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/20 mt-2"
              >
                {loading ? 'Salvando...' : '🔐 Redefinir senha'}
              </button>
            </form>
          )}

          {/* Link voltar ao login */}
          <p className="text-center text-sm text-slate-600 mt-6">
            Lembrou a senha?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
