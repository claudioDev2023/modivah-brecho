import fs from "fs";

async function queryInfo() {
  console.log("=== CALLING LOCAL DIAGNOSTIC API ===");
  try {
    const res = await fetch("http://localhost:3000/api/debug/database-info");
    console.log("Status Code:", res.status);
    console.log("Status Text:", res.statusText);
    const contentType = res.headers.get("content-type") || "";
    console.log("Content-Type:", contentType);
    
    if (res.ok) {
      const data = await res.json();
      console.log("=== DIAGNOSTIC API MATCH SUCCESS ===");
      console.log("Products Count in Firestore:", data.productsCount);
      console.log("Categories Count in Firestore:", data.categoriesCount);
      console.log("Clients Count in Firestore:", data.clientsCount);
      console.log("Orders Count in Firestore:", data.ordersCount);
      console.log("\n--- Sample Products (Up to 12) ---");
      if (Array.isArray(data.products)) {
        data.products.slice(0, 12).forEach((p: any, idx: number) => {
          console.log(`${idx + 1}. [${p.id}] title: "${p.title || p.name}" | category: "${p.category}" | status: "${p.status}" | stock: ${p.stock}`);
        });
      }
      fs.writeFileSync("audit_db_result.json", JSON.stringify(data, null, 2));
      console.log("Saved full data to audit_db_result.json");
    } else {
      const text = await res.text();
      console.error("DIAGNOSTIC API RETURNED EXCEPTION:");
      console.error(text);
      fs.writeFileSync("audit_db_error.txt", text);
    }
  } catch (err: any) {
    console.error("FAILED to query intermediate database-info endpoint:");
    console.error(err.message || err);
  }
}

queryInfo();
