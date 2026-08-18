import { GITHUB_URL } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-sm font-medium text-heading">dECODED</p>
          <p className="mt-1 text-sm text-muted">
            Prompt cache for coding agents.
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted transition-colors hover:text-heading"
          >
            GitHub
          </a>
          <p className="text-xs text-muted">© 2026 dECODED</p>
        </div>
      </div>
    </footer>
  );
}
