"use client";

import { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, Check, User, ShieldCheck } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { cn } from "@/app/_lib/utils";

interface SelfieCameraProps {
  onCapture: (blob: Blob) => void;
}

export function SelfieCamera({ onCapture }: SelfieCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Efeito para vincular o stream ao elemento de vídeo assim que ele for renderizado
  useEffect(() => {
    if (hasStarted && stream && videoRef.current) {
      console.log("Binding stream to video element");
      videoRef.current.srcObject = stream;
    }
  }, [hasStarted, stream]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 720 }
        },
        audio: false,
      });
      
      setStream(mediaStream);
      setHasStarted(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões do seu navegador.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Flash Effect
    setIsFlashActive(true);
    
    // Pequeno delay para o flash ser visível e a câmera ajustar a exposição
    await new Promise((resolve) => setTimeout(resolve, 200));

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Usar um tamanho quadrado para a selfie
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = 600;
    canvas.height = 600;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Limpar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Espelhar a imagem pois a câmera frontal é espelhada no preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      
      // Desenhar o frame cortado para quadrado
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;
      
      ctx.drawImage(video, startX, startY, size, size, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setCapturedImage(dataUrl);
    }

    setIsFlashActive(false);
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;
    
    // Convert base64 to blob
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => onCapture(blob));
  };

  const retake = () => {
    setCapturedImage(null);
  };

  if (!hasStarted && !error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 bg-slate-50/50 rounded-[3rem] border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="p-5 rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
          <ShieldCheck size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Segurança & Identificação</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-[240px] mx-auto font-medium">
            Para garantir a entrega correta e sua segurança, precisamos de uma foto rápida para identificação visual.
          </p>
        </div>
        <Button 
          onClick={startCamera} 
          disabled={isLoading}
          className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
        >
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "ENTENDI, TIRAR FOTO"}
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-6 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
        <div className="p-5 rounded-full bg-rose-50 text-rose-500">
          <Camera size={40} />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Acesso Negado</p>
          <p className="text-xs text-gray-500 leading-relaxed max-w-[200px] mx-auto">{error}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()} className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-black text-gray-900 tracking-tight">
          {capturedImage ? "Ficou boa?" : "Posicione seu rosto"}
        </h3>
        <p className="text-xs text-gray-500 font-medium">
          {capturedImage ? "Confirme ou tente novamente" : "Garanta que o local esteja iluminado"}
        </p>
      </div>

      <div className="relative w-full aspect-square max-w-[320px] mx-auto overflow-hidden rounded-[3rem] bg-black shadow-2xl ring-8 ring-white">
        {/* Flash Overlay */}
        <div 
          className={cn(
            "absolute inset-0 z-50 bg-white transition-opacity duration-150 pointer-events-none",
            isFlashActive ? "opacity-100" : "opacity-0"
          )} 
        />

        {capturedImage ? (
          <div className="relative h-full w-full group">
            <img src={capturedImage} alt="Selfie" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : (
          <div className="relative h-full w-full">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 z-10">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Iniciando câmera...</span>
              </div>
            )}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="h-full w-full object-cover scale-x-[-1]" 
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Guide Overlay */}
            {!isLoading && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[70%] h-[70%] rounded-full border-2 border-white/30 border-dashed" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        {capturedImage ? (
          <div className="flex gap-3 w-full max-w-[320px]">
            <Button 
              variant="outline" 
              onClick={retake}
              className="flex-1 h-14 rounded-2xl border-gray-200 text-gray-600 font-black text-xs uppercase tracking-widest hover:bg-gray-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refazer
            </Button>
            <Button 
              onClick={confirmPhoto}
              className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200"
            >
              <Check className="mr-2 h-4 w-4" />
              Confirmar
            </Button>
          </div>
        ) : (
          <button 
            onClick={takePhoto}
            disabled={isLoading}
            className="h-24 w-24 rounded-full border-8 border-gray-100 bg-white shadow-2xl flex items-center justify-center active:scale-90 transition-all hover:border-primary/10 group disabled:opacity-50"
          >
            <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <Camera size={24} />
            </div>
          </button>
        )}
        
        {!capturedImage && !isLoading && (
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 animate-pulse">
            Toque para capturar
          </span>
        )}
      </div>
    </div>
  );
}
