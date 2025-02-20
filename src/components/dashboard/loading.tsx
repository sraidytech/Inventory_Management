export function DashboardLoading() {
  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={`stat-${i}`}
            className="h-[120px] rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>

      {/* Financial Stats Grid */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={`financial-${i}`}
            className="h-[120px] rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>

      {/* Transactions and Chart Grid */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="h-[400px] rounded-lg bg-muted animate-pulse" />
        <div className="h-[400px] rounded-lg bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export function DashboardError({ message }: { message: string }) {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        Failed to load dashboard data: {message}
      </div>
    </div>
  );
}
