"use client";

import { updateCustomerSelfie } from "@/app/_actions/customer/update-customer-selfie";
import { useState } from "react";
import { toast } from "sonner";

interface UseSelfieUploadProps {
  companyId: string;
  companySlug: string;
  tempCustomerId: string | null;
  onUploadSuccess: (url: string) => void;
}

export function useSelfieUpload({
  companyId,
  companySlug,
  tempCustomerId,
  onUploadSuccess,
}: UseSelfieUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleSelfieCapture = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: "image/jpeg" });
      
      const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&category=customers&companySlug=${companySlug}&v=${Date.now()}`, {
        method: "POST",
        body: file,
      });
      
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      if (tempCustomerId) {
        await updateCustomerSelfie(tempCustomerId, url);
        
        const saved = localStorage.getItem(`kipo-customer-${companyId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          localStorage.setItem(`kipo-customer-${companyId}`, JSON.stringify({ ...parsed, imageUrl: url }));
        }
      }

      toast.success("Selfie salva com sucesso!");
      onUploadSuccess(url);
    } catch (error) {
      toast.error("Erro ao processar selfie.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    handleSelfieCapture,
  };
}
