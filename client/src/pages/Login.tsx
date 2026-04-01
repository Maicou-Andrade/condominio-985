import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../auth';
import { useState } from 'react';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const { login, loginWithPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState<any>(null);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError(null);
    setNotRegistered(null);
    const result = await login(credentialResponse.credential);
    if (!result.success) {
      if (result.error === 'not_registered') setNotRegistered(result.data);
      else setError('Falha na autenticação. Tente novamente.');
    }
  };

  const handlePasswordLogin = async () => {
    if (!email || !senha) { setError('Preencha e-mail e senha'); return; }
    setError(null);
    setLoading(true);
    const result = await loginWithPassword(email, senha);
    setLoading(false);
    if (!result.success) setError(result.error || 'Erro ao fazer login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-500 via-navy-500 to-accent-blue relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-yellow rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-accent-yellow mx-auto flex items-center justify-center shadow-2xl shadow-accent-yellow/30 mb-6">
            <span className="font-display font-extrabold text-navy-500 text-3xl">985</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-white">Condomínio 985</h1>
          <p className="text-navy-200 mt-2 text-sm">Gestão de Sugestões e Despesas</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          <h2 className="font-display font-bold text-xl text-navy-500 text-center mb-2">Bem-vindo</h2>
          <p className="text-gray-400 text-sm text-center mb-6">
            Faça login para acessar o sistema
          </p>

          {!showPasswordLogin ? (
            <>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Erro no Google Sign-In')}
                  theme="outline"
                  size="large"
                  width="320"
                  text="signin_with"
                  locale="pt-BR"
                />
              </div>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                onClick={() => setShowPasswordLogin(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-navy-500 font-semibold text-sm hover:bg-gray-50 transition-all"
              >
                <Lock size={16} />
                Entrar com e-mail e senha
              </button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-navy-500 mb-1">E-mail</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy-500 mb-1">Senha</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="Sua senha"
                      onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={handlePasswordLogin}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl bg-navy-500 text-white font-semibold text-sm hover:bg-navy-600 transition-all disabled:opacity-50"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </div>

              <button
                onClick={() => { setShowPasswordLogin(false); setError(null); }}
                className="w-full mt-3 text-center text-xs text-accent-blue font-semibold hover:underline"
              >
                ← Voltar para login com Google
              </button>
            </>
          )}

          {error && (
            <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-3 text-center animate-slide-up">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {notRegistered && (
            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-3 animate-slide-up">
              <p className="text-amber-800 text-sm font-semibold mb-1">E-mail não cadastrado</p>
              <p className="text-amber-700 text-xs">
                <strong>{notRegistered.email}</strong> não está vinculado a nenhuma casa.
              </p>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">MS</span>
            </div>
            <span className="text-navy-300 text-xs">MS Consultoria</span>
          </div>
        </div>
      </div>
    </div>
  );
}
