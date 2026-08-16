import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type LambOption } from "../data/schema";

type LambComboboxProps = {
  lambs: LambOption[];
  value: string | undefined;
  onChange: (lambId: string) => void;
  className?: string;
};

function lambLabel(lamb: LambOption) {
  const name = `${lamb.first_name} ${lamb.last_name}`.trim();
  return lamb.nick_name ? `${name} (${lamb.nick_name})` : name;
}

// Combobox พิมพ์ค้นหาชื่อลูกแกะแทน select ธรรมดา — lamb_id เป็น UUID ดิบๆ
// พิมพ์เองไม่ไหว และรายชื่ออาจยาวกว่า 38 คนในอนาคต ดู pattern เดียวกันที่
// features/bible/components/book-combobox.tsx (grill-me 2026-08-13)
export function LambCombobox({
  lambs,
  value,
  onChange,
  className,
}: LambComboboxProps) {
  const [open, setOpen] = useState(false);
  const activeLamb = lambs.find((l) => l.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          {activeLamb ? lambLabel(activeLamb) : "เลือกลูกแกะ"}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command
          filter={(value, search) =>
            value.includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder="ค้นหาชื่อลูกแกะ..." />
          <CommandList>
            <CommandEmpty>ไม่พบลูกแกะ</CommandEmpty>
            <CommandGroup>
              {lambs.map((lamb) => (
                <CommandItem
                  key={lamb.id}
                  value={lambLabel(lamb).toLowerCase()}
                  onSelect={() => {
                    onChange(lamb.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4",
                      lamb.id === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {lambLabel(lamb)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
