import { Skeleton } from "@/app/_components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";

export const GoalTableSkeleton = () => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-slate-200 bg-slate-50/50 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-12 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
