import { generateKeyPairSync } from 'crypto';
import fs from 'fs';
import path from 'path';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'pkcs1',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs1',
    format: 'pem'
  }
});

fs.mkdirSync('./keys', { recursive: true }); // ensure directory exists

fs.writeFileSync('./keys/private.key', privateKey);
fs.writeFileSync('./keys/public.key', publicKey);

console.log('✅ RSA key pair generated in /keys folder');
