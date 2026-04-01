import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Home, Lightbulb, CheckCircle, LogOut } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './auth';
import LoginPage from './pages/Login';
import CasasPage from './pages/Casas';
import SugestoesPage from './pages/Sugestoes';
import AprovacaoPage from './pages/Aprovacao';
import DetalhePage from './pages/Detalhe';

const navItems = [
  { path: '/', label: 'Casas', icon: Home },
  { path: '/sugestoes', label: 'Sugestões', icon: Lightbulb },
  { path: '/aprovacao', label: 'Votação das Ideias', icon: CheckCircle },
];

export default function App() {
  const location = useLocation();
  const { user, loading, logout, hasCasas } = useAuth();

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
        <div className="max-w-3xl mx-auto py-12 px-6">
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

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <aside className="w-64 bg-navy-500 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-40">
        {/* Logo */}
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

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 text-white shadow-lg shadow-black/20'
                    : 'text-navy-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User Info + Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-accent-blue/30 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.nome}</p>
              <p className="text-navy-300 text-[10px] truncate">{user.casaNumero}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-navy-300 hover:text-white hover:bg-white/5 transition-all text-xs"
          >
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
      <main className="flex-1 ml-64">
        <div className="p-8 max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<CasasPage />} />
            <Route path="/sugestoes" element={<SugestoesPage />} />
            <Route path="/aprovacao" element={<AprovacaoPage />} />
            <Route path="/aprovacao/:id" element={<DetalhePage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
