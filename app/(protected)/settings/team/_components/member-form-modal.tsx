
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { inviteUserViaWhatsApp } from "@/app/_actions/user/invite-whatsapp";
import { updateMemberAction } from "@/app/_actions/user/update-member";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Button } from "@/app/_components/ui/button";
import { Checkbox } from "@/app/_components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/_components/ui/tooltip";
import { 
    PlusIcon, 
    Loader2Icon, 
    UserPlusIcon, 
    MessageCircleIcon, 
    CheckCircle2Icon, 
    ShieldCheckIcon, 
    InfoIcon,
    Edit3Icon 
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { UserRole } from "@prisma/client";
import { PERMISSIONS, PERMISSION_PRESETS, PERMISSION_LABELS, PERMISSION_DESCRIPTIONS } from "@/app/_lib/permissions";
import { ImagePicker } from "@/app/_components/ui/image-picker";
import { PatternFormat, NumberFormatValues } from "react-number-format";

const formSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres").optional(),
  email: z.string().email("E-mail inválido").optional(),
  phone: z.string().min(10, "Telefone inválido (mínimo 10 dígitos)").optional(),
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.string()).default([]),
  avatarUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MemberFormModalProps {
  mode: "invite" | "edit";
  initialData?: {
    userCompanyId?: string;
    name: string | null;
    email: string;
    phone?: string;
    role: UserRole;
    permissions: string[];
    avatarUrl?: string;
  };
  trigger?: React.ReactNode;
}

