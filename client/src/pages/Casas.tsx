import { useState } from 'react';
import { trpc } from '../trpc';
import { useAuth } from '../auth';
import { Home, Plus, Trash2, User, Mail, Phone, X, Pencil, LogIn } from 'lucide-react';
import { maskPhone } from '../utils';
import toast from 'react-hot-toast';

const CASAS_OPTIONS = ['Casa 01', 'Casa 02', 'Casa 03', 'Casa 04', 'Casa 05'];
const ADMIN_EMAIL = 'maicouandrade@msconsultoria.net.br';

export default function CasasPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [showModal, setShowModal] = useState(false);
  const [editingCasa, setEditingCasa] = useState<any>(null);
  const [form, setForm] = useState({ numero: '', nomeMorador: '', email: '', telefone: '' });

  const getBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') return '';
    return 'http://localhost:3000';
  };

  async function impersonate(casaId: number, casaNumero: string) {
    try {
      const res = await fetch(`${getBaseUrl()}/api/auth/impersonate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ casaId }),
      });
      if (res.ok) {
        toast.success(`Acessando como ${casaNumero}`);
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error('Erro ao acessar como usuário');
      }
    } catch { toast.error('Erro de conexão'); }
  }

  const casasQuery = trpc.casas.list.useQuery();
  const createMutation = trpc.casas.create.useMutation({
    onSuccess: () => {
      toast.success('Casa cadastrada com sucesso!');
      closeModal();
      casasQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.casas.update.useMutation({
    onSuccess: () => {
      toast.success('Casa atualizada com sucesso!');
      closeModal();
      casasQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.casas.delete.useMutation({
    onSuccess: () => {
      toast.success('Casa removida');
      casasQuery.refetch();
    },
  });

  const casasCadastradas = casasQuery.data?.map(c => c.numero) || [];
  const casasDisponiveis = CASAS_OPTIONS.filter(c => !casasCadastradas.includes(c));

  function openCreate(preselect?: string) {
    setEditingCasa(null);
    setForm({ numero: preselect || '', nomeMorador: '', email: '', telefone: '' });
    setShowModal(true);
  }

  function openEdit(casa: any) {
    setEditingCasa(casa);
    setForm({
      numero: casa.numero,
      nomeMorador: casa.nomeMorador,
      email: casa.email,
      telefone: maskPhone(casa.telefone || ''),
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingCasa(null);
    setForm({ numero: '', nomeMorador: '', email: '', telefone: '' });
  }

  function handleSave() {
    if (!form.numero || !form.nomeMorador || !form.email) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    if (editingCasa) {
      updateMutation.mutate({ id: editingCasa.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // For edit: available options = not taken + current one
  const selectOptions = editingCasa
    ? CASAS_OPTIONS.filter(c => !casasCadastradas.includes(c) || c === editingCasa.numero)
    : casasDisponiveis;

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-navy-500">Casas</h1>
          <p className="text-gray-500 mt-1">Cadastro dos moradores do condomínio</p>
        </div>
        {casasDisponiveis.length > 0 && (
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 bg-navy-500 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-navy-600 transition-all shadow-lg shadow-navy-500/25 active:scale-95"
          >
            <Plus size={18} />
            Cadastrar Casa
          </button>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CASAS_OPTIONS.map((numero) => {
          const casa = casasQuery.data?.find(c => c.numero === numero);
          const isRegistered = !!casa;

          return (
            <div
              key={numero}
              className={`rounded-2xl border-2 p-6 transition-all duration-300 ${
                isRegistered
                  ? 'border-accent-green/30 bg-white shadow-lg shadow-accent-green/5'
                  : 'border-dashed border-gray-200 bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isRegistered ? 'bg-accent-green/10' : 'bg-gray-100'
                }`}>
                  <Home size={22} className={isRegistered ? 'text-accent-green' : 'text-gray-400'} />
                </div>
                {isRegistered && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(casa)}
                      className="p-2 rounded-lg text-gray-400 hover:text-accent-blue hover:bg-blue-50 transition-all"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Remover esta casa?')) deleteMutation.mutate({ id: casa.id });
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-display font-bold text-lg text-navy-500 mb-1">{numero}</h3>

              {isRegistered ? (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={14} className="text-accent-blue" />
                    {casa.nomeMorador}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} className="text-accent-blue" />
                    <span className="truncate">{casa.email}</span>
                  </div>
                  {casa.telefone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-accent-blue" />
                      {casa.telefone}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-green/10 text-accent-green text-xs font-semibold">
                      ● Cadastrada
                    </span>
                    {isAdmin && casa.email !== ADMIN_EMAIL && (
                      <button
                        onClick={() => impersonate(casa.id, casa.numero)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-blue/10 text-accent-blue text-xs font-semibold hover:bg-accent-blue/20 transition-all"
                        title="Acessar como este usuário"
                      >
                        <LogIn size={12} />
                        Acessar como
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-gray-400 text-sm">Disponível para cadastro</p>
                  <button
                    onClick={() => openCreate(numero)}
                    className="mt-3 text-accent-blue text-sm font-semibold hover:underline"
                  >
                    + Cadastrar morador
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="mt-8 bg-accent-yellow/10 border border-accent-yellow/30 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-accent-yellow/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-accent-yellow text-sm">💡</span>
        </div>
        <div>
          <p className="text-sm text-navy-500 font-medium">Máximo de 5 casas</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Cada casa pode ser cadastrada apenas uma vez. {casasCadastradas.length}/5 cadastradas.
          </p>
        </div>
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={closeModal}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-navy-500">
                {editingCasa ? 'Editar Casa' : 'Cadastrar Casa'}
              </h2>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-navy-500 mb-1.5">Casa *</label>
                <select
                  value={form.numero}
                  onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue text-sm"
                >
                  <option value="">Selecione a casa</option>
                  {selectOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-500 mb-1.5">Nome do Morador *</label>
                <input
                  type="text"
                  value={form.nomeMorador}
                  onChange={e => setForm(f => ({ ...f, nomeMorador: e.target.value }))}
                  placeholder="Nome completo"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-500 mb-1.5">E-mail (Gmail) *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="exemplo@gmail.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-500 mb-1.5">Telefone</label>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={e => setForm(f => ({ ...f, telefone: maskPhone(e.target.value) }))}
                  placeholder="(84) 99999-9999"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-navy-500 text-white font-semibold text-sm hover:bg-navy-600 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Salvando...' : editingCasa ? 'Salvar Alterações' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
