import * as schema from "@shared/shared/schema";

const dbUrl = process.env.DATABASE_URL || "";

let db, pool;

if (dbUrl.startsWith("postgres://")) {
  // 로컬 PostgreSQL (pg)
  const { Pool } = await import('pg');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  pool = new Pool({ connectionString: dbUrl });
  db = drizzle(pool, { schema });
  // 연결 테스트
  (async () => {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('로컬 DB 연결 성공');
    } catch (error) {
      console.error('로컬 DB 연결 실패:', error);
    }
  })();
} else if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgresql+ws://")) {
  // Neon 서버리스 (WebSocket)
  const { Pool, neonConfig } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-serverless');
  const ws = (await import('ws')).default;
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: dbUrl });
  db = drizzle({ client: pool, schema });
  // 연결 테스트
  (async () => {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('Neon DB 연결 성공');
    } catch (error) {
      console.error('Neon DB 연결 실패:', error);
    }
  })();
} else {
  throw new Error("지원하지 않는 DATABASE_URL 형식입니다.");
}

export { db, pool };
