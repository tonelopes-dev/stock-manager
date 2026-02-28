import { getInvitation } from "@/app/_data-access/user/get-invitation";
import { auth } from "@/app/_lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Building2Icon, UserPlusIcon, CheckCircle2Icon } from "lucide-react";
import AcceptInvitationButton from "./_components/accept-invitation-button";

interface InvitationPageProps {
  params: { id: string };
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const invitation = await getInvitation(params.id);
  const session = await auth();

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
            <CardContent className="pt-8 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                    <Building2Icon size={24} />
                </div>
                <h1 className="text-xl font-bold text-slate-900">Convite não encontrado</h1>
                <p className="text-sm text-slate-500 mt-2">Este convite pode ter expirado ou já foi utilizado.</p>
                <Button asChild className="mt-6 w-full" variant="outline">
                    <a href="/">Voltar ao Dashboard</a>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
      redirect(`/login?callbackUrl=/invite/${params.id}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md w-full overflow-hidden border-none shadow-xl">
        <div className="h-2 bg-primary" />
        <CardHeader className="text-center pt-8">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 rotate-3">
            <UserPlusIcon size={32} />
          </div>
          <CardTitle className="text-2xl font-black italic tracking-tighter">STOCKY</CardTitle>
          <CardDescription className="text-lg font-medium text-slate-900 mt-2">
            Você foi convidado!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-sm text-slate-500 uppercase font-black tracking-widest mb-1">Empresa</p>
              <h2 className="text-xl font-bold text-slate-900">{invitation.company.name}</h2>
          </div>
          
          <div className="flex items-center gap-3 text-left p-4 rounded-xl border border-green-100 bg-green-50/30 text-green-700 text-sm">
              <CheckCircle2Icon size={18} className="shrink-0" />
              <p>Ao aceitar, você terá acesso ao catálogo de produtos e vendas desta empresa como <strong>{invitation.role}</strong>.</p>
          </div>
        </CardContent>
        <CardFooter>
          <AcceptInvitationButton invitationId={invitation.id} />
        </CardFooter>
      </Card>
    </div>
  );
}
