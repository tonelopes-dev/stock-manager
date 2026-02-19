import { getLowStockProducts } from "@/app/_data-access/dashboard/get-low-stock-products";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { AlertCircleIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";

import { db } from "@/app/_lib/prisma";
import { auth } from "@/app/_lib/auth";
import { FirstAlertToastTrigger } from "./first-alert-toast-trigger";

const LowStockAlerts = async () => {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const [lowStockProducts, company] = await Promise.all([
    getLowStockProducts(),
    db.company.findUnique({
      where: { id: session.user.companyId },
      select: { firstAlertSeenAt: true }
    })
  ]);

  if (lowStockProducts.length === 0) {
    return null;
  }

  return (
    <Card className="border-red-100 bg-red-50/30">
      <FirstAlertToastTrigger firstAlertSeenAt={company?.firstAlertSeenAt ?? null} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
            <AlertCircleIcon className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-900">Alertas de Estoque</CardTitle>
        </div>
        <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-100 hover:text-red-800" asChild>
            <Link href="/products">
                Ver todos
                <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {lowStockProducts.map((product) => (
          <div key={product.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-white p-3 shadow-sm">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-slate-900">{product.name}</p>
              <p className="text-xs text-red-600 font-medium">
                Mínimo esperado: {product.minStock} unidades
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-black ${product.stock === 0 ? "text-red-600" : "text-amber-600"}`}>
                {product.stock}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Em estoque</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export const LowStockAlertsSkeleton = () => {
  return (
    <Card className="border-slate-100">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-20" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex flex-col items-end gap-1">
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LowStockAlerts;
