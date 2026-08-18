export function ComparisonCards() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-8 md:py-12">
      <h2 className="text-sm text-heading">Why the bill changes</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Without dECODED</p>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-muted">Cache reads</dt>
              <dd className="mt-1 font-mono text-heading">
                $3.00 / 1M tokens{" "}
                <span className="text-muted">(0% hit)</span>
              </dd>
            </div>
            <div>
              <dt className="text-muted">20-turn session</dt>
              <dd className="mt-1 font-mono text-heading">~$4.50</dd>
            </div>
            <div>
              <dt className="text-muted">Context</dt>
              <dd className="mt-1 font-mono text-heading">Naive text truncation</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">With dECODED</p>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-muted">Cache reads</dt>
              <dd className="mt-1 font-mono text-accent">
                $0.30 / 1M tokens{" "}
                <span className="text-muted">(90% off cached)</span>
              </dd>
            </div>
            <div>
              <dt className="text-muted">20-turn session</dt>
              <dd className="mt-1 font-mono text-accent">
                ~$0.80 <span className="text-muted">(~80% less)</span>
              </dd>
            </div>
            <div>
              <dt className="text-muted">Context</dt>
              <dd className="mt-1 font-mono text-accent">Deterministic AST diffs</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}
