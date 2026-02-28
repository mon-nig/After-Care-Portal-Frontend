"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SuddenDeathSectionProps {
  formData: Record<string, string>
  onChange: (name: string, value: string) => void
  visible: boolean
}

export function SuddenDeathSection({ formData, onChange, visible }: SuddenDeathSectionProps) {
  if (!visible) return null

  return (
    <fieldset className="space-y-6 rounded-lg border-2 border-dashed border-border bg-muted/30 p-5">
      <legend className="text-base font-semibold text-foreground px-2">
        If a Sudden Death &mdash; Particulars of the Inquirer into Deaths or Judicial Medical Officer
      </legend>

      <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
        Note: For a sudden death declaration, please attach the Inquirer{"'"}s Certificate
        of Death (Registration {"'"}B 18{"'"})
      </p>

      {/* (29) Identification Number */}
      <div className="space-y-2">
        <Label htmlFor="inquirerId" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(29)</span>
          Identification Number
        </Label>
        <Input
          id="inquirerId"
          name="inquirerId"
          placeholder="NIC or Passport Number"
          value={formData.inquirerId || ""}
          onChange={(e) => onChange("inquirerId", e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* (30) Name */}
      <div className="space-y-2">
        <Label htmlFor="inquirerName" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(30)</span>
          Name
        </Label>
        <Input
          id="inquirerName"
          name="inquirerName"
          placeholder="Full name"
          value={formData.inquirerName || ""}
          onChange={(e) => onChange("inquirerName", e.target.value)}
        />
      </div>

      {/* (31) Postal Address */}
      <div className="space-y-2">
        <Label htmlFor="inquirerAddress" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(31)</span>
          Postal Address
        </Label>
        <Input
          id="inquirerAddress"
          name="inquirerAddress"
          placeholder="Full postal address"
          value={formData.inquirerAddress || ""}
          onChange={(e) => onChange("inquirerAddress", e.target.value)}
        />
      </div>
    </fieldset>
  )
}
