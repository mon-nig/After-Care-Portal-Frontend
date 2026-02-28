"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface B24FormHeaderProps {
  formData: Record<string, string>
  onChange: (name: string, value: string) => void
}

export function B24FormHeader({ formData, onChange }: B24FormHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground tracking-wide">
          H 047186 &mdash; 1,000 (2016/02)
        </p>
        <p className="text-xs text-muted-foreground">
          Registration B.24 (F 2&deg; long), 9/72
        </p>
        <h1 className="text-xl font-bold text-foreground text-balance">
          Report of Death by Grama Seva Niladhari
        </h1>
        <p className="text-xs text-muted-foreground italic">
          (To be forwarded direct to the Registrar within seven days of death)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="b24GramaDivision" className="text-xs text-muted-foreground">
            Grama Seva Niladhari{"'"}s Division
          </Label>
          <Input
            id="b24GramaDivision"
            name="b24GramaDivision"
            placeholder="GN Division"
            value={formData.b24GramaDivision || ""}
            onChange={(e) => onChange("b24GramaDivision", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="b24RegistrarDivision" className="text-xs text-muted-foreground">
            Registrar{"'"}s Division
          </Label>
          <Input
            id="b24RegistrarDivision"
            name="b24RegistrarDivision"
            placeholder="Registrar's Division"
            value={formData.b24RegistrarDivision || ""}
            onChange={(e) => onChange("b24RegistrarDivision", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="b24SerialNo" className="text-xs text-muted-foreground">
            No.
          </Label>
          <Input
            id="b24SerialNo"
            name="b24SerialNo"
            placeholder="Serial No."
            value={formData.b24SerialNo || ""}
            onChange={(e) => onChange("b24SerialNo", e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
