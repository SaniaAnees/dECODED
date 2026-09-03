export const GITHUB_URL = "https://github.com/SaniaAnees/dECODED";
export const ISSUES_URL = `${GITHUB_URL}/issues/new/choose`;

export const SETUP_UNIX = `curl -fsSL https://raw.githubusercontent.com/SaniaAnees/dECODED/main/install.sh | sh
decoded start`;

export const SETUP_WINDOWS = `irm https://raw.githubusercontent.com/SaniaAnees/dECODED/main/install.ps1 | iex
decoded start`;

/** Default copy = macOS / Linux. */
export const SETUP_CMD = SETUP_UNIX;
