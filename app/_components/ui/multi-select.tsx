"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Badge } from "@/app/_components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/app/_components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

type Option = {
  id: string;
  name: string;
  color?: string | null;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({
  options = [],
  selected,
  onChange,
  placeholder = "Selecione as opções...",
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = React.useCallback(
    (optionId: string) => {
      onChange((selected || []).filter((id) => id !== optionId));
    },
    [onChange, selected],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "") {
            const newSelected = [...(selected || [])];
            newSelected.pop();
            onChange(newSelected);
          }
        }
        if (e.key === "Escape") {
          input.blur();
        }
      }
    },
    [onChange, selected],
  );

  const safeOptions = options || [];
  const safeSelected = selected || [];

  const selectables = safeOptions.filter(
    (option) => !safeSelected.includes(option.id),
  );

  return (
    <Command
      onKeyDown={handleKeyDown}
      className="overflow-visible bg-transparent"
    >
      <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {safeSelected.map((id) => {
            const option = safeOptions.find((o) => o.id === id);
            if (!option) return null;
            return (
              <Badge key={option.id} variant="secondary">
                {option.name}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(option.id);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(option.id)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            );
          })}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={safeOptions.length === 0 ? undefined : setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={
              safeOptions.length === 0
                ? "Nenhuma categoria cadastrada."
                : safeSelected.length === 0
                  ? placeholder
                  : ""
            }
            disabled={safeOptions.length === 0}
            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open && selectables.length > 0 ? (
          <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandList>
              <CommandGroup className="h-full overflow-auto">
                {selectables.map((option) => {
                  return (
                    <CommandItem
                      key={option.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={(value) => {
                        setInputValue("");
                        onChange([...safeSelected, option.id]);
                      }}
                      className={"cursor-pointer"}
                    >
                      {option.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </div>
        ) : null}
      </div>
    </Command>
  );
}
