import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const DEFAULT_DATA = {
  users: [],
  appointments: [],
  availability: [],
};

function keyFromSecret(secret) {
  if (!secret || secret.length < 32) {
    throw new Error('DATA_ENCRYPTION_KEY must be at least 32 characters long');
  }
  return createHash('sha256').update(secret).digest();
}

export class EncryptedJsonStore {
  constructor({ filePath, secret }) {
    this.filePath = resolve(filePath || './data.enc.json');
    this.key = keyFromSecret(secret);
  }

  read() {
    if (!existsSync(this.filePath)) return structuredClone(DEFAULT_DATA);

    const raw = JSON.parse(readFileSync(this.filePath, 'utf8'));
    if (!raw.iv || !raw.tag || !raw.data) {
      throw new Error('Encrypted data file is corrupted');
    }

    const iv = Buffer.from(raw.iv, 'base64');
    const tag = Buffer.from(raw.tag, 'base64');
    const encrypted = Buffer.from(raw.data, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  }

  write(nextData) {
    mkdirSync(dirname(this.filePath), { recursive: true });
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(nextData), 'utf8'),
      cipher.final(),
    ]);
    const payload = {
      version: 1,
      algorithm: 'aes-256-gcm',
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      data: encrypted.toString('base64'),
    };
    writeFileSync(this.filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  }

  update(mutator) {
    const current = this.read();
    const result = mutator(current) || current;
    this.write(result);
    return result;
  }
}
