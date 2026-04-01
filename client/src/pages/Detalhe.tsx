import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../trpc';
import { useAuth } from '../auth';
import { maskCurrency, unmaskCurrency } from '../utils';
import {
  ArrowLeft, Lightbulb, Clock, CheckCircle, XCircle, Trophy, AlertTriangle,
  ThumbsUp, ThumbsDown, DollarSign, MessageCircle, Share2, X, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const statusSteps = [
  { key: 'gerada', label: 'Ideia Gerada', desc: 'Cadastro da Ideia', icon: Lightbulb },
  { key: 'aguardando_avaliacao', label: 'Aguardando Avaliação', desc: 'Em votação entre todos', icon: Clock },
  { key: 'resultado', label: 'Resultado', desc: '', icon: CheckCircle },
  { key: 'concluida', label: 'Projeto Concluído', desc: 'Valores finais registrados', icon: Trophy },
];

function getStepIndex(status: string) {
  if (status === 'gerada') return 0;
  if (status === 'aguardando_avaliacao') return 1;
  if (['aprovada_parcial', 'aprovada_total', 'desistencia'].includes(status)) return 2;
  if (status === 'concluida') return 3;
  return 0;
}

export default function DetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showConcluirModal, setShowConcluirModal] = useState(false);
  const [showDivisaoModal, setShowDivisaoModal] = useState(false);
  const [voteValue, setVoteValue] = useState<'sim' | 'nao'>('sim');
  const [justificativa, setJustificativa] = useState('');
  const [concluirForm, setConcluirForm] = useState({ valorProduto: '', valorServico: '' });
  const [divisaoValues, setDivisaoValues] = useState<Record<string, string>>({});

  const detailQuery = trpc.sugestoes.getById.useQuery({ id: parseInt(id || '0') }, { enabled: !!id });
  const votarMutation = trpc.sugestoes.votar.useMutation({
    onSuccess: () => { toast.success('Voto registrado!'); setShowVoteModal(false); detailQuery.refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const desistirMutation = trpc.sugestoes.desistir.useMutation({
    onSuccess: () => { toast.success('Desistência registrada'); detailQuery.refetch(); },
  });
  const avancarMutation = trpc.sugestoes.avancarParcial.useMutation({
    onSuccess: () => { toast.success('Divisão salva!'); setShowDivisaoModal(false); detailQuery.refetch(); },
  });
  const concluirMutation = trpc.sugestoes.concluir.useMutation({
    onSuccess: () => { toast.success('Projeto concluído!'); setShowConcluirModal(false); detailQuery.refetch(); },
  });
  const deleteMutation = trpc.sugestoes.delete.useMutation({
    onSuccess: () => { toast.success('Sugestão excluída'); navigate('/sugestoes'); },
    onError: (err: any) => toast.error(err.message),
  });

  if (!detailQuery.data) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-navy-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const sug = detailQuery.data as any;
  const votosArr = (sug.votos || []) as any[];
  const divisoesArr = (sug.divisoes || []) as any[];
  const allCasas = (sug.casas || []) as any[];
  const currentStep = getStepIndex(sug.status);
  const totalCasas = allCasas.length;
  const votesNeeded = totalCasas - 1;
  const votedCasaIds = votosArr.map((v: any) => v.casa_id);
  const casasQueNaoVotaram = allCasas.filter((c: any) => c.id !== sug.casa_id && !votedCasaIds.includes(c.id));
  const votosSimIds = votosArr.filter((v: any) => v.voto === 'sim').map((v: any) => v.casa_id);
  const casasInteressadas = [sug.casa_id, ...votosSimIds];

  const valorEstimado = parseFloat(sug.valor_produto || sug.sugestao_valor_produto || 0) + parseFloat(sug.valor_servico || sug.sugestao_valor_servico || 0);

  function gerarWhatsApp() {
    const valorTotalReal = parseFloat(sug.valor_total_gasto_produto || 0) + parseFloat(sug.valor_total_gasto_servico || 0);
    let msg = `🏠 *Condomínio 985 - Projeto Concluído*\n\n`;
    msg += `📋 *${sug.categoria_nome || sug.item_tipo || sug.item_outros || 'Sugestão #' + sug.id}*\n`;
    msg += `📝 ${sug.motivo}\n\n`;
    msg += `💰 *Valores Reais:*\n`;
    msg += `  Produtos: R$ ${parseFloat(sug.valor_total_gasto_produto || 0).toFixed(2)}\n`;
    msg += `  Serviço: R$ ${parseFloat(sug.valor_total_gasto_servico || 0).toFixed(2)}\n`;
    msg += `  *Total: R$ ${valorTotalReal.toFixed(2)}*\n\n`;

    if (divisoesArr.length > 0) {
      msg += `📊 *Divisão por Casa:*\n`;
      divisoesArr.forEach((d: any) => {
        const diff = parseFloat(d.percentual_diferenca || 0);
        msg += `  ${d.casa_numero} (${d.nome_morador}): R$ ${parseFloat(d.valor_pagar).toFixed(2)}`;
        if (diff !== 0) msg += ` (${diff > 0 ? '+' : ''}${diff.toFixed(1)}% vs estimado)`;
        msg += `\n`;
      });
    }

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <button onClick={() => navigate('/aprovacao')} className="flex items-center gap-2 text-gray-500 hover:text-navy-500 mb-6 text-sm font-medium transition-colors">
        <ArrowLeft size={18} />
        Voltar para Votação
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-navy-500">
            {sug.categoria_nome || sug.item_tipo || sug.item_outros || 'Sugestão #' + sug.id}
          </h1>
          <p className="text-gray-500 mt-1">
            Solicitado por <strong>{sug.nome_morador}</strong> ({sug.casa_numero}) •
            {sug.tipo_sugestao === 'novo' ? ' ✨ Novo' : ' 🔧 Manutenção'}
          </p>
        </div>
        {user && sug.casa_id === user.casaId && ['aguardando_avaliacao', 'gerada'].includes(sug.status) && (
          <button
            onClick={() => {
              if (confirm('Excluir esta sugestão? Todos os votos serão perdidos.')) {
                deleteMutation.mutate({ id: sug.id, casaId: user.casaId });
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-all"
          >
            <Trash2 size={16} />
            Excluir
          </button>
        )}
      </div>

      {/* Status Timeline - iFood style */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
        <h3 className="font-display font-bold text-sm text-gray-400 uppercase tracking-wider mb-6">Status da Sugestão</h3>
        <div className="space-y-0">
          {statusSteps.map((step, i) => {
            const Icon = step.icon;
            const isActive = currentStep >= i;
            const isCurrent = currentStep === i;
            const isResultStep = step.key === 'resultado';

            let resultLabel = step.label;
            let resultDesc = step.desc;
            if (isResultStep) {
              if (sug.status === 'aprovada_total') { resultLabel = 'Aprovada por Todos'; resultDesc = 'Divisão igualitária automática'; }
              else if (sug.status === 'aprovada_parcial') { resultLabel = 'Aprovada Parcial'; resultDesc = 'Alguns aprovaram, decisão pendente'; }
              else if (sug.status === 'desistencia') { resultLabel = 'Desistência'; resultDesc = 'O solicitante desistiu da ideia'; }
            }

            return (
              <div key={step.key} className="flex gap-4 relative">
                {/* Line */}
                {i < statusSteps.length - 1 && (
                  <div className="absolute left-[19px] top-[40px] bottom-0 w-0.5">
                    <div className={`h-full ${isActive && currentStep > i ? 'bg-accent-green' : 'bg-gray-200'}`} />
                  </div>
                )}
                {/* Dot */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                  isActive
                    ? isCurrent
                      ? 'bg-navy-500 shadow-lg shadow-navy-500/30 ring-4 ring-navy-500/10'
                      : 'bg-accent-green'
                    : 'bg-gray-200'
                }`}>
                  <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                </div>
                {/* Text */}
                <div className={`pb-8 ${i === statusSteps.length - 1 ? 'pb-0' : ''}`}>
                  <p className={`font-display font-bold text-sm ${isActive ? 'text-navy-500' : 'text-gray-400'}`}>{resultLabel}</p>
                  <p className={`text-xs mt-0.5 ${isActive ? 'text-gray-500' : 'text-gray-300'}`}>{resultDesc}</p>
                  {isCurrent && (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-navy-500/10 text-navy-500 text-[10px] font-bold animate-pulse">
                        ● Etapa atual
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-display font-bold text-navy-500 mb-4">Detalhes</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Motivo</p>
              <p className="text-sm text-navy-500 mt-1">{sug.motivo}</p>
            </div>
            {sug.melhoria && (
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Melhoria</p>
                <p className="text-sm text-navy-500 mt-1">{sug.melhoria}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Valor Produto</p>
                <p className="text-lg font-bold text-navy-500">
                  R$ {parseFloat(sug.valor_produto || sug.sugestao_valor_produto || 0).toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-400">{sug.tem_valor ? 'Definido' : 'Estimado'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Valor Serviço</p>
                <p className="text-lg font-bold text-navy-500">
                  R$ {parseFloat(sug.valor_servico || sug.sugestao_valor_servico || 0).toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-400">{sug.tem_valor ? 'Definido' : 'Estimado'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Votos */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-navy-500">Votos</h3>
            <span className="text-xs text-gray-400">{votosArr.length}/{votesNeeded} recebidos</span>
          </div>

          <div className="space-y-2.5">
            {allCasas.filter((c: any) => c.id !== sug.casa_id).map((casa: any) => {
              const voto = votosArr.find((v: any) => v.casa_id === casa.id);
              return (
                <div key={casa.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  voto
                    ? voto.voto === 'sim'
                      ? 'border-green-200 bg-green-50/50'
                      : 'border-red-200 bg-red-50/50'
                    : 'border-gray-100 bg-gray-50/50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    voto
                      ? voto.voto === 'sim' ? 'bg-green-100' : 'bg-red-100'
                      : 'bg-gray-200'
                  }`}>
                    {voto ? (
                      voto.voto === 'sim'
                        ? <ThumbsUp size={14} className="text-green-600" />
                        : <ThumbsDown size={14} className="text-red-500" />
                    ) : (
                      <Clock size={14} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-500">{casa.numero}</p>
                    <p className="text-xs text-gray-400 truncate">{casa.nome_morador}</p>
                  </div>
                  {voto ? (
                    <div className="text-right">
                      <span className={`text-xs font-bold ${voto.voto === 'sim' ? 'text-green-600' : 'text-red-500'}`}>
                        {voto.voto === 'sim' ? 'Aprovado' : 'Reprovado'}
                      </span>
                      {voto.justificativa && (
                        <p className="text-[10px] text-gray-400 mt-0.5 max-w-[150px] truncate" title={voto.justificativa}>
                          "{voto.justificativa}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Pendente</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Vote Button */}
          {sug.status === 'aguardando_avaliacao' && user && sug.casa_id !== user.casaId && !votedCasaIds.includes(user.casaId) && (
            <button
              onClick={() => setShowVoteModal(true)}
              className="w-full mt-4 px-4 py-3 rounded-xl bg-navy-500 text-white font-semibold text-sm hover:bg-navy-600 transition-all"
            >
              🗳️ Votar
            </button>
          )}
          {sug.status === 'aguardando_avaliacao' && user && votedCasaIds.includes(user.casaId) && (
            <div className="mt-4 text-center text-sm text-accent-green font-semibold">✓ Você já votou</div>
          )}
          {sug.status === 'aguardando_avaliacao' && user && sug.casa_id === user.casaId && (
            <div className="mt-4 text-center text-sm text-gray-400">Você é o solicitante desta ideia</div>
          )}
        </div>
      </div>

      {/* Actions based on status */}
      {sug.status === 'aprovada_parcial' && user && sug.casa_id === user.casaId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mt-6">
          <h3 className="font-display font-bold text-amber-800 mb-2">Aprovação Parcial</h3>
          <p className="text-sm text-amber-700 mb-4">
            Nem todos aprovaram. Você pode avançar com a ideia dividindo entre os interessados ou desistir.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const initial: Record<string, string> = {};
                const interessados = allCasas.filter((c: any) => casasInteressadas.includes(c.id));
                const valorPorCasa = valorEstimado / interessados.length;
                interessados.forEach((c: any) => { initial[String(c.id)] = maskCurrency((valorPorCasa * 100).toFixed(0)); });
                setDivisaoValues(initial);
                setShowDivisaoModal(true);
              }}
              className="flex-1 px-4 py-3 rounded-xl bg-accent-blue text-white font-semibold text-sm"
            >
              ✓ Avançar com Ideia
            </button>
            <button
              onClick={() => { if (confirm('Deseja realmente desistir?')) desistirMutation.mutate({ sugestaoId: sug.id }); }}
              className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm"
            >
              ✕ Desistir da Ideia
            </button>
          </div>
        </div>
      )}

      {(sug.status === 'aprovada_total' || (sug.status === 'aprovada_parcial' && divisoesArr.length > 0)) && sug.status !== 'concluida' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mt-6">
          <h3 className="font-display font-bold text-green-800 mb-2">
            {sug.status === 'aprovada_total' ? '✅ Aprovada por Todos' : '✅ Divisão Definida'}
          </h3>
          {divisoesArr.length > 0 && (
            <div className="mb-4 space-y-1.5">
              {divisoesArr.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                  <span className="text-sm text-green-800 font-medium">{d.casa_numero} - {d.nome_morador}</span>
                  <span className="text-sm font-bold text-green-700">R$ {parseFloat(d.valor_pagar).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {user && sug.casa_id === user.casaId && (
            <button
              onClick={() => setShowConcluirModal(true)}
              className="w-full px-4 py-3 rounded-xl bg-accent-green text-white font-semibold text-sm"
            >
              🏁 Concluir Projeto
            </button>
          )}
        </div>
      )}

      {sug.status === 'concluida' && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 mt-6">
          <h3 className="font-display font-bold text-purple-800 mb-3">🏆 Projeto Concluído</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/60 rounded-xl p-3">
              <p className="text-[10px] text-purple-500 font-semibold uppercase">Valor Real Produto</p>
              <p className="text-xl font-bold text-purple-800">R$ {parseFloat(sug.valor_total_gasto_produto || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white/60 rounded-xl p-3">
              <p className="text-[10px] text-purple-500 font-semibold uppercase">Valor Real Serviço</p>
              <p className="text-xl font-bold text-purple-800">R$ {parseFloat(sug.valor_total_gasto_servico || 0).toFixed(2)}</p>
            </div>
          </div>

          {divisoesArr.length > 0 && (
            <div className="space-y-1.5 mb-4">
              <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider">Divisão Final</p>
              {divisoesArr.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                  <span className="text-sm text-purple-800 font-medium">{d.casa_numero} - {d.nome_morador}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-purple-700">R$ {parseFloat(d.valor_pagar).toFixed(2)}</span>
                    {d.percentual_diferenca && parseFloat(d.percentual_diferenca) !== 0 && (
                      <span className={`ml-2 text-xs font-semibold ${parseFloat(d.percentual_diferenca) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                        ({parseFloat(d.percentual_diferenca) > 0 ? '+' : ''}{parseFloat(d.percentual_diferenca).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={gerarWhatsApp}
            className="w-full px-4 py-3 rounded-xl bg-green-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-all"
          >
            <MessageCircle size={18} />
            Enviar por WhatsApp
          </button>
        </div>
      )}

      {/* Vote Modal */}
      {showVoteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowVoteModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg text-navy-500">Votar</h2>
              <button onClick={() => setShowVoteModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-navy-500 mb-1.5">Votante</label>
                <div className="w-full px-4 py-3 rounded-xl border border-accent-blue/30 bg-accent-blue/5 text-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-blue/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-blue text-xs font-bold">{user?.nome?.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-navy-500">{user?.casaNumero} — {user?.nome}</p>
                    <p className="text-gray-400 text-xs">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-500 mb-2">Seu Voto *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setVoteValue('sim')}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      voteValue === 'sim' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <ThumbsUp size={24} className={`mx-auto mb-1 ${voteValue === 'sim' ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className="font-semibold text-sm">Sim</p>
                  </button>
                  <button
                    onClick={() => setVoteValue('nao')}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      voteValue === 'nao' ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <ThumbsDown size={24} className={`mx-auto mb-1 ${voteValue === 'nao' ? 'text-red-500' : 'text-gray-400'}`} />
                    <p className="font-semibold text-sm">Não</p>
                  </button>
                </div>
              </div>

              {voteValue === 'nao' && (
                <div>
                  <label className="block text-sm font-semibold text-navy-500 mb-1.5">Justificativa (opcional)</label>
                  <textarea
                    value={justificativa}
                    onChange={e => setJustificativa(e.target.value)}
                    placeholder="Motivo da reprovação..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 text-sm resize-none"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (!user?.casaId) return;
                votarMutation.mutate({
                  sugestaoId: sug.id,
                  casaId: user.casaId,
                  voto: voteValue,
                  justificativa: voteValue === 'nao' ? justificativa : undefined,
                });
              }}
              disabled={votarMutation.isPending}
              className="w-full mt-5 px-4 py-3 rounded-xl bg-navy-500 text-white font-semibold text-sm disabled:opacity-50"
            >
              {votarMutation.isPending ? 'Registrando...' : 'Confirmar Voto'}
            </button>
          </div>
        </div>
      )}

      {/* Divisão Modal */}
      {showDivisaoModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowDivisaoModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg text-navy-500">Dividir Despesa</h2>
              <button onClick={() => setShowDivisaoModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Valor total estimado: <strong className="text-navy-500">R$ {valorEstimado.toFixed(2)}</strong>
            </p>

            <div className="space-y-3">
              {allCasas.filter((c: any) => casasInteressadas.includes(c.id)).map((casa: any) => (
                <div key={casa.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-navy-500">{casa.numero}</p>
                    <p className="text-xs text-gray-400">{casa.nome_morador}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-400">R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={divisaoValues[String(casa.id)] || ''}
                      onChange={e => setDivisaoValues(v => ({ ...v, [String(casa.id)]: maskCurrency(e.target.value) }))}
                      className="w-28 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const vals: Record<string, number> = {};
                Object.entries(divisaoValues).forEach(([k, v]) => { vals[k] = parseFloat(unmaskCurrency(v)) || 0; });
                avancarMutation.mutate({
                  sugestaoId: sug.id,
                  casasIds: allCasas.filter((c: any) => casasInteressadas.includes(c.id)).map((c: any) => c.id),
                  valorPorCasa: vals,
                });
              }}
              disabled={avancarMutation.isPending}
              className="w-full mt-5 px-4 py-3 rounded-xl bg-accent-blue text-white font-semibold text-sm disabled:opacity-50"
            >
              {avancarMutation.isPending ? 'Salvando...' : 'Confirmar Divisão'}
            </button>
          </div>
        </div>
      )}

      {/* Concluir Modal */}
      {showConcluirModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowConcluirModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg text-navy-500">Concluir Projeto</h2>
              <button onClick={() => setShowConcluirModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-navy-500 mb-1.5">Valor Total Gasto - Produtos (R$)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={concluirForm.valorProduto}
                  onChange={e => setConcluirForm(f => ({ ...f, valorProduto: maskCurrency(e.target.value) }))}
                  placeholder="0,00"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-500 mb-1.5">Valor Total Gasto - Serviço (R$)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={concluirForm.valorServico}
                  onChange={e => setConcluirForm(f => ({ ...f, valorServico: maskCurrency(e.target.value) }))}
                  placeholder="0,00"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 text-sm"
                />
              </div>
            </div>

            <button
              onClick={() => {
                concluirMutation.mutate({
                  sugestaoId: sug.id,
                  valorTotalGastoProduto: parseFloat(unmaskCurrency(concluirForm.valorProduto)) || 0,
                  valorTotalGastoServico: parseFloat(unmaskCurrency(concluirForm.valorServico)) || 0,
                });
              }}
              disabled={concluirMutation.isPending}
              className="w-full mt-5 px-4 py-3 rounded-xl bg-purple-600 text-white font-semibold text-sm disabled:opacity-50"
            >
              {concluirMutation.isPending ? 'Concluindo...' : '🏁 Concluir Projeto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
