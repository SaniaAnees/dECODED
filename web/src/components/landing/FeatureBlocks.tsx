const features = [
  {
    title: "Prefix Normalizer",
    description: "Enforces byte-exact system prompts and tool ordering.",
  },
  {
    title: "AST Diff Engine",
    description: "Tracks code edits as structured diffs instead of raw text logs.",
  },
  {
    title: "Localhost First",
    description: "Runs locally on port 8080; API keys never leave your machine.",
  },
  {
    title: "Universal Compatibility",
    description: "Drop-in proxy for Claude Code, Cursor, OpenCode, and AutoGen.",
  },
];

export function FeatureBlocks() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
      <h2 className="text-sm text-heading">What it does</h2>
      <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
        {features.map((feature) => (
          <div key={feature.title} className="bg-surface p-6">
            <h3 className="text-sm font-medium text-heading">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
