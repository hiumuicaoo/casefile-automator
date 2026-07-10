// Server-only: pool kết nối tới Postgres local trên server Ubuntu.
// KHÔNG được import từ code client. Chỉ dùng trong .server.ts hoặc handler của createServerFn.
import { Pool } from "pg";

let _pool: Pool | undefined;

export function getPool(): Pool {
  if (!_pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USER ?? "postgres"}@${process.env.DB_HOST ?? "postgres"}:${process.env.DB_PORT ?? "5432"}/${process.env.DB_NAME ?? "casefile_db"}`;
    _pool = new Pool({ connectionString, max: 10 });
  }
  return _pool;
}
