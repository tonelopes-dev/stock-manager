import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Skeleton } from "@/app/_components/ui/skeleton";

interface SummaryCardProps {
  children: ReactNode;
  title: string;
}

export const SummaryCard = ({ children, title }: SummaryCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium uppercase text-slate-500">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export const SummaryCardSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-32" />
      </CardContent>
    </Card>
  );
};