const MemberFormModal = ({ mode, initialData, trigger }: MemberFormModalProps) => {
  const [open, setOpen] = useState(false);
  const [invitationResult, setInvitationResult] = useState<{ whatsappUrl: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      role: initialData?.role || UserRole.MEMBER,
      permissions: initialData?.permissions || [],
      avatarUrl: initialData?.avatarUrl || "",
    },
  });

  // Action: Convidar
  const inviteAction = useAction(inviteUserViaWhatsApp, {
    onSuccess: (data) => {
      if (data.data?.success && data.data?.whatsappUrl) {
        setInvitationResult({ whatsappUrl: data.data.whatsappUrl });
        toast.success("Convite gerado com sucesso!");
      }
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao gerar convite.");
    },
  });

  // Action: Editar
  const updateAction = useAction(updateMemberAction, {
    onSuccess: () => {
      toast.success("Membro atualizado com sucesso!");
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao atualizar membro.");
    },
  });

  const onSubmit = (values: FormValues) => {
    if (mode === "invite") {
      inviteAction.execute({
        name: values.name!,
        email: values.email!,
        phone: values.phone!,
        role: values.role,
        permissions: values.permissions,
      });
    } else {
      updateAction.execute({
        userCompanyId: initialData!.userCompanyId!,
        role: values.role,
        permissions: values.permissions,
        avatarUrl: values.avatarUrl,
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setInvitationResult(null);
    if (mode === "invite") form.reset();
  };

  const applyPreset = (preset: keyof typeof PERMISSION_PRESETS) => {
    form.setValue("permissions", PERMISSION_PRESETS[preset]);
  };

  const isPending = inviteAction.isPending || updateAction.isPending;

  return (
    <Dialog open={open} onOpenChange={(val) => {
        if (!val) handleClose();
        else setOpen(true);
    }}>
      <DialogTrigger asChild>
        {trigger || (
            <Button className="font-black gap-2 h-11">
                <PlusIcon size={18} />
                Convidar Membro
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {!invitationResult ? (
          <>
            <DialogHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                {mode === "invite" ? <UserPlusIcon size={24} /> : <Edit3Icon size={24} />}
              </div>
              <DialogTitle className="text-2xl font-black">
                {mode === "invite" ? "Convidar para a equipe" : "Editar Membro"}
              </DialogTitle>
              <DialogDescription>
                {mode === "invite" 
                    ? "Informe os dados do colaborador e defina as permissões de acesso."
                    : "Atualize o papel e as capacidades deste colaborador na empresa."}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Coluna da Esquerda: Dados */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                             <UserPlusIcon size={20} className="text-primary" />
                             <h3 className="font-black text-lg">Dados do Colaborador</h3>
                        </div>

                        {mode === "edit" && (
                            <div className="flex justify-center sm:justify-start pb-4">
                                <FormField
                                    control={form.control}
                                    name="avatarUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <ImagePicker 
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    category="avatars"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                        
                        <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="font-bold">Nome Completo</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Nome do colaborador" 
                                    {...field} 
                                    disabled={mode === "edit"} 
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                        <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="font-bold">Papel Base</FormLabel>
                            <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                disabled={isPending}
                            >
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um papel" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value={UserRole.MEMBER}>Membro (Operacional)</SelectItem>
                                <SelectItem value={UserRole.ADMIN}>Administrador (Gestão)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                        <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="font-bold">E-mail</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="ex@empresa.com" 
                                    {...field} 
                                    disabled={mode === "edit"}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                        <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="font-bold">WhatsApp (Celular)</FormLabel>
                            <FormControl>
                                <PatternFormat
                                    format="(##) #####-####"
                                    mask="_"
                                    customInput={Input}
                                    placeholder="(11) 99999-9999"
                                    value={field.value}
                                    onValueChange={(values: NumberFormatValues) => field.onChange(values.value)}
                                    disabled={mode === "edit"}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    {/* Coluna da Direita: Permissões */}
                    <div className="space-y-4 lg:border-l lg:pl-8">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheckIcon size={20} className="text-primary" />
                            <h3 className="font-black text-lg">Capacidades (RBAC)</h3>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="text-[10px] font-bold rounded-full h-7"
                                onClick={() => applyPreset("COZINHA")}
                            >
                                Cozinha
                            </Button>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="text-[10px] font-bold rounded-full h-7"
                                onClick={() => applyPreset("ATENDIMENTO")}
                            >
                                Atendimento
                            </Button>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="text-[10px] font-bold rounded-full h-7"
                                onClick={() => applyPreset("GERENCIA")}
                            >
                                Gerência Total
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-y-2.5 p-4 bg-muted/30 rounded-xl border max-h-[350px] overflow-y-auto">
                            {Object.entries(PERMISSIONS).map(([key, value]) => (
                                <FormField
                                    key={key}
                                    control={form.control}
                                    name="permissions"
                                    render={({ field }) => {
                                        return (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(value)}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...field.value, value])
                                                                : field.onChange(
                                                                    field.value?.filter(
                                                                        (val) => val !== value
                                                                    )
                                                                )
                                                        }}
                                                    />
                                                </FormControl>
                                                <div className="flex items-center gap-1.5">
                                                    <FormLabel className="text-sm font-medium leading-none cursor-pointer">
                                                        {PERMISSION_LABELS[key as keyof typeof PERMISSION_LABELS]}
                                                    </FormLabel>
                                                    <TooltipProvider>
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <InfoIcon size={14} className="text-muted-foreground hover:text-primary cursor-help transition-colors" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-[280px] text-xs font-normal">
                                                                {PERMISSION_DESCRIPTIONS[key as keyof typeof PERMISSIONS]}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </FormItem>
                                        )
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                  <Button type="button" variant="ghost" onClick={handleClose} className="font-bold">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending} className="font-black px-8">
                    {isPending ? (
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        mode === "invite" ? "Gerar Convite Seguro" : "Salvar Alterações"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        ) : (
          <div className="py-6 text-center space-y-6">
             <div className="flex justify-center">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                    <CheckCircle2Icon size={40} />
                </div>
             </div>
             <div>
                <h3 className="text-xl font-black text-foreground">Convite Criado com Sucesso!</h3>
                <p className="text-sm text-muted-foreground mt-2 px-6">
                    O link de acesso seguro (Magic Link) foi gerado. O colaborador receberá o link para configurar sua própria senha.
                </p>
             </div>

             <Button 
                className="w-full bg-[#25D366] hover:bg-[#20ba59] text-background font-black h-12 gap-2"
                onClick={() => {
                    window.open(invitationResult.whatsappUrl, "_blank");
                    handleClose();
                }}
             >
                <MessageCircleIcon size={20} />
                Enviar Link via WhatsApp
             </Button>

             <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                Segurança Zero Trust: Nenhuma senha foi enviada em texto claro.
             </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MemberFormModal;
