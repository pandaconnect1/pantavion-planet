import { describe, expect, it } from "vitest";
import { mergeStreetEvidence, normalizeStreetName, streetDeduplicationKey } from "./cyprus-street-registry";

describe("Cyprus street registry", () => {
  it("normalizes Greek accents and punctuation", () => {
    expect(normalizeStreetName("Αρχιεπισκόπου  Μακαρίου Γ΄")).toBe("αρχιεπισκοπου μακαριου γ");
  });

  it("keeps identical street names in different communities separate", () => {
    const a = streetDeduplicationKey({ district: "Λεμεσός", municipalityOrCommunity: "Γερμασόγεια", nameEl: "Αγίου Γεωργίου", nameEn: null });
    const b = streetDeduplicationKey({ district: "Λεμεσός", municipalityOrCommunity: "Ύψωνας", nameEl: "Αγίου Γεωργίου", nameEn: null });
    expect(a).not.toBe(b);
  });

  it("promotes corroborated non-conflicting evidence to verified", () => {
    const common = { streetRegistryId: "s1", nameEl: "Ανεξαρτησίας", nameEn: null, alternateNames: [], formerNames: [], district: "Λεμεσός", municipalityOrCommunity: "Λεμεσός", areaOrParish: null, zoneOrSection: null, postalCodes: ["3040"], status: "NEW_CANDIDATE" as const };
    const merged = mergeStreetEvidence([
      { ...common, sourceReferences: [{ source: "CYPRUS_POST" as const, sourceId: "p1", observedAt: "2026-10-04" }] },
      { ...common, sourceReferences: [{ source: "DLS_ROAD_NETWORK" as const, sourceId: "d1", observedAt: "2026-10-04" }] },
    ]);
    expect(merged[0]?.status).toBe("VERIFIED");
  });
});
