import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const privateKey = fs.readFileSync(path.resolve('keys/private.key'), 'utf8');
const publicKey = fs.readFileSync(path.resolve('keys/public.key'), 'utf8');

// 🔐 Sign data using RS256
export function generateRS256Token(payload) {
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: '5m'
  });
}

// 🔍 Verify token using public key
export function verifyRS256Token(token) {
  try {
    return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
  } catch (err) {
    return null;
  }
}
