/**
 * Registry-only country and area coverage for Global Connect Foundation.
 *
 * This snapshot is not evidence for a local-law, age, consent, emergency,
 * residency, moderation, language, or production-approval decision.
 */

export const GLOBAL_CONNECT_COUNTRY_REGISTRY_VERSION = "2026-08-15";
export const ISO3166_SNAPSHOT_REFERENCE =
  "IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.";

export const GLOBAL_CONNECT_CONTINENTS = [
  "Africa",
  "Antarctica",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "South America",
] as const;

export type GlobalConnectContinent = (typeof GLOBAL_CONNECT_CONTINENTS)[number];
export type CountryEvidenceStatus =
  | "registry-only"
  | "research-pending"
  | "evidence-partial"
  | "reviewed"
  | "legally-reviewed"
  | "approved-for-production"
  | "suspended";

export interface GlobalConnectCountryRecord {
  readonly isoAlpha2: string;
  readonly canonicalName: string;
  readonly nativeNames: readonly string[];
  readonly primaryContinent: GlobalConnectContinent;
  readonly status: CountryEvidenceStatus;
  readonly evidence: Readonly<{
    readonly iso3166Snapshot: string;
    readonly unM49ContextStatus: "research-pending";
    readonly jurisdictionPackStatus: "research-pending";
    readonly productionSensitiveFeatures: "blocked";
  }>;
}

