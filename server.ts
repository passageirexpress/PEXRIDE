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
        status TEXT DEFAULT 'active',
        photo_url TEXT,
        phone_number TEXT,
        license_number TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Users table checked/created');
    await sql`
      CREATE TABLE IF NOT EXISTS rides (
        id SERIAL PRIMARY KEY,
        passenger_id TEXT REFERENCES users(uid),
        passenger_name TEXT,
        driver_id TEXT,
        pickup_location TEXT NOT NULL,
        dropoff_location TEXT NOT NULL,
        status TEXT DEFAULT 'requested',
        ride_type TEXT,
        vehicle_name TEXT,
        price NUMERIC,
        preferences JSONB,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Add columns if they don't exist (for existing databases)
    try { await sql`ALTER TABLE users ADD COLUMN phone_number TEXT;`; } catch (e) {}
    try { await sql`ALTER TABLE users ADD COLUMN license_number TEXT;`; } catch (e) {}
    try { await sql`ALTER TABLE rides ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;`; } catch (e) {}
    try { await sql`ALTER TABLE rides ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;`; } catch (e) {}
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP WITH TIME ZONE
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
        tour_price NUMERIC DEFAULT 0,
        duration TEXT NOT NULL,
        image_url TEXT,
        status TEXT DEFAULT 'Active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Add columns if they don't exist
    try { await sql`ALTER TABLE pois ADD COLUMN tour_price NUMERIC DEFAULT 0;`; } catch (e) {}
    try { await sql`ALTER TABLE pois ADD COLUMN image_url TEXT;`; } catch (e) {}
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS vehicle_types (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        base_price NUMERIC DEFAULT 0,
        multiplier NUMERIC DEFAULT 1.0,
        price_per_km NUMERIC DEFAULT 0,
        price_per_min NUMERIC DEFAULT 0,
        min_fare NUMERIC DEFAULT 0,
        hourly_rate NUMERIC DEFAULT 0,
        capacity INTEGER,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Add columns if they don't exist
    try { await sql`ALTER TABLE vehicle_types ADD COLUMN price_per_km NUMERIC DEFAULT 0;`; } catch (e) {}
    try { await sql`ALTER TABLE vehicle_types ADD COLUMN price_per_min NUMERIC DEFAULT 0;`; } catch (e) {}
    try { await sql`ALTER TABLE vehicle_types ADD COLUMN min_fare NUMERIC DEFAULT 0;`; } catch (e) {}
    try { await sql`ALTER TABLE vehicle_types ADD COLUMN hourly_rate NUMERIC DEFAULT 0;`; } catch (e) {}
    
    // Seed initial settings if not exists
    await sql`
      INSERT INTO settings (key, value)
      VALUES ('pricing', '{"normal_price_per_km": 1.5, "base_fare": 5.0}')
      ON CONFLICT (key) DO NOTHING;
    `;

    // Seed initial vehicle types
    await sql`
      INSERT INTO vehicle_types (name, base_price, multiplier, price_per_km, price_per_min, min_fare, capacity, description)
      VALUES 
        ('Business', 5.0, 1.0, 1.5, 0.5, 15.0, 4, 'Standard luxury sedan'),
        ('First Class', 10.0, 1.5, 2.5, 1.0, 25.0, 3, 'Premium luxury experience'),
        ('SUV', 8.0, 1.3, 2.0, 0.8, 20.0, 6, 'Spacious luxury SUV')
      ON CONFLICT (name) DO UPDATE SET
        base_price = EXCLUDED.base_price,
        multiplier = EXCLUDED.multiplier,
        price_per_km = EXCLUDED.price_per_km,
        price_per_min = EXCLUDED.price_per_min,
        min_fare = EXCLUDED.min_fare,
        capacity = EXCLUDED.capacity,
        description = EXCLUDED.description;
    `;

    // Seed POIs if empty
    const { rows: poiCount } = await sql`SELECT count(*) FROM pois`;
    if (parseInt(poiCount[0].count) === 0) {
      const initialPois = [
        // Portugal
        ['Torre de Belém, Lisbon', 15, 25, '2h', 'https://picsum.photos/seed/belem/800/600'],
        ['Pena Palace, Sintra', 25, 45, '4h', 'https://picsum.photos/seed/pena/800/600'],
        ['Ribeira, Porto', 10, 20, '3h', 'https://picsum.photos/seed/porto/800/600'],
        ['Benagil Cave, Algarve', 35, 60, '3h', 'https://picsum.photos/seed/benagil/800/600'],
        ['University of Coimbra', 12, 22, '2h', 'https://picsum.photos/seed/coimbra/800/600'],
        ['Évora Roman Temple', 8, 15, '1.5h', 'https://picsum.photos/seed/evora/800/600'],
        ['Fatima Sanctuary', 0, 30, '4h', 'https://picsum.photos/seed/fatima/800/600'],
        ['Óbidos Medieval Village', 0, 25, '3h', 'https://picsum.photos/seed/obidos/800/600'],
        
        // France
        ['Eiffel Tower, Paris', 30, 55, '3h', 'https://picsum.photos/seed/eiffel/800/600'],
        ['Louvre Museum, Paris', 20, 40, '5h', 'https://picsum.photos/seed/louvre/800/600'],
        ['Mont Saint-Michel', 15, 35, '4h', 'https://picsum.photos/seed/mont/800/600'],
        ['Palace of Versailles', 25, 50, '5h', 'https://picsum.photos/seed/versailles/800/600'],
        ['Promenade des Anglais, Nice', 0, 20, '2h', 'https://picsum.photos/seed/nice/800/600'],
        ['Carcassonne Fortress', 12, 28, '3h', 'https://picsum.photos/seed/carcassonne/800/600'],
        ['Chamonix-Mont-Blanc', 50, 90, '6h', 'https://picsum.photos/seed/chamonix/800/600'],
        ['Verdon Gorge', 0, 45, '5h', 'https://picsum.photos/seed/verdon/800/600'],
        
        // Spain
        ['Sagrada Família, Barcelona', 26, 48, '3h', 'https://picsum.photos/seed/sagrada/800/600'],
        ['Alhambra, Granada', 18, 38, '4h', 'https://picsum.photos/seed/alhambra/800/600'],
        ['Prado Museum, Madrid', 15, 30, '4h', 'https://picsum.photos/seed/prado/800/600'],
        ['Seville Cathedral', 12, 25, '2h', 'https://picsum.photos/seed/seville/800/600'],
        ['Park Güell, Barcelona', 10, 22, '2h', 'https://picsum.photos/seed/guell/800/600'],
        ['Guggenheim Museum, Bilbao', 16, 32, '3h', 'https://picsum.photos/seed/bilbao/800/600'],
        ['Santiago de Compostela Cathedral', 0, 25, '3h', 'https://picsum.photos/seed/santiago/800/600'],
        ['Toledo Old City', 0, 35, '5h', 'https://picsum.photos/seed/toledo/800/600']
      ];

      for (const [name, price, tourPrice, duration, imageUrl] of initialPois) {
        await sql`
          INSERT INTO pois (name, price, tour_price, duration, image_url)
          VALUES (${name}, ${price}, ${tourPrice}, ${duration}, ${imageUrl})
        `;
      }
    }
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
    const { uid, email, displayName, role, photoURL, status, phoneNumber, licenseNumber } = req.body;
    
    // Server-side validation for driver's license
    if (role === 'driver' && licenseNumber) {
      const licenseRegex = /^[A-Z0-9]{5,15}$/; // Example format: 5-15 alphanumeric characters
      if (!licenseRegex.test(licenseNumber)) {
        return res.status(400).json({ error: 'Invalid driver\'s license format. Must be 5-15 alphanumeric characters.' });
      }
    }

    // Auto-assign admin role to the specific user email
    const isAdminEmail = email?.toLowerCase() === 'michaelsouzaxt21@gmail.com';
    const finalRole = isAdminEmail ? 'admin' : (role || 'passenger');

    try {
      const { rows } = await sql`
        INSERT INTO users (uid, email, display_name, role, photo_url, status, phone_number, license_number)
        VALUES (${uid}, ${email}, ${displayName}, ${finalRole}, ${photoURL}, ${status || 'active'}, ${phoneNumber}, ${licenseNumber})
        ON CONFLICT (uid) DO UPDATE SET
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          photo_url = EXCLUDED.photo_url,
          status = COALESCE(EXCLUDED.status, users.status),
          phone_number = COALESCE(EXCLUDED.phone_number, users.phone_number),
          license_number = COALESCE(EXCLUDED.license_number, users.license_number),
          role = CASE 
            WHEN LOWER(EXCLUDED.email) = 'michaelsouzaxt21@gmail.com' THEN 'admin'
            WHEN users.role = 'admin' THEN 'admin' 
            ELSE EXCLUDED.role 
          END
        RETURNING 
          id, 
          uid, 
          email, 
          display_name as "displayName", 
          role, 
          status,
          phone_number as "phoneNumber",
          license_number as "licenseNumber",
          photo_url as "photoURL", 
          created_at as "createdAt";
      `;
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/users/:uid', async (req, res) => {
    const { uid } = req.params;
    const { status, role, displayName } = req.body;
    try {
      const { rows } = await sql`
        UPDATE users 
        SET 
          status = COALESCE(${status}, status),
          role = COALESCE(${role}, role),
          display_name = COALESCE(${displayName}, display_name)
        WHERE uid = ${uid}
        RETURNING 
          id, 
          uid, 
          email, 
          display_name as "displayName", 
          role, 
          status,
          photo_url as "photoURL", 
          created_at as "createdAt";
      `;
      if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
      const updatedUser = rows[0];
      io.emit('user:updated', updatedUser);
      res.json(updatedUser);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/users', async (req, res) => {
    const { role } = req.query;
    try {
      const { rows } = await sql`
        SELECT 
          id, 
          uid, 
          email, 
          display_name as "displayName", 
          role, 
          status,
          phone_number as "phoneNumber",
          license_number as "licenseNumber",
          photo_url as "photoURL", 
          created_at as "createdAt" 
        FROM users 
        WHERE (${role}::text IS NULL OR role = ${role})
        ORDER BY created_at DESC;
      `;
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/users/passengers', async (req, res) => {
    try {
      const { rows } = await sql`
        SELECT 
          id, 
          uid, 
          email, 
          display_name as "displayName", 
          role, 
          photo_url as "photoURL", 
          created_at as "createdAt" 
        FROM users 
        WHERE role = 'passenger' 
        ORDER BY created_at DESC;
      `;
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Ride Routes
  app.post('/api/rides', async (req, res) => {
    const { passengerId, passengerName, pickupLocation, dropoffLocation, rideType, vehicleName, price, preferences } = req.body;
    try {
      const { rows } = await sql`
        INSERT INTO rides (passenger_id, passenger_name, pickup_location, dropoff_location, ride_type, vehicle_name, price, preferences)
        VALUES (${passengerId}, ${passengerName}, ${pickupLocation}, ${dropoffLocation}, ${rideType}, ${vehicleName}, ${price}, ${JSON.stringify(preferences)})
        RETURNING 
          id, 
          passenger_id as "passengerId", 
          passenger_name as "passengerName",
          pickup_location as "pickupLocation", 
          dropoff_location as "dropoffLocation", 
          status, 
          ride_type as "rideType", 
          vehicle_name as "vehicleName", 
          price, 
          preferences,
          created_at as "createdAt";
      `;
      const ride = rows[0];
      io.emit('ride:requested', ride);
      res.json(ride);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/rides', async (req, res) => {
    const { passengerId } = req.query;
    try {
      const { rows } = await sql`
        SELECT 
          r.id, 
          r.passenger_id as "passengerId", 
          r.passenger_name as "passengerName",
          r.driver_id as "driverId",
          u.display_name as "driverName",
          r.pickup_location as "pickupLocation", 
          r.dropoff_location as "dropoffLocation", 
          r.status, 
          r.ride_type as "rideType", 
          r.vehicle_name as "vehicleName", 
          r.price, 
          r.preferences,
          r.started_at as "startedAt",
          r.completed_at as "completedAt",
          r.created_at as "createdAt" 
        FROM rides r
        LEFT JOIN users u ON r.driver_id = u.uid
        WHERE (${passengerId}::text IS NULL OR r.passenger_id = ${passengerId})
        ORDER BY r.created_at DESC 
        LIMIT 50;
      `;
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
            driver_id = COALESCE(${driverId}, driver_id),
            started_at = CASE WHEN ${status} = 'in_progress' AND started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
            completed_at = CASE WHEN ${status} = 'completed' AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE id = ${id}
        RETURNING 
          id, 
          passenger_id as "passengerId", 
          passenger_name as "passengerName",
          driver_id as "driverId",
          status, 
          ride_type as "rideType", 
          vehicle_name as "vehicleName", 
          price, 
          preferences,
          started_at as "startedAt",
          completed_at as "completedAt",
          created_at as "createdAt";
      `;
      const ride = rows[0];
      
      // Fetch driver name if assigned
      if (ride.driverId) {
        const { rows: driverRows } = await sql`SELECT display_name FROM users WHERE uid = ${ride.driverId}`;
        if (driverRows.length > 0) {
          ride.driverName = driverRows[0].display_name;
        }
      }

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
    const { make, model, type, licensePlate, capacity, status } = req.body;
    try {
      const { rows } = await sql`
        INSERT INTO vehicles (make, model, type, license_plate, capacity, status)
        VALUES (${make}, ${model}, ${type}, ${licensePlate}, ${capacity}, ${status || 'active'})
        RETURNING 
          id, 
          make, 
          model, 
          type, 
          license_plate as "licensePlate", 
          capacity, 
          status;
      `;
      const vehicle = rows[0];
      io.emit('vehicle:added', vehicle);
      res.json(vehicle);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/vehicles/:id', async (req, res) => {
    const { id } = req.params;
    const { make, model, type, licensePlate, capacity, status } = req.body;
    try {
      const { rows } = await sql`
        UPDATE vehicles 
        SET make = COALESCE(${make}, make),
            model = COALESCE(${model}, model),
            type = COALESCE(${type}, type),
            license_plate = COALESCE(${licensePlate}, license_plate),
            capacity = COALESCE(${capacity}, capacity),
            status = COALESCE(${status}, status)
        WHERE id = ${id}
        RETURNING 
          id, 
          make, 
          model, 
          type, 
          license_plate as "licensePlate", 
          capacity, 
          status;
      `;
      const vehicle = rows[0];
      io.emit('vehicle:updated', vehicle);
      res.json(vehicle);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/vehicles', async (req, res) => {
    try {
      const { rows } = await sql`
        SELECT 
          id, 
          make, 
          model, 
          type, 
          license_plate as "licensePlate", 
          capacity, 
          status 
        FROM vehicles 
        ORDER BY id DESC;
      `;
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vehicle Types Routes
  app.get('/api/vehicle-types', async (req, res) => {
    try {
      const { rows } = await sql`SELECT id, name, base_price as "basePrice", multiplier, price_per_km as "pricePerKm", price_per_min as "pricePerMin", min_fare as "minFare", hourly_rate as "hourlyRate", capacity, description FROM vehicle_types ORDER BY id ASC`;
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/vehicle-types', async (req, res) => {
    const { name, basePrice, multiplier, pricePerKm, pricePerMin, minFare, hourlyRate, capacity, description } = req.body;
    try {
      const { rows } = await sql`
        INSERT INTO vehicle_types (name, base_price, multiplier, price_per_km, price_per_min, min_fare, hourly_rate, capacity, description)
        VALUES (${name}, ${basePrice}, ${multiplier}, ${pricePerKm}, ${pricePerMin}, ${minFare}, ${hourlyRate}, ${capacity}, ${description})
        RETURNING id, name, base_price as "basePrice", multiplier, price_per_km as "pricePerKm", price_per_min as "pricePerMin", min_fare as "minFare", hourly_rate as "hourlyRate", capacity, description;
      `;
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/vehicle-types/:id', async (req, res) => {
    const { id } = req.params;
    const { name, basePrice, multiplier, pricePerKm, pricePerMin, minFare, hourlyRate, capacity, description } = req.body;
    try {
      const { rows } = await sql`
        UPDATE vehicle_types 
        SET name = COALESCE(${name}, name),
            base_price = COALESCE(${basePrice}, base_price),
            multiplier = COALESCE(${multiplier}, multiplier),
            price_per_km = COALESCE(${pricePerKm}, price_per_km),
            price_per_min = COALESCE(${pricePerMin}, price_per_min),
            min_fare = COALESCE(${minFare}, min_fare),
            hourly_rate = COALESCE(${hourlyRate}, hourly_rate),
            capacity = COALESCE(${capacity}, capacity),
            description = COALESCE(${description}, description)
        WHERE id = ${id}
        RETURNING id, name, base_price as "basePrice", multiplier, price_per_km as "pricePerKm", price_per_min as "pricePerMin", min_fare as "minFare", hourly_rate as "hourlyRate", capacity, description;
      `;
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/vehicle-types/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await sql`DELETE FROM vehicle_types WHERE id = ${id}`;
      res.json({ success: true });
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

  app.patch('/api/chats/:chatId/read', async (req, res) => {
    const { chatId } = req.params;
    const { userId } = req.body;
    try {
      await sql`
        UPDATE chat_messages 
        SET read_at = CURRENT_TIMESTAMP 
        WHERE chat_id = ${chatId} AND sender_id != ${userId} AND read_at IS NULL;
      `;
      io.to(chatId).emit('chat:read', { chatId, userId });
      res.json({ success: true });
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
      const { rows } = await sql`
        SELECT 
          id, 
          driver_id as "driverId", 
          driver_name as "driverName", 
          lat, 
          lng, 
          status, 
          updated_at as "updatedAt" 
        FROM driver_locations;
      `;
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POI Routes
  app.post('/api/pois', async (req, res) => {
    const { name, price, tourPrice, duration, imageUrl, status } = req.body;
    try {
      const { rows } = await sql`
        INSERT INTO pois (name, price, tour_price, duration, image_url, status)
        VALUES (${name}, ${price}, ${tourPrice || 0}, ${duration}, ${imageUrl}, ${status})
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

  app.patch('/api/pois/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price, tourPrice, duration, imageUrl, status } = req.body;
    try {
      const { rows } = await sql`
        UPDATE pois 
        SET 
          name = COALESCE(${name}, name),
          price = COALESCE(${price}, price),
          tour_price = COALESCE(${tourPrice}, tour_price),
          duration = COALESCE(${duration}, duration),
          image_url = COALESCE(${imageUrl}, image_url),
          status = COALESCE(${status}, status)
        WHERE id = ${id}
        RETURNING *;
      `;
      res.json(rows[0]);
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

  // Google Maps Proxy Routes
  app.get('/api/maps/geocode', async (req, res) => {
    const { address } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Google Maps API Key not configured' });
    
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address as string)}&key=${apiKey}`);
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/maps/distance', async (req, res) => {
    const { origins, destinations } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Google Maps API Key not configured' });
    
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins as string)}&destinations=${encodeURIComponent(destinations as string)}&key=${apiKey}`);
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/maps/autocomplete', async (req, res) => {
    const { input } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Google Maps API Key not configured' });
    
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input as string)}&key=${apiKey}`);
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Settings Routes
  app.get('/api/settings/:key', async (req, res) => {
    const { key } = req.params;
    try {
      const { rows } = await sql`SELECT value FROM settings WHERE key = ${key}`;
      if (rows.length === 0) return res.status(404).json({ error: 'Setting not found' });
      res.json(rows[0].value);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings/:key', async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    try {
      const { rows } = await sql`
        INSERT INTO settings (key, value)
        VALUES (${key}, ${value})
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = CURRENT_TIMESTAMP
        RETURNING value;
      `;
      res.json(rows[0].value);
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
