// Backend Node/Express para Stripe + Clerk
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.raw({ type: 'application/json' }));

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const DOMAIN = process.env.DOMAIN || 'http://localhost:5173';

// Simulação de "banco de dados" em memória
const userPremiumStatus = {};

// Cria sessão de checkout Stripe
app.post('/api/create-checkout-session', async (req, res) => {
  const { plan, clerkUserId } = req.body;
  if (!clerkUserId) return res.status(400).json({ error: 'Usuário não autenticado.' });
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: process.env.STRIPE_PREMIUM_PRICE_ID, // Defina no .env
        quantity: 1,
      }],
      success_url: `${DOMAIN}/?checkout=success`,
      cancel_url: `${DOMAIN}/?checkout=cancel`,
      client_reference_id: clerkUserId,
      metadata: { clerkUserId },
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Webhook Stripe para ativar premium
app.post('/api/stripe-webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const clerkUserId = session.client_reference_id;
    if (clerkUserId) {
      userPremiumStatus[clerkUserId] = true;
      console.log(`Usuário ${clerkUserId} agora é premium!`);
    }
  }
  res.json({ received: true });
});

// Endpoint para consultar status premium
app.get('/api/premium-status/:clerkUserId', (req, res) => {
  const { clerkUserId } = req.params;
  res.json({ premium: !!userPremiumStatus[clerkUserId] });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));
