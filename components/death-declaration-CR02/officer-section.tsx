"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface OfficerSectionProps {
  formData: Record<string, string>
  onChange: (name: string, value: string) => void
}

export function OfficerSection({ formData, onChange }: OfficerSectionProps) {
  return (
    <fieldset className="space-y-6">
      <legend className="text-base font-semibold text-foreground border-b border-border pb-2 w-full">
        Details of the Notifying Officer / Registrar
      </legend>

      {/* (32) Identification Number */}
      <div className="space-y-2">
        <Label htmlFor="officerId" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(32)</span>
          Identification Number
        </Label>
        <Input
          id="officerId"
          name="officerId"
          placeholder="NIC or Passport Number"
          value={formData.officerId || ""}
          onChange={(e) => onChange("officerId", e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* (33) Name */}
      <div className="space-y-2">
        <Label htmlFor="officerName" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(33)</span>
          Name
        </Label>
        <Input
          id="officerName"
          name="officerName"
          placeholder="Full name of the officer"
          value={formData.officerName || ""}
          onChange={(e) => onChange("officerName", e.target.value)}
        />
      </div>

      {/* (34) Postal Address */}
      <div className="space-y-2">
        <Label htmlFor="officerAddress" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(34)</span>
          Postal Address
        </Label>
        <Input
          id="officerAddress"
          name="officerAddress"
          placeholder="Full postal address"
          value={formData.officerAddress || ""}
          onChange={(e) => onChange("officerAddress", e.target.value)}
        />
      </div>

      {/* Forwarding declaration */}
      <div className="rounded-lg bg-muted/50 p-4 space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          I hereby forward the {"'"}Declaration of Death{"'"} form received from the
          informant for registration in the Civil Registration System.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="officerDivision" className="text-xs text-muted-foreground">
              Division
            </Label>
            <Input
              id="officerDivision"
              name="officerDivision"
              placeholder="Division"
              value={formData.officerDivision || ""}
              onChange={(e) => onChange("officerDivision", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="officerDate" className="text-xs text-muted-foreground">
              Date
            </Label>
            <Input
              id="officerDate"
              name="officerDate"
              type="date"
              value={formData.officerDate || ""}
              onChange={(e) => onChange("officerDate", e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground italic">
          Name, Division, Signature, Date & Official Seal of the Officer / Registrar
        </p>
      </div>
    </fieldset>
  )
}
