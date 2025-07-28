import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

// Required in ES modules to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Absolute paths to both private and public keys
const privateKeyPath = path.resolve(__dirname, '../../Generate/keys/private.key');
const publicKeyPath = path.resolve(__dirname, '../../Generate/keys/public.key');

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

// 🔐 Generate RS256 token
export function generateRS256Token(payload) {
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: '5m',
  });
}

// 🔍 Verify RS256 token
export function verifyRS256Token(token) {
  try {
    return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    return null;
  }
}
