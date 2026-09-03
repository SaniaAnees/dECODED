import { CopyCommand } from "@/components/landing/CopyCommand";
import { SETUP_UNIX, SETUP_WINDOWS } from "@/lib/site";

export function Ledger() {
  return (
    <section id="setup" className="scroll-mt-24 mx-auto max-w-5xl px-6 py-8 md:px-8">
      <hr className="rule" />
      <div className="py-24 md:py-32">
        <p className="font-mono text-[11px] tracking-[0.28em] text-gilt">
          THE LAYER THAT EXISTS
        </p>
        <h2 className="mt-5 max-w-2xl font-serif text-4xl font-medium leading-tight text-moon md:text-5xl">
          PAYG: run the proxy, then point the agent at it.
        </h2>
        <p className="mt-6 max-w-xl font-serif text-lg leading-relaxed text-mist">
          DecodeD listens on 127.0.0.1:8080. Install the binary, set DECODED_*
          on that process, point the agent at localhost. Your key is forwarded;
          it never hits a dECODED server.
        </p>

        <div className="mt-12 space-y-6">
          <div className="border border-line bg-ink/60 p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-[11px] tracking-[0.18em] text-dusk">
                macOS / Linux
              </p>
              <CopyCommand
                text={SETUP_UNIX}
                className="font-mono text-[11px] tracking-[0.14em] text-gilt hover:text-moon"
              />
            </div>
            <pre className="mt-6 overflow-x-auto font-mono text-[13px] leading-relaxed text-moon/90 md:text-sm">
              {SETUP_UNIX}
            </pre>
          </div>
          <div className="border border-line bg-ink/60 p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-[11px] tracking-[0.18em] text-dusk">
                Windows
              </p>
              <CopyCommand
                text={SETUP_WINDOWS}
                className="font-mono text-[11px] tracking-[0.14em] text-gilt hover:text-moon"
              />
            </div>
            <pre className="mt-6 overflow-x-auto font-mono text-[13px] leading-relaxed text-moon/90 md:text-sm">
              {SETUP_WINDOWS}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
