import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { getDb, getPool } from './db';
import { casas, categorias, sugestoes, votos, divisoes } from './schema';
import { eq, and, sql } from 'drizzle-orm';

const t = initTRPC.create();
const publicProcedure = t.procedure;

export const appRouter = t.router({
  // ========== CASAS ==========
  casas: t.router({
    list: publicProcedure.query(async () => {
      const db = getDb();
      return db.select().from(casas).orderBy(casas.numero);
    }),

    create: publicProcedure
      .input(z.object({
        numero: z.string(),
        nomeMorador: z.string().min(1),
        email: z.string().email(),
        telefone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        // Check max 5
        const existing = await db.select().from(casas);
        if (existing.length >= 5) throw new Error('Máximo de 5 casas atingido');
        // Check unique
        const dup = existing.find(c => c.numero === input.numero);
        if (dup) throw new Error(`${input.numero} já está cadastrada`);

        await db.insert(casas).values({
          numero: input.numero,
          nomeMorador: input.nomeMorador,
          email: input.email,
          telefone: input.telefone || null,
        });
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = getDb();
        await db.delete(casas).where(eq(casas.id, input.id));
        return { success: true };
      }),
  }),

  // ========== CATEGORIAS ==========
  categorias: t.router({
    list: publicProcedure.query(async () => {
      const db = getDb();
      return db.select().from(categorias).orderBy(categorias.nome);
    }),

    create: publicProcedure
      .input(z.object({ nome: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const db = getDb();
        await db.insert(categorias).values({
          nome: input.nome,
          tipo: 'Condomínio',
        });
        return { success: true };
      }),
  }),

  // ========== SUGESTÕES ==========
  sugestoes: t.router({
    list: publicProcedure.query(async () => {
      const db = getDb();
      const pool = getPool();
      const [rows] = await pool.query(`
        SELECT s.*, c.numero as casa_numero, c.nome_morador, c.email as casa_email,
               cat.nome as categoria_nome,
               (SELECT COUNT(*) FROM votos WHERE sugestao_id = s.id) as total_votos,
               (SELECT COUNT(*) FROM votos WHERE sugestao_id = s.id AND voto = 'sim') as votos_sim,
               (SELECT COUNT(*) FROM votos WHERE sugestao_id = s.id AND voto = 'nao') as votos_nao,
               (SELECT COUNT(*) FROM casas) as total_casas
        FROM sugestoes s
        LEFT JOIN casas c ON c.id = s.casa_id
        LEFT JOIN categorias cat ON cat.id = s.categoria_id
        ORDER BY s.created_at DESC
      `);
      return rows;
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const pool = getPool();
        const [rows] = await pool.query(`
          SELECT s.*, c.numero as casa_numero, c.nome_morador, c.email as casa_email,
                 cat.nome as categoria_nome
          FROM sugestoes s
          LEFT JOIN casas c ON c.id = s.casa_id
          LEFT JOIN categorias cat ON cat.id = s.categoria_id
          WHERE s.id = ?
        `, [input.id]);
        const sugestao = (rows as any[])[0];
        if (!sugestao) throw new Error('Sugestão não encontrada');

        // Get votes
        const [votosRows] = await pool.query(`
          SELECT v.*, c.numero as casa_numero, c.nome_morador
          FROM votos v
          LEFT JOIN casas c ON c.id = v.casa_id
          WHERE v.sugestao_id = ?
        `, [input.id]);

        // Get divisoes
        const [divisoesRows] = await pool.query(`
          SELECT d.*, c.numero as casa_numero, c.nome_morador
          FROM divisoes d
          LEFT JOIN casas c ON c.id = d.casa_id
          WHERE d.sugestao_id = ?
        `, [input.id]);

        // Get all casas
        const [casasRows] = await pool.query('SELECT * FROM casas ORDER BY numero');

        return {
          ...sugestao,
          votos: votosRows,
          divisoes: divisoesRows,
          casas: casasRows,
        };
      }),

    create: publicProcedure
      .input(z.object({
        casaId: z.number(),
        tipoSugestao: z.string(),
        categoriaId: z.number().optional(),
        itemTipo: z.string().optional(),
        itemOutros: z.string().optional(),
        temValor: z.boolean(),
        valorProduto: z.number().optional(),
        valorServico: z.number().optional(),
        sugestaoValorProduto: z.number().optional(),
        sugestaoValorServico: z.number().optional(),
        motivo: z.string().min(1),
        melhoria: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const pool = getPool();

        const [result] = await pool.query(`
          INSERT INTO sugestoes (casa_id, tipo_sugestao, categoria_id, item_tipo, item_outros,
            tem_valor, valor_produto, valor_servico, sugestao_valor_produto, sugestao_valor_servico,
            motivo, melhoria, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aguardando_avaliacao')
        `, [
          input.casaId, input.tipoSugestao, input.categoriaId || null,
          input.itemTipo || null, input.itemOutros || null,
          input.temValor, input.valorProduto || null, input.valorServico || null,
          input.sugestaoValorProduto || null, input.sugestaoValorServico || null,
          input.motivo, input.melhoria || null,
        ]);

        // Send email to all houses
        try {
          const [allCasas] = await pool.query('SELECT * FROM casas') as any;
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          const solicitante = allCasas.find((c: any) => c.id === input.casaId);

          for (const casa of allCasas) {
            if (casa.id === input.casaId) continue;
            await resend.emails.send({
              from: process.env.RESEND_FROM || 'noreply@msconsultoria.net.br',
              to: casa.email,
              subject: `🏠 Nova Sugestão no Condomínio 985 - Avalie!`,
              html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                  <h2 style="color:#011A23;">Condomínio 985</h2>
                  <p>Olá <strong>${casa.nome_morador}</strong>,</p>
                  <p><strong>${solicitante?.nome_morador}</strong> (${solicitante?.numero}) criou uma nova sugestão que precisa da sua avaliação.</p>
                  <p><strong>Tipo:</strong> ${input.tipoSugestao === 'novo' ? 'Novo' : 'Manutenção'}</p>
                  <p><strong>Motivo:</strong> ${input.motivo}</p>
                  <p>Acesse o sistema para votar!</p>
                  <a href="${process.env.APP_URL || 'http://localhost:5173'}" style="display:inline-block;padding:12px 24px;background:#011A23;color:white;text-decoration:none;border-radius:8px;margin-top:10px;">Avaliar Sugestão</a>
                </div>
              `,
            });
          }
        } catch (e) {
          console.error('Email error:', e);
        }

        return { success: true, id: (result as any).insertId };
      }),

    votar: publicProcedure
      .input(z.object({
        sugestaoId: z.number(),
        casaId: z.number(),
        voto: z.enum(['sim', 'nao']),
        justificativa: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const pool = getPool();

        // Check if already voted
        const [existing] = await pool.query(
          'SELECT id FROM votos WHERE sugestao_id = ? AND casa_id = ?',
          [input.sugestaoId, input.casaId]
        ) as any;
        if (existing.length > 0) throw new Error('Esta casa já votou nesta sugestão');

        await pool.query(
          'INSERT INTO votos (sugestao_id, casa_id, voto, justificativa) VALUES (?, ?, ?, ?)',
          [input.sugestaoId, input.casaId, input.voto, input.justificativa || null]
        );

        // Check if all voted
        const [casasCount] = await pool.query('SELECT COUNT(*) as total FROM casas') as any;
        const [sugestaoRow] = await pool.query('SELECT casa_id FROM sugestoes WHERE id = ?', [input.sugestaoId]) as any;
        const totalCasas = casasCount[0].total;
        // Total votes needed = all houses except the one who created
        const votesNeeded = totalCasas - 1;

        const [votosCount] = await pool.query(
          'SELECT COUNT(*) as total, SUM(voto = "sim") as sim, SUM(voto = "nao") as nao FROM votos WHERE sugestao_id = ?',
          [input.sugestaoId]
        ) as any;

        if (votosCount[0].total >= votesNeeded) {
          const allSim = votosCount[0].nao === 0;
          const newStatus = allSim ? 'aprovada_total' : 'aprovada_parcial';
          await pool.query('UPDATE sugestoes SET status = ? WHERE id = ?', [newStatus, input.sugestaoId]);

          // If all approved, auto-divide equally
          if (allSim) {
            const [sug] = await pool.query('SELECT * FROM sugestoes WHERE id = ?', [input.sugestaoId]) as any;
            const valorTotal = parseFloat(sug[0].valor_produto || sug[0].sugestao_valor_produto || 0) +
                               parseFloat(sug[0].valor_servico || sug[0].sugestao_valor_servico || 0);
            const valorPorCasa = valorTotal / totalCasas;

            const [allCasas] = await pool.query('SELECT id FROM casas') as any;
            for (const casa of allCasas) {
              await pool.query(
                'INSERT INTO divisoes (sugestao_id, casa_id, valor_pagar) VALUES (?, ?, ?)',
                [input.sugestaoId, casa.id, valorPorCasa.toFixed(2)]
              );
            }
          }
        }

        return { success: true };
      }),

    avancarParcial: publicProcedure
      .input(z.object({
        sugestaoId: z.number(),
        casasIds: z.array(z.number()),
        valorPorCasa: z.record(z.string(), z.number()),
      }))
      .mutation(async ({ input }) => {
        const pool = getPool();
        // Delete old divisions
        await pool.query('DELETE FROM divisoes WHERE sugestao_id = ?', [input.sugestaoId]);

        for (const casaId of input.casasIds) {
          const valor = input.valorPorCasa[String(casaId)] || 0;
          await pool.query(
            'INSERT INTO divisoes (sugestao_id, casa_id, valor_pagar) VALUES (?, ?, ?)',
            [input.sugestaoId, casaId, valor.toFixed(2)]
          );
        }

        await pool.query('UPDATE sugestoes SET status = "aprovada_parcial" WHERE id = ?', [input.sugestaoId]);
        return { success: true };
      }),

    desistir: publicProcedure
      .input(z.object({ sugestaoId: z.number() }))
      .mutation(async ({ input }) => {
        const pool = getPool();
        await pool.query('UPDATE sugestoes SET status = "desistencia" WHERE id = ?', [input.sugestaoId]);
        return { success: true };
      }),

    concluir: publicProcedure
      .input(z.object({
        sugestaoId: z.number(),
        valorTotalGastoProduto: z.number(),
        valorTotalGastoServico: z.number(),
      }))
      .mutation(async ({ input }) => {
        const pool = getPool();

        await pool.query(
          'UPDATE sugestoes SET status = "concluida", valor_total_gasto_produto = ?, valor_total_gasto_servico = ? WHERE id = ?',
          [input.valorTotalGastoProduto, input.valorTotalGastoServico, input.sugestaoId]
        );

        // Recalculate divisions based on actual cost
        const [sug] = await pool.query('SELECT * FROM sugestoes WHERE id = ?', [input.sugestaoId]) as any;
        const [divs] = await pool.query('SELECT * FROM divisoes WHERE sugestao_id = ?', [input.sugestaoId]) as any;

        const valorTotalReal = input.valorTotalGastoProduto + input.valorTotalGastoServico;
        const valorTotalEstimado = divs.reduce((sum: number, d: any) => sum + parseFloat(d.valor_pagar), 0);

        if (divs.length > 0) {
          const valorRealPorCasa = valorTotalReal / divs.length;
          const percentualDiferenca = valorTotalEstimado > 0
            ? ((valorTotalReal - valorTotalEstimado) / valorTotalEstimado) * 100
            : 0;

          for (const div of divs) {
            await pool.query(
              'UPDATE divisoes SET valor_pagar = ?, percentual_diferenca = ? WHERE id = ?',
              [valorRealPorCasa.toFixed(2), percentualDiferenca.toFixed(2), div.id]
            );
          }
        }

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
