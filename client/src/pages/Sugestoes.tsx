import { useState } from 'react';
import { trpc } from '../trpc';
import { useAuth } from '../auth';
import { maskCurrency, unmaskCurrency } from '../utils';
import { Lightbulb, Plus, Tag, X, ChevronRight, DollarSign, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ITEM_TIPOS = ['Portão', 'Câmera', 'Vidro', 'Fechadura', 'Portão Pequeno', 'Muro', 'Outros'];

type FormStep = 'tipo' | 'item' | 'valor' | 'detalhes';

export default function SugestoesPage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catNome, setCatNome] = useState('');
  const [step, setStep] = useState<FormStep>('tipo');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    casaId: user?.casaId || 0,
    tipoSugestao: '',
    categoriaId: 0,
    itemTipo: '',
    itemOutros: '',
    temValor: false,
    valorProduto: '',
    valorServico: '',
    sugestaoValorProduto: '',
    sugestaoValorServico: '',
    motivo: '',
    melhoria: '',
  });

  const casasQuery = trpc.casas.list.useQuery();
  const categoriasQuery = trpc.categorias.list.useQuery();
  const sugestoesQuery = trpc.sugestoes.list.useQuery();

  const createMutation = trpc.sugestoes.create.useMutation({
    onSuccess: () => {
      toast.success('Sugestão criada! Os moradores serão notificados.');
      resetForm();
      sugestoesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.sugestoes.update.useMutation({
    onSuccess: () => {
      toast.success('Sugestão atualizada!');
      resetForm();
      sugestoesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.sugestoes.delete.useMutation({
    onSuccess: () => {
      toast.success('Sugestão excluída');
      sugestoesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const createCatMutation = trpc.categorias.create.useMutation({
    onSuccess: () => {
      toast.success('Categoria adicionada!');
      setCatNome('');
      setShowCatModal(false);
      categoriasQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setShowModal(false);
    setStep('tipo');
    setEditingId(null);
    setForm({
      casaId: user?.casaId || 0, tipoSugestao: '', categoriaId: 0, itemTipo: '', itemOutros: '',
      temValor: false, valorProduto: '', valorServico: '',
      sugestaoValorProduto: '', sugestaoValorServico: '', motivo: '', melhoria: '',
    });
  }

  function openEdit(sug: any) {
    setEditingId(sug.id);
    setForm({
      casaId: user?.casaId || 0,
      tipoSugestao: sug.tipo_sugestao,
      categoriaId: sug.categoria_id || 0,
      itemTipo: sug.item_tipo || '',
      itemOutros: sug.item_outros || '',
      temValor: !!sug.tem_valor,
      valorProduto: sug.valor_produto ? maskCurrency((parseFloat(sug.valor_produto) * 100).toFixed(0)) : '',
      valorServico: sug.valor_servico ? maskCurrency((parseFloat(sug.valor_servico) * 100).toFixed(0)) : '',
      sugestaoValorProduto: sug.sugestao_valor_produto ? maskCurrency((parseFloat(sug.sugestao_valor_produto) * 100).toFixed(0)) : '',
      sugestaoValorServico: sug.sugestao_valor_servico ? maskCurrency((parseFloat(sug.sugestao_valor_servico) * 100).toFixed(0)) : '',
      motivo: sug.motivo || '',
      melhoria: sug.melhoria || '',
    });
    setStep('tipo');
    setShowModal(true);
  }

  function handleSubmit() {
    if (createMutation.isPending || updateMutation.isPending) return;
    if (!form.casaId || !form.motivo) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    const payload = {
      casaId: form.casaId,
      tipoSugestao: form.tipoSugestao,
      categoriaId: form.categoriaId || undefined,
      itemTipo: form.itemTipo || undefined,
      itemOutros: form.itemOutros || undefined,
      temValor: form.temValor,
      valorProduto: form.valorProduto ? parseFloat(unmaskCurrency(form.valorProduto)) : undefined,
      valorServico: form.valorServico ? parseFloat(unmaskCurrency(form.valorServico)) : undefined,
      sugestaoValorProduto: form.sugestaoValorProduto ? parseFloat(unmaskCurrency(form.sugestaoValorProduto)) : undefined,
      sugestaoValorServico: form.sugestaoValorServico ? parseFloat(unmaskCurrency(form.sugestaoValorServico)) : undefined,
      motivo: form.motivo,
      melhoria: form.melhoria || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const statusColors: Record<string, string> = {
    gerada: 'bg-gray-100 text-gray-600',
    aguardando_avaliacao: 'bg-amber-50 text-amber-700',
    aprovada_parcial: 'bg-blue-50 text-blue-700',
    aprovada_total: 'bg-green-50 text-green-700',
    desistencia: 'bg-red-50 text-red-600',
    concluida: 'bg-purple-50 text-purple-700',
  };

  const statusLabels: Record<string, string> = {
    gerada: 'Ideia Gerada',
    aguardando_avaliacao: 'Aguardando Avaliação',
    aprovada_parcial: 'Aprovada Parcial',
    aprovada_total: 'Aprovada por Todos',
    desistencia: 'Desistência',
    concluida: 'Concluída',
  };

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-navy-500">Sugestões</h1>
          <p className="text-gray-500 mt-1">Crie e acompanhe sugestões para o condomínio</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowCatModal(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-navy-500 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            <Tag size={16} />
            Nova Categoria
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-navy-500 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-navy-600 transition-all shadow-lg shadow-navy-500/25 active:scale-95"
          >
            <Plus size={18} />
            Nova Sugestão
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="font-display font-semibold text-sm text-gray-400 uppercase tracking-wider mb-3">Categorias</h3>
        <div className="flex flex-wrap gap-2">
          {categoriasQuery.data?.map(cat => (
            <span key={cat.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-500/5 text-navy-500 text-xs font-semibold">
              <Tag size={12} />
              {cat.nome}
              <span className="text-navy-300 text-[10px]">({cat.tipo})</span>
            </span>
          ))}
        </div>
      </div>

      {/* Sugestoes List */}
      <div className="space-y-4">
        {(sugestoesQuery.data as any[])?.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Lightbulb size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Nenhuma sugestão ainda</p>
            <p className="text-gray-300 text-sm mt-1">Clique em "Nova Sugestão" para começar</p>
          </div>
        )}

        {(sugestoesQuery.data as any[])?.map((sug: any) => (
          <div key={sug.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[sug.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[sug.status] || sug.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    #{sug.id} • {sug.tipo_sugestao === 'novo' ? '✨ Novo' : '🔧 Manutenção'}
                  </span>
                </div>
                <h3 className="font-display font-bold text-navy-500 text-lg">
                  {sug.categoria_nome || sug.item_tipo || sug.item_outros || 'Sugestão'}
                </h3>
                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{sug.motivo}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span>🏠 {sug.casa_numero} - {sug.nome_morador}</span>
                  <span>🗳️ {sug.total_votos}/{sug.total_casas > 0 ? sug.total_casas - 1 : 0} votos</span>
                  {(sug.valor_produto || sug.sugestao_valor_produto) && (
                    <span>💰 R$ {(parseFloat(sug.valor_produto || sug.sugestao_valor_produto || 0) + parseFloat(sug.valor_servico || sug.sugestao_valor_servico || 0)).toFixed(2)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {user && sug.casa_id === user.casaId && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(sug); }}
                      className="p-2 rounded-lg text-gray-300 hover:text-accent-blue hover:bg-blue-50 transition-all"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Excluir esta sugestão? Esta ação não pode ser desfeita.')) {
                          deleteMutation.mutate({ id: sug.id, casaId: user.casaId });
                        }
                      }}
                      className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
                <a
                  href={`/aprovacao/${sug.id}`}
                  className="p-2 rounded-lg text-gray-300 hover:text-navy-500 hover:bg-navy-500/5 transition-all"
                >
                  <ChevronRight size={20} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={() => setShowCatModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-5 sm:p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg text-navy-500">Nova Categoria</h2>
              <button onClick={() => setShowCatModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-500 mb-1.5">Descrição</label>
              <input
                type="text"
                value={catNome}
                onChange={e => setCatNome(e.target.value)}
                placeholder="Nome da categoria"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 text-sm"
              />
              <p className="text-xs text-gray-400 mt-2">Tipo: <span className="font-semibold text-accent-blue">Condomínio</span> (automático)</p>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCatModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">Cancelar</button>
              <button
                onClick={() => { if (catNome.trim()) createCatMutation.mutate({ nome: catNome.trim() }); }}
                className="flex-1 px-4 py-3 rounded-xl bg-navy-500 text-white font-semibold text-sm"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Suggestion Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in overflow-y-auto py-8" onClick={() => resetForm()}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg p-5 sm:p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-bold text-xl text-navy-500">{editingId ? 'Editar Sugestão' : 'Nova Sugestão'}</h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  Passo {step === 'tipo' ? '1' : step === 'item' ? '2' : step === 'valor' ? '3' : '4'} de 4
                </p>
              </div>
              <button onClick={resetForm} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-1.5 mb-6">
              {['tipo', 'item', 'valor', 'detalhes'].map((s, i) => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${
                  ['tipo', 'item', 'valor', 'detalhes'].indexOf(step) >= i ? 'bg-navy-500' : 'bg-gray-200'
                }`} />
              ))}
            </div>

            {/* Step 1: Tipo */}
            {step === 'tipo' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-navy-500 mb-1.5">Solicitante</label>
                  <div className="w-full px-4 py-3 rounded-xl border border-accent-green/30 bg-accent-green/5 text-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-green/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-accent-green text-xs font-bold">{user?.nome?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-navy-500">{user?.casaNumero} — {user?.nome}</p>
                      <p className="text-gray-400 text-xs">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-navy-500 mb-2">Tipo da Sugestão *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'novo', label: '✨ Novo', desc: 'Algo novo para o condomínio' },
                      { value: 'manutencao', label: '🔧 Manutenção', desc: 'Reparo ou manutenção' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setForm(f => ({ ...f, tipoSugestao: opt.value }))}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          form.tipoSugestao === opt.value
                            ? 'border-navy-500 bg-navy-500/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-semibold text-sm text-navy-500">{opt.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!form.tipoSugestao) { toast.error('Selecione o tipo da sugestão'); return; }
                    setStep('item');
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-navy-500 text-white font-semibold text-sm mt-2"
                >
                  Próximo →
                </button>
              </div>
            )}

            {/* Step 2: Item */}
            {step === 'item' && (
              <div className="space-y-4">
                {form.tipoSugestao === 'novo' ? (
                  <div>
                    <label className="block text-sm font-semibold text-navy-500 mb-2">O que é? *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ITEM_TIPOS.map(item => (
                        <button
                          key={item}
                          onClick={() => setForm(f => ({ ...f, itemTipo: item, itemOutros: item === 'Outros' ? '' : f.itemOutros }))}
                          className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                            form.itemTipo === item
                              ? 'border-navy-500 bg-navy-500/5 text-navy-500'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    {form.itemTipo === 'Outros' && (
                      <input
                        type="text"
                        value={form.itemOutros}
                        onChange={e => setForm(f => ({ ...f, itemOutros: e.target.value }))}
                        placeholder="Descreva o item..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 text-sm mt-3"
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-navy-500 mb-2">Categoria da Manutenção *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {categoriasQuery.data?.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setForm(f => ({ ...f, categoriaId: c.id }))}
                          className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                            form.categoriaId === c.id
                              ? 'border-navy-500 bg-navy-500/5 text-navy-500'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          🔧 {c.nome}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button onClick={() => setStep('tipo')} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">← Voltar</button>
                  <button
                    onClick={() => {
                      if (form.tipoSugestao === 'novo' && !form.itemTipo) { toast.error('Selecione o item'); return; }
                      if (form.tipoSugestao === 'manutencao' && !form.categoriaId) { toast.error('Selecione a categoria'); return; }
                      setStep('valor');
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-navy-500 text-white font-semibold text-sm"
                  >
                    Próximo →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Valor */}
            {step === 'valor' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-navy-500 mb-2">Já tem o valor? *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[true, false].map(val => (
                      <button
                        key={String(val)}
                        onClick={() => setForm(f => ({ ...f, temValor: val }))}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          form.temValor === val
                            ? 'border-navy-500 bg-navy-500/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <DollarSign size={20} className={`mx-auto mb-1 ${form.temValor === val ? 'text-navy-500' : 'text-gray-400'}`} />
                        <p className="font-semibold text-sm text-navy-500">{val ? 'Sim' : 'Não'}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {form.temValor ? (
                  <div className="space-y-3 bg-green-50/50 p-4 rounded-xl border border-green-100">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Valores Definidos</p>
                    <div>
                      <label className="block text-sm font-medium text-navy-500 mb-1">Valor de Produto (R$)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.valorProduto}
                        onChange={e => setForm(f => ({ ...f, valorProduto: maskCurrency(e.target.value) }))}
                        placeholder="0,00"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent-blue/30 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy-500 mb-1">Valor de Serviço (R$)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.valorServico}
                        onChange={e => setForm(f => ({ ...f, valorServico: maskCurrency(e.target.value) }))}
                        placeholder="0,00"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent-blue/30 text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Sugestão de Valor (para base)</p>
                    <div>
                      <label className="block text-sm font-medium text-navy-500 mb-1">Sugestão Valor Produto (R$)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.sugestaoValorProduto}
                        onChange={e => setForm(f => ({ ...f, sugestaoValorProduto: maskCurrency(e.target.value) }))}
                        placeholder="0,00"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent-blue/30 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy-500 mb-1">Sugestão Valor Serviço (R$)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.sugestaoValorServico}
                        onChange={e => setForm(f => ({ ...f, sugestaoValorServico: maskCurrency(e.target.value) }))}
                        placeholder="0,00"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent-blue/30 text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button onClick={() => setStep('item')} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">← Voltar</button>
                  <button
                    onClick={() => setStep('detalhes')}
                    className="flex-1 px-4 py-3 rounded-xl bg-navy-500 text-white font-semibold text-sm"
                  >
                    Próximo →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Detalhes */}
            {step === 'detalhes' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-navy-500 mb-1.5">Motivo da Solicitação *</label>
                  <textarea
                    value={form.motivo}
                    onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
                    placeholder="Descreva o motivo..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-navy-500 mb-1.5">Melhoria da Solicitação</label>
                  <textarea
                    value={form.melhoria}
                    onChange={e => setForm(f => ({ ...f, melhoria: e.target.value }))}
                    placeholder="O que essa mudança vai melhorar..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 text-sm resize-none"
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button onClick={() => setStep('valor')} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">← Voltar</button>
                  <button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 px-4 py-3 rounded-xl bg-accent-green text-white font-semibold text-sm disabled:opacity-50"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : editingId ? '✓ Salvar Alterações' : '✓ Criar Sugestão'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
