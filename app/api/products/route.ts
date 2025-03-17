import { db } from "@/app/_lib/prisma";
import { NextRequest } from "next/server";

/*  APENAS PARA FINS DIDATICOS
 Neste código entendemos o que Router Handler faz
 que neste caso criamos rotas HTTP para o nosso backend
 este uso é muito comum em frameworks como Next.js
 em vez de criar rotas no backend, criamos rotas no frontend
 e enviamos as rotas para o backend para que ele responda
 com os dados
 Exemplos quando estamos esperando uma resposta de um WebHook
disponibilizando uma Rota para ouvir o WebHook.



 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("price");

  if (!query) {
    const products = await db.product.findMany({});
    return new Response(JSON.stringify(products), {
      status: 200,
    });
  }
  // apenas para valores igual a 20

  const products = await db.product.findMany({
    where: {
      price: {
        lte: Number(query),
      },
    },
  });
  return new Response(JSON.stringify(products), {
    status: 200,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = body.name;
  const price = body.price;
  const stock = body.stock;
  const product = await db.product.create({ data: { name, price, stock } });
  return new Response(JSON.stringify(product), { status: 201 });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const id = body.id;
  const product = await db.product.delete({ where: { id } });
  return new Response(JSON.stringify(product), { status: 200 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const id = body.id;
  const name = body.name;
  const price = body.price;
  const stock = body.stock;
  const product = await db.product.update({
    where: { id },
    data: { name, price, stock },
  });
  return new Response(JSON.stringify(product), { status: 200 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = body.id;
  const name = body.name;
  const price = body.price;
  const stock = body.stock;
  const product = await db.product.update({
    where: { id },
    data: { name, price, stock },
  });
  return new Response(JSON.stringify(product), { status: 200 });
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
