import Header, {
  HeaderLeft,
  HeaderSubtitle,
  HeaderTitle,
} from "@/app/_components/header";
import { SummaryCardSkeleton } from "@/app/(protected)/_components/summary-card";
import TotalRevenueCard from "@/app/(protected)/_components/total-revenue-card";
import { Suspense } from "react";
import TodayRevenueCard from "@/app/(protected)/_components/today-revenue-card";
import TotalSalesCard from "@/app/(protected)/_components/total-sales-card";
import TotalInStockCard from "@/app/(protected)/_components/total-in-stock-card";
import TotalProductsCard from "@/app/(protected)/_components/total-products-card";
import { Last14DaysRevenueCard } from "@/app/(protected)/_components/last-14-days-revenue-card";
import { Skeleton } from "@/app/_components/ui/skeleton";
import MostSoldProducts, {
  MostSoldProductsSkeleton,
} from "@/app/(protected)/_components/most-sold-products";
import { getLast14DaysRevenue } from "@/app/_data-access/dashboard/get-last-14-days-revenue";

// Essa página será montada do zero a cada acesso (SSR)
export const dynamic = "force-dynamic";

const Home = async () => {
  return (
    <div className="flex flex-col space-y-8 p-8">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Visão geral dos dados</HeaderSubtitle>
          <HeaderTitle>Dashboard</HeaderTitle>
        </HeaderLeft>
      </Header>

      <div className="grid grid-cols-2 gap-6">
        <Suspense fallback={<SummaryCardSkeleton />}>
          <TotalRevenueCard />
        </Suspense>
        <Suspense fallback={<SummaryCardSkeleton />}>
          <TodayRevenueCard />
        </Suspense>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <Suspense fallback={<SummaryCardSkeleton />}>
          <TotalSalesCard />
        </Suspense>
        <Suspense fallback={<SummaryCardSkeleton />}>
          <TotalInStockCard />
        </Suspense>
        <Suspense fallback={<SummaryCardSkeleton />}>
          <TotalProductsCard />
        </Suspense>
      </div>

      <div className="grid min-h-0 grid-cols-[minmax(0,2.5fr),minmax(0,1fr)] gap-6">
        <Suspense
          fallback={
            <Skeleton className="bg-white p-6">
              <div className="space-y-2">
                <div className="h-5 w-[86.26px] rounded-md bg-gray-200" />
                <div className="h-4 w-48 rounded-md bg-gray-200" />
              </div>
            </Skeleton>
          }
        >
          <Last14DaysRevenueCardWrapper />
        </Suspense>
        <Suspense fallback={<MostSoldProductsSkeleton />}>
          <MostSoldProducts />
        </Suspense>
      </div>
    </div>
  );
};

const Last14DaysRevenueCardWrapper = async () => {
  const data = await getLast14DaysRevenue();
  return <Last14DaysRevenueCard data={data} />;
};

export default Home;