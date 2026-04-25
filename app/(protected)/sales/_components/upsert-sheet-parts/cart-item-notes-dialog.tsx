"use client";

import { useState } from "react";
import { StickyNoteIcon, MessageSquareQuoteIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { Textarea } from "@/app/_components/ui/textarea";

interface CartItemNotesDialogProps {
  notes?: string;
  onSave: (notes: string) => void;
  isReadOnly?: boolean;
}

export const CartItemNotesDialog = ({
  notes = "",
  onSave,
  isReadOnly = false,
}: CartItemNotesDialogProps) => {
  const [currentNotes, setCurrentNotes] = useState(notes);

  const handleSave = () => {
    onSave(currentNotes);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          disabled={isReadOnly}
          className={`h-8 w-8 rounded-lg transition-all ${
            notes 
              ? "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {notes ? (
            <MessageSquareQuoteIcon size={14} className="animate-in fade-in zoom-in" />
          ) : (
            <StickyNoteIcon size={14} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 shadow-2xl" align="end">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase italic tracking-tighter text-foreground">
              Observações do Item
            </h4>
            <p className="text-[10px] font-medium text-muted-foreground">
              Ex: Sem cebola, Ponto da carne, etc.
            </p>
          </div>
          <Textarea
            placeholder="Digite as observações..."
            value={currentNotes}
            onChange={(e) => setCurrentNotes(e.target.value)}
            className="min-h-[80px] resize-none text-xs font-bold"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSave}
              className="h-8 px-4 text-[10px] font-black uppercase tracking-tight"
            >
              Salvar Nota
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
