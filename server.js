import express from 'express';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let carts;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function connectMongo() {
  if (!mongoUri) {
    console.warn('MONGODB_URI is not set. Cart requests will be accepted in demo mode only.');
    return;
  }
  const client = new MongoClient(mongoUri);
  await client.connect();
  carts = client.db(process.env.MONGODB_DB || 'loom').collection('carts');
  console.log('Connected to MongoDB cart collection.');
}

app.post('/api/cart', async (req, res) => {
  const { sessionId, product } = req.body || {};
  if (!sessionId || !product?.id || !product?.name || !Number.isFinite(product?.price)) {
    return res.status(400).json({ error: 'A sessionId and complete product are required.' });
  }

  const lineItem = {
    ...product,
    quantity: Math.max(1, Number(product.quantity) || 1),
    addedAt: new Date()
  };

  if (!carts) {
    return res.status(202).json({ saved: false, demo: true, item: lineItem });
  }

  const updated = await carts.findOneAndUpdate(
    { sessionId },
    {
      $set: { updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
      $push: { items: lineItem }
    },
    { upsert: true, returnDocument: 'after' }
  );

  return res.status(201).json({ saved: true, cart: updated });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

connectMongo()
  .then(() => app.listen(port, () => console.log(`Loom is live at http://localhost:${port}`)))
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    app.listen(port, () => console.log(`Loom is live at http://localhost:${port} (MongoDB unavailable)`));
  });
