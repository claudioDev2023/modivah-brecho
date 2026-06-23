import fs from 'fs';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const configPath = 'firebase-applet-config.json';
if (!fs.existsSync(configPath)) {
  console.log(`Config file ${configPath} does not exist.`);
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
}

const db = getFirestore(
  admin.apps[0],
  firebaseConfig.firestoreDatabaseId
);

db.settings({ ignoreUndefinedProperties: true });

async function run() {
  const targetId = 'prod-1782056011840';
  console.log(`Attempting to delete product ${targetId} ("anuncio teste 21/06/2026") from Firestore...`);
  
  const docRef = db.collection('products').doc(targetId);
  const docSnap = await docRef.get();
  
  if (docSnap.exists) {
    const data = docSnap.data();
    console.log(`Product found: "${data.title}" (Category: ${data.category}, Brand: ${data.brand})`);
    await docRef.delete();
    console.log(`Successfully deleted document ${targetId} from collection 'products'.`);
  } else {
    console.log(`Product document ${targetId} does not exist in 'products' collection.`);
  }
}

run().catch(console.error);
