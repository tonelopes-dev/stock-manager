"use client";

import { Button } from "@/app/_components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface StockPaginationProps {
  total: number;
  pageSize: number;
}

const StockPagination = ({ total, pageSize }: StockPaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white/60 shadow-inner mt-6">
      <p className="text-sm font-medium text-slate-500 italic">
        Mostrando <span className="font-black text-slate-900">{Math.min(total, (currentPage - 1) * pageSize + 1)}</span>-
        <span className="font-black text-slate-900">{Math.min(total, currentPage * pageSize)}</span> de 
        <span className="font-black text-slate-900 ml-1">{total}</span> itens
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="rounded-2xl h-10 w-10 hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all text-slate-600"
        >
          <ChevronLeftIcon size={18} />
        </Button>

        <div className="flex items-center justify-center min-w-20 px-4 h-10 bg-white rounded-2xl shadow-sm border border-slate-100/50">
          <span className="text-sm font-black text-primary italic">Página {currentPage}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="rounded-2xl h-10 w-10 hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all text-slate-600"
        >
          <ChevronRightIcon size={18} />
        </Button>
      </div>
    </div>
  );
};

export default StockPagination;
