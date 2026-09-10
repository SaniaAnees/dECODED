/**
 * Set feedback Resend env on Vercel production.
 * Usage: VERCEL_TOKEN=... node scripts/set-feedback-env.mjs
 */
import { execSync } from "node:child_process";

const token = process.env.VERCEL_TOKEN?.trim();
if (!token) {
  console.error("VERCEL_TOKEN missing");
  process.exit(1);
}

const vars = {
  RESEND_API_KEY: process.env.RESEND_API_KEY?.trim(),
  FEEDBACK_TO_EMAIL: process.env.FEEDBACK_TO_EMAIL?.trim() || "saniaanees91@gmail.com",
  FEEDBACK_FROM_EMAIL:
    process.env.FEEDBACK_FROM_EMAIL?.trim() || "onboarding@resend.dev",
};

for (const [key, value] of Object.entries(vars)) {
  if (!value) {
    console.error(`${key} missing`);
    process.exit(1);
  }
}

function vercel(args) {
  return execSync(`npx --yes vercel@latest ${args}`, {
    encoding: "utf8",
    env: { ...process.env, VERCEL_TOKEN: token },
    stdio: ["pipe", "pipe", "pipe"],
  });
}

for (const [key, value] of Object.entries(vars)) {
  try {
    execSync(
      `npx --yes vercel@latest env rm ${key} production --yes`,
      {
        encoding: "utf8",
        env: { ...process.env, VERCEL_TOKEN: token },
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    console.log(`removed old ${key}`);
  } catch {
    // not present
  }

  execSync(
    `npx --yes vercel@latest env add ${key} production`,
    {
      input: `${value}\n`,
      encoding: "utf8",
      env: { ...process.env, VERCEL_TOKEN: token },
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  console.log(`set ${key}`);
}

console.log("Done. Redeploy production for vars to apply.");