const ISO3166_SNAPSHOT_TSV = "AD\tAndorra\nAE\tUnited Arab Emirates\nAF\tAfghanistan\nAG\tAntigua & Barbuda\nAI\tAnguilla\nAL\tAlbania\nAM\tArmenia\nAO\tAngola\nAQ\tAntarctica\nAR\tArgentina\nAS\tSamoa (American)\nAT\tAustria\nAU\tAustralia\nAW\tAruba\nAX\tÅland Islands\nAZ\tAzerbaijan\nBA\tBosnia & Herzegovina\nBB\tBarbados\nBD\tBangladesh\nBE\tBelgium\nBF\tBurkina Faso\nBG\tBulgaria\nBH\tBahrain\nBI\tBurundi\nBJ\tBenin\nBL\tSt Barthelemy\nBM\tBermuda\nBN\tBrunei\nBO\tBolivia\nBQ\tCaribbean NL\nBR\tBrazil\nBS\tBahamas\nBT\tBhutan\nBV\tBouvet Island\nBW\tBotswana\nBY\tBelarus\nBZ\tBelize\nCA\tCanada\nCC\tCocos (Keeling) Islands\nCD\tCongo (Dem. Rep.)\nCF\tCentral African Rep.\nCG\tCongo (Rep.)\nCH\tSwitzerland\nCI\tCôte d'Ivoire\nCK\tCook Islands\nCL\tChile\nCM\tCameroon\nCN\tChina\nCO\tColombia\nCR\tCosta Rica\nCU\tCuba\nCV\tCape Verde\nCW\tCuraçao\nCX\tChristmas Island\nCY\tCyprus\nCZ\tCzech Republic\nDE\tGermany\nDJ\tDjibouti\nDK\tDenmark\nDM\tDominica\nDO\tDominican Republic\nDZ\tAlgeria\nEC\tEcuador\nEE\tEstonia\nEG\tEgypt\nEH\tWestern Sahara\nER\tEritrea\nES\tSpain\nET\tEthiopia\nFI\tFinland\nFJ\tFiji\nFK\tFalkland Islands\nFM\tMicronesia\nFO\tFaroe Islands\nFR\tFrance\nGA\tGabon\nGB\tBritain (UK)\nGD\tGrenada\nGE\tGeorgia\nGF\tFrench Guiana\nGG\tGuernsey\nGH\tGhana\nGI\tGibraltar\nGL\tGreenland\nGM\tGambia\nGN\tGuinea\nGP\tGuadeloupe\nGQ\tEquatorial Guinea\nGR\tGreece\nGS\tSouth Georgia & the South Sandwich Islands\nGT\tGuatemala\nGU\tGuam\nGW\tGuinea-Bissau\nGY\tGuyana\nHK\tHong Kong\nHM\tHeard Island & McDonald Islands\nHN\tHonduras\nHR\tCroatia\nHT\tHaiti\nHU\tHungary\nID\tIndonesia\nIE\tIreland\nIL\tIsrael\nIM\tIsle of Man\nIN\tIndia\nIO\tBritish Indian Ocean Territory\nIQ\tIraq\nIR\tIran\nIS\tIceland\nIT\tItaly\nJE\tJersey\nJM\tJamaica\nJO\tJordan\nJP\tJapan\nKE\tKenya\nKG\tKyrgyzstan\nKH\tCambodia\nKI\tKiribati\nKM\tComoros\nKN\tSt Kitts & Nevis\nKP\tKorea (North)\nKR\tKorea (South)\nKW\tKuwait\nKY\tCayman Islands\nKZ\tKazakhstan\nLA\tLaos\nLB\tLebanon\nLC\tSt Lucia\nLI\tLiechtenstein\nLK\tSri Lanka\nLR\tLiberia\nLS\tLesotho\nLT\tLithuania\nLU\tLuxembourg\nLV\tLatvia\nLY\tLibya\nMA\tMorocco\nMC\tMonaco\nMD\tMoldova\nME\tMontenegro\nMF\tSt Martin (French)\nMG\tMadagascar\nMH\tMarshall Islands\nMK\tNorth Macedonia\nML\tMali\nMM\tMyanmar (Burma)\nMN\tMongolia\nMO\tMacau\nMP\tNorthern Mariana Islands\nMQ\tMartinique\nMR\tMauritania\nMS\tMontserrat\nMT\tMalta\nMU\tMauritius\nMV\tMaldives\nMW\tMalawi\nMX\tMexico\nMY\tMalaysia\nMZ\tMozambique\nNA\tNamibia\nNC\tNew Caledonia\nNE\tNiger\nNF\tNorfolk Island\nNG\tNigeria\nNI\tNicaragua\nNL\tNetherlands\nNO\tNorway\nNP\tNepal\nNR\tNauru\nNU\tNiue\nNZ\tNew Zealand\nOM\tOman\nPA\tPanama\nPE\tPeru\nPF\tFrench Polynesia\nPG\tPapua New Guinea\nPH\tPhilippines\nPK\tPakistan\nPL\tPoland\nPM\tSt Pierre & Miquelon\nPN\tPitcairn\nPR\tPuerto Rico\nPS\tPalestine\nPT\tPortugal\nPW\tPalau\nPY\tParaguay\nQA\tQatar\nRE\tRéunion\nRO\tRomania\nRS\tSerbia\nRU\tRussia\nRW\tRwanda\nSA\tSaudi Arabia\nSB\tSolomon Islands\nSC\tSeychelles\nSD\tSudan\nSE\tSweden\nSG\tSingapore\nSH\tSt Helena\nSI\tSlovenia\nSJ\tSvalbard & Jan Mayen\nSK\tSlovakia\nSL\tSierra Leone\nSM\tSan Marino\nSN\tSenegal\nSO\tSomalia\nSR\tSuriname\nSS\tSouth Sudan\nST\tSao Tome & Principe\nSV\tEl Salvador\nSX\tSt Maarten (Dutch)\nSY\tSyria\nSZ\tEswatini (Swaziland)\nTC\tTurks & Caicos Is\nTD\tChad\nTF\tFrench S. Terr.\nTG\tTogo\nTH\tThailand\nTJ\tTajikistan\nTK\tTokelau\nTL\tEast Timor\nTM\tTurkmenistan\nTN\tTunisia\nTO\tTonga\nTR\tTurkey\nTT\tTrinidad & Tobago\nTV\tTuvalu\nTW\tTaiwan\nTZ\tTanzania\nUA\tUkraine\nUG\tUganda\nUM\tUS minor outlying islands\nUS\tUnited States\nUY\tUruguay\nUZ\tUzbekistan\nVA\tVatican City\nVC\tSt Vincent\nVE\tVenezuela\nVG\tVirgin Islands (UK)\nVI\tVirgin Islands (US)\nVN\tVietnam\nVU\tVanuatu\nWF\tWallis & Futuna\nWS\tSamoa (western)\nYE\tYemen\nYT\tMayotte\nZA\tSouth Africa\nZM\tZambia\nZW\tZimbabwe";

const CONTINENT_CODES: Readonly<Record<GlobalConnectContinent, string>> = {
  Africa:
    "AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EG EH ER ET GA GH GM GN GQ GW IO KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RE RW SC SD SH SL SN SO SS ST SZ TD TG TN TZ UG YT ZA ZM ZW",
  Antarctica: "AQ BV HM TF",
  Asia:
    "AE AF AM AZ BD BH BN BT CN CY GE HK ID IL IN IQ IR JO JP KG KH KP KR KW KZ LA LB LK MM MN MO MV MY NP OM PH PK PS QA SA SG SY TH TJ TL TM TR TW UZ VN YE",
  Europe:
    "AD AL AT AX BA BE BG BY CH CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM UA VA",
  "North America":
    "AG AI AW BB BL BM BQ BS BZ CA CR CU CW DM DO GD GL GP GT HN HT JM KN KY LC MF MQ MS MX NI PA PM PR SV SX TC TT US VC VG VI",
  Oceania: "AS AU CC CK CX FJ FM GU KI MH MP NC NF NR NU NZ PF PG PN PW SB TK TO TV UM VU WF WS",
  "South America": "AR BO BR CL CO EC FK GF GS GY PE PY SR UY VE",
};

