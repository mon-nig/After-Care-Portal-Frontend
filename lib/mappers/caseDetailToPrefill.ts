import { familyReportToB24 } from "./familyReportToB24";
import { familyReportToCr2 } from "./familyReportToCr2";
import type { CaseDetailResponse } from "../api";
import type { CanonicalFamilyReport } from "../death-report-schema";

function toStringRecord(input?: Record<string, unknown> | null) {
  const normalized: Record<string, string> = {};
  if (!input) return normalized;

  for (const [key, value] of Object.entries(input)) {
    if (value == null) {
      normalized[key] = "";
      continue;
    }
    if (typeof value === "string") {
      normalized[key] = value;
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      normalized[key] = String(value);
      continue;
    }
    if (value instanceof Date) {
      normalized[key] = value.toISOString().slice(0, 10);
      continue;
    }
    normalized[key] = String(value);
  }

  return normalized;
}

function asFamilyReport(detail: CaseDetailResponse) {
  return detail.familyReport as CanonicalFamilyReport | undefined;
}

export function caseDetailToPrefill(detail: CaseDetailResponse) {
  const familyReport = asFamilyReport(detail);
  const b12 = detail.formB12 ?? undefined;

  return {
    b12Header: toStringRecord(detail.b12HeaderPrefill),
    b24: detail.b24Prefill
      ? toStringRecord(detail.b24Prefill)
      : familyReport
        ? familyReportToB24(familyReport, b12)
        : {},
    cr2: detail.cr2Prefill
      ? toStringRecord(detail.cr2Prefill)
      : familyReport
        ? familyReportToCr2(familyReport, b12)
        : {},
  };
}
