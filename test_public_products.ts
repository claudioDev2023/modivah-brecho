async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/public/products?bypassCache=true");
    console.log("Status:", res.status);
    console.log("Status Text:", res.statusText);
    const text = await res.text();
    console.log("Response:", text.substring(0, 1000));
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
test();
