export default function HomePage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-hold-accent">
          Stage 6 · Auto-expiry wired
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Multi-warehouse shelf holds
        </h1>
        <p className="max-w-xl text-hold-muted">
          Checkout holds that expire in 10 minutes — stock returns to the shelf
          if payment doesn&apos;t complete. Product lanes and reservation flow
          land in upcoming stages.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-hold-ink/20 bg-white/50 p-8 text-center text-sm text-hold-muted">
        Cron releases expired holds every minute. Shelf UI in Stage 7.
      </div>
    </section>
  );
}
