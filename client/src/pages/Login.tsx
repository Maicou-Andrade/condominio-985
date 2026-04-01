import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../auth';
import { useState } from 'react';

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState<any>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError(null);
    setNotRegistered(null);
    const result = await login(credentialResponse.credential);
    if (!result.success) {
      if (result.error === 'not_registered') {
        setNotRegistered(result.data);
      } else {
        setError('Falha na autenticação. Tente novamente.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-500 via-navy-500 to-accent-blue relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-yellow rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 sm:px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-accent-yellow mx-auto flex items-center justify-center shadow-2xl shadow-accent-yellow/30 mb-6">
            <span className="font-display font-extrabold text-navy-500 text-3xl">985</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-white">Condomínio 985</h1>
          <p className="text-navy-200 mt-2 text-sm">Gestão de Sugestões e Despesas</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="font-display font-bold text-xl text-navy-500 text-center mb-2">Bem-vindo</h2>
          <p className="text-gray-400 text-sm text-center mb-8">
            Faça login com seu Gmail cadastrado no condomínio
          </p>

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

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-center animate-slide-up">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {notRegistered && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 animate-slide-up">
              <p className="text-amber-800 text-sm font-semibold mb-2">E-mail não cadastrado</p>
              <p className="text-amber-700 text-xs">
                O e-mail <strong>{notRegistered.email}</strong> não está vinculado a nenhuma casa do condomínio.
              </p>
              <p className="text-amber-600 text-xs mt-2">
                Peça ao administrador para cadastrar sua casa com este e-mail.
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-[10px] text-gray-300 text-center">
              Apenas moradores cadastrados podem acessar o sistema.
            </p>
          </div>
        </div>

        {/* Footer */}
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
