import { mysqlTable, varchar, int, text, timestamp, decimal, mysqlEnum, boolean, uniqueIndex } from 'drizzle-orm/mysql-core';

export const casas = mysqlTable('casas', {
  id: int('id').primaryKey().autoincrement(),
  numero: varchar('numero', { length: 20 }).notNull(),
  nomeMorador: varchar('nome_morador', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  telefone: varchar('telefone', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueNumero: uniqueIndex('unique_numero').on(table.numero),
}));

export const categorias = mysqlTable('categorias', {
  id: int('id').primaryKey().autoincrement(),
  nome: varchar('nome', { length: 255 }).notNull(),
  tipo: varchar('tipo', { length: 50 }).notNull().default('Condomínio'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sugestoes = mysqlTable('sugestoes', {
  id: int('id').primaryKey().autoincrement(),
  casaId: int('casa_id').notNull(),
  tipoSugestao: varchar('tipo_sugestao', { length: 20 }).notNull(), // 'novo' ou 'manutencao'
  categoriaId: int('categoria_id'),
  itemTipo: varchar('item_tipo', { length: 100 }), // Para 'novo': Portão, Câmera, etc
  itemOutros: varchar('item_outros', { length: 255 }), // Se escolheu "Outros"
  temValor: boolean('tem_valor').notNull().default(false),
  valorProduto: decimal('valor_produto', { precision: 12, scale: 2 }),
  valorServico: decimal('valor_servico', { precision: 12, scale: 2 }),
  sugestaoValorProduto: decimal('sugestao_valor_produto', { precision: 12, scale: 2 }),
  sugestaoValorServico: decimal('sugestao_valor_servico', { precision: 12, scale: 2 }),
  motivo: text('motivo').notNull(),
  melhoria: text('melhoria'),
  status: varchar('status', { length: 50 }).notNull().default('gerada'),
  // gerada, aguardando_avaliacao, aprovada_parcial, aprovada_total, desistencia, concluida
  valorTotalGastoProduto: decimal('valor_total_gasto_produto', { precision: 12, scale: 2 }),
  valorTotalGastoServico: decimal('valor_total_gasto_servico', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const votos = mysqlTable('votos', {
  id: int('id').primaryKey().autoincrement(),
  sugestaoId: int('sugestao_id').notNull(),
  casaId: int('casa_id').notNull(),
  voto: varchar('voto', { length: 10 }).notNull(), // 'sim' ou 'nao'
  justificativa: text('justificativa'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const divisoes = mysqlTable('divisoes', {
  id: int('id').primaryKey().autoincrement(),
  sugestaoId: int('sugestao_id').notNull(),
  casaId: int('casa_id').notNull(),
  valorPagar: decimal('valor_pagar', { precision: 12, scale: 2 }).notNull(),
  percentualDiferenca: decimal('percentual_diferenca', { precision: 8, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
});
