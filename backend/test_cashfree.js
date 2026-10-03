require("dotenv").config();

async function testCashfree() {
  const url = "https://api.cashfree.com/verification/aadhaar";
  const headers = {
    "x-client-id": process.env.CASHFREE_CLIENT_ID,
    "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
    "x-api-version": "2024-12-01",
    "Content-Type": "application/json"
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ uid: "123456789012" }) // Dummy Aadhaar to test auth
    });
    
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

testCashfree();
