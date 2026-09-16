/**
 * Dashboard URLs for usecoded.com — copy into Google, GitHub, Razorpay.
 * Run: node scripts/cutover-oauth-checklist.mjs
 */

const lines = [
  "",
  "=== GOOGLE CLOUD CONSOLE ===",
  "APIs & Services → Credentials → OAuth 2.0 Client (Web)",
  "",
  "Authorized redirect URIs (production):",
  "  https://auth.usecoded.com/api/auth/callback/google",
  "  http://localhost:3000/api/auth/callback/google",
  "",
  "Authorized JavaScript origins:",
  "  https://auth.usecoded.com",
  "  https://usecoded.com",
  "  http://localhost:3000",
  "",
  "=== GITHUB OAUTH APP ===",
  "Settings → Developer settings → OAuth Apps",
  "",
  "Homepage URL:",
  "  https://usecoded.com",
  "",
  "Authorization callback URL:",
  "  https://auth.usecoded.com/api/auth/callback/github",
  "",
  "=== RAZORPAY ===",
  "Account settings → Website URL:",
  "  https://usecoded.com",
  "",
  "Webhooks → active webhook URL:",
  "  https://usecoded.com/api/razorpay/webhook",
  "",
  "Policy links (if required for review):",
  "  https://usecoded.com/privacy",
  "  https://usecoded.com/terms",
  "  https://usecoded.com/refund",
  "  https://usecoded.com/pricing",
  "",
];

console.log(lines.join("\n"));
