import 'dotenv/config';
import { EncryptedJsonStore } from './cryptoStore.js';
import { hashPassword } from './auth.js';

const DATA_ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY;
if (!DATA_ENCRYPTION_KEY || DATA_ENCRYPTION_KEY.length < 32) throw new Error('DATA_ENCRYPTION_KEY must be at least 32 characters long');

const store = new EncryptedJsonStore({
  filePath: process.env.DATA_FILE || './data.enc.json',
  secret: DATA_ENCRYPTION_KEY,
});

const now = new Date().toISOString();
const staff = [
  { login: 'admin', password: 'admin12345', role: 'admin', name: 'Администратор', phone: '' },
  { login: 'master', password: 'master12345', role: 'therapist', name: 'Массажист', phone: '' },
];

const data = store.read();

for (const item of staff) {
  const existing = data.users.find((user) => user.login === item.login);
  if (!existing) {
    data.users.push({
      id: item.login,
      login: item.login,
      passwordHash: await hashPassword(item.password),
      role: item.role,
      name: item.name,
      phone: item.phone,
      createdAt: now,
    });
  }
}

store.write(data);
console.log('Seed users ready: admin/admin12345, master/master12345');
