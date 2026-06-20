import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function runAudit() {
  console.log("=== FIRESTORE CLIENT AUDIT ===");
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    console.error("firebase-applet-config.json not found!");
    return;
  }

  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  console.log("Config keys found (excluding sensitive information):");
  console.log({
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId
  });

  const clientApp = initializeApp(firebaseConfig);
  const db = getFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

  try {
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);
    
    console.log("SUCCESS: Fetched collection 'products' via Client SDK successfully.");
    console.log("Total Products in Firestore:", snapshot.size);

    const docs = snapshot.docs;
    console.log("=== FIRST 15 PRODUCTS IN FIRESTORE ===");
    for (let i = 0; i < Math.min(docs.length, 15); i++) {
      const doc = docs[i];
      const data = doc.data();
      console.log(`Product ${i + 1}:`);
      console.log({
        id: doc.id,
        name: data.name || data.title || "",
        brand: data.brand || "",
        price: data.price,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdBy: data.createdBy || "",
        origin: data.origin || "",
        image: data.image || (data.images && data.images[0]) || ""
      });
    }

  } catch (err: any) {
    console.error("FAILED to query Firestore products via Client SDK:");
    console.error("- Message:", err.message);
    console.error("- Code:", err.code);
    console.error("- Error Object:", JSON.stringify(err));
  }
}

runAudit();
