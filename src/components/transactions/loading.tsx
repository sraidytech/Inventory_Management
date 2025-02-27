import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TransactionFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Party and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
        </div>
      </div>

      {/* Payment Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-10 w-full bg-muted rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-10 w-full bg-muted rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-10 w-full bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 w-16 bg-muted rounded" />
          <div className="h-8 w-24 bg-muted rounded" />
        </div>

        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5 space-y-2">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-10 w-full bg-muted rounded" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-10 w-full bg-muted rounded" />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-10 w-full bg-muted rounded" />
                </div>
                <div className="md:col-span-1 flex items-end justify-center pb-2">
                  <div className="h-8 w-8 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-24 w-full bg-muted rounded" />
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <div className="flex justify-end gap-2">
        <div className="h-10 w-20 bg-muted rounded" />
        <div className="h-10 w-32 bg-muted rounded" />
      </div>
    </div>
  );
}

export function TransactionsTableSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Search and filters skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-10 w-64 bg-muted rounded" />
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-muted rounded" />
          <div className="h-10 w-32 bg-muted rounded" />
        </div>
      </div>

      {/* Table header skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 gap-4 py-3 px-4 border-b">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-4 w-16 bg-muted rounded" />
          </div>

          {/* Table rows skeleton */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4 py-4 px-4 border-b">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-4 w-8 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-8 w-24 bg-muted rounded" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pagination skeleton */}
      <div className="flex justify-between items-center pt-4">
        <div className="h-4 w-40 bg-muted rounded" />
        <div className="flex space-x-2">
          <div className="h-8 w-20 bg-muted rounded" />
          <div className="h-8 w-20 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export function TransactionDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-4 w-64 bg-muted rounded" />
      </div>

      {/* Transaction Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="h-5 w-32 bg-muted rounded" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-muted rounded-full" />
              <div className="h-4 w-40 bg-muted rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-muted rounded-full" />
              <div className="h-4 w-48 bg-muted rounded" />
            </div>
            <div className="h-6 w-20 bg-muted rounded" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="h-5 w-28 bg-muted rounded" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-muted rounded-full" />
              <div className="h-4 w-36 bg-muted rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-muted rounded-full" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-muted rounded-full" />
              <div className="h-4 w-40 bg-muted rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-muted rounded-full" />
              <div className="h-4 w-44 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader className="pb-2">
          <div className="h-5 w-16 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 py-2">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-4 w-16 bg-muted rounded" />
            </div>

            {[...Array(3)].map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 py-2 border-b">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            ))}

            <div className="grid grid-cols-4 gap-4 py-2">
              <div className="col-span-3 h-4 w-16 bg-muted rounded justify-self-end" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <div className="h-10 w-20 bg-muted rounded" />
      </div>
    </div>
  );
}
