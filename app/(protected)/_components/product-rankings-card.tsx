import { 
    ProductRanking,
} from "@/app/_services/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { formatCurrency } from "@/app/_lib/utils";
import { PackageIcon } from "lucide-react";

interface RawProductRanking {
    productName: string;
    productId: string;
    totalSold?: number;
    revenue: number;
    profit?: number;
    margin?: number;
}

interface ProductRankingsCardProps {
    topProfitable: ProductRanking[];
    worstMargin: ProductRanking[];
    mostSold: RawProductRanking[];
}

const ProductRankingsCard = ({ topProfitable, worstMargin, mostSold }: ProductRankingsCardProps) => {
    return (
        <Card className="h-full overflow-hidden flex flex-col min-h-[440px]">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Rankings de Produtos</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <Tabs defaultValue="profitable" className="w-full h-full flex flex-col">
                    <div className="px-6 pb-2">
                        <TabsList className="grid w-full grid-cols-3 bg-slate-100/50">
                            <TabsTrigger value="profitable" className="text-[10px] font-bold uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-primary">
                                Lucro
                            </TabsTrigger>
                            <TabsTrigger value="volume" className="text-[10px] font-bold uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-primary">
                                Volume
                            </TabsTrigger>
                            <TabsTrigger value="margin" className="text-[10px] font-bold uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-rose-600">
                                Margem
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    
                    <TabsContent value="profitable" className="flex-1 mt-0 px-6 pb-6 space-y-4 overflow-y-auto custom-scrollbar">
                        {topProfitable.length === 0 ? <EmptyState /> : topProfitable.map((p, i) => (
                            <RankingItem key={p.productId} product={p as unknown as RawProductRanking} index={i} type="profit" />
                        ))}
                    </TabsContent>

                    <TabsContent value="volume" className="flex-1 mt-0 px-6 pb-6 space-y-4 overflow-y-auto custom-scrollbar">
                        {mostSold.length === 0 ? <EmptyState /> : mostSold.map((p, i) => (
                            <RankingItem key={p.productId} product={p as unknown as RawProductRanking} index={i} type="volume" />
                        ))}
                    </TabsContent>
                    
                    <TabsContent value="margin" className="flex-1 mt-0 px-6 pb-6 space-y-4 overflow-y-auto custom-scrollbar">
                        {worstMargin.length === 0 ? <EmptyState /> : worstMargin.map((p, i) => (
                            <RankingItem key={p.productId} product={p as unknown as RawProductRanking} index={i} type="margin" />
                        ))}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

const RankingItem = ({ product, index, type }: { product: RawProductRanking, index: number, type: 'profit' | 'margin' | 'volume' }) => (
    <div className="flex items-center gap-3 group transition-all hover:bg-slate-50/50 p-1 -m-1 rounded-lg">
        <div className="flex-none w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100 group-hover:border-primary/20 group-hover:text-primary transition-colors">
            {index + 1}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{product.productName}</p>
            <div className="flex items-center gap-2">
                {type === 'volume' ? (
                    <p className="text-[10px] font-medium text-slate-500 uppercase">Total: {product.totalSold} un.</p>
                ) : (
                    <p className="text-[10px] font-medium text-slate-500 uppercase">Rev: {formatCurrency(product.revenue)}</p>
                )}
                <div className="w-1 h-1 rounded-full bg-slate-200" />
                <p className={`text-[10px] font-bold uppercase ${type === 'margin' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {type === 'profit' ? `Lucro: ${formatCurrency(product.profit || 0)}` : 
                     type === 'volume' ? `Valor: ${formatCurrency(product.revenue)}` :
                     `Margem: ${product.margin?.toFixed(1)}%`}
                </p>
            </div>
        </div>
    </div>
);

const EmptyState = () => (
    <div className="h-full flex flex-col items-center justify-center py-10 opacity-40">
        <PackageIcon className="w-8 h-8 mb-2" />
        <p className="text-xs font-bold uppercase tracking-widest">Sem dados</p>
    </div>
);

export const ProductRankingsSkeleton = () => (
    <Card className="h-full overflow-hidden min-h-[440px]">
        <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="px-6 space-y-6">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                    <Skeleton className="w-6 h-6 rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </CardContent>
    </Card>
);

export default ProductRankingsCard;
