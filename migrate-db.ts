import pg from 'pg';
const { Pool } = pg;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Running migrations...');
    
    // Add columns to rides table if they don't exist
    await pool.query(`
      ALTER TABLE rides ADD COLUMN IF NOT EXISTS passenger_name TEXT;
      ALTER TABLE rides ADD COLUMN IF NOT EXISTS preferences JSONB;
    `);
    
    console.log('Migrations complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
