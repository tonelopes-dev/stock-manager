import { Skeleton } from "@/app/_components/ui/skeleton";
import { Card, CardContent } from "@/app/_components/ui/card";

export const ProductGridSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Category Section Skeleton */}
      {Array.from({ length: 2 }).map((_, sectorIndex) => (
        <div key={sectorIndex} className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-48 rounded-md" />
            <div className="h-px flex-1 bg-muted rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-none bg-muted/50 flex flex-row h-[180px]">
                <Skeleton className="w-44 shrink-0 h-full rounded-none" />
                <CardContent className="p-4 flex flex-col flex-1 justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 py-2 border-y border-border/50">
                    <div className="space-y-1">
                      <Skeleton className="h-2 w-10" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-2 w-10" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
