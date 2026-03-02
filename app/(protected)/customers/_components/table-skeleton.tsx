import { Skeleton } from "@/app/_components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";

export const CustomerTableSkeleton = () => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-32" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-[100px] text-right">
              <Skeleton className="ml-auto h-4 w-12" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-4 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
