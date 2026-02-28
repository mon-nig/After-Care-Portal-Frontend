"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface DeclarationSectionProps {
  formData: Record<string, string>
  onChange: (name: string, value: string) => void
}

export function DeclarationSection({ formData, onChange }: DeclarationSectionProps) {
  return (
    <fieldset className="space-y-6">
      <legend className="text-base font-semibold text-foreground border-b border-border pb-2 w-full">
        Declaration
      </legend>

      <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-5">
        <p className="text-sm text-foreground leading-relaxed font-medium">
          I do hereby declare the above to be a true and correct statement.
        </p>

        <div className="flex items-start gap-3">
          <Checkbox
            id="declarationConfirm"
            checked={formData.declarationConfirmed === "true"}
            onCheckedChange={(checked) =>
              onChange("declarationConfirmed", checked ? "true" : "false")
            }
            className="mt-0.5"
          />
          <Label htmlFor="declarationConfirm" className="font-normal cursor-pointer text-sm leading-relaxed">
            I confirm that all the information provided in this declaration is true and
            correct to the best of my knowledge.
          </Label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="declarationDate" className="text-xs text-muted-foreground">
              Date
            </Label>
            <Input
              id="declarationDate"
              name="declarationDate"
              type="date"
              value={formData.declarationDate || ""}
              onChange={(e) => onChange("declarationDate", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="informantSignatureName" className="text-xs text-muted-foreground">
              Name of Informant (Signature)
            </Label>
            <Input
              id="informantSignatureName"
              name="informantSignatureName"
              placeholder="Full name"
              value={formData.informantSignatureName || ""}
              onChange={(e) => onChange("informantSignatureName", e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="informantSignatureAddress" className="text-xs text-muted-foreground">
            Address
          </Label>
          <Input
            id="informantSignatureAddress"
            name="informantSignatureAddress"
            placeholder="Address of informant"
            value={formData.informantSignatureAddress || ""}
            onChange={(e) => onChange("informantSignatureAddress", e.target.value)}
          />
        </div>
      </div>
    </fieldset>
  )
}
