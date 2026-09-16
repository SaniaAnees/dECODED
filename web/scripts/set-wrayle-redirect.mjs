/**
 * Production cleanup: keep wrayle hosts only as redirects to usecoded.
 * Usage (from web/): node scripts/set-wrayle-redirect.mjs
 */
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error("VERCEL_TOKEN missing in .env.local");
  process.exit(1);
}

const projectId = "prj_GrDdgZ7RJn6hetw9aOomI70TYURA";
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

/** Old domain stays only as permanent redirects — not a second product. */
const redirects = [
  { domain: "wrayle.com", redirect: "usecoded.com" },
  { domain: "www.wrayle.com", redirect: "usecoded.com" },
  { domain: "auth.wrayle.com", redirect: "auth.usecoded.com" },
  { domain: "proxy.wrayle.com", redirect: "proxy.usecoded.com" },
];

for (const { domain, redirect } of redirects) {
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/domains/${domain}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        redirect,
        redirectStatusCode: 308,
      }),
    },
  );
  if (!res.ok) {
    console.error(`${domain}: ${await res.text()}`);
    process.exit(1);
  }
  console.log(`Redirect set: ${domain} → https://${redirect}`);
}

console.log("\nOld wrayle hosts redirect to usecoded only.");
console.log("Google / GitHub callbacks should use auth.usecoded.com (wrayle URIs removed).");
