"use client";

import { ComandaDto } from "@/app/_data-access/order/get-active-comandas";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { ComboboxOption } from "@/app/_components/ui/combobox";
import {
  useState,
  useTransition,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { toast } from "sonner";
import { convertOrderToSaleAction } from "@/app/_actions/order/convert-to-sale";
import { upsertOrderAction } from "@/app/_actions/order/upsert-order";
import { convertItemsToSaleAction } from "@/app/_actions/order/convert-items-to-sale";
import { generatePixPayment } from "@/app/_actions/integration/generate-pix-payment";
import { deleteOrderItemAction } from "@/app/_actions/order/delete-order-item";
import { usePaymentRealtime } from "../../_hooks/use-payment-realtime";
import { useRouter } from "next/navigation";
import { PaymentMethod, SaleStatus } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ComandaTotals {
  fullSubtotal: number;
  partialTotal: number;
  relevantSubtotal: number;
  itenCount: number;
  serviceChargeAmount: number;
  totalWithTip: number;
  effectiveDiscount: number;
  extraAmount: number;
}

export interface GroupedItem {
  id: string;
  productId: string;
  productName?: string;
  name?: string;
  price: number | string;
  cost?: number | string;
  operationalCost?: number | string;
  quantity: number;
  createdAt: Date | string;
  notes?: string | null;
  totalPrice?: number;
}

interface UseComandaStateParams {
  comanda: ComandaDto | null;
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  products: ProductDto[];
  customerOptions: ComboboxOption[];
}

// ── Hook ───────────────────────────────────────────────────────────────────

export const useComandaState = ({
  comanda,
  isOpen,
  onClose,
  companyId,
  products,
}: UseComandaStateParams) => {
  const [isPending, startTransition] = useTransition();

  const [generatedPix, setGeneratedPix] = useState<{
    qrCodeBase64: string;
    copyPasteCode: string;
    externalId: string;
  } | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<string>("PIX");
  const [applyServiceCharge, setApplyServiceCharge] = useState<boolean>(true);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [extraAmount, setExtraAmount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<"discount" | "extra">(
    "discount",
  );
  const [isEmployeeSale, setIsEmployeeSale] = useState<boolean>(false);
  const [now, setNow] = useState(new Date());
  const [isImageOpen, setIsImageOpen] = useState(false);

  // Add Item State
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // Partial Payment State
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(),
  );
  const [isGrouped, setIsGrouped] = useState<boolean>(false);

  // VIP Pending Payment State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  });

  const router = useRouter();

  const lastInitializedComandaId = useRef<string | null>(null);

  // Reset state when sheet opens/closes or comanda changes
  useEffect(() => {
    if (!isOpen) {
      lastInitializedComandaId.current = null;
      return;
    }

    if (isOpen && comanda && lastInitializedComandaId.current !== comanda.customerId) {
      lastInitializedComandaId.current = comanda.customerId;
      setSelectedItemIds(new Set());
      setSelectedProductId("");
      setSelectedQuantity(1);
      setApplyServiceCharge(comanda.hasServiceTax);
      setDiscountAmount(comanda.discountAmount || 0);
      setExtraAmount(comanda.extraAmount || 0);
      setAdjustmentReason(comanda.adjustmentReason || "");
      setAdjustmentType((comanda.extraAmount || 0) > 0 ? "extra" : "discount");
      setIsEmployeeSale(comanda.isEmployeeSale || false);
      setSelectedCustomerId(comanda.customerId || "");
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setDueDate(d);
      setPaymentMethod("PIX");
      setGeneratedPix(null);
    }
  }, [isOpen, comanda]);

  // Hook realtime para atualizar o status automaticamente quando o Pix for pago via webhook
  usePaymentRealtime({
    companyId,
    orderIds: comanda ? comanda.orders.map((o) => o.id) : [],
    enabled: !!generatedPix,
    onPaymentSuccess: () => {
      onClose();
      toast.success(`Comanda de ${comanda?.customerName} paga com sucesso!`);
    }
  });

  // ── Computed Values ────────────────────────────────────────────────────

  const totals = useMemo<ComandaTotals>(() => {
    if (!comanda)
      return {
        fullSubtotal: 0,
        partialTotal: 0,
        itenCount: 0,
        serviceChargeAmount: 0,
        totalWithTip: 0,
        effectiveDiscount: 0,
        relevantSubtotal: 0,
        extraAmount: 0,
      };

    const calculateSubtotal = (items: typeof comanda.items) => {
      return items.reduce((acc, p) => {
        const unitPrice = isEmployeeSale
          ? Number(p.cost || 0) + Number(p.operationalCost || 0)
          : Number(p.price);
        return acc + unitPrice * p.quantity;
      }, 0);
    };

    const fullSubtotal = calculateSubtotal(comanda.items);
    const selectedItemsList = comanda.items.filter((i) =>
      selectedItemIds.has(i.id),
    );
    const currentPartialSubtotal = calculateSubtotal(selectedItemsList);

    const relevantSubtotal =
      selectedItemIds.size > 0 ? currentPartialSubtotal : fullSubtotal;
    const itenCount =
      selectedItemIds.size > 0
        ? selectedItemsList.reduce((acc, p) => acc + p.quantity, 0)
        : comanda.items.reduce((acc, p) => acc + p.quantity, 0);

    const serviceChargeAmount = applyServiceCharge
      ? Math.round(relevantSubtotal * 0.1 * 100) / 100
      : 0;

    const totalBeforeDiscount = relevantSubtotal + serviceChargeAmount;

    // Boundary check
    const effectiveDiscount = Math.min(discountAmount, totalBeforeDiscount);
    const totalWithTip = Math.max(
      0,
      Math.round(
        (totalBeforeDiscount - effectiveDiscount + extraAmount) * 100,
      ) / 100,
    );

    return {
      fullSubtotal,
      partialTotal: currentPartialSubtotal,
      relevantSubtotal,
      itenCount,
      serviceChargeAmount,
      totalWithTip,
      effectiveDiscount,
      extraAmount,
    };
  }, [
    comanda,
    selectedItemIds,
    applyServiceCharge,
    isEmployeeSale,
    discountAmount,
    extraAmount,
  ]);

  const groupedItems = useMemo<GroupedItem[]>(() => {
    if (!comanda) return [];
    if (!isGrouped) return comanda.items as GroupedItem[];

    const group = comanda.items.reduce<GroupedItem[]>((acc, item) => {
      const existing = acc.find((i) => i.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.totalPrice =
          (existing.totalPrice || 0) + Number(item.price) * item.quantity;
      } else {
        acc.push({
          ...item,
          totalPrice: Number(item.price) * item.quantity,
        } as GroupedItem);
      }
      return acc;
    }, []);

    return group;
  }, [comanda, isGrouped]);

  const currentProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId],
  );

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // ── Mutation Handlers ──────────────────────────────────────────────────

  const isPartial = selectedItemIds.size > 0;

  const handlePay = () => {
    if (!comanda) return;
    if (!paymentMethod) {
      toast.error("Selecione um método de pagamento.");
      return;
    }

    if (paymentMethod === "PENDING_PAYMENT" && !selectedCustomerId) {
      toast.error("Selecione um cliente para gerar a fatura fiado.");
      return;
    }

    startTransition(async () => {
      try {
        let saleIdForPix: string | undefined;

        if (paymentMethod === "PIX_API") {
          // 1. Cria a Sale com status PENDING_PAYMENT
          if (selectedItemIds.size === 0) {
            const result = await convertOrderToSaleAction({
              orderIds: comanda.orders.map((o) => o.id),
              companyId,
              paymentMethod: null,
              tipAmount: totals.serviceChargeAmount,
              discountAmount: totals.effectiveDiscount,
              extraAmount: totals.extraAmount,
              adjustmentReason: adjustmentReason || undefined,
              isEmployeeSale: isEmployeeSale,
              status: "PENDING_PAYMENT",
            });
            if (result?.serverError) throw new Error(result.serverError);
            saleIdForPix = result?.data?.saleId;
          } else {
            const result = await convertItemsToSaleAction({
              itemIds: Array.from(selectedItemIds),
              companyId,
              paymentMethod: null,
              tipAmount: totals.serviceChargeAmount,
              discountAmount: totals.effectiveDiscount,
              extraAmount: totals.extraAmount,
              adjustmentReason: adjustmentReason || undefined,
              isEmployeeSale,
              status: "PENDING_PAYMENT",
            });
            if (result?.serverError) throw new Error(result.serverError);
            saleIdForPix = result?.data?.saleId;
          }

          if (!saleIdForPix) throw new Error("Falha ao preparar a venda para PIX.");

          // 2. Gera o PIX dinâmico
          const pixResult = await generatePixPayment({
            companyId,
            saleId: saleIdForPix,
          });

          if (pixResult?.serverError) throw new Error(pixResult.serverError);
          if (pixResult?.data) {
            setGeneratedPix(pixResult.data);
          }
          return; // Para aqui, aguardando o webhook
        }

        const actualStatus: SaleStatus = paymentMethod === "PENDING_PAYMENT" ? "PENDING_PAYMENT" : "ACTIVE";
        const actualPaymentMethod: PaymentMethod | null = paymentMethod === "PENDING_PAYMENT" ? null : (paymentMethod as PaymentMethod);

        if (selectedItemIds.size === 0) {
          const result = await convertOrderToSaleAction({
            orderIds: comanda.orders.map(o => o.id),
            companyId,
            paymentMethod: actualPaymentMethod,
            tipAmount: totals.serviceChargeAmount,
            discountAmount: totals.effectiveDiscount,
            extraAmount: totals.extraAmount,
            adjustmentReason: adjustmentReason || undefined,
            isEmployeeSale: isEmployeeSale,
            status: actualStatus,
            dueDate: paymentMethod === "PENDING_PAYMENT" ? dueDate : undefined,
            customerId: paymentMethod === "PENDING_PAYMENT" ? selectedCustomerId : undefined,
          });
          if (result?.serverError) throw new Error(result.serverError);
        } else {
          const result = await convertItemsToSaleAction({
            itemIds: Array.from(selectedItemIds),
            companyId,
            paymentMethod: actualPaymentMethod,
            tipAmount: totals.serviceChargeAmount,
            discountAmount: totals.effectiveDiscount,
            extraAmount: totals.extraAmount,
            adjustmentReason: adjustmentReason || undefined,
            isEmployeeSale,
            status: actualStatus,
            dueDate: paymentMethod === "PENDING_PAYMENT" ? dueDate : undefined,
            customerId: paymentMethod === "PENDING_PAYMENT" ? selectedCustomerId : undefined,
          });

          if (result?.serverError) throw new Error(result.serverError);
        }

        toast.success(
          `Comanda de ${comanda.customerName} finalizada com sucesso!`,
        );
        router.refresh();
        onClose();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        toast.error(`Erro ao processar pagamento: ${message}`);
      }
    });
  };

  const handleAddItem = () => {
    if (!comanda) return;
    if (!selectedProductId) return;

    startTransition(async () => {
      try {
        const result = await upsertOrderAction({
          companyId,
          customerId: comanda.customerId,
          items: [{ productId: selectedProductId, quantity: selectedQuantity }],
          discountAmount: totals.effectiveDiscount,
          extraAmount: totals.extraAmount,
          adjustmentReason: adjustmentReason || undefined,
          isEmployeeSale,
          hasServiceTax: applyServiceCharge,
        });

        if (result?.serverError) throw new Error(result.serverError);

        toast.success("Item adicionado com sucesso!");
        setSelectedProductId("");
        setSelectedQuantity(1);
        router.refresh();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        toast.error(`Erro ao adicionar item: ${message}`);
      }
    });
  };

  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItemIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItemIds(newSelection);
  };

  const handleDeleteItem = (itemId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteOrderItemAction({
          itemId,
          companyId,
        });

        if (result?.serverError) throw new Error(result.serverError);

        toast.success("Item cancelado com sucesso!");
        router.refresh();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        toast.error(`Erro ao cancelar item: ${message}`);
      }
    });
  };

  const handleAdjustmentTypeChange = (val: string) => {
    const type = val as "discount" | "extra";
    setAdjustmentType(type);
    if (type === "discount") setExtraAmount(0);
    else setDiscountAmount(0);
  };

  return {
    // States
    isPending,
    paymentMethod,
    setPaymentMethod,
    applyServiceCharge,
    setApplyServiceCharge,
    discountAmount,
    setDiscountAmount,
    extraAmount,
    setExtraAmount,
    adjustmentReason,
    setAdjustmentReason,
    adjustmentType,
    handleAdjustmentTypeChange,
    isEmployeeSale,
    setIsEmployeeSale,
    now,
    isImageOpen,
    setIsImageOpen,
    selectedProductId,
    setSelectedProductId,
    selectedQuantity,
    setSelectedQuantity,
    selectedItemIds,
    isGrouped,
    setIsGrouped,
    selectedCustomerId,
    setSelectedCustomerId,
    dueDate,
    setDueDate,
    generatedPix,
    setGeneratedPix,

    // Computed
    totals,
    groupedItems,
    currentProduct,
    isPartial,

    // Actions
    handlePay,
    handleAddItem,
    toggleItemSelection,
    handleDeleteItem,
  };
};
