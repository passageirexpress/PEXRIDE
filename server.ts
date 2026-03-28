import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Bypass self-signed certificate issues for Vercel Postgres
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon/Vercel Postgres
  },
});

// Helper to mimic @vercel/postgres tagged template
async function sql(strings: TemplateStringsArray, ...values: any[]) {
  const query = strings.reduce((acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ''), '');
  return pool.query(query, values);
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  app.use(cors());
  app.use(express.json());

  // Initialize Postgres Tables
  console.log('Checking environment variables...');
  console.log('POSTGRES_URL present:', !!process.env.POSTGRES_URL);

  try {
    console.log('Attempting to initialize Postgres tables...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT UNIQUE NOT NULL,
        email TEXT,
        display_name TEXT,
        role TEXT DEFAULT 'passenger',
        photo_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Users table checked/created');
    await sql`
      CREATE TABLE IF NOT EXISTS rides (
        id SERIAL PRIMARY KEY,
        passenger_id TEXT REFERENCES users(uid),
        driver_id TEXT,
        pickup_location TEXT NOT NULL,
        dropoff_location TEXT NOT NULL,
        status TEXT DEFAULT 'requested',
        ride_type TEXT,
        vehicle_name TEXT,
        price NUMERIC,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        make TEXT,
        model TEXT,
        type TEXT,
        license_plate TEXT UNIQUE,
        capacity INTEGER,
        status TEXT DEFAULT 'active'
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        chat_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_name TEXT,
        text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS driver_locations (
        id SERIAL PRIMARY KEY,
        driver_id TEXT UNIQUE NOT NULL,
        driver_name TEXT,
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        status TEXT DEFAULT 'available',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS driver_location_history (
        id SERIAL PRIMARY KEY,
        driver_id TEXT NOT NULL,
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS pois (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        duration TEXT NOT NULL,
        image_url TEXT,
        status TEXT DEFAULT 'Active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Postgres tables initialized');
  } catch (err) {
    console.error('Error initializing Postgres tables:', err);
  }

  // API Routes
  app.get('/api/health', async (req, res) => {
    const envCheck = {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      POSTGRES_HOST: !!process.env.POSTGRES_HOST,
      POSTGRES_DATABASE: !!process.env.POSTGRES_DATABASE,
      POSTGRES_USER: !!process.env.POSTGRES_USER,
      POSTGRES_PASSWORD: !!process.env.POSTGRES_PASSWORD,
    };

    try {
      if (!process.env.POSTGRES_URL) {
        throw new Error('Missing POSTGRES_URL environment variable. Please add it in Settings > Environment Variables.');
      }
      await pool.query('SELECT 1;');
      res.json({ status: 'ok', database: 'connected', envCheck });
    } catch (err) {
      res.status(500).json({ 
        status: 'error', 
        database: 'disconnected', 
        error: err.message,
        envCheck
      });
    }
  });

  // User Routes
  app.post('/api/users', async (req, res) => {
    const { uid, email, displayName, role, photoURL } = req.body;
    try {
      const { rows } = await sql`
        INSERT INTO users (uid, email, display_name, role, photo_url)
        VALUES (${uid}, ${email}, ${displayName}, ${role}, ${photoURL})
        ON CONFLICT (uid) DO UPDATE SET
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          photo_url = EXCLUDED.photo_url
        RETURNING *;
      `;
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/users/passengers', async (req, res) => {
    try {
      const { rows } = await sql`SELECT * FROM users WHERE role = 'passenger' ORDER BY created_at DESC;`;
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Ride Routes
  app.post('/api/rides', async (req, res) => {
    const { passengerId, pickupLocation, dropoffLocation, rideType, vehicleName, price } = req.body;
    try {
      const { rows } = await sql`
        INSERT INTO rides (passenger_id, pickup_location, dropoff_location, ride_type, vehicle_name, price)
        VALUES (${passengerId}, ${pickupLocation}, ${dropoffLocation}, ${rideType}, ${vehicleName}, ${price})
        RETURNING *;
      `;
      const ride = rows[0];
      io.emit('ride:requested', ride);
      res.json(ride);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/rides', async (req, res) => {
    try {
      const { rows } = await sql`SELECT * FROM rides ORDER BY created_at DESC LIMIT 50;`;
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/rides/:id', async (req, res) => {
    const { id } = req.params;
    const { status, driverId } = req.body;
    try {
      const { rows } = await sql`
        UPDATE rides 
        SET status = COALESCE(${status}, status), 
            driver_id = COALESCE(${driverId}, driver_id)
        WHERE id = ${id}
        RETURNING *;
      `;
      const ride = rows[0];
      io.emit('ride:updated', ride);
      res.json(ride);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/rides/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await sql`DELETE FROM rides WHERE id = ${id};`;
      io.emit('ride:deleted', id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vehicle Routes
  app.post('/api/vehicles', async (req, res) => {
    const { make, model, type, licensePlate, capacity } = req.body;
    try {
      const { rows } = await sql`
        INSERT INTO vehicles (make, model, type, license_plate, capacity)
        VALUES (${make}, ${model}, ${type}, ${licensePlate}, ${capacity})
        RETURNING *;
      `;
      const vehicle = rows[0];
      io.emit('vehicle:added', vehicle);
      res.json(vehicle);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/vehicles', async (req, res) => {
    try {
      const { rows } = await sql`SELECT * FROM vehicles ORDER BY id DESC;`;
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/vehicles/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await sql`DELETE FROM vehicles WHERE id = ${id};`;
      io.emit('vehicle:deleted', id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Chat Routes
  app.post('/api/chats/:chatId/messages', async (req, res) => {
    const { chatId } = req.params;
    const { senderId, senderName, text } = req.body;
    try {
      const { rows } = await sql`
        INSERT INTO chat_messages (chat_id, sender_id, sender_name, text)
        VALUES (${chatId}, ${senderId}, ${senderName}, ${text})
        RETURNING *;
      `;
      const message = rows[0];
      io.to(chatId).emit('chat:message', message);
      res.json(message);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/chats/:chatId/messages', async (req, res) => {
    const { chatId } = req.params;
    try {
      const { rows } = await sql`
        SELECT * FROM chat_messages WHERE chat_id = ${chatId} ORDER BY created_at ASC;
      `;
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Driver Location Routes
  app.post('/api/driver-locations', async (req, res) => {
    const { driverId, driverName, lat, lng, status } = req.body;
    try {
      const { rows } = await sql`
        INSERT INTO driver_locations (driver_id, driver_name, lat, lng, status)
        VALUES (${driverId}, ${driverName}, ${lat}, ${lng}, ${status})
        ON CONFLICT (driver_id) DO UPDATE SET
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          status = EXCLUDED.status,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;
      const location = rows[0];

      // Insert into history
      await sql`
        INSERT INTO driver_location_history (driver_id, lat, lng)
        VALUES (${driverId}, ${lat}, ${lng})
      `;

      io.emit('driver:location_updated', location);
      res.json(location);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/driver-locations/:driverId/history', async (req, res) => {
    const { driverId } = req.params;
    try {
      const { rows } = await sql`
        SELECT lat, lng, created_at 
        FROM driver_location_history 
        WHERE driver_id = ${driverId} 
        ORDER BY created_at DESC 
        LIMIT 50;
      `;
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/driver-locations', async (req, res) => {
    try {
      const { rows } = await sql`SELECT * FROM driver_locations;`;
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POI Routes
  app.post('/api/pois', async (req, res) => {
    const { name, price, duration, imageUrl, status } = req.body;
    try {
      const { rows } = await sql`
        INSERT INTO pois (name, price, duration, image_url, status)
        VALUES (${name}, ${price}, ${duration}, ${imageUrl}, ${status})
        RETURNING *;
      `;
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/pois', async (req, res) => {
    try {
      const { rows } = await sql`SELECT * FROM pois ORDER BY created_at DESC;`;
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/pois/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await sql`DELETE FROM pois WHERE id = ${id};`;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Socket.io Connection
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join:chat', (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });

    socket.on('chat:typing', (data) => {
      socket.to(data.chatId).emit('chat:typing', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
