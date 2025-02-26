export function ClientFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Input field skeletons */}
      <div className="space-y-2">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-10 w-full bg-muted rounded" />
      </div>

      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-10 w-full bg-muted rounded" />
      </div>

      <div className="space-y-2">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-10 w-full bg-muted rounded" />
      </div>

      {/* Address field skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-24 w-full bg-muted rounded" />
      </div>

      {/* Notes field skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-24 w-full bg-muted rounded" />
      </div>

      {/* Financial fields skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
        </div>
      </div>

      {/* Buttons skeleton */}
      <div className="flex justify-end space-x-4">
        <div className="h-10 w-20 bg-muted rounded" />
        <div className="h-10 w-24 bg-muted rounded" />
      </div>
    </div>
  );
}

export function ClientsTableSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Search and filters skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-10 w-64 bg-muted rounded" />
        <div className="h-10 w-32 bg-muted rounded" />
      </div>

      {/* Table header skeleton */}
      <div className="grid grid-cols-5 gap-4 py-3 border-b">
        <div className="h-4 w-4 bg-muted rounded" />
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>

      {/* Table rows skeleton */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-5 gap-4 py-4 border-b">
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-4 w-40 bg-muted rounded" />
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      ))}

      {/* Pagination skeleton */}
      <div className="flex justify-between items-center pt-4">
        <div className="h-4 w-40 bg-muted rounded" />
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
