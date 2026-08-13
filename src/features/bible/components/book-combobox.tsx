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
import { type BibleBookMeta } from "../data/types";

type BookComboboxProps = {
  books: BibleBookMeta[];
  bookNumber: number;
  onChange: (bookNumber: number) => void;
  className?: string;
};

// Combobox พิมพ์ค้นหาหนังสือ (ชื่อไทย + เลขหนังสือ) แทน Select เดิม — เลื่อนหา
// ใน list 66 เล่มช้ากว่าพิมพ์ค้นหาตรงๆ (ดู grill-me 2026-08-13)
export function BookCombobox({
  books,
  bookNumber,
  onChange,
  className,
}: BookComboboxProps) {
  const [open, setOpen] = useState(false);
  const activeBook = books.find((b) => b.number === bookNumber);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-56 justify-between font-normal", className)}
        >
          {activeBook ? `${activeBook.number}. ${activeBook.nameTh}` : "เลือกหนังสือ"}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command
          filter={(value, search) => {
            // value = "{number} {nameTh}" ดู CommandItem ด้านล่าง — cmdk filter
            // เทียบกับ value ตรงๆ อยู่แล้วแบบ case-insensitive substring
            return value.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="ค้นหาชื่อหนังสือ หรือเลขหนังสือ..." />
          <CommandList>
            <CommandEmpty>ไม่พบหนังสือ</CommandEmpty>
            <CommandGroup>
              {books.map((book) => (
                <CommandItem
                  key={book.number}
                  value={`${book.number} ${book.nameTh}`.toLowerCase()}
                  onSelect={() => {
                    onChange(book.number);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4",
                      book.number === bookNumber ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {book.number}. {book.nameTh}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
