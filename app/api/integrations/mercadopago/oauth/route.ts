import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const companyId = searchParams.get("companyId");
  const companySlug = searchParams.get("companySlug");

  if (!companyId || !companySlug) {
    return NextResponse.json(
      { error: "companyId and companySlug are required" },
      { status: 400 }
    );
  }

  const clientId = process.env.MP_MASTER_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "MP_MASTER_CLIENT_ID is not configured in .env" },
      { status: 500 }
    );
  }

  // A URL de callback do nosso app
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/mercadopago/callback`;

  // Monta a URL de autorização oficial do MP
  const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${companyId}___${companySlug}&redirect_uri=${redirectUri}`;

  return NextResponse.redirect(authUrl);
}
