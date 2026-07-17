"use client";

import { formatPhoneNumber } from "@/app/_lib/utils";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function useCustomerSession(companyId: string) {
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [customerExists, setCustomerExists] = useState(false);
  const [tempCustomerId, setTempCustomerId] = useState<string | null>(null);
  const [customerImageUrl, setCustomerImageUrl] = useState<string | null>(null);

  const loadFromStorage = useCallback(() => {
    const savedCustomer = localStorage.getItem(`kipo-customer-${companyId}`);
    if (savedCustomer) {
      try {
        const data = JSON.parse(savedCustomer);
        setCustomerName(data.name || "");
        setPhoneNumber(formatPhoneNumber(data.phoneNumber || ""));
        setIsPhoneVerified(true);
        setCustomerExists(true);
        setTempCustomerId(data.customerId || null);
        setCustomerImageUrl(data.imageUrl || null);
      } catch (e) {
        console.error("Error parsing saved customer", e);
      }
    } else {
      setCustomerName("");
      setPhoneNumber("");
      setIsPhoneVerified(false);
      setCustomerExists(false);
      setTempCustomerId(null);
      setCustomerImageUrl(null);
    }
  }, [companyId]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleCheckPhone = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (!cleanPhone) {
      toast.error("Informe o telefone primeiro.");
      return;
    }
    
    setIsCheckingPhone(true);
    try {
      const res = await fetch(`/api/customers/check?phone=${cleanPhone}&companyId=${companyId}`);
      const data = await res.json();

      setIsPhoneVerified(true);
      if (data.exists) {
        setCustomerExists(true);
        setCustomerName(data.customer.name);
        setTempCustomerId(data.customer.customerId);
        setCustomerImageUrl(data.customer.imageUrl || null);
        
        localStorage.setItem(`kipo-customer-${companyId}`, JSON.stringify(data.customer));
        toast.success(`Olá, ${data.customer.name.split(' ')[0]}!`);
        return true;
      } else {
        setCustomerExists(false);
        setCustomerName("");
        setTempCustomerId(null);
        setCustomerImageUrl(null);
        toast.info("Não encontramos seu cadastro. Por favor, informe seu nome.");
        return false;
      }
    } catch {
      toast.error("Erro ao verificar telefone.");
      return null;
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const setSessionData = useCallback((data: any) => {
    if (data) {
      setCustomerName(data.name || "");
      setPhoneNumber(formatPhoneNumber(data.phoneNumber || ""));
      setIsPhoneVerified(true);
      setCustomerExists(true);
      setTempCustomerId(data.customerId || null);
      setCustomerImageUrl(data.imageUrl || null);
      localStorage.setItem(`kipo-customer-${companyId}`, JSON.stringify(data));
    }
  }, [companyId]);

  const clearSession = useCallback(() => {
    setCustomerName("");
    setPhoneNumber("");
    setIsPhoneVerified(false);
    setCustomerExists(false);
    setTempCustomerId(null);
    setCustomerImageUrl(null);
    localStorage.removeItem(`kipo-customer-${companyId}`);
  }, [companyId]);

  return {
    customerName,
    setCustomerName,
    phoneNumber,
    setPhoneNumber,
    isPhoneVerified,
    setIsPhoneVerified,
    isCheckingPhone,
    customerExists,
    tempCustomerId,
    customerImageUrl,
    setCustomerImageUrl,
    loadFromStorage,
    handleCheckPhone,
    setSessionData,
    clearSession,
  };
}
