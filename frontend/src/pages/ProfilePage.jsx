import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePassword } from '../services/api';

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

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUserSession, logout } = useAuth();

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    avatar: user?.avatar || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  const inputClass =
    'w-full bg-dark-700/80 border border-dark-600 text-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder-slate-500 outline-none';

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    setProfileSuccess('');
    setProfileError('');
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPassSuccess('');
    setPassError('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      setProfileError('O nome não pode ficar vazio.');
      return;
    }
    setProfileLoading(true);
    try {
      const updatedUser = await updateProfile({
        name: profileForm.name,
        avatar: profileForm.avatar || null,
      });
      updateUserSession(updatedUser);
      setProfileSuccess('Perfil atualizado com sucesso!');
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Erro ao atualizar perfil.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError('Preencha todos os campos.');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (!HAS_SPECIAL.test(newPassword)) {
      setPassError('A nova senha deve conter pelo menos 1 caractere especial.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('A confirmação não coincide com a nova senha.');
      return;
    }

    setPassLoading(true);
    try {
      await updatePassword({ currentPassword, newPassword });
      setPassSuccess('Senha alterada com sucesso!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPassError(err.response?.data?.error || 'Erro ao alterar a senha.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header (Minimal) */}
      <header className="border-b border-dark-600/50 bg-dark-800/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-slate-400 hover:text-primary-400 transition-colors flex items-center gap-1.5 text-sm font-medium">
              ← <span className="hidden sm:inline">Voltar ao Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border-2 border-primary-500/40 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}
            <button onClick={logout} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 border border-transparent hover:bg-red-500/10 transition-all">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-4 mb-8 fade-in-up">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <span className="text-2xl">👤</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Configurações de Perfil</h1>
            <p className="text-sm text-slate-400">Atualize suas informações pessoais e de segurança</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card: Informações Pessoais */}
          <div className="glass-card p-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <span>📝</span> Dados Pessoais
            </h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Nome completo</label>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  className={inputClass}
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Email (Não editável)</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-dark-800 border border-dark-600 text-slate-500 rounded-xl px-4 py-3 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">URL da Foto de Perfil (Avatar)</label>
                <input
                  type="url"
                  name="avatar"
                  value={profileForm.avatar}
                  onChange={handleProfileChange}
                  placeholder="https://..."
                  className={inputClass}
                />
                {profileForm.avatar && (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-dark-800 rounded-xl border border-dark-600/50">
                    <img src={profileForm.avatar} alt="Preview" className="w-10 h-10 rounded-full object-cover" onError={(e) => e.target.src = ''} />
                    <span className="text-xs text-slate-400">Preview</span>
                  </div>
                )}
              </div>

              {profileError && <p className="text-xs text-red-400">⚠️ {profileError}</p>}
              {profileSuccess && <p className="text-xs text-emerald-400">✅ {profileSuccess}</p>}

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 transition-all mt-2"
              >
                {profileLoading ? 'Salvando...' : 'Salvar Perfil'}
              </button>
            </form>
          </div>

          {/* Card: Segurança */}
          <div className="glass-card p-6 fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <span>🔐</span> Segurança
            </h2>
            
            {!user?.password && (
              <div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-xl px-4 py-3 text-sm mb-4">
                <p>Você entrou com o Google e ainda não tem uma senha definida.</p>
                <p className="mt-1 text-xs opacity-80">Se quiser definir uma senha, saia da conta e use a opção "Esqueci minha senha" na tela de login.</p>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className={`space-y-4 ${!user?.password ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Senha Atual</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className={inputClass + ' pr-11'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm"
                    tabIndex={-1}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="h-px w-full bg-dark-600/50 my-2" />

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Nova Senha</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className={inputClass}
                />
                <PasswordStrength password={passwordForm.newPassword} />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Confirmar Nova Senha</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className={inputClass}
                />
              </div>

              {passError && <p className="text-xs text-red-400">⚠️ {passError}</p>}
              {passSuccess && <p className="text-xs text-emerald-400">✅ {passSuccess}</p>}

              <button
                type="submit"
                disabled={passLoading || !user?.password}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-slate-700 to-slate-600 text-white hover:from-slate-600 hover:to-slate-500 disabled:opacity-50 transition-all mt-2"
              >
                {passLoading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
