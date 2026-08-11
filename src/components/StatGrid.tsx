type Stat = { label: string; value: string | number };

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <section className="stats">
      {stats.map((stat) => (
        <article className="stat" key={stat.label}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
        </article>
      ))}
    </section>
  );
}
