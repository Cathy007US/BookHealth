import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';

async function migrate() {
  const schemaPath = path.join(__dirname, '..', '..', '..', 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  try {
    await pool.query(sql);
    console.log('[Migrate] Database schema created successfully');
    process.exit(0);
  } catch (err: any) {
    console.error('[Migrate] Failed:', err.message);
    process.exit(1);
  }
}

migrate();
