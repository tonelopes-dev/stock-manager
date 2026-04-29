import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const filename = searchParams.get("filename");
  const category = searchParams.get("category") || "others";
  let companySlug = searchParams.get("companySlug");

  if (!filename) {
    return NextResponse.json({ error: "Filename is required" }, { status: 400 });
  }

  if (!request.body) {
    return NextResponse.json({ error: "No body provided" }, { status: 400 });
  }

  try {
    // 1. Resolve Company Slug from Session if not provided
    if (!companySlug) {
      const session = await auth();
      const companyId = session?.user?.companyId;

      if (companyId) {
        const company = await db.company.findUnique({
          where: { id: companyId },
          select: { slug: true },
        });
        companySlug = company?.slug ?? null;
      }
    }

    // 2. Build Robust Path
    // Clean parts to avoid double slashes or leading slashes
    const cleanCompany = (companySlug || "").trim().replace(/^\/+|\/+$/g, "");
    const cleanCategory = category.trim().replace(/^\/+|\/+$/g, "");
    const cleanFilename = filename.trim().replace(/^\/+/g, "");

    const pathParts = [];
    if (cleanCompany) pathParts.push(cleanCompany);
    if (cleanCategory) pathParts.push(cleanCategory);
    pathParts.push(cleanFilename);

    const path = pathParts.join("/");

    // 3. Debugging
    console.log("[UPLOAD_DEBUG] ----------------------------");
    console.log("[UPLOAD_DEBUG] Filename:", filename);
    console.log("[UPLOAD_DEBUG] Category:", category);
    console.log("[UPLOAD_DEBUG] Resolved CompanySlug:", companySlug);
    console.log("[UPLOAD_DEBUG] Final Path:", path);
    console.log("[UPLOAD_DEBUG] ----------------------------");

    const blob = await put(path, request.body, {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
