"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface InformantSectionProps {
  formData: Record<string, string>
  onChange: (name: string, value: string) => void
}

export function InformantSection({ formData, onChange }: InformantSectionProps) {
  return (
    <fieldset className="space-y-6">
      <legend className="text-base font-semibold text-foreground border-b border-border pb-2 w-full">
        Details of the Informant
      </legend>

      {/* (24) Capacity for giving information */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(24)</span>
          Capacity for giving information (relationship to deceased)
        </Label>
        <RadioGroup
          value={formData.informantCapacity || ""}
          onValueChange={(val) => onChange("informantCapacity", val)}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="husband_wife" id="husbandWife" />
            <Label htmlFor="husbandWife" className="font-normal cursor-pointer">
              Husband / Wife
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="father_mother" id="fatherMother" />
            <Label htmlFor="fatherMother" className="font-normal cursor-pointer">
              Father / Mother
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="son_daughter" id="sonDaughter" />
            <Label htmlFor="sonDaughter" className="font-normal cursor-pointer">
              Son / Daughter
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="brother_sister" id="brotherSister" />
            <Label htmlFor="brotherSister" className="font-normal cursor-pointer">
              Brother / Sister
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="relative" id="relative" />
            <Label htmlFor="relative" className="font-normal cursor-pointer">
              Relative
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="other" id="otherRelation" />
            <Label htmlFor="otherRelation" className="font-normal cursor-pointer">
              Other
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* (25) Identification Number */}
      <div className="space-y-2">
        <Label htmlFor="informantId" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(25)</span>
          Identification Number (NIC / Passport)
        </Label>
        <Input
          id="informantId"
          name="informantId"
          placeholder="NIC or Passport Number"
          value={formData.informantId || ""}
          onChange={(e) => onChange("informantId", e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* (26) Name */}
      <div className="space-y-2">
        <Label htmlFor="informantName" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(26)</span>
          Name
        </Label>
        <Input
          id="informantName"
          name="informantName"
          placeholder="Full name of the informant"
          value={formData.informantName || ""}
          onChange={(e) => onChange("informantName", e.target.value)}
        />
      </div>

      {/* (27) Postal Address */}
      <div className="space-y-2">
        <Label htmlFor="informantAddress" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(27)</span>
          Postal Address
        </Label>
        <Input
          id="informantAddress"
          name="informantAddress"
          placeholder="Full postal address"
          value={formData.informantAddress || ""}
          onChange={(e) => onChange("informantAddress", e.target.value)}
        />
      </div>

      {/* (28) Contact Details */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(28)</span>
          Contact Details
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="informantPhone" className="text-xs text-muted-foreground">
              Telephone
            </Label>
            <Input
              id="informantPhone"
              name="informantPhone"
              type="tel"
              placeholder="Phone number"
              value={formData.informantPhone || ""}
              onChange={(e) => onChange("informantPhone", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="informantEmail" className="text-xs text-muted-foreground">
              Email
            </Label>
            <Input
              id="informantEmail"
              name="informantEmail"
              type="email"
              placeholder="Email address"
              value={formData.informantEmail || ""}
              onChange={(e) => onChange("informantEmail", e.target.value)}
            />
          </div>
        </div>
      </div>
    </fieldset>
  )
}
