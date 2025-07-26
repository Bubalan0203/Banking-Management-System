import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

// Required in ES modules to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Corrected absolute path to the private key
const privateKeyPath = path.resolve(__dirname, '../../Generate/keys/private.key');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

export function generateRS256Token(payload) {
  return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '5m' });
}
