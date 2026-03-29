import pg from 'pg';
const { Pool } = pg;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function verifySchema() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Verifying database schema...');
    
    // Ensure read_at exists in chat_messages
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='read_at') THEN
          ALTER TABLE chat_messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
        END IF;
      END $$;
    `);
    console.log('Column chat_messages.read_at verified/added.');

    // Ensure driver_location_history exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS driver_location_history (
        id SERIAL PRIMARY KEY,
        driver_id TEXT NOT NULL,
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table driver_location_history verified/created.');

    // Test a simple query on all tables
    const tables = ['users', 'rides', 'vehicles', 'chat_messages', 'driver_locations', 'driver_location_history', 'pois'];
    for (const table of tables) {
      const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`Table ${table} has ${res.rows[0].count} rows.`);
    }

    console.log('Schema verification complete.');
  } catch (err) {
    console.error('Schema verification failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifySchema();
