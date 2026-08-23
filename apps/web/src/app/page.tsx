import { Card, CardContent, CardHeader, CardTitle, EmptyState } from "@al-makan/ui";
import { getDictionary } from "@/lib/i18n/dictionary";

const dict = getDictionary();

const stats = [
  { key: "orders", value: "—" },
  { key: "production", value: "—" },
  { key: "ready", value: "—" },
  { key: "sales", value: "—" },
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <h1 className="text-xl font-semibold">{dict.dashboard.title}</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {dict.dashboard[stat.key]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <EmptyState
        title="Recent orders will appear here"
        description="This dashboard is a Phase 0 shell — real data connects starting Phase 2."
      />
    </div>
  );
}
