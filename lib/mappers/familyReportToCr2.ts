import { CanonicalFamilyReport, computeAgeAtDeath } from "../death-report-schema";

type B12Like = {
  naturalDeath?: boolean | null;
  icd10Code?: string | null;
  immediateCause?: string | null;
  primaryCause?: string | null;
};

function yesNo(value?: boolean | null) {
  if (value == null) return "";
  return value ? "yes" : "no";
}

export function familyReportToCr2(report: CanonicalFamilyReport, formB12?: B12Like | null) {
  const deathDate = report.death.date ? new Date(report.death.date) : null;
  const age = computeAgeAtDeath(report.deceased.dateOfBirth, report.death.date);
  const cause = formB12?.immediateCause || formB12?.primaryCause || report.death.familyNarrative || "";
  const causeEstablished = formB12 ? "yes" : yesNo(report.death.causeKnownByFamily);

  return {
    typeOfDeath: "normal",
    deathYear: deathDate ? String(deathDate.getFullYear()) : "",
    deathMonth: deathDate ? String(deathDate.getMonth() + 1) : "",
    deathDay: deathDate ? String(deathDate.getDate()) : "",
    district: report.death.placeDistrict || "",
    dsDivision: report.death.placeDsDivision || "",
    regDivision: report.death.registrationDivision || "",
    placeInSinhalaOrTamil: report.death.placeOfficialLanguage || "",
    placeInEnglish: report.death.placeEnglish || "",
    timeOfDeath: report.death.time || "",
    deathLocation: "outside",
    causeEstablished,
    causeOfDeath: cause,
    icdCode: formB12?.icd10Code || "",
    burialPlace: report.death.burialOrCremationPlace || "",
    identificationStatus:
      report.deceased.identificationStatus === "NOT_IDENTIFIED" ? "not_identified" : "identified",
    deceasedNic: report.deceased.identificationStatus === "IDENTIFIED_SRI_LANKAN" ? report.deceased.nic || "" : "",
    foreignerCountry: report.deceased.passportCountry || "",
    foreignerPassport: report.deceased.passportNumber || "",
    dobYear: report.deceased.dateOfBirth ? String(new Date(report.deceased.dateOfBirth).getFullYear()) : "",
    dobMonth: report.deceased.dateOfBirth ? String(new Date(report.deceased.dateOfBirth).getMonth() + 1) : "",
    dobDay: report.deceased.dateOfBirth ? String(new Date(report.deceased.dateOfBirth).getDate()) : "",
    ageYears: age ? String(age.years) : String(report.deceased.ageYears ?? ""),
    ageMonths: age ? String(age.months) : String(report.deceased.ageMonths ?? ""),
    ageDays: age ? String(age.days) : String(report.deceased.ageDays ?? ""),
    deceasedGender: report.deceased.gender.toLowerCase(),
    deceasedRace: report.deceased.race || "",
    nameOfficialLang: report.deceased.fullNameOfficialLanguage || "",
    nameEnglish: report.deceased.fullNameEnglish || "",
    permAddressFullText: report.deceased.permanentAddress.fullText || "",
    permAddressDistrict: report.deceased.permanentAddress.district || "",
    permAddressDs: report.deceased.permanentAddress.dsDivision || "",
    permAddressGn: report.deceased.permanentAddress.gnDivision || "",
    profession: report.deceased.profession || "",
    pensionStatus: yesNo(report.deceased.pensionStatus),
    fatherNic: report.deceased.fatherNic || "",
    fatherName: report.deceased.fatherName || "",
    motherNic: report.deceased.motherNic || "",
    motherName: report.deceased.motherName || "",
    wasPregnant: yesNo(report.maternal.wasPregnantAtDeath),
    recentBirth: yesNo(report.maternal.gaveBirthWithin42Days),
    recentAbortion: yesNo(report.maternal.hadAbortion),
    maternalTimelineDays: report.maternal.daysSinceBirthOrAbortion != null ? String(report.maternal.daysSinceBirthOrAbortion) : "",
    causeOfDeathDetail: cause,
    isNaturalDeath: formB12 ? yesNo(formB12.naturalDeath) : "yes",
    suddenDeathReasons: "",
    opinionAboutDeath: "",
    otherInformation: report.death.familyNarrative || "",
    informantCapacity: report.informant.capacity.toLowerCase(),
    informantOtherCapacityText: report.informant.otherCapacityText || "",
    informantId: report.informant.nicOrPassport || "",
    informantName: report.informant.fullName || "",
    informantAddress: report.informant.postalAddress || "",
    informantPhone: report.informant.mobile || "",
    informantLandline: report.informant.landline || "",
    informantEmail: report.informant.email || "",
    declarationConfirmed: report.declarationConfirmed ? "true" : "false",
    declarationDate: "",
    informantSignatureName: report.informant.fullName || "",
    informantSignatureAddress: report.informant.postalAddress || "",
    officerId: "",
    officerName: "",
    officerAddress: "",
    officerDivision: "",
    officerDate: "",
  };
}
