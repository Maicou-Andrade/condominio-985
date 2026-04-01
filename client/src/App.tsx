import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Home, Lightbulb, CheckCircle, Settings } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import CasasPage from './pages/Casas';
import SugestoesPage from './pages/Sugestoes';
import AprovacaoPage from './pages/Aprovacao';
import DetalhePage from './pages/Detalhe';

const navItems = [
  { path: '/', label: 'Casas', icon: Home },
  { path: '/sugestoes', label: 'Sugestões', icon: Lightbulb },
  { path: '/aprovacao', label: 'Aprovação', icon: CheckCircle },
];

export default function App() {
  const location = useLocation();

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

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2 px-3">
            <div className="w-8 h-8 rounded-full bg-accent-blue/30 flex items-center justify-center">
              <span className="text-white text-xs font-bold">MS</span>
            </div>
            <div>
              <p className="text-white text-xs font-medium">MS Consultoria</p>
              <p className="text-navy-300 text-[10px]">v1.0.0</p>
            </div>
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
