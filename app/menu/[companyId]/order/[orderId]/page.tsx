import { notFound } from "next/navigation";
import { getOrderStatus } from "@/app/_data-access/order/get-order-status";
import { OrderStatusClient } from "./_components/order-status-client";

interface OrderStatusPageProps {
  params: Promise<{
    companyId: string;
    orderId: string;
  }>;
}

export default async function OrderStatusPage({
  params,
}: OrderStatusPageProps) {
  const { companyId, orderId } = await params;
  const order = await getOrderStatus(orderId, companyId);

  if (!order) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OrderStatusClient initialOrder={order} companyId={companyId} />
    </div>
  );
}
