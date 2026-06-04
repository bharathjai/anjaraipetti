const API_BASE_URL = "http://localhost:4000";
const action = process.argv[2] || "send";
const phone = process.argv[3] || "9876543210";
const codeOrToken = process.argv[4];

async function sendOtp() {
  console.log(`[Test] Sending OTP request for phone: ${phone}...`);
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    console.log("[Test] Send Response:", data);
    console.log("\n==================================================");
    console.log("Check the server console output for the 6-digit code.");
    console.log(`Run the verification test with:`);
    console.log(`node scratch/test_otp_verify.js verify ${phone} <6-digit-code>`);
    console.log("==================================================\n");
  } catch (err) {
    console.error("[Test] Send request failed:", err);
  }
}

async function verifyOtp() {
  if (!codeOrToken) {
    console.error("[Error] Please specify the verification code or access token: node scratch/test_otp_verify.js verify <phone> <code_or_token>");
    return;
  }

  const payload = {};
  if (codeOrToken.length === 6) {
    payload.phone = phone;
    payload.otp = codeOrToken;
    console.log(`[Test] Verifying 6-digit OTP: ${codeOrToken} for phone: ${phone}...`);
  } else {
    payload.token = codeOrToken;
    console.log(`[Test] Verifying widget access-token: ${codeOrToken}...`);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("[Test] Verify Response:", data);
    if (res.ok && data.ok) {
      console.log("[Test] Verification SUCCESS! JWT session token issued successfully.");
    } else {
      console.error("[Test] Verification FAILED.");
    }
  } catch (err) {
    console.error("[Test] Verify request failed:", err);
  }
}

if (action === "send") {
  sendOtp();
} else if (action === "verify") {
  verifyOtp();
} else {
  console.error("Unknown action. Use 'send' or 'verify'.");
}
