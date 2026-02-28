"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface CertificationSectionProps {
  formData: Record<string, string>
  onChange: (name: string, value: string) => void
}

export function CertificationSection({ formData, onChange }: CertificationSectionProps) {
  return (
    <fieldset className="space-y-6">
      <legend className="text-base font-semibold text-foreground border-b border-border pb-2 w-full">
        Grama Seva Niladhari{"'"}s Certification
      </legend>

      {/* Certification statement */}
      <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-foreground leading-relaxed">
        <p>
          I certify that the above statement contains the true particulars of a death
          which occurred in my division and I report the same to the Registrar of the
          relevant division.
        </p>
      </div>

      {/* Registrar to whom reported */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="b24RegistrarName" className="text-xs text-muted-foreground">
          Registrar to whom reported
        </Label>
        <Input
          id="b24RegistrarName"
          name="b24RegistrarName"
          placeholder="Name of the Registrar"
          value={formData.b24RegistrarName || ""}
          onChange={(e) => onChange("b24RegistrarName", e.target.value)}
        />
      </div>

      {/* Signed at, date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="b24SignedAt" className="text-xs text-muted-foreground">
            Signed at
          </Label>
          <Input
            id="b24SignedAt"
            name="b24SignedAt"
            placeholder="Place of signing"
            value={formData.b24SignedAt || ""}
            onChange={(e) => onChange("b24SignedAt", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="b24SignDate" className="text-xs text-muted-foreground">
            Date
          </Label>
          <Input
            id="b24SignDate"
            name="b24SignDate"
            type="date"
            value={formData.b24SignDate || ""}
            onChange={(e) => onChange("b24SignDate", e.target.value)}
          />
        </div>
      </div>

      {/* Signature */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="b24GNSignature" className="text-sm font-medium">
          Signature of Grama Seva Niladhari
        </Label>
        <Input
          id="b24GNSignature"
          name="b24GNSignature"
          placeholder="Full name as signature"
          value={formData.b24GNSignature || ""}
          onChange={(e) => onChange("b24GNSignature", e.target.value)}
        />
      </div>

      {/* Confirmation checkbox */}
      <div className="flex items-start gap-2 pt-2">
        <Checkbox
          id="b24Confirmed"
          checked={formData.b24Confirmed === "true"}
          onCheckedChange={(checked) =>
            onChange("b24Confirmed", checked ? "true" : "false")
          }
        />
        <Label
          htmlFor="b24Confirmed"
          className="text-sm font-normal leading-relaxed cursor-pointer"
        >
          I certify that the above statement contains the true particulars of the death
          and I am reporting the same to the Registrar within seven days of the death as required.
        </Label>
      </div>
    </fieldset>
  )
}
