import { cookies } from "next/headers";
import { Package2 } from "lucide-react";

export default async function ClearSessionPage() {
  // 1. Server-side Cookie Cleanup
  const cookieStore = cookies();
  const cookiesToClear = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
    "next-auth.state",
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
    "authjs.state",
  ];

  cookiesToClear.forEach((cookieName) => {
    cookieStore.delete(cookieName);
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="animate-pulse rounded-2xl bg-slate-900 p-3 shadow-xl">
          <Package2 className="h-10 w-10 text-white" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">
            Reiniciando Sessão
          </h1>
          <p className="max-w-xs text-sm font-medium text-slate-500">
            Limpando dados de segurança e redirecionando você para a página
            inicial...
          </p>
        </div>

        {/* Client-side Cleanup Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                localStorage.clear();
                sessionStorage.clear();
                console.log("[Auth] Browser storage cleared.");
              } catch (e) {
                console.error("[Auth] Failed to clear storage:", e);
              }
              setTimeout(() => {
                window.location.href = "/?reason=session_cleared";
              }, 1500);
            `,
          }}
        />

        <div className="mt-4 flex gap-1">
          <div
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-200"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-200"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-200"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
