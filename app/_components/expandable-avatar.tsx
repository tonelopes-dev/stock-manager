"use client";

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/app/_components/ui/dialog";
import { cn } from "@/app/_lib/utils";
import { User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ExpandableAvatarProps {
  imageUrl?: string | null;
  name?: string;
  className?: string;
  iconSize?: number;
}

export const ExpandableAvatar = ({
  imageUrl,
  name = "Avatar",
  className,
  iconSize = 18,
}: ExpandableAvatarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div
          onClick={(e) => {
            if (imageUrl) {
              e.stopPropagation();
            }
          }}
          className={cn(
            "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary transition-all shadow-sm border border-primary/20 hover:border-primary/40",
            imageUrl && "cursor-pointer hover:scale-105 active:scale-95 hover:shadow-md",
            className
          )}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
            />
          ) : (
            <User size={iconSize} className="text-primary/70" />
          )}
        </div>
      </DialogTrigger>
      {imageUrl && (
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          className="border-none bg-transparent p-0 shadow-none sm:max-w-[400px]"
        >
          <DialogTitle className="sr-only">Foto de {name}</DialogTitle>
          <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] bg-background shadow-2xl border border-border">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
            />
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
