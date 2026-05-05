"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { ImageIcon, Loader2, MapPin, MessageCircle, Instagram, Store, Save, Clock, ImagePlus, Trash2, User } from "lucide-react";
import Image from "next/image";

import { updateCompany } from "@/app/_actions/company/update-company";
import { updateCompanySchema, UpdateCompanySchema } from "@/app/_actions/company/update-company/schema";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Textarea } from "@/app/_components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/_components/ui/form";
import { CompanyBranding } from "@/app/_data-access/menu/get-menu-management-data";
import { Switch } from "@/app/_components/ui/switch";

interface MenuAppearanceSettingsProps {
  initialData: CompanyBranding;
}

const DEFAULT_HOURS = [
  { day: "Segunda", open: "08:00", close: "22:00", closed: false },
  { day: "Terça", open: "08:00", close: "22:00", closed: false },
  { day: "Quarta", open: "08:00", close: "22:00", closed: false },
  { day: "Quinta", open: "08:00", close: "22:00", closed: false },
  { day: "Sexta", open: "08:00", close: "22:00", closed: false },
  { day: "Sábado", open: "08:00", close: "22:00", closed: false },
  { day: "Domingo", open: "08:00", close: "22:00", closed: true },
];

export const MenuAppearanceSettings = ({ initialData }: MenuAppearanceSettingsProps) => {
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const form = useForm<UpdateCompanySchema>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: {
      name: initialData.name,
      slug: initialData.slug,
      bannerUrl: initialData.bannerUrl || "",
      logoUrl: initialData.logoUrl || "",
      address: initialData.address || "",
      description: initialData.description || "",
      whatsappNumber: initialData.whatsappNumber || "",
      instagramUrl: initialData.instagramUrl || "",

      operatingHours: initialData.operatingHours || DEFAULT_HOURS,
      requireSelfieOnCheckout: initialData.requireSelfieOnCheckout,
      allowNegativeStock: initialData.allowNegativeStock,
      estimatedMonthlyVolume: initialData.estimatedMonthlyVolume,
      enableOverheadInjection: initialData.enableOverheadInjection,
      enableServiceTax: initialData.enableServiceTax,
    },
  });

  const { execute, isPending } = useAction(updateCompany, {
    onSuccess: () => {
      toast.success("Informações do menu atualizadas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar informações do menu.");
    },
  });

  const onFormError = (errors: any) => {
    console.error("FORM VALIDATION ERRORS:", errors);
    toast.error("Existem erros no formulário. Verifique os campos.");
  };

  const onSubmit = (data: UpdateCompanySchema) => {
    console.log("SUBMITTING FORM DATA:", data);
    execute(data);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "banner" | "logo") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (type === "banner") setIsUploadingBanner(true);
      else setIsUploadingLogo(true);

      const imageCompression = (await import("browser-image-compression")).default;
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
      });

      const response = await fetch(`/api/upload?filename=${encodeURIComponent(compressedFile.name)}&category=branding&v=${Date.now()}`, {
        method: "POST",
        body: compressedFile,
      });

      if (!response.ok) throw new Error("Upload failed");
      const blob = await response.json();

      if (type === "banner") {
        form.setValue("bannerUrl", blob.url, { shouldDirty: true, shouldValidate: true });
      } else {
        form.setValue("logoUrl", blob.url, { shouldDirty: true, shouldValidate: true });
      }
      
      console.log(`[UPLOAD_SUCCESS] ${type}:`, blob.url);
      toast.success(`${type === "banner" ? "Banner" : "Logo"} enviado com sucesso!`);

      // AUTO-SAVE: Trigger submission automatically after successful upload
      form.handleSubmit(onSubmit)();
    } catch (error) {
      toast.error("Erro no upload da imagem.");
    } finally {
      setIsUploadingBanner(false);
      setIsUploadingLogo(false);
    }
  };

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardHeader className="bg-primary/5 pb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary text-white">
            <Store size={20} />
          </div>
          <div>
            <CardTitle className="text-xl">Identidade do Cardápio</CardTitle>
            <CardDescription>Customize a aparência e informações da sua loja online</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 -mt-4 bg-background rounded-t-[2rem]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onFormError)} className="space-y-8">
            
            {/* Visuals Section */}
            <FormField
              control={form.control}
              name="bannerUrl"
              render={({ field }) => <input type="hidden" {...field} />}
            />
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => <input type="hidden" {...field} />}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Banner Column */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-black uppercase tracking-wider text-gray-900">Banner do Menu (16:9)</label>
                  <div className="relative group">
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[2.5rem] border-2 border-dashed border-gray-200 bg-gray-50/50 transition-all hover:border-primary/50">
                      {form.watch("bannerUrl") ? (
                        <>
                          <Image
                            src={form.watch("bannerUrl")!}
                            alt="Banner Preview"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                            <label className="cursor-pointer p-4 rounded-full bg-white text-gray-900 hover:scale-110 transition-transform shadow-xl">
                              <ImagePlus size={24} />
                              <input 
                                data-testid="upload-banner-input"
                                type="file" 
                                className="hidden" 
                                onChange={(e) => handleImageUpload(e, "banner")} 
                                disabled={isUploadingBanner} 
                              />
                            </label>
                            <Button 
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-14 w-14 rounded-full shadow-xl hover:scale-110 transition-transform"
                              onClick={() => {
                                form.setValue("bannerUrl", "", { shouldDirty: true, shouldValidate: true });
                                form.handleSubmit(onSubmit)();
                              }}
                            >
                              <Trash2 size={24} />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <label className="cursor-pointer h-full flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                          {isUploadingBanner ? (
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <div className="p-5 rounded-3xl bg-white shadow-sm border border-gray-100">
                                <ImagePlus size={32} />
                              </div>
                              <span className="text-xs font-black uppercase tracking-widest">Upload do Banner</span>
                            </div>
                          )}
                          <input 
                            data-testid="upload-banner-input"
                            type="file" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(e, "banner")} 
                            disabled={isUploadingBanner} 
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo Column */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-black uppercase tracking-wider text-gray-900">Logo da Empresa (1:1)</label>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50/50 group shrink-0">
                      {form.watch("logoUrl") ? (
                        <>
                          <Image
                            src={form.watch("logoUrl")!}
                            alt="Logo Preview"
                            fill
                            className="object-cover"
                            sizes="128px"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                            <label className="cursor-pointer p-2 rounded-full bg-white text-gray-900 shadow-lg hover:scale-110 transition-transform">
                              <ImagePlus size={16} />
                              <input 
                                data-testid="upload-logo-input"
                                type="file" 
                                className="hidden" 
                                onChange={(e) => handleImageUpload(e, "logo")} 
                                disabled={isUploadingLogo} 
                              />
                            </label>
                            <Button 
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8 rounded-full shadow-lg hover:scale-110 transition-transform"
                              onClick={() => {
                                form.setValue("logoUrl", "", { shouldDirty: true, shouldValidate: true });
                                form.handleSubmit(onSubmit)();
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors w-full h-full justify-center">
                          {isUploadingLogo ? <Loader2 size={24} className="animate-spin text-primary" /> : <ImagePlus size={24} />}
                          <span className="text-[10px] font-bold uppercase">Logo</span>
                          <input 
                            data-testid="upload-logo-input"
                            type="file" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(e, "logo")} 
                            disabled={isUploadingLogo} 
                          />
                        </label>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Avatar da Loja</p>
                      <p className="text-xs text-muted-foreground">Recomendado: 400x400px. PNG, JPG ou WebP.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Unidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Kipo Burger - Unidade Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição / Slogan</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: O melhor burger da cidade. Aberto desde 2010." 
                          className="resize-none h-24"
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact & Location */}
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin size={14} className="text-muted-foreground" />
                        Endereço
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Av. Paulista, 1000 - São Paulo" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MessageCircle size={14} className="text-muted-foreground" />
                          WhatsApp
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 11999999999" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instagramUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Instagram size={14} className="text-muted-foreground" />
                          Instagram
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="@seunegocio" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
 


            {/* Operating Hours Section */}
            <div className="space-y-6 pt-4 border-t">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500 text-white">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Horário de Funcionamento</h3>
                  <p className="text-xs text-muted-foreground">Defina os horários de atendimento</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {DEFAULT_HOURS.map((dayItem, index) => (
                  <div key={dayItem.day} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col gap-2 flex-1">
                      <span className="text-xs font-bold text-gray-700">{dayItem.day}</span>
                      <div className="flex items-center gap-1.5">
                        <FormField
                          control={form.control}
                          name={`operatingHours.${index}.open` as any}
                          render={({ field }) => (
                            <FormItem className="space-y-0">
                              <FormControl>
                                <Input 
                                  type="time" 
                                  className="w-20 h-8 text-[10px] bg-white px-2" 
                                  {...field} 
                                  disabled={form.watch(`operatingHours.${index}.closed` as any)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span className="text-[10px] font-medium text-gray-400">às</span>
                        <FormField
                          control={form.control}
                          name={`operatingHours.${index}.close` as any}
                          render={({ field }) => (
                            <FormItem className="space-y-0">
                              <FormControl>
                                <Input 
                                  type="time" 
                                  className="w-20 h-8 text-[10px] bg-white px-2" 
                                  {...field} 
                                  disabled={form.watch(`operatingHours.${index}.closed` as any)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name={`operatingHours.${index}.closed` as any}
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-center gap-1 space-y-0">
                          <span className={`text-[8px] font-black uppercase ${field.value ? "text-rose-500" : "text-green-600"}`}>
                            {field.value ? "FECHADO" : "ABERTO"}
                          </span>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="scale-75 data-[state=checked]:bg-rose-500"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                data-testid="appearance-save-button"
                type="submit" 
                disabled={isPending || isUploadingBanner || isUploadingLogo} 
                className="min-w-[180px] h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    SALVANDO...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    SALVAR ALTERAÇÕES
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
