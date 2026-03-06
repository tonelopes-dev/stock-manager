import { MyOrdersClient } from "./_components/my-orders-client";

interface MyOrdersPageProps {
  params: Promise<{
    companyId: string;
  }>;
}

export default async function MyOrdersPage({ params }: MyOrdersPageProps) {
  const { companyId } = await params;

  return (
    <div className="min-h-screen bg-slate-50">
      <MyOrdersClient companyId={companyId} />
    </div>
  );
}
