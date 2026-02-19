import { db } from "@/app/_lib/prisma";
import { auth } from "@/app/_lib/auth";
import { Card } from "@/app/_components/ui/card";
import { PackageIcon, TrendingUpIcon, CalendarIcon, ZapIcon } from "lucide-react";
import { differenceInDays } from "date-fns";
import { Progress } from "@/app/_components/ui/progress";

export const TrialOnboardingBanner = async () => {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const company = await db.company.findUnique({
    where: { id: session.user.companyId },
    select: { createdAt: true }
  });

  const productsCount = await db.product.count({
    where: { companyId: session.user.companyId }
  });

  const salesCount = await db.sale.count({
    where: { companyId: session.user.companyId }
  });

  if (!company) return null;

  const daysUsed = differenceInDays(new Date(), company.createdAt);
  const daysRemaining = Math.max(0, 14 - daysUsed);
  const trialProgress = (daysUsed / 14) * 100;

  return (
    <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors" />
      
      <div className="relative p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <ZapIcon size={18} fill="currentColor" />
            </div>
            <h3 className="text-lg font-black text-white italic tracking-tighter uppercase whitespace-nowrap">
              {productsCount > 0 ? "Você está evoluindo!" : "Vamos começar?"}
            </h3>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-300 leading-tight">
              {productsCount > 0 ? (
                <>Você já organizou <span className="text-primary">{productsCount} itens</span> e registrou <span className="text-primary">{salesCount} vendas</span>.</>
              ) : (
                "Transforme sua gestão de estoque em uma máquina de vendas eficiente."
              )}
            </p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {daysRemaining} dias de trial premium restantes
            </p>
          </div>

          <div className="space-y-1.5 max-w-[200px]">
             <Progress value={trialProgress} className="h-1 bg-white/5" />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm min-w-[80px]">
            <PackageIcon size={16} className="text-slate-400 mb-1" />
            <span className="text-lg font-black text-white">{productsCount}</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Produtos</span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm min-w-[80px]">
            <TrendingUpIcon size={16} className="text-slate-400 mb-1" />
            <span className="text-lg font-black text-white">{salesCount}</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Vendas</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
