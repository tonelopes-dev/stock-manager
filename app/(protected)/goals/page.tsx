import { Suspense } from "react";
import Header, {
  HeaderLeft,
  HeaderRight,
  HeaderTitle,
} from "@/app/_components/header";
import { getGoals } from "@/app/_data-access/goal/get-goals";
import { GoalCard } from "./_components/goal-card";
import { CreateGoalButton } from "./_components/create-goal-button";
import { getProducts } from "@/app/_data-access/product/get-products";
import { GoalTableSkeleton } from "./_components/table-skeleton";
import { getCurrentUserRole } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";
import { TargetIcon } from "lucide-react";

const GoalsPage = async () => {
  const role = await getCurrentUserRole();
  const isAdmin = role === UserRole.ADMIN || role === UserRole.OWNER;

  const products = await getProducts();
  const productOptions = products.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-8">
      <Header>
        <HeaderLeft>
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <TargetIcon size={24} />
          </div>
          <div>
            <HeaderTitle>Metas de Desempenho</HeaderTitle>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              Monitore seu progresso e alcance seus objetivos comerciais
            </p>
          </div>
        </HeaderLeft>
        {isAdmin && (
          <HeaderRight>
            <CreateGoalButton products={productOptions} />
          </HeaderRight>
        )}
      </Header>

      <Suspense fallback={<GoalTableSkeleton />}>
        <GoalsList isAdmin={isAdmin} products={productOptions} />
      </Suspense>
    </div>
  );
};

const GoalsList = async ({
  isAdmin,
  products,
}: {
  isAdmin: boolean;
  products: { id: string; name: string }[];
}) => {
  const goals = await getGoals();

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-20">
        <div className="rounded-full bg-slate-100 p-4 text-slate-400">
          <TargetIcon size={48} strokeWidth={1.5} />
        </div>
        <div className="space-y-1 text-center">
          <h3 className="font-bold text-slate-900">Nenhuma meta definida</h3>
          <p className="max-w-[300px] text-sm text-slate-500">
            Crie sua primeira meta para começar a monitorar o desempenho da sua
            empresa.
          </p>
        </div>
        {isAdmin && <CreateGoalButton products={products} />}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          isAdmin={isAdmin}
          products={products}
        />
      ))}
    </div>
  );
};

export default GoalsPage;
