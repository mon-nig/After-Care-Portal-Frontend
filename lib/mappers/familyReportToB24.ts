import { CanonicalFamilyReport, computeAgeAtDeath } from "../death-report-schema";

type B12Like = {
  immediateCause?: string | null;
  primaryCause?: string | null;
};

function ageText(report: CanonicalFamilyReport) {
  const computed = computeAgeAtDeath(report.deceased.dateOfBirth, report.death.date);
  if (computed) {
    return `${computed.years}y ${computed.months}m ${computed.days}d`;
  }

  return `${report.deceased.ageYears ?? 0}y ${report.deceased.ageMonths ?? 0}m ${report.deceased.ageDays ?? 0}d`;
}

export function familyReportToB24(report: CanonicalFamilyReport, formB12?: B12Like | null) {
  const cause = formB12?.immediateCause || formB12?.primaryCause || report.death.familyNarrative || "";

  return {
    b24GramaDivision: report.deceased.permanentAddress.gnDivision || "",
    b24RegistrarDivision: report.death.registrationDivision || "",
    b24SerialNo: "",
    b24DeathYear: report.death.date ? String(new Date(report.death.date).getFullYear()) : "",
    b24DeathMonth: report.death.date ? String(new Date(report.death.date).getMonth() + 1) : "",
    b24DeathDay: report.death.date ? String(new Date(report.death.date).getDate()) : "",
    b24PlaceOfDeath: report.death.placeEnglish || "",
    b24FullName: report.deceased.fullNameEnglish || "",
    b24Sex: report.deceased.gender.toLowerCase(),
    b24Race: report.deceased.race || "",
    b24Age: ageText(report),
    b24Profession: report.deceased.profession || "",
    b24CauseOfDeath: cause,
    b24InformantName: report.informant.fullName || "",
    b24InformantAddress: report.informant.postalAddress || "",
    b24RegistrarName: "",
    b24SignedAt: report.death.registrationDivision || "",
    b24SignDate: "",
    b24GNSignature: "",
    b24Confirmed: "false",
  };
}
