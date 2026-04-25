import { notFound } from "next/navigation";
import { getOrderStatus } from "@/app/_data-access/order/get-order-status";
import { db } from "@/app/_lib/prisma";
import { OrderTrackerClient } from "./_components/order-tracker-client";

interface OrderTrackerPageProps {
  params: Promise<{
    companySlug: string;
    orderId: string;
  }>;
}

export default async function OrderTrackerPage({ params }: OrderTrackerPageProps) {
  const { companySlug, orderId } = await params;

  // First get the company to ensure we are in the right context
  const company = await db.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, name: true, logoUrl: true }
  });

  if (!company) return notFound();

  // Get the order data
  const order = await getOrderStatus(orderId, company.id);

  if (!order) return notFound();

  return (
    <div className="min-h-screen bg-white">
      <OrderTrackerClient 
        initialOrder={order} 
        companyName={company.name}
        companyLogo={company.logoUrl}
        companySlug={companySlug}
      />
    </div>
  );
}
