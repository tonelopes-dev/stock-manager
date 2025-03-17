import { db } from "@/app/_lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const id = params.id;
  const product = await db.product.findUnique({ where: { id } });
  return new Response(JSON.stringify(product), { status: 200 });
}
