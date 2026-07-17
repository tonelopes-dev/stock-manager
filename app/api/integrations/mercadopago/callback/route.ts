import { db } from "@/app/_lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state parameters" },
      { status: 400 }
    );
  }

  const [companyId, companySlug] = state.split("___");

  if (!companyId || !companySlug) {
    return NextResponse.json(
      { error: "Invalid state format" },
      { status: 400 }
    );
  }

  const clientId = process.env.MP_MASTER_CLIENT_ID;
  const clientSecret = process.env.MP_MASTER_CLIENT_SECRET;
  
  let appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  appUrl = appUrl.replace(/\/$/, ""); // Remove trailing slash se houver
  const redirectUri = `${appUrl}/api/integrations/mercadopago/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Mercado Pago credentials not configured in .env" },
      { status: 500 }
    );
  }

  try {
    // Troca o auth code pelo access token e refresh token
    const tokenResponse = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        client_secret: clientSecret,
        client_id: clientId,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Mercado Pago OAuth Error:", data);
      return NextResponse.json(
        { error: "Failed to exchange code for token", details: data },
        { status: tokenResponse.status }
      );
    }

    // Salva o token do lojista no banco
    await db.company.update({
      where: { id: companyId },
      data: {
        mpMarketplaceToken: data.access_token,
        mpMarketplacePublicKey: data.public_key,
        mpMarketplaceAccountId: data.user_id.toString(),
      },
    });

    // Redireciona de volta para o dashboard
    let dashUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    dashUrl = dashUrl.replace(/\/$/, "");
    const dashboardUrl = `${dashUrl}/integracoes?success=mp_connected`;
    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error("Error during Mercado Pago OAuth callback:", error);
    return NextResponse.json(
      { error: "Internal server error during OAuth callback" },
      { status: 500 }
    );
  }
}
