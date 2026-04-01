import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

let pool: mysql.Pool;
let db: ReturnType<typeof drizzle>;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL || process.env.MYSQL_URL,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

export function getDb() {
  if (!db) {
    db = drizzle(getPool(), { schema, mode: 'default' });
  }
  return db;
}

export async function runMigrations() {
  const p = getPool();
  const conn = await p.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS casas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero VARCHAR(20) NOT NULL,
        nome_morador VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        telefone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_numero (numero)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        tipo VARCHAR(50) NOT NULL DEFAULT 'Condomínio',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS sugestoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        casa_id INT NOT NULL,
        tipo_sugestao VARCHAR(20) NOT NULL,
        categoria_id INT,
        item_tipo VARCHAR(100),
        item_outros VARCHAR(255),
        tem_valor BOOLEAN NOT NULL DEFAULT FALSE,
        valor_produto DECIMAL(12,2),
        valor_servico DECIMAL(12,2),
        sugestao_valor_produto DECIMAL(12,2),
        sugestao_valor_servico DECIMAL(12,2),
        motivo TEXT NOT NULL,
        melhoria TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'gerada',
        valor_total_gasto_produto DECIMAL(12,2),
        valor_total_gasto_servico DECIMAL(12,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS votos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sugestao_id INT NOT NULL,
        casa_id INT NOT NULL,
        voto VARCHAR(10) NOT NULL,
        justificativa TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_voto (sugestao_id, casa_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS divisoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sugestao_id INT NOT NULL,
        casa_id INT NOT NULL,
        valor_pagar DECIMAL(12,2) NOT NULL,
        percentual_diferenca DECIMAL(8,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default categories
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM categorias') as any;
    if (rows[0].count === 0) {
      await conn.query(`
        INSERT INTO categorias (nome, tipo) VALUES
        ('Lavar Calçada', 'Condomínio'),
        ('Limpar Pátio', 'Condomínio'),
        ('Cerca Elétrica', 'Condomínio'),
        ('Pintura Portão', 'Condomínio'),
        ('Pintura Muros', 'Condomínio'),
        ('Portão Elétrico', 'Condomínio')
      `);
    }

    console.log('✅ Migrations executed successfully');
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  } finally {
    conn.release();
  }
}
