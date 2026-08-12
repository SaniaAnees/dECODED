const GITHUB_URL = "https://github.com/SaniaAnees/dECODED";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[#1e2227] bg-[#090a0c] px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Left */}
          <div>
            <p className="font-mono text-sm font-semibold text-[#f4f4f5]">
              dECODED
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#9ca3af]">
              Prompt Cache &amp; Context Engine for AI Coding Agents
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs text-[#34d399]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#34d399]" />
              All Systems Operational
            </p>
          </div>

          {/* Middle */}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-[#6b7280]">
              Quick Links
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9ca3af] transition-colors hover:text-[#f4f4f5]"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="#setup"
                  className="text-[#9ca3af] transition-colors hover:text-[#f4f4f5]"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="#beta"
                  className="text-[#9ca3af] transition-colors hover:text-[#f4f4f5]"
                >
                  Beta Access
                </a>
              </li>
            </ul>
          </div>

          {/* Right */}
          <div>
            <p className="text-sm leading-relaxed text-[#9ca3af]">
              Built for developers using Claude Code, Cursor, and OpenCode.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-[#1e2227] pt-6">
          <p className="text-xs text-[#6b7280]">
            &copy; 2026 dECODED. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
