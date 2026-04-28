import { describe, it, expect } from "vitest";
import { OrderStatus } from "@prisma/client";
import { getDerivedStatus, isUrgent } from "@/app/(protected)/kds/_hooks/kds-engine";
import { KDSOrderDto } from "@/app/_data-access/order/get-kds-orders";

// --- FACTORIES LOCAIS ---
const createItemMock = (id: string, envId: string, status: OrderStatus) => ({
  id,
  productId: `p-${id}`,
  productName: `Product ${id}`,
  quantity: 1,
  status,
  environmentId: envId,
  environmentName: `Station ${envId}`,
  notes: null,
});

const createOrderMock = (id: string, items: any[]): KDSOrderDto => ({
  id,
  orderNumber: 100,
  status: OrderStatus.PENDING,
  createdAt: new Date(),
  tableNumber: "10",
  notes: null,
  items,
});

// --- SUÍTE DE TESTES ---
describe("KDS Engine - Unit Tests", () => {
  
  describe("getDerivedStatus", () => {
    
    it("Scenario A (Progress Logic): should return PREPARING if at least one item is PREPARING and another is PENDING", () => {
      const order = createOrderMock("ord-1", [
        createItemMock("it-1", "cozinha", OrderStatus.PENDING),
        createItemMock("it-2", "cozinha", OrderStatus.PREPARING),
      ]);

      // Na visão da Cozinha
      const status = getDerivedStatus(order, "cozinha");
      expect(status).toBe(OrderStatus.PREPARING);
    });

    it("Scenario B (Station Completion): should return READY if all items for the active station are READY", () => {
      const order = createOrderMock("ord-2", [
        createItemMock("it-1", "cozinha", OrderStatus.READY),
        createItemMock("it-2", "bar", OrderStatus.PENDING), // Outra praça ainda pendente
      ]);

      // Na visão da Cozinha, o card deve estar pronto
      const statusCozinha = getDerivedStatus(order, "cozinha");
      expect(statusCozinha).toBe(OrderStatus.READY);

      // Na visão do Bar, o card ainda deve estar pendente
      const statusBar = getDerivedStatus(order, "bar");
      expect(statusBar).toBe(OrderStatus.PENDING);
    });

    it("Scenario C (Expedition Mode): should only return READY if 100% of items from ALL stations are READY", () => {
      const order = createOrderMock("ord-3", [
        createItemMock("it-1", "cozinha", OrderStatus.READY),
        createItemMock("it-2", "bar", OrderStatus.PENDING),
      ]);

      // No modo Expedição ("all")
      const status = getDerivedStatus(order, "all");
      
      // Deve ser PREPARING (ou PENDING dependendo se algum começou), 
      // mas definitivamente NÃO PODE ser READY enquanto houver um item pendente.
      expect(status).not.toBe(OrderStatus.READY);
      expect(status).toBe(OrderStatus.PREPARING);
    });

    it("Scenario C.1 (Expedition Success): should return READY in 'all' view when every single item is DONE", () => {
      const order = createOrderMock("ord-4", [
        createItemMock("it-1", "cozinha", OrderStatus.READY),
        createItemMock("it-2", "bar", OrderStatus.DELIVERED), // Entregue também conta como pronto para a expedição
      ]);

      const status = getDerivedStatus(order, "all");
      expect(status).toBe(OrderStatus.READY);
    });
  });

  describe("isUrgent (SLA Calculation)", () => {
    const now = new Date("2024-01-01T12:00:00Z");

    it("Scenario D.1: should return false if order was created 10 minutes ago", () => {
      const tenMinsAgo = new Date("2024-01-01T11:50:00Z");
      expect(isUrgent(tenMinsAgo, now)).toBe(false);
    });

    it("Scenario D.2: should return true if order was created 35 minutes ago", () => {
      const thirtyFiveMinsAgo = new Date("2024-01-01T11:25:00Z");
      expect(isUrgent(thirtyFiveMinsAgo, now)).toBe(true);
    });

    it("Scenario D.3: should respect custom SLA limits", () => {
      const fifteenMinsAgo = new Date("2024-01-01T11:45:00Z");
      // Com SLA de 10 min, 15 min já é urgente
      expect(isUrgent(fifteenMinsAgo, now, 10)).toBe(true);
    });
  });
});
