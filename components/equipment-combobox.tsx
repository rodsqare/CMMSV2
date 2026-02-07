"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Equipment {
  id: number
  nombre: string
  numeroSerie?: string
}

interface EquipmentComboboxProps {
  equipment: Equipment[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
}

export function EquipmentCombobox({
  equipment,
  value,
  onValueChange,
  placeholder = "Buscar equipo...",
  disabled = false,
  error = false,
}: EquipmentComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Find selected equipment
  const selectedEquipment = equipment.find((eq) => eq.id.toString() === value)

  // Filter equipment based on search query
  const filteredEquipment = React.useMemo(() => {
    if (!searchQuery) return equipment

    const query = searchQuery.toLowerCase()
    return equipment.filter(
      (eq) =>
        eq.nombre.toLowerCase().includes(query) || (eq.numeroSerie && eq.numeroSerie.toLowerCase().includes(query)),
    )
  }, [equipment, searchQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", !value && "text-muted-foreground", error && "border-red-500")}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedEquipment
              ? `${selectedEquipment.nombre}${selectedEquipment.numeroSerie ? ` (${selectedEquipment.numeroSerie})` : ""}`
              : "Seleccionar equipo"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={placeholder} value={searchQuery} onValueChange={setSearchQuery} />
          <CommandList>
            <CommandEmpty>No se encontró ningún equipo.</CommandEmpty>
            <CommandGroup>
              {filteredEquipment.map((eq) => (
                <CommandItem
                  key={eq.id}
                  value={eq.id.toString()}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                    setSearchQuery("")
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === eq.id.toString() ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span>{eq.nombre}</span>
                    {eq.numeroSerie && <span className="text-xs text-muted-foreground">{eq.numeroSerie}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
