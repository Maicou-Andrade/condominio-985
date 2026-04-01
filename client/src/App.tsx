import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Home, Lightbulb, CheckCircle, LogOut, Menu, X, Lock } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './auth';
import { useState } from 'react';
import toast from 'react-hot-toast';
import LoginPage from './pages/Login';
import CasasPage from './pages/Casas';
import SugestoesPage from './pages/Sugestoes';
import AprovacaoPage from './pages/Aprovacao';
import DetalhePage from './pages/Detalhe';

const navItems = [
  { path: '/', label: 'Casas', icon: Home },
  { path: '/sugestoes', label: 'Sugestões', icon: Lightbulb },
  { path: '/aprovacao', label: 'Votação', icon: CheckCircle },
];

export default function App() {
  const location = useLocation();
  const { user, loading, logout, hasCasas, changePassword } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-500">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent-yellow mx-auto flex items-center justify-center mb-4">
            <span className="font-display font-extrabold text-navy-500 text-2xl">985</span>
          </div>
          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  if (!user && !hasCasas) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <div className="max-w-3xl mx-auto py-8 px-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent-yellow mx-auto flex items-center justify-center mb-4">
              <span className="font-display font-extrabold text-navy-500 text-2xl">985</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl text-navy-500">Configuração Inicial</h1>
            <p className="text-gray-500 mt-1 text-sm">Cadastre a primeira casa para ativar o sistema</p>
          </div>
          <CasasPage />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginPage />
      </>
    );
  }

  const isImpersonating = user.nome.includes('(via Admin)');

  // First login - force password change
  if (user.deveTrocarSenha) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-500 via-navy-500 to-accent-blue p-4">
        <Toaster position="top-center" />
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-accent-yellow/20 mx-auto flex items-center justify-center mb-3">
              <Lock size={24} className="text-accent-yellow" />
            </div>
            <h2 className="font-display font-bold text-xl text-navy-500">Trocar Senha</h2>
            <p className="text-gray-400 text-xs mt-1">
              Olá <strong>{user.nome}</strong>, crie uma nova senha para continuar.
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-navy-500 mb-1">Nova Senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-500 mb-1">Confirmar Senha</label>
              <input
                type="password"
                value={confirmSenha}
                onChange={e => setConfirmSenha(e.target.value)}
                placeholder="Repita a senha"
                onKeyDown={e => e.key === 'Enter' && !changingPw && novaSenha && handleChangePw()}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 text-sm"
              />
            </div>
            <button
              onClick={handleChangePw}
              disabled={changingPw}
              className="w-full px-4 py-3 rounded-xl bg-navy-500 text-white font-semibold text-sm hover:bg-navy-600 transition-all disabled:opacity-50 mt-2"
            >
              {changingPw ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function handleChangePw() {
    if (novaSenha.length < 4) { toast.error('Senha deve ter pelo menos 4 caracteres'); return; }
    if (novaSenha !== confirmSenha) { toast.error('Senhas não conferem'); return; }
    setChangingPw(true);
    const result = await changePassword(novaSenha);
    setChangingPw(false);
    if (result.success) { toast.success('Senha alterada com sucesso!'); }
    else { toast.error(result.error || 'Erro ao alterar senha'); }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Toaster position="top-center" />

      {/* Mobile Header */}
      <header className="lg:hidden bg-navy-500 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-yellow flex items-center justify-center">
            <span className="text-navy-500 font-display font-extrabold text-sm">985</span>
          </div>
          <span className="font-display font-bold text-white text-sm">Condomínio</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-white">
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 top-[52px] z-40 animate-fade-in" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-navy-500 p-4 space-y-1 animate-slide-up" onClick={e => e.stopPropagation()}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'bg-white/15 text-white' : 'text-navy-200 hover:bg-white/5'
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </NavLink>
              );
            })}
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-accent-blue/30 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{user.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{user.nome}</p>
                  <p className="text-navy-300 text-[10px]">{user.casaNumero}</p>
                </div>
                <button onClick={logout} className="p-2 text-navy-300 hover:text-white"><LogOut size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-navy-500 min-h-screen flex-col fixed left-0 top-0 bottom-0 z-40">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-yellow flex items-center justify-center">
              <span className="text-navy-500 font-display font-extrabold text-lg">985</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-lg leading-tight">Condomínio</h1>
              <p className="text-navy-200 text-xs font-medium">Gestão de Sugestões</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive ? 'bg-white/15 text-white shadow-lg shadow-black/20' : 'text-navy-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-accent-blue/30 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{user.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.nome}</p>
              <p className="text-navy-300 text-[10px] truncate">{user.casaNumero}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-navy-300 hover:text-white hover:bg-white/5 transition-all text-xs">
            <LogOut size={14} />
            Sair
          </button>
          <div className="flex items-center gap-2 px-3 mt-3 pt-3 border-t border-white/5">
            <div className="w-5 h-5 rounded-full bg-accent-blue/20 flex items-center justify-center">
              <span className="text-white text-[7px] font-bold">MS</span>
            </div>
            <span className="text-navy-400 text-[10px]">MS Consultoria v1.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {isImpersonating && (
          <div className="bg-amber-400 px-4 py-2 flex items-center justify-between">
            <p className="text-navy-500 text-xs font-semibold">
              👁️ Visualizando como <strong>{user.casaNumero}</strong>
            </p>
            <button
              onClick={async () => {
                const base = window.location.hostname !== 'localhost' ? '' : 'http://localhost:3000';
                const casas = await fetch(`${base}/trpc/casas.list`).then(r => r.json());
                const adminCasa = (casas?.result?.data || []).find((c: any) => c.email === 'maicouandrade@msconsultoria.net.br');
                if (adminCasa) {
                  await fetch(`${base}/api/auth/impersonate`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    credentials: 'include', body: JSON.stringify({ casaId: adminCasa.id }),
                  });
                  window.location.reload();
                } else { logout(); }
              }}
              className="px-3 py-1 rounded-lg bg-navy-500 text-white text-xs font-semibold"
            >
              Voltar
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<CasasPage />} />
            <Route path="/sugestoes" element={<SugestoesPage />} />
            <Route path="/aprovacao" element={<AprovacaoPage />} />
            <Route path="/aprovacao/:id" element={<DetalhePage />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/aprovacao' && location.pathname.startsWith('/aprovacao'));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
                  isActive ? 'text-navy-500' : 'text-gray-400'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
