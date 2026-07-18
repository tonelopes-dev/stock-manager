import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { MenuDataDto } from "@/app/_data-access/menu/get-menu-data";
import { LogOut, MapPin, ShoppingBag, Utensils } from "lucide-react";
import Image from "next/image";

interface MenuHeaderProps {
  menuData: MenuDataDto;
  status: { isOpen: boolean; label: string };
  customer: { name?: string; phoneNumber?: string; customerId?: string; imageUrl?: string } | null;
  handleLogout: () => void;
  totalItems: number;
  setIsCartOpen: (open: boolean) => void;
  setIsStoreInfoOpen: (open: boolean) => void;
  tableNumber: string | null;
  onBack: () => void;
}

export const MenuHeader = ({
  menuData,
  status,
  customer,
  handleLogout,
  totalItems,
  setIsCartOpen,
  setIsStoreInfoOpen,
  tableNumber,
  onBack,
}: MenuHeaderProps) => {
  return (
    <header className="relative w-full">
      <div className="relative h-40 w-full overflow-hidden">
        <Image
          src={
            menuData.bannerUrl ||
            "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop"
          }
          alt="Banner Loja"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute left-6 right-6 top-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/20 text-white backdrop-blur-md"
            onClick={onBack}
          >
            <Utensils className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            {customer && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/20 text-white backdrop-blur-md"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-full bg-white/20 text-white backdrop-blur-md"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary text-[8px] font-black">
                  {totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-6 -mt-10 rounded-[2.5rem] bg-white p-6 shadow-2xl shadow-gray-200/50">
        <div className="absolute -top-14 left-1/2 h-28 w-28 -translate-x-1/2 overflow-hidden rounded-full border-[6px] border-white bg-white shadow-xl">
          <Image
            src={menuData.logoUrl || "/logo/logomarca-180.png"}
            alt="Logo"
            fill
            className="object-cover"
            sizes="112px"
          />
        </div>

        <div className="mt-14 flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-black leading-tight tracking-tight text-gray-900">
            {menuData.companyName}
          </h1>

          {menuData.description && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {menuData.description}
            </p>
          )}

          <div className="mt-1 flex flex-col items-center gap-2 text-gray-500">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="max-w-[200px] truncate">
                {menuData.address || "Endereço não informado"}
              </span>
              <span className="h-1 w-1 rounded-full bg-gray-300" />
              <button
                onClick={() => setIsStoreInfoOpen(true)}
                className="text-[10px] font-bold text-gray-700 transition-colors hover:text-primary"
              >
                Mais informações
              </button>
            </div>

            <div className="flex flex-col items-center gap-1">
              <p
                className={`text-[11px] font-black uppercase tracking-tight ${status.isOpen ? "text-green-600" : "text-rose-500"}`}
              >
                {status.label}
              </p>
              {tableNumber && (
                <Badge
                  variant="secondary"
                  className="mt-1 rounded-full bg-gray-900 px-3 py-1 text-[9px] font-black uppercase text-white"
                >
                  Mesa {tableNumber}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
