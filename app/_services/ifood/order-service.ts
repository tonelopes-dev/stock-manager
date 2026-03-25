import { db } from "@/app/_lib/prisma";
import { OrderSource, OrderStatus } from "@prisma/client";
import { IfoodAuthService } from "./auth-service";
import { BusinessError } from "@/app/_lib/errors";
import { notifyKDS } from "@/app/api/kds/events/route";

export interface IfoodEvent {
  id: string;
  code: string;
  fullCode: string;
  orderId: string;
  merchantId: string;
  createdAt: string;
  metadata?: any;
}

interface IfoodOrderDetail {
  id: string;
  displayId: string;
  createdAt: string;
  orderType: string;
  total: {
    subTotal: number;
    deliveryFee: number;
    benefits: number;
    orderAmount: number;
  };
  items: IfoodOrderItem[];
  customer: {
    id: string;
    name: string;
    phone?: {
      number: string;
    };
  };
  delivery?: {
    deliveryAddress: {
      formattedAddress: string;
      streetName: string;
      streetNumber: string;
      neighborhood: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
}

interface IfoodOrderItem {
  id: string;
  name: string;
  externalId?: string;
  quantity: number;
  unitPrice: number;
  options?: IfoodOrderItem[]; // Recursive structure for modifiers
}

export class IfoodOrderService {
  private static API_BASE_URL = "https://merchant-api.ifood.com.br/order/v1.0/orders";

  static async processIfoodOrder(event: IfoodEvent) {
    if (event.fullCode === "PLACED" || event.code === "PLC") {
      await this.handleNewOrder(event);
    } else {
      console.log(`[iFood] Evento ${event.fullCode || event.code} recebido, ignorado por enquanto.`);
    }
  }

  /**
   * Fetches full order details from iFood API.
   */
  private static async getOrderDetails(orderId: string, companyId: string): Promise<IfoodOrderDetail> {
    const accessToken = await IfoodAuthService.getAccessToken(companyId);
    
    const response = await fetch(`${this.API_BASE_URL}/${orderId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new BusinessError(`Falha ao buscar detalhes do pedido ${orderId} no iFood.`);
    }

    return response.json();
  }

  /**
   * Handles the 'PLACED' event: fetch details, persist to DB, and notify KDS.
   */
  private static async handleNewOrder(event: IfoodEvent) {
    // 1. Initial validation
    const company = await db.company.findFirst({
      where: { ifoodMerchantId: event.merchantId },
      select: { id: true },
    });

    if (!company) {
      console.error(`[iFood] Empresa não encontrada para merchantId: ${event.merchantId}`);
      return;
    }

    const existingOrder = await db.order.findUnique({
      where: { ifoodOrderId: event.orderId },
    });

    if (existingOrder) return;

    // 2. Fetch full details
    const details = await this.getOrderDetails(event.orderId, company.id);

    // 3. Persist in Transaction
    try {
      const order = await db.$transaction(async (trx) => {
        // A. Upsert Customer (Linked to IFOOD)
        let customer = await trx.customer.findFirst({
          where: {
            OR: [
              { phone: details.customer.phone?.number || "NO_PHONE" },
              { name: details.customer.name } // Fallback generic match
            ]
          }
        });

        if (!customer) {
          customer = await trx.customer.create({
            data: {
              name: details.customer.name,
              phone: details.customer.phone?.number || "",
              companyId: company.id,
              // source: 'IFOOD' // Add this field to Customer if needed, for now logic focus on Order
            }
          });
        }

        // B. Create the Order
        const newOrder = await trx.order.create({
          data: {
            companyId: company.id,
            customerId: customer.id,
            source: OrderSource.IFOOD,
            ifoodOrderId: details.id,
            ifoodDisplayId: details.displayId,
            totalAmount: details.total.orderAmount,
            deliveryFee: details.total.deliveryFee,
            deliveryAddress: (details.delivery?.deliveryAddress as any) || null,
            status: OrderStatus.PENDING,
            notes: `iFood Delivery - #${details.displayId}`,
          }
        });

        // C. Process Items and Modifiers
        // Pega o primeiro produto da empresa para servir de fallback seguro (evita erro P2003)
        const fallbackProduct = await trx.product.findFirst({
          where: { companyId: company.id }
        });

        if (!fallbackProduct) {
          throw new BusinessError("Nenhum produto cadastrado. Crie pelo menos um produto para receber pedidos.");
        }

        for (const item of details.items) {
          // Find matching product
          const product = await trx.product.findFirst({
            where: {
              companyId: company.id,
              OR: [
                { ifoodId: item.id },
                { ifoodExternalId: item.externalId },
                { name: { contains: item.name, mode: 'insensitive' } }
              ]
            }
          });

          const parentProductId = product?.id || fallbackProduct.id;
          const itemNotes = !product ? `[Item iFood não mapeado: ${item.name}]` : undefined;

          // Create Parent Item
          const parentItem = await trx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: parentProductId, 
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              isModifier: false,
              notes: itemNotes,
            }
          });

          // Create Sub-items (Modifiers/Options)
          if (item.options && item.options.length > 0) {
            for (const option of item.options) {
              const modifierProduct = await trx.product.findFirst({
                where: {
                  companyId: company.id,
                  OR: [
                    { ifoodId: option.id },
                    { name: { contains: option.name, mode: 'insensitive' } }
                  ]
                }
              });

              const modProductId = modifierProduct?.id || fallbackProduct.id;
              const modNotes = !modifierProduct ? `[Adicional não mapeado: ${option.name}]` : undefined;

              await trx.orderItem.create({
                data: {
                  orderId: newOrder.id,
                  productId: modProductId,
                  quantity: option.quantity,
                  unitPrice: option.unitPrice,
                  isModifier: true,
                  parentItemId: parentItem.id,
                  notes: modNotes,
                }
              });
            }
          }
        }

        return newOrder;
      });

      // Notify clients (Notification Bell & Sales Kanban)
      const { notifyKDS } = await import("@/app/api/kds/events/route");
      notifyKDS(company.id, { 
        type: "NEW_ORDER", 
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId 
      });

      console.log(`[iFood] Pedido ${details.displayId} salvo.`);

    } catch (error) {
      console.error(`[iFood] Erro ao persistir pedido ${event.orderId}:`, error);
      // We don't throw here to avoid failing the whole batch in the webhook, 
      // but the event won't be acknowledged if we handle error in webhook route.
      throw error; 
    }
  }

  /**
   * Confirms an order on iFood.
   */
  static async confirmOrder(orderId: string, companyId: string) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { ifoodOrderId: true, orderNumber: true }
    });

    if (!order?.ifoodOrderId) {
      console.warn(`[iFood] Tentativa de confirmar pedido ${orderId} sem ID do iFood.`);
      return;
    }

    const accessToken = await IfoodAuthService.getAccessToken(companyId);

    try {
      const response = await fetch(`${this.API_BASE_URL}/${order.ifoodOrderId}/confirm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[iFood] Erro ao confirmar pedido ${order.ifoodOrderId}: ${errorText}`);
        throw new BusinessError("Falha ao sincronizar confirmação com o iFood.");
      }

      console.log(`[iFood] Pedido ${order.ifoodOrderId} confirmado com sucesso.`);
    } catch (error: any) {
      console.error(`[iFood] Erro ao confirmar pedido ${orderId}:`, error);
      throw new BusinessError(error.message || "Erro ao confirmar pedido no iFood.");
    }
  }

  /**
   * Dispatches an order on iFood (Saiu para entrega)
   */
  static async dispatchOrder(orderId: string, companyId: string) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { ifoodOrderId: true }
    });

    if (!order?.ifoodOrderId) {
      console.warn(`[iFood] Tentativa de despachar pedido ${orderId} sem ID do iFood.`);
      return;
    }

    const accessToken = await IfoodAuthService.getAccessToken(companyId);

    try {
      const response = await fetch(`${this.API_BASE_URL}/${order.ifoodOrderId}/dispatch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[iFood] Erro ao despachar pedido ${order.ifoodOrderId}: ${errorText}`);
        throw new BusinessError("Falha ao sincronizar despacho com o iFood.");
      }

      console.log(`[iFood] Pedido ${order.ifoodOrderId} despachado com sucesso.`);
    } catch (error: any) {
      console.error(`[iFood] Erro ao despachar pedido ${orderId}:`, error);
      throw new BusinessError(error.message || "Erro ao despachar pedido no iFood.");
    }
  }
}
