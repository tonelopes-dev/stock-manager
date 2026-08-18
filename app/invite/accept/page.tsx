
import { Button } from "@/app/_components/ui/button";
import { InvitationService } from "@/app/_services/invitation.service";
import { ArrowLeftIcon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { AcceptInviteForm } from "./_components/accept-invite-form";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage(props: PageProps) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  if (!token) {
    return <ErrorState message="Link de convite ausente." />;
  }

  try {
    const invitation = await InvitationService.validateToken(token);

    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        
        <div className="w-full max-w-[440px] relative z-10">
          <AcceptInviteForm 
            token={token} 
            email={invitation.email} 
            companyName={invitation.company.name} 
          />
          
          <p className="text-center text-xs text-muted-foreground mt-8">
            &copy; {new Date().getFullYear()} Kipo ERP. Todos os direitos reservados.
          </p>
        </div>
      </main>
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return <ErrorState message={error.message} />;
    }
    return <ErrorState message="O link expirou ou é inválido." />;
  }
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center">
          <div className="h-24 w-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
            <XCircleIcon size={56} />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-foreground">Link Inválido</h1>
          <p className="text-xl text-muted-foreground">
            {message}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Por favor, solicite um novo convite ao gestor da sua empresa para continuar.
          </p>
        </div>

        <div className="pt-4">
          <Button asChild variant="outline" className="h-12 px-8 font-bold gap-2">
            <Link href="/login">
              <ArrowLeftIcon size={18} />
              Voltar para o Login
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
