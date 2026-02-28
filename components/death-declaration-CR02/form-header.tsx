import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function FormHeader() {
  return (
    <div className="border-b border-border pb-6">
      <div className="flex flex-col items-center gap-2 text-center mb-6">
        <p className="text-xs text-muted-foreground">
          This form is issued free of charge
        </p>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Registration</span>
            <span className="text-sm font-semibold text-foreground">CR2</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-foreground tracking-tight text-balance">
          Registrar General{"'"}s Department
        </h1>
        <h2 className="text-lg font-semibold text-foreground">
          Declaration of Death
        </h2>
        <p className="text-sm text-muted-foreground">
          Normal and Sudden Death
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="serialNumber" className="text-xs text-muted-foreground">
            Serial Number
          </Label>
          <Input
            id="serialNumber"
            name="serialNumber"
            placeholder="For office use only"
            disabled
            className="bg-muted"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dateOfAcceptance" className="text-xs text-muted-foreground">
            Date of Acceptance
          </Label>
          <Input
            id="dateOfAcceptance"
            name="dateOfAcceptance"
            type="date"
            disabled
            className="bg-muted"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
        Should be completed by the informant and the duly completed form should
        be forwarded to the Reporting Officer / Registrar. The death will be
        registered in the Civil Registration System based on the information
        provided in this form.
      </p>
    </div>
  )
}
