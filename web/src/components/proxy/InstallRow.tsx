import { existsSync } from "node:fs";
import path from "node:path";
import { CopyCommand } from "@/components/landing/CopyCommand";
import { PLATFORMS } from "@/lib/site";

export function InstallRow() {
  const publicDir = path.join(process.cwd(), "public");

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-5">
      {PLATFORMS.map((platform) => {
        const gif = path.join(publicDir, platform.file);
        const isWindows = platform.label === "Windows";

        return (
          <article
            key={platform.label}
            className="flex min-w-0 flex-col border border-line bg-ink/55 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[11px] tracking-[0.18em] text-gilt">
                {platform.label}
              </p>
              <CopyCommand
                text={platform.text}
                className="font-mono text-[10px] tracking-[0.12em] text-dusk hover:text-moon"
              />
            </div>
            <pre
              className={`mt-3 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-[1.65] text-moon/90 ${
                isWindows ? "text-[10px] sm:text-[11px]" : "text-[11px] sm:text-xs"
              }`}
            >
              {platform.text}
            </pre>
            {existsSync(gif) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/${platform.file}?v=2`}
                alt={platform.alt}
                className="mt-3 w-full rounded-md border border-line"
                width={720}
                height={480}
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
