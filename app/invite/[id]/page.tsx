import { getInvitation } from "@/app/_data-access/user/get-invitation";
import { auth } from "@/app/_lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Building2Icon, UserPlusIcon, CheckCircle2Icon } from "lucide-react";
import AcceptInvitationButton from "./_components/accept-invitation-button";

interface InvitationPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { id } = await params;
  const invitation = await getInvitation(id);
  const session = await auth();

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Building2Icon size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Convite não encontrado
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Este convite pode ter expirado ou já foi utilizado.
            </p>
            <Button asChild className="mt-6 w-full" variant="outline">
              <a href="/">Voltar ao Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    redirect(`/login?callbackUrl=/invite/${id}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md overflow-hidden border-none shadow-xl">
        <div className="h-2 bg-primary" />
        <CardHeader className="pt-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 rotate-3 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserPlusIcon size={32} />
          </div>
          <CardTitle className="text-2xl font-black italic tracking-tighter">
            KIPO
          </CardTitle>
          <CardDescription className="mt-2 text-lg font-medium text-slate-900">
            Você foi convidado!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
            <p className="mb-1 text-sm font-black uppercase tracking-widest text-slate-500">
              Empresa
            </p>
            <h2 className="text-xl font-bold text-slate-900">
              {invitation.company.name}
            </h2>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50/30 p-4 text-left text-sm text-green-700">
            <CheckCircle2Icon size={18} className="shrink-0" />
            <p>
              Ao aceitar, você terá acesso ao catálogo de produtos e vendas
              desta empresa como <strong>{invitation.role}</strong>.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <AcceptInvitationButton invitationId={invitation.id} />
        </CardFooter>
      </Card>
    </div>
  );
}
