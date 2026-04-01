import { trpc } from '../trpc';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, Trophy, AlertTriangle, ChevronRight, Lightbulb } from 'lucide-react';

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  gerada: { icon: Lightbulb, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Ideia Gerada' },
  aguardando_avaliacao: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Aguardando Avaliação' },
  aprovada_parcial: { icon: AlertTriangle, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Aprovada Parcial' },
  aprovada_total: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Aprovada por Todos' },
  desistencia: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Desistência' },
  concluida: { icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Projeto Concluído' },
};

export default function AprovacaoPage() {
  const navigate = useNavigate();
  const sugestoesQuery = trpc.sugestoes.list.useQuery();
  const sugestoes = (sugestoesQuery.data || []) as any[];

  const grouped = {
    ativas: sugestoes.filter(s => ['aguardando_avaliacao', 'aprovada_parcial', 'aprovada_total'].includes(s.status)),
    concluidas: sugestoes.filter(s => ['concluida', 'desistencia'].includes(s.status)),
    geradas: sugestoes.filter(s => s.status === 'gerada'),
  };

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-3xl text-navy-500">Votação das Ideias</h1>
        <p className="text-gray-500 mt-1">Acompanhe o status e vote nas sugestões</p>
      </div>

      {sugestoes.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <CheckCircle size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Nenhuma sugestão para avaliar</p>
        </div>
      )}

      {/* Ativas */}
      {grouped.ativas.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display font-bold text-sm text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Em andamento ({grouped.ativas.length})
          </h2>
          <div className="space-y-3">
            {grouped.ativas.map((sug: any) => {
              const cfg = statusConfig[sug.status] || statusConfig.gerada;
              const Icon = cfg.icon;
              const votosTotal = parseInt(sug.total_casas) > 0 ? parseInt(sug.total_casas) - 1 : 0;
              const progress = votosTotal > 0 ? (parseInt(sug.total_votos) / votosTotal) * 100 : 0;

              return (
                <button
                  key={sug.id}
                  onClick={() => navigate(`/aprovacao/${sug.id}`)}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-300 text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={22} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-navy-500 truncate">
                          {sug.categoria_nome || sug.item_tipo || sug.item_outros || 'Sugestão #' + sug.id}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{sug.motivo}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-400">🏠 {sug.casa_numero}</span>
                        <span className="text-xs text-gray-400">🗳️ {sug.total_votos}/{votosTotal} votos</span>
                        {/* Progress bar */}
                        <div className="flex-1 max-w-[120px]">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-green rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-navy-500 transition-colors flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Concluidas */}
      {grouped.concluidas.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">
            Finalizadas ({grouped.concluidas.length})
          </h2>
          <div className="space-y-3">
            {grouped.concluidas.map((sug: any) => {
              const cfg = statusConfig[sug.status] || statusConfig.gerada;
              const Icon = cfg.icon;
              return (
                <button
                  key={sug.id}
                  onClick={() => navigate(`/aprovacao/${sug.id}`)}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all text-left opacity-80 hover:opacity-100 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-navy-500 text-sm truncate">
                        {sug.categoria_nome || sug.item_tipo || sug.item_outros || 'Sugestão #' + sug.id}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">🏠 {sug.casa_numero}</span>
                        <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                        {sug.valor_total_gasto_produto && (
                          <span className="text-xs text-gray-400">
                            💰 R$ {(parseFloat(sug.valor_total_gasto_produto || 0) + parseFloat(sug.valor_total_gasto_servico || 0)).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-navy-500 transition-colors flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
