"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface DeathInfoSectionProps {
  formData: Record<string, string>
  onChange: (name: string, value: string) => void
}

export function DeathInfoSection({ formData, onChange }: DeathInfoSectionProps) {
  return (
    <fieldset className="space-y-6">
      <legend className="text-base font-semibold text-foreground border-b border-border pb-2 w-full">
        Information about the Death
      </legend>

      {/* (1) Type of Death */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(1)</span>
          Type of death
        </Label>
        <RadioGroup
          value={formData.typeOfDeath || ""}
          onValueChange={(val) => onChange("typeOfDeath", val)}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="normal" id="normalDeath" />
            <Label htmlFor="normalDeath" className="font-normal cursor-pointer">
              Normal Death
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="sudden" id="suddenDeath" />
            <Label htmlFor="suddenDeath" className="font-normal cursor-pointer">
              Sudden Death
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* (2) Date of Death */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(2)</span>
          Date of Death
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="deathYear" className="text-xs text-muted-foreground">
              Year
            </Label>
            <Input
              id="deathYear"
              name="deathYear"
              type="number"
              placeholder="YYYY"
              value={formData.deathYear || ""}
              onChange={(e) => onChange("deathYear", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="deathMonth" className="text-xs text-muted-foreground">
              Month
            </Label>
            <Input
              id="deathMonth"
              name="deathMonth"
              type="number"
              placeholder="MM"
              min={1}
              max={12}
              value={formData.deathMonth || ""}
              onChange={(e) => onChange("deathMonth", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="deathDay" className="text-xs text-muted-foreground">
              Day
            </Label>
            <Input
              id="deathDay"
              name="deathDay"
              type="number"
              placeholder="DD"
              min={1}
              max={31}
              value={formData.deathDay || ""}
              onChange={(e) => onChange("deathDay", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* (3) Place of Death */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(3)</span>
          Particulars of Place of Death
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="district" className="text-xs text-muted-foreground">
              District
            </Label>
            <Input
              id="district"
              name="district"
              placeholder="District"
              value={formData.district || ""}
              onChange={(e) => onChange("district", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dsDivision" className="text-xs text-muted-foreground">
              Divisional Secretary Division
            </Label>
            <Input
              id="dsDivision"
              name="dsDivision"
              placeholder="DS Division"
              value={formData.dsDivision || ""}
              onChange={(e) => onChange("dsDivision", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="regDivision" className="text-xs text-muted-foreground">
              Registration Division
            </Label>
            <Input
              id="regDivision"
              name="regDivision"
              placeholder="Registration Division"
              value={formData.regDivision || ""}
              onChange={(e) => onChange("regDivision", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="placeInSinhalaOrTamil" className="text-xs text-muted-foreground">
              Place (in Sinhala or Tamil)
            </Label>
            <Input
              id="placeInSinhalaOrTamil"
              name="placeInSinhalaOrTamil"
              placeholder="Place in Sinhala or Tamil"
              value={formData.placeInSinhalaOrTamil || ""}
              onChange={(e) => onChange("placeInSinhalaOrTamil", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="placeInEnglish" className="text-xs text-muted-foreground">
              Place (in English)
            </Label>
            <Input
              id="placeInEnglish"
              name="placeInEnglish"
              placeholder="Place in English"
              value={formData.placeInEnglish || ""}
              onChange={(e) => onChange("placeInEnglish", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="timeOfDeath" className="text-xs text-muted-foreground">
              Time of Death
            </Label>
            <Input
              id="timeOfDeath"
              name="timeOfDeath"
              type="time"
              value={formData.timeOfDeath || ""}
              onChange={(e) => onChange("timeOfDeath", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-2">
          <RadioGroup
            value={formData.deathLocation || ""}
            onValueChange={(val) => onChange("deathLocation", val)}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="hospital" id="atHospital" />
              <Label htmlFor="atHospital" className="font-normal cursor-pointer">
                Death occurred at a Hospital
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="outside" id="outsideHospital" />
              <Label htmlFor="outsideHospital" className="font-normal cursor-pointer">
                Death occurred outside of a Hospital
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* (4) Cause of Death Established */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(4)</span>
          Has the cause of death been established?
        </Label>
        <RadioGroup
          value={formData.causeEstablished || ""}
          onValueChange={(val) => onChange("causeEstablished", val)}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="causeYes" />
            <Label htmlFor="causeYes" className="font-normal cursor-pointer">
              Cause of death has been established
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="causeNo" />
            <Label htmlFor="causeNo" className="font-normal cursor-pointer">
              Cause of death has not been established
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* (5) Cause of Death */}
      <div className="space-y-2">
        <Label htmlFor="causeOfDeath" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(5)</span>
          Cause of death (only if known)
        </Label>
        <Textarea
          id="causeOfDeath"
          name="causeOfDeath"
          placeholder="Describe the cause of death"
          value={formData.causeOfDeath || ""}
          onChange={(e) => onChange("causeOfDeath", e.target.value)}
          rows={2}
        />
      </div>

      {/* (6) ICD Code */}
      <div className="space-y-2">
        <Label htmlFor="icdCode" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(6)</span>
          ICD Code of cause (only if known)
        </Label>
        <Input
          id="icdCode"
          name="icdCode"
          placeholder="ICD Code"
          value={formData.icdCode || ""}
          onChange={(e) => onChange("icdCode", e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* (7) Burial / Cremation */}
      <div className="space-y-2">
        <Label htmlFor="burialPlace" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(7)</span>
          If already buried or cremated, place of burial or cremation
        </Label>
        <Input
          id="burialPlace"
          name="burialPlace"
          placeholder="Place of burial or cremation"
          value={formData.burialPlace || ""}
          onChange={(e) => onChange("burialPlace", e.target.value)}
        />
      </div>
    </fieldset>
  )
}
