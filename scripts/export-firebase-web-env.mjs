import fs from 'node:fs';

const filename = process.argv[2];
if (!filename) throw new Error('Pass the Firebase Web SDK JSON filename.');
const config = JSON.parse(fs.readFileSync(filename, 'utf8'));
const mappings = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
  measurementId: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
};

for (const [key, environmentName] of Object.entries(mappings)) {
  if (config[key]) process.stdout.write(`${environmentName}=${String(config[key])}\n`);
}
