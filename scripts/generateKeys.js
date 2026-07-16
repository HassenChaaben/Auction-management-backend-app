/**
 * Script to generate RSA RS256 keypair for JWT signing.
 * Run: node scripts/generateKeys.js
 * Then copy the key contents into your .env file.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const keysDir = path.join(__dirname, '..', 'keys');
if (!fs.existsSync(keysDir)) fs.mkdirSync(keysDir);

fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey);
fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey);

console.log('RSA RS256 keypair generated successfully in /keys/');
console.log('Add key contents to your .env file as JWT_PRIVATE_KEY and JWT_PUBLIC_KEY.');
console.log('⚠  Never commit the keys/ directory — it is in .gitignore.');
