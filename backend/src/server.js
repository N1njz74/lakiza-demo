import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { EncryptedJsonStore } from './cryptoStore.js';
import { hashPassword, publicUser, requireAuth, requireRole, signToken, verifyPassword } from './auth.js';

const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET;
const DATA_ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY;

if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters long');
if (!DATA_ENCRYPTION_KEY || DATA_ENCRYPTION_KEY.length < 32) throw new Error('DATA_ENCRYPTION_KEY must be at least 32 characters long');

const store = new EncryptedJsonStore({
  filePath: process.env.DATA_FILE || './data.enc.json',
  secret: DATA_ENCRYPTION_KEY,
});

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '200kb' }));

const registerSchema = z.object({
  login: z.string().trim().min(3).max(40).toLowerCase(),
  password: z.string().min(8).max(120),
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30).optional().default(''),
});

const loginSchema = z.object({
  login: z.string().trim().toLowerCase(),
  password: z.string().min(1),
});

const appointmentSchema = z.object({
  therapistId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().min(8).max(20),
  start: z.string().min(3).max(8),
  duration: z.number().int().min(15).max(240),
  comment: z.string().max(500).optional().default(''),
});

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'lakiza-backend' });
});

app.post('/api/auth/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_request', details: parsed.error.flatten() });

  const input = parsed.data;
  const passwordHash = await hashPassword(input.password);
  let created;

  try {
    store.update((data) => {
      if (data.users.some((user) => user.login === input.login)) throw new Error('login_exists');
      created = {
        id: nanoid(),
        login: input.login,
        passwordHash,
        role: 'client',
        name: input.name,
        phone: input.phone,
        createdAt: new Date().toISOString(),
      };
      data.users.push(created);
      return data;
    });
  } catch (error) {
    if (error.message === 'login_exists') return res.status(409).json({ error: 'login_exists' });
    throw error;
  }

  const token = signToken(created, JWT_SECRET);
  res.status(201).json({ token, user: publicUser(created) });
});

app.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_request' });

  const data = store.read();
  const user = data.users.find((item) => item.login === parsed.data.login);
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: 'bad_credentials' });
  }

  const token = signToken(user, JWT_SECRET);
  res.json({ token, user: publicUser(user) });
});

app.get('/api/me', requireAuth(JWT_SECRET), (req, res) => {
  const data = store.read();
  const user = data.users.find((item) => item.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'not_found' });
  res.json({ user: publicUser(user) });
});

app.get('/api/appointments', requireAuth(JWT_SECRET), (req, res) => {
  const data = store.read();
  const userId = req.user.sub;
  const role = req.user.role;

  if (role === 'admin') return res.json({ appointments: data.appointments });
  if (role === 'therapist') return res.json({ appointments: data.appointments.filter((item) => item.therapistUserId === userId || item.therapistId === userId) });

  return res.json({ appointments: data.appointments.filter((item) => item.clientUserId === userId) });
});

app.post('/api/appointments', requireAuth(JWT_SECRET), async (req, res) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_request', details: parsed.error.flatten() });

  let created;
  store.update((data) => {
    created = {
      id: nanoid(),
      ...parsed.data,
      clientUserId: req.user.sub,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    data.appointments.push(created);
    return data;
  });

  res.status(201).json({ appointment: created });
});

app.patch('/api/appointments/:id/status', requireAuth(JWT_SECRET), requireRole('admin', 'therapist'), (req, res) => {
  const status = z.enum(['new', 'confirmed', 'cancelled', 'done']).safeParse(req.body.status);
  if (!status.success) return res.status(400).json({ error: 'bad_status' });

  let updated;
  store.update((data) => {
    const item = data.appointments.find((appointment) => appointment.id === req.params.id);
    if (!item) return data;
    if (req.user.role === 'therapist' && item.therapistUserId && item.therapistUserId !== req.user.sub) return data;
    item.status = status.data;
    item.updatedAt = new Date().toISOString();
    updated = item;
    return data;
  });

  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json({ appointment: updated });
});

app.get('/api/admin/users', requireAuth(JWT_SECRET), requireRole('admin'), (req, res) => {
  const data = store.read();
  res.json({ users: data.users.map(publicUser) });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'server_error' });
});

app.listen(PORT, () => {
  console.log(`Lakiza backend listening on http://localhost:${PORT}`);
});
