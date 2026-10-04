import { describe, expect, it } from "vitest";
import { matchesStreetQuery } from "./cyprus-street-registry-store";

const street = {
  streetRegistryId: "s1",
  nameEl: "Αρχιεπισκόπου Μακαρίου Γ΄",
  nameEn: "Archbishop Makarios III",
  alternateNames: ["Makariou"],
  formerNames: [],
  district: "Λεμεσός",
  municipalityOrCommunity: "Λεμεσός",
  areaOrParish: null,
  zoneOrSection: null,
  postalCodes: ["3030"],
  geometryIdentity: "geom:s1",
  sourceReferences: [],
  status: "VERIFIED" as const,
};

describe("Cyprus street registry store", () => {
  it("finds Greek street names without accents", () => {
    expect(matchesStreetQuery(street, "αρχιεπισκοπου μακαριου")).toBe(true);
  });

  it("finds English aliases", () => {
    expect(matchesStreetQuery(street, "Makariou")).toBe(true);
  });

  it("does not match unrelated names", () => {
    expect(matchesStreetQuery(street, "Ανεξαρτησίας")).toBe(false);
  });
});
