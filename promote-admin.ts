import pg from 'pg';
const { Pool } = pg;
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const ADMIN_EMAIL = 'michaelsouzaxt21@gmail.com';

async function promoteAdmin() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log(`Promoting ${ADMIN_EMAIL} to admin...`);
    
    // Update Postgres
    const res = await pool.query(`
      UPDATE users 
      SET role = 'admin' 
      WHERE email = $1 
      RETURNING *;
    `, [ADMIN_EMAIL]);
    
    if (res.rowCount > 0) {
      console.log('Postgres: User promoted to admin.');
    } else {
      console.log('Postgres: User not found in database yet.');
    }

    console.log('Promotion script complete.');
  } catch (err) {
    console.error('Promotion failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

promoteAdmin();