const ISO3166_SNAPSHOT = ISO3166_SNAPSHOT_TSV.split("\n").map((line) => {
  const separator = line.indexOf("\t");

  if (separator !== 2) {
    throw new Error("Invalid ISO 3166 snapshot row.");
  }

  return [line.slice(0, separator), line.slice(separator + 1)] as const;
});

function createContinentIndex(): ReadonlyMap<string, GlobalConnectContinent> {
  const index = new Map<string, GlobalConnectContinent>();

  for (const continent of GLOBAL_CONNECT_CONTINENTS) {
    for (const code of CONTINENT_CODES[continent].split(" ")) {
      if (index.has(code)) {
        throw new Error(`Duplicate continent assignment for ISO alpha-2 code: ${code}.`);
      }

      index.set(code, continent);
    }
  }

  return index;
}

const CONTINENT_BY_CODE = createContinentIndex();

function buildRegistry(): readonly GlobalConnectCountryRecord[] {
  const codes = new Set<string>();
  const records = ISO3166_SNAPSHOT.map(([isoAlpha2, canonicalName]) => {
    if (codes.has(isoAlpha2)) {
      throw new Error(`Duplicate ISO alpha-2 entry: ${isoAlpha2}.`);
    }

    const primaryContinent = CONTINENT_BY_CODE.get(isoAlpha2);

    if (!primaryContinent) {
      throw new Error(`Missing continent coverage for ISO alpha-2 entry: ${isoAlpha2}.`);
    }

    codes.add(isoAlpha2);

    return Object.freeze({
      isoAlpha2,
      canonicalName,
      // Native-language names require country-specific source evidence.
      nativeNames: Object.freeze([]),
      primaryContinent,
      status: "registry-only" as const,
      evidence: Object.freeze({
        iso3166Snapshot: ISO3166_SNAPSHOT_REFERENCE,
        // This operating grouping has seven-continent coverage. Numeric UN M49
        // region/subregion reconciliation remains explicitly unverified.
        unM49ContextStatus: "research-pending" as const,
        jurisdictionPackStatus: "research-pending" as const,
        productionSensitiveFeatures: "blocked" as const,
      }),
    });
  });

  if (records.length !== 249 || codes.size !== 249 || CONTINENT_BY_CODE.size !== 249) {
    throw new Error("Global country registry must contain exactly 249 uniquely assigned ISO alpha-2 entries.");
  }

  return Object.freeze(records);
}

export const GLOBAL_CONNECT_COUNTRY_REGISTRY = buildRegistry();

function safeLocale(locale: string | undefined): string {
  if (!locale) {
    return "en";
  }

  try {
    const canonicalLocales = (
      Intl as typeof Intl & { getCanonicalLocales?: (locales: string | readonly string[]) => string[] }
    ).getCanonicalLocales;
    return canonicalLocales?.(locale)[0] || locale;
  } catch {
    return "en";
  }
}

export function localizedGlobalConnectCountryName(record: GlobalConnectCountryRecord, locale?: string): string {
  const resolvedLocale = safeLocale(locale);

  try {
    const displayNames = new Intl.DisplayNames([resolvedLocale], { type: "region", fallback: "code" });
    const localized = displayNames.of(record.isoAlpha2);
    return localized && localized !== record.isoAlpha2 ? localized : record.canonicalName;
  } catch {
    return record.canonicalName;
  }
}

export function listGlobalConnectCountries(locale?: string): readonly GlobalConnectCountryRecord[] {
  const resolvedLocale = safeLocale(locale);
  const collator = new Intl.Collator(resolvedLocale, { sensitivity: "base", usage: "sort" });

  return Object.freeze(
    [...GLOBAL_CONNECT_COUNTRY_REGISTRY].sort((left, right) =>
      collator.compare(
        localizedGlobalConnectCountryName(left, resolvedLocale),
        localizedGlobalConnectCountryName(right, resolvedLocale),
      ),
    ),
  );
}

export function globalConnectCountryRegistryMetrics() {
  const continentCoverage = GLOBAL_CONNECT_CONTINENTS.map((continent) => ({
    continent,
    count: GLOBAL_CONNECT_COUNTRY_REGISTRY.filter((record) => record.primaryContinent === continent).length,
  }));

  return Object.freeze({
    total: GLOBAL_CONNECT_COUNTRY_REGISTRY.length,
    uniqueCodes: new Set(GLOBAL_CONNECT_COUNTRY_REGISTRY.map((record) => record.isoAlpha2)).size,
    continentCoverage: Object.freeze(continentCoverage),
    statusCounts: Object.freeze({ "registry-only": GLOBAL_CONNECT_COUNTRY_REGISTRY.length }),
    unM49ContextStatus: "research-pending" as const,
  });
}
