import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mensagem de sucesso vinda do fluxo de recuperação de senha
  const successMsg = location.state?.successMsg || '';

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao autenticar com Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Preencha email e senha.');
      return;
    }
    if (mode === 'register' && !form.name) {
      setError('Informe seu nome.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(form.email, form.password);
      } else {
        await registerWithEmail(form.name, form.email, form.password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-dark-700/80 border border-dark-600 text-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder-slate-500 outline-none';

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #4f6ef7, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #4f6ef7, transparent 60%)' }}
        />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md fade-in-up">
        <div
          className="rounded-2xl p-8 border border-dark-600/50 shadow-2xl"
          style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(24px)' }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8 relative">
            {/* Efeito de brilho atrás da logo */}
            <div className="absolute top-0 w-20 h-20 bg-primary-500/30 rounded-full blur-xl animate-pulse" />
            
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center relative z-10 mb-4 transition-transform hover:scale-105">
              <img src="/logo.png" alt="Smart Cash Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(79,110,247,0.5)]" />
            </div>
            <h1 className="text-2xl font-bold gradient-text text-center">Smart Cash Monitor</h1>
            <p className="text-slate-400 text-sm mt-1">
              {mode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta gratuitamente'}
            </p>
          </div>

          {/* Banner de sucesso (vindo do reset de senha) */}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl px-4 py-3 flex items-center gap-2 mb-5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Botão Google */}
          <div className="flex justify-center mb-6">
            <div className="w-full" style={{ colorScheme: 'dark' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Falha no login com Google.')}
                theme="filled_black"
                shape="rectangular"
                size="large"
                width="100%"
                text={mode === 'login' ? 'signin_with' : 'signup_with'}
                locale="pt-BR"
              />
            </div>
          </div>

          {/* Separador */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-dark-600" />
            <span className="text-xs text-slate-500 font-medium">ou</span>
            <div className="flex-1 h-px bg-dark-600" />
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="fade-in-up">
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Nome completo</label>
                <input
                  id="input-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  className={inputClass}
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Email</label>
              <input
                id="input-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className={inputClass}
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">Senha</label>
                {mode === 'login' && (
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Esqueci minha senha
                  </Link>
                )}
              </div>
              <input
                id="input-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                className={inputClass}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-4 py-3 flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              id="btn-submit-auth"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/20 mt-2"
            >
              {loading
                ? 'Aguarde...'
                : mode === 'login'
                ? 'Entrar'
                : 'Criar conta'}
            </button>
          </form>

          {/* Toggle login/cadastro */}
          <p className="text-center text-sm text-slate-500 mt-6">
            {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              id="btn-toggle-mode"
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
                setForm({ name: '', email: '', password: '' });
              }}
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              {mode === 'login' ? 'Criar conta' : 'Fazer login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
