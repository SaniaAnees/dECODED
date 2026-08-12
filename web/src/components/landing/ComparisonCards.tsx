export function ComparisonCards() {
  return (
    <section className="mt-20 grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-red-900/30 bg-[#121316] p-5">
        <span className="inline-block rounded-md border border-red-900/40 bg-red-950/30 px-2.5 py-1 font-mono text-xs text-[#fca5a5]">
          Standard Agent Request
        </span>
        <p className="mt-4 text-sm font-medium text-[#9ca3af]">
          Without dECODED
        </p>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="text-[#6b7280]">Cache Reads</dt>
            <dd className="mt-1 font-mono text-[#fca5a5]">
              $3.00 / 1M tokens{" "}
              <span className="text-[#6b7280]">(0% Cache Hit)</span>
            </dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">20-Turn Session Cost</dt>
            <dd className="mt-1 font-mono text-[#fca5a5]">~$4.50</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Context Strategy</dt>
            <dd className="mt-1 font-mono text-[#fca5a5]">
              Naive Text Truncation
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-emerald-500/40 bg-[#121316] p-5">
        <span className="inline-block rounded-md border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1 font-mono text-xs text-[#6ee7b7]">
          dECODED Proxy
        </span>
        <p className="mt-4 text-sm font-medium text-[#9ca3af]">With dECODED</p>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="text-[#6b7280]">Cache Reads</dt>
            <dd className="mt-1 font-mono text-[#6ee7b7]">
              $0.30 / 1M tokens{" "}
              <span className="text-[#34d399]/80">(90% Official Discount)</span>
            </dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">20-Turn Session Cost</dt>
            <dd className="mt-1 font-mono text-[#6ee7b7]">
              ~$0.80{" "}
              <span className="text-[#34d399]/80">(~80% Total Savings)</span>
            </dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Context Strategy</dt>
            <dd className="mt-1 font-mono text-[#6ee7b7]">
              Deterministic AST Diffs
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
