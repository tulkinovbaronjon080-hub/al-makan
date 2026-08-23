import { EmptyState } from "@al-makan/ui";

/** Stand-in for routes whose real module hasn't been built yet — keeps nav links live during Phase 0. */
export function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="mx-auto max-w-5xl p-4">
      <EmptyState title={title} description={`Ships in ${phase}.`} />
    </div>
  );
}
