require("dotenv").config();

async function testEndpoints3() {
  const headers = {
    "x-client-id": process.env.CASHFREE_CLIENT_ID,
    "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
    "x-api-version": "2024-12-01",
    "Content-Type": "application/json"
  };

  const verifyOtpUrl = "https://api.cashfree.com/verification/offline-aadhaar/verify";
  const panUrl = "https://api.cashfree.com/verification/pan";

  try {
    const res1 = await fetch(verifyOtpUrl, {
      method: "POST", headers, body: JSON.stringify({ otp: "123456", ref_id: "87276677" }) 
    });
    console.log(`Verify OTP URL: ${verifyOtpUrl} -> Status: ${res1.status}`);
    console.log(await res1.json());
    
    const res2 = await fetch(panUrl, {
      method: "POST", headers, body: JSON.stringify({ pan: "ABCDE1234F", name: "TEST" }) 
    });
    console.log(`PAN URL: ${panUrl} -> Status: ${res2.status}`);
    console.log(await res2.json());
  } catch (e) {}
}

testEndpoints3();
