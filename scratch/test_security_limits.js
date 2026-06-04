const API_BASE_URL = "http://localhost:4000";
const phone = "9876549999"; // Test number

async function runSecurityTests() {
  console.log("=== RUNNING SECURITY LIMITS AND ABUSE PROTECTION TESTS ===\n");

  // 1. Send OTP 5 times in a row to trigger rate limits and blocks
  console.log("[Test 1] Attempting to send OTP 5 times in a row to trigger rate-limiting & blocking...");
  for (let i = 1; i <= 6; i++) {
    console.log(`[Send ${i}] Sending OTP...`);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      console.log(`[Send ${i}] Status: ${res.status}, Response:`, data);
      
      if (res.status === 429) {
        console.log(`[Send ${i}] Match! Correctly blocked by 10-minute rate limit (3 requests max).`);
      } else if (res.status === 403) {
        console.log(`[Send ${i}] Match! Correctly blocked & temporary block applied:`, data.message);
        break;
      }
    } catch (err) {
      console.error(`[Send ${i}] Failed:`, err.message);
    }
  }

  // 2. Try to verify incorrect codes 5 times to trigger verification block
  const verifyPhone = "9876548888";
  console.log("\n[Test 2] Sending initial OTP for incorrect verification attempt test...");
  try {
    const sendRes = await fetch(`${API_BASE_URL}/api/auth/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: verifyPhone })
    });
    const sendData = await sendRes.json();
    console.log("Send OTP Status:", sendRes.status, sendData);
  } catch (err) {
    console.error("Initial send failed:", err.message);
  }

  console.log("\nAttempting 6 incorrect verification attempts in a row...");
  for (let i = 1; i <= 6; i++) {
    console.log(`[Verify ${i}] Submitting incorrect OTP '111111'...`);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: verifyPhone, otp: "111111" })
      });
      const data = await res.json();
      console.log(`[Verify ${i}] Status: ${res.status}, Response:`, data);
      
      if (res.status === 403) {
        console.log(`[Verify ${i}] Match! Correctly blocked & temporary verification block applied:`, data.message);
        break;
      }
    } catch (err) {
      console.error(`[Verify ${i}] Failed:`, err.message);
    }
  }
  
  console.log("\n=== SECURITY TESTS COMPLETED ===");
}

runSecurityTests();
