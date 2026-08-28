import { z } from "zod";

export const AUSTRALIAN_JURISDICTION_CODES = [
  "AU",
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
] as const;

export const australianJurisdictionCodeSchema = z.enum(AUSTRALIAN_JURISDICTION_CODES);
export type AustralianJurisdictionCode = z.infer<typeof australianJurisdictionCodeSchema>;

export const SCHOOL_SECTORS = ["government", "catholic", "independent"] as const;
export const schoolSectorSchema = z.enum(SCHOOL_SECTORS);
export type SchoolSector = z.infer<typeof schoolSectorSchema>;

export const jurisdictionKindSchema = z.enum(["national", "state", "territory"]);
export type JurisdictionKind = z.infer<typeof jurisdictionKindSchema>;

export const australianJurisdictionSchema = z
  .object({
    code: australianJurisdictionCodeSchema,
    name: z.string().trim().min(1).max(80),
    kind: jurisdictionKindSchema,
    parentCode: z.literal("AU").nullable(),
    schoolSectors: z.array(schoolSectorSchema).length(SCHOOL_SECTORS.length),
  })
  .strict();

export type AustralianJurisdiction = z.infer<typeof australianJurisdictionSchema>;

/**
 * Product registry only: it identifies Australian jurisdictions and sectors.
 * It deliberately does not assert which curriculum release is current in any
 * jurisdiction; releases are separately sourced, dated and versioned records.
 */
export const AUSTRALIAN_JURISDICTIONS = [
  { code: "AU", name: "Australia", kind: "national", parentCode: null },
  { code: "ACT", name: "Australian Capital Territory", kind: "territory", parentCode: "AU" },
  { code: "NSW", name: "New South Wales", kind: "state", parentCode: "AU" },
  { code: "NT", name: "Northern Territory", kind: "territory", parentCode: "AU" },
  { code: "QLD", name: "Queensland", kind: "state", parentCode: "AU" },
  { code: "SA", name: "South Australia", kind: "state", parentCode: "AU" },
  { code: "TAS", name: "Tasmania", kind: "state", parentCode: "AU" },
  { code: "VIC", name: "Victoria", kind: "state", parentCode: "AU" },
  { code: "WA", name: "Western Australia", kind: "state", parentCode: "AU" },
].map((jurisdiction) =>
  australianJurisdictionSchema.parse({
    ...jurisdiction,
    schoolSectors: [...SCHOOL_SECTORS],
  }),
) satisfies readonly AustralianJurisdiction[];

const jurisdictionByCode = new Map(
  AUSTRALIAN_JURISDICTIONS.map((jurisdiction) => [jurisdiction.code, jurisdiction]),
);

export function getAustralianJurisdiction(
  code: AustralianJurisdictionCode,
): AustralianJurisdiction {
  const jurisdiction = jurisdictionByCode.get(code);
  if (!jurisdiction) throw new Error(`Unknown Australian jurisdiction '${code}'.`);
  return jurisdiction;
}
