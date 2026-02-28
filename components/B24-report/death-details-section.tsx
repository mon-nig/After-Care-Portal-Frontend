"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface DeathDetailsSectionProps {
  formData: Record<string, string>
  onChange: (name: string, value: string) => void
}

export function DeathDetailsSection({ formData, onChange }: DeathDetailsSectionProps) {
  return (
    <fieldset className="space-y-6">
      <legend className="text-base font-semibold text-foreground border-b border-border pb-2 w-full">
        Particulars of the Deceased
      </legend>

      {/* (1) Date and Place of Death */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">1.</span>
          Date and Place of Death
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b24DeathYear" className="text-xs text-muted-foreground">
              Year
            </Label>
            <Input
              id="b24DeathYear"
              name="b24DeathYear"
              type="number"
              placeholder="YYYY"
              value={formData.b24DeathYear || ""}
              onChange={(e) => onChange("b24DeathYear", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b24DeathMonth" className="text-xs text-muted-foreground">
              Month
            </Label>
            <Input
              id="b24DeathMonth"
              name="b24DeathMonth"
              type="number"
              placeholder="MM"
              min={1}
              max={12}
              value={formData.b24DeathMonth || ""}
              onChange={(e) => onChange("b24DeathMonth", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b24DeathDay" className="text-xs text-muted-foreground">
              Day
            </Label>
            <Input
              id="b24DeathDay"
              name="b24DeathDay"
              type="number"
              placeholder="DD"
              min={1}
              max={31}
              value={formData.b24DeathDay || ""}
              onChange={(e) => onChange("b24DeathDay", e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="b24PlaceOfDeath" className="text-xs text-muted-foreground">
            Place of death
          </Label>
          <Input
            id="b24PlaceOfDeath"
            name="b24PlaceOfDeath"
            placeholder="Place of death"
            value={formData.b24PlaceOfDeath || ""}
            onChange={(e) => onChange("b24PlaceOfDeath", e.target.value)}
          />
        </div>
      </div>

      {/* (2) Full Name */}
      <div className="space-y-2">
        <Label htmlFor="b24FullName" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">2.</span>
          Full Name
        </Label>
        <Input
          id="b24FullName"
          name="b24FullName"
          placeholder="Full name of the deceased"
          value={formData.b24FullName || ""}
          onChange={(e) => onChange("b24FullName", e.target.value)}
        />
      </div>

      {/* (3) Sex and Race */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">3.</span>
          Sex and Race *
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Sex</Label>
            <RadioGroup
              value={formData.b24Sex || ""}
              onValueChange={(val) => onChange("b24Sex", val)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="male" id="b24Male" />
                <Label htmlFor="b24Male" className="font-normal cursor-pointer">
                  Male
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="female" id="b24Female" />
                <Label htmlFor="b24Female" className="font-normal cursor-pointer">
                  Female
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b24Race" className="text-xs text-muted-foreground">
              Race
            </Label>
            <Input
              id="b24Race"
              name="b24Race"
              placeholder="e.g. Sinhalese, Sri Lanka Tamil"
              value={formData.b24Race || ""}
              onChange={(e) => onChange("b24Race", e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          * Tamils or Moors must be described as {"\""}Sri Lanka Tamil{"\""} or {"\""}Sri Lanka Moor{"\""}
          or {"\""}Indian Tamil{"\""} or {"\""}Indian Moor{"\""} as the case may be.
        </p>
      </div>

      {/* (4) Age */}
      <div className="space-y-2">
        <Label htmlFor="b24Age" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">4.</span>
          Age
        </Label>
        <Input
          id="b24Age"
          name="b24Age"
          placeholder="Age at the time of death"
          value={formData.b24Age || ""}
          onChange={(e) => onChange("b24Age", e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* (5) Rank or Profession */}
      <div className="space-y-2">
        <Label htmlFor="b24Profession" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">5.</span>
          Rank or Profession
        </Label>
        <Input
          id="b24Profession"
          name="b24Profession"
          placeholder="Status, rank or profession"
          value={formData.b24Profession || ""}
          onChange={(e) => onChange("b24Profession", e.target.value)}
        />
      </div>

      {/* (6) Cause of Death */}
      <div className="space-y-2">
        <Label htmlFor="b24CauseOfDeath" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">6.</span>
          Cause of Death
        </Label>
        <Textarea
          id="b24CauseOfDeath"
          name="b24CauseOfDeath"
          placeholder="Describe the cause of death"
          value={formData.b24CauseOfDeath || ""}
          onChange={(e) => onChange("b24CauseOfDeath", e.target.value)}
          rows={3}
        />
      </div>

      {/* (7) Name and address of person bound to give information */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">7.</span>
          Name and address of person bound to give information
        </Label>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b24InformantName" className="text-xs text-muted-foreground">
              Full name
            </Label>
            <Input
              id="b24InformantName"
              name="b24InformantName"
              placeholder="Full name of the informant"
              value={formData.b24InformantName || ""}
              onChange={(e) => onChange("b24InformantName", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b24InformantAddress" className="text-xs text-muted-foreground">
              Address
            </Label>
            <Textarea
              id="b24InformantAddress"
              name="b24InformantAddress"
              placeholder="Address of the informant"
              value={formData.b24InformantAddress || ""}
              onChange={(e) => onChange("b24InformantAddress", e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </div>
    </fieldset>
  )
}
