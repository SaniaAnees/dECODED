const features = [
  {
    title: "Prefix Normalizer",
    description:
      "Enforces byte-exact system prompts and tool ordering.",
  },
  {
    title: "AST Diff Engine",
    description:
      "Tracks code edits as structured diffs instead of raw text logs.",
  },
  {
    title: "Localhost First",
    description:
      "Runs locally on port 8080; API keys never leave your machine.",
  },
  {
    title: "Universal Compatibility",
    description:
      "Drop-in proxy for Claude Code, Cursor, OpenCode, and AutoGen.",
  },
];

export function FeatureBlocks() {
  return (
    <section className="mt-20">
      <h2 className="font-mono text-xs uppercase tracking-widest text-[#6b7280]">
        Features
      </h2>
      <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-[#22262b] bg-[#22262b] sm:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="bg-[#121316] p-6 transition-colors hover:bg-[#181a1f]"
          >
            <h3 className="font-mono text-sm font-medium text-[#f4f4f5]">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
