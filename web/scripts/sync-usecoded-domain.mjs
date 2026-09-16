/**
 * Update Production env vars for usecoded.com cutover + redeploy.
 * Usage (from web/): node scripts/sync-usecoded-domain.mjs
 */
import dotenv from "dotenv";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config({ path: ".env.local", quiet: true });

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error("VERCEL_TOKEN missing in .env.local");
  process.exit(1);
}

const projectId = "prj_GrDdgZ7RJn6hetw9aOomI70TYURA";

/** Production domain env — edit in place, never duplicate keys. */
const env = {
  NEXT_PUBLIC_SITE_URL: "https://usecoded.com",
  NEXT_PUBLIC_AUTH_URL: "https://auth.usecoded.com",
  NEXT_PUBLIC_PROXY_URL: "https://proxy.usecoded.com",
  NEXTAUTH_URL: "https://auth.usecoded.com",
  AUTH_COOKIE_DOMAIN: ".usecoded.com",
};

async function upsert(key, value) {
  const list = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/env?decrypt=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await list.json();
  const existing = (data.envs ?? data.env ?? []).find((e) => e.key === key);

  if (existing) {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value, target: ["production"] }),
      },
    );
    if (!res.ok) throw new Error(`patch ${key}: ${await res.text()}`);
    console.log("Updated", key);
    return;
  }

  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      value,
      type: "plain",
      target: ["production"],
    }),
  });
  if (!res.ok) throw new Error(`add ${key}: ${await res.text()}`);
  console.log("Added", key);
}

for (const [key, value] of Object.entries(env)) {
  await upsert(key, value);
}

console.log("Redeploying production…");
const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
execSync("npx --yes vercel@latest deploy --prod --yes", {
  stdio: "inherit",
  cwd: repoRoot,
  env: { ...process.env, VERCEL_TOKEN: token },
});

console.log("\nDone. Production OAuth / billing URLs:");
console.log("  Google:  https://auth.usecoded.com/api/auth/callback/google");
console.log("  GitHub:  https://auth.usecoded.com/api/auth/callback/github");
console.log("  Razorpay webhook: https://usecoded.com/api/razorpay/webhook");
