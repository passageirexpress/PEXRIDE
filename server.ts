import express from 'express';
import { createServer } from 'http';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Extra Protection: Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'firebase' });
  });

  app.post('/api/translate', async (req, res) => {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Missing text or targetLanguage' });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following text to ${targetLanguage}. Return ONLY the translated text, no other commentary: "${text}"`,
      });
      res.json({ translatedText: response.text });
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ error: 'Translation failed' });
    }
  });

  // Viva.com Payment Integration Skeleton
  // This is where you'd handle creating orders and verifying payments
  app.post('/api/payments/viva/create-order', async (req, res) => {
    const { amount, customerEmail, description } = req.body;
    const merchantId = process.env.VIVA_MERCHANT_ID?.trim();
    const apiKey = process.env.VIVA_API_KEY?.trim();

    if (!merchantId || !apiKey) {
      console.warn('Viva.com credentials not configured. Simulating payment for testing.');
    }

    try {
      if (merchantId && apiKey) {
        // Real API call
        const authString = Buffer.from(`${merchantId}:${apiKey}`).toString('base64');
        const response = await fetch('https://api.vivapayments.com/checkout/v2/orders', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // in cents
            customerTrns: description,
            customer: {
              email: customerEmail
            },
            paymentTimeout: 3600,
            preauth: false,
            allowRecurring: false,
            maxInstallments: 0,
            paymentNotification: true,
            disableExactAmount: false,
            disableCash: true,
            disableWallet: false,
            sourceCode: "Default"
          })
        });

        if (!response.ok) {
          throw new Error(`Viva API Error: ${response.statusText}`);
        }

        const data = await response.json();
        res.json({
          orderCode: data.orderCode,
          checkoutUrl: `https://www.vivapayments.com/web/checkout?ref=${data.orderCode}`
        });
      } else {
        // Mock response from Viva.com
        const mockOrderCode = `VIVA-${Math.random().toString(36).substring(7).toUpperCase()}`;
        res.json({ 
          orderCode: mockOrderCode, 
          checkoutUrl: `https://demo.vivapayments.com/web/checkout?ref=${mockOrderCode}` 
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Driver Notification (Simulated Email)
  app.post('/api/drivers/notify', async (req, res) => {
    const { email, name } = req.body;
    console.log(`[SIMULATED EMAIL] To: ${email}, Name: ${name}`);
    console.log(`Message: Hello ${name}, your registration is pending. Please complete your profile by uploading your documents and vehicle details for admin approval.`);
    
    // In production, use SendGrid/Mailgun/etc.
    res.json({ success: true, message: 'Notification sent' });
  });

  // Google Maps Proxy Routes
  app.get('/api/maps/geocode', async (req, res) => {
    const { address } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
    if (!apiKey) return res.status(500).json({ error: 'Google Maps API Key not configured' });
    
    try {
      const addressStr = address as string;
      let url = '';
      if (addressStr.startsWith('place_id:')) {
        url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(addressStr.substring(9))}&key=${apiKey}`;
      } else {
        url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressStr)}&key=${apiKey}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/maps/distance', async (req, res) => {
    const { origins, destinations } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
    if (!apiKey) return res.status(500).json({ error: 'Google Maps API Key not configured' });
    
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins as string)}&destinations=${encodeURIComponent(destinations as string)}&key=${apiKey}`);
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/maps/autocomplete', async (req, res) => {
    const { input } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
    if (!apiKey) return res.status(500).json({ error: 'Google Maps API Key not configured' });
    
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input as string)}&key=${apiKey}`);
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // OSRM Proxy
  app.get('/api/osrm/route', async (req, res) => {
    const { coordinates } = req.query;
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full`, {
        headers: { 'User-Agent': 'PassageiroExpressLuxury/1.0' }
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Nominatim Proxy
  app.get('/api/nominatim/search', async (req, res) => {
    const { q } = req.query;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q as string)}&limit=1`, {
        headers: { 'User-Agent': 'PassageiroExpressLuxury/1.0' }
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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
