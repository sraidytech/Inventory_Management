export function ProductFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Input field skeletons */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Description field skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-24 w-full bg-muted rounded" />
      </div>

      {/* Buttons skeleton */}
      <div className="flex justify-end space-x-4">
        <div className="h-10 w-20 bg-muted rounded" />
        <div className="h-10 w-24 bg-muted rounded" />
      </div>
    </div>
  );
}
