"use client";

import { Bell, Clock, X, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { format, setHours, setMinutes, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/app/_components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { cn } from "@/app/_lib/utils";

interface ExpirationReminderProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

export const ExpirationReminder = ({
  value,
  onChange,
  placeholder = "Selecione uma data",
}: ExpirationReminderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined,
  );
  const [selectedTime, setSelectedTime] = useState(
    value ? format(new Date(value), "HH:mm") : "12:00",
  );

  const handleSave = () => {
    if (!selectedDate) {
      onChange(null);
      setIsOpen(false);
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const finalDate = setMinutes(setHours(selectedDate, hours), minutes);
    onChange(finalDate);
    setIsOpen(false);
  };

  const handleRemove = () => {
    onChange(null);
    setSelectedDate(undefined);
    setIsOpen(false);
  };

  const hasReminder = !!value;
  const isOverdue = value && isPast(new Date(value));

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal transition-all duration-300",
            !value && "text-muted-foreground",
            hasReminder && "border-emerald-500/50 bg-emerald-500/5 text-emerald-600 font-bold hover:bg-emerald-500/10 hover:text-emerald-700",
            isOverdue && "border-destructive/50 bg-destructive/5 text-destructive animate-pulse"
          )}
        >
          <CalendarIcon className={cn(
            "mr-2 h-4 w-4 opacity-50",
            hasReminder && "text-emerald-500 opacity-100",
            isOverdue && "text-destructive opacity-100"
          )} />
          {value ? (
            format(value, "PPP 'às' HH:mm", { locale: ptBR })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-64 rounded-xl border-none p-4 shadow-2xl"
        align="start"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-xs font-black uppercase italic tracking-tighter">
                Lembrete de Validade
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              Data do Alerta
            </label>
            <DatePicker value={selectedDate} onChange={setSelectedDate} />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              Horário
            </label>
            <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <input
                type="time"
                className="flex-1 bg-transparent text-xs outline-none"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {hasReminder && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 flex-1 text-[10px] font-bold uppercase text-destructive hover:bg-destructive/10"
                onClick={handleRemove}
              >
                Remover
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="h-8 flex-1 text-[10px] font-bold uppercase hover:bg-primary/90"
              onClick={handleSave}
              disabled={!selectedDate}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
