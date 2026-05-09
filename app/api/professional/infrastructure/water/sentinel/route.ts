import { existsSync, readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Geometry = {
  type?: string;
  coordinates?: unknown;
  geometries?: Geometry[];
};

type Feature = {
  geometry?: Geometry;
  properties?: Record<string, unknown>;
};

type Collection = {
  features?: Feature[];
  pantavion?: Record<string, unknown>;
};

type FindingLevel = "critical" | "warning" | "info" | "ok";

type Finding = {
  level: FindingLevel;
  title: string;
  detail: string;
  action: string;
};

const localProcessedPath = path.join(
  process.cwd(),
  "data",
  "water-network-private",
  "processed",
  "water-network.geojson"
);

function getGeometrySummary(features: Feature[]) {
  const summary: Record<string, number> = {};

  for (const feature of features) {
    const type = feature.geometry?.type || "unknown";
    summary[type] = (summary[type] || 0) + 1;
  }

  return summary;
}

function getSourceMode() {
  if (process.env.PANTAVION_WATER_NETWORK_GEOJSON_URL) {
    return "production_cloud_configured";
  }

  if (existsSync(localProcessedPath)) {
    return "local_private_file";
  }

  return "missing";
}

async function readCollection(): Promise<Collection> {
  const cloudUrl = process.env.PANTAVION_WATER_NETWORK_GEOJSON_URL;
  const token = process.env.PANTAVION_WATER_NETWORK_GEOJSON_BEARER_TOKEN;

  if (cloudUrl) {
    const response = await fetch(cloudUrl, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      throw new Error(`Production cloud source returned HTTP ${response.status}`);
    }

    return (await response.json()) as Collection;
  }

  if (existsSync(localProcessedPath)) {
    return JSON.parse(readFileSync(localProcessedPath, "utf8")) as Collection;
  }

  return { features: [] };
}

function buildFindings(
  sourceMode: string,
  features: Feature[],
  geometrySummary: Record<string, number>
): Finding[] {
  const findings: Finding[] = [];
  const featureCount = features.length;
  const lineCount =
    (geometrySummary.LineString || 0) + (geometrySummary.MultiLineString || 0);
  const polygonCount =
    (geometrySummary.Polygon || 0) + (geometrySummary.MultiPolygon || 0);
  const pointCount =
    (geometrySummary.Point || 0) + (geometrySummary.MultiPoint || 0);

  if (sourceMode === "missing") {
    findings.push({
      level: "critical",
      title: "Δεν υπάρχει ενεργό ιδιωτικό layer ύδρευσης",
      detail:
        "Το Pantavion δεν βλέπει production cloud source ούτε local processed GeoJSON.",
      action:
        "Φόρτωσε private cloud layer ή τρέξε την τοπική μετατροπή KMZ/KML σε GeoJSON για δοκιμή.",
    });
  }

  if (sourceMode === "local_private_file") {
    findings.push({
      level: "warning",
      title: "Το δίκτυο δουλεύει μόνο τοπικά",
      detail:
        "Το layer διαβάζεται από το PC. Από Pantavion.com / 4G οι χρήστες δεν θα το δουν μέχρι να συνδεθεί private cloud storage.",
      action:
        "Συνέχισε με production private cloud bridge και env variable PANTAVION_WATER_NETWORK_GEOJSON_URL.",
    });
  }

  if (sourceMode === "production_cloud_configured") {
    findings.push({
      level: "ok",
      title: "Υπάρχει ρύθμιση production cloud",
      detail:
        "Το Pantavion έχει δηλωμένο private cloud GeoJSON source για production χρήση.",
      action:
        "Έλεγξε authentication, audit log και viewport/vector tile περιορισμούς πριν δοθεί πρόσβαση σε συνεργεία.",
    });
  }

  if (featureCount === 0) {
    findings.push({
      level: "critical",
      title: "Το dataset επιστρέφει 0 στοιχεία",
      detail:
        "Ο χάρτης μπορεί να ανοίγει, αλλά δεν έχει πραγματικά στοιχεία δικτύου για εμφάνιση.",
      action:
        "Έλεγξε source path, cloud URL, μετατροπή KMZ/KML και status endpoint.",
    });
  } else {
    findings.push({
      level: "ok",
      title: "Το dataset έχει στοιχεία",
      detail: `Το PantaAI βλέπει ${featureCount} στοιχεία δικτύου στο ενεργό source.`,
      action:
        "Μπορεί να γίνει τεχνικός έλεγχος ποιότητας, ταχύτητας και γεωαναφοράς.",
    });
  }

  if (featureCount > 50000) {
    findings.push({
      level: "warning",
      title: "Μεγάλο dataset για κινητό",
      detail:
        "Πάνω από 50.000 στοιχεία δεν πρέπει να στέλνονται ολόκληρα σε κινητό 4G.",
      action:
        "Χρειάζεται viewport API ή vector tiles ώστε το κινητό να παίρνει μόνο την περιοχή που βλέπει.",
    });
  }

  if (polygonCount > lineCount && polygonCount > 0) {
    findings.push({
      level: "warning",
      title: "Πιθανή λάθος μορφή δικτύου",
      detail:
        "Το αρχείο έχει περισσότερα Polygon/MultiPolygon από γραμμές. Αυτό μπορεί να κάνει το δίκτυο να φαίνεται σαν κλειστές μάζες και όχι σαν αγωγοί.",
      action:
        "Ζήτησε export από GIS/AutoCAD ως πραγματικά LineString/MultiLineString για αγωγούς, ή κάνε τεχνικό conversion σε γραμμικό layer.",
    });
  }

  if (lineCount > 0) {
    findings.push({
      level: "ok",
      title: "Υπάρχουν γραμμικά στοιχεία",
      detail: `Βρέθηκαν ${lineCount} γραμμικά στοιχεία που μπορούν να λειτουργήσουν ως αγωγοί/σωλήνες.`,
      action:
        "Έλεγξε αν κάθονται σωστά πάνω στους δρόμους και αν έχουν σωστά properties.",
    });
  }

  if (pointCount === 0) {
    findings.push({
      level: "info",
      title: "Δεν φαίνονται σημεία βανών/παροχών",
      detail:
        "Το PantaAI δεν βλέπει Point/MultiPoint στοιχεία στο τρέχον sample/source.",
      action:
        "Αν υπάρχουν βάνες, μετρητές ή παροχές, πρέπει να μπουν ως σημεία με asset type.",
    });
  }

  findings.push({
    level: "info",
    title: "Κανόνας έγκρισης",
    detail:
      "Το PantaAI δεν εγκρίνει μόνο του πρόσβαση σε ευαίσθητο δίκτυο.",
    action:
      "Το AI εισηγείται. Η τελική έγκριση μένει στον Γιώργο / Αρχή με audit log.",
  });

  return findings;
}

export async function GET() {
  try {
    const sourceMode = getSourceMode();
    const collection = await readCollection();
    const features = Array.isArray(collection.features) ? collection.features : [];
    const geometrySummary = getGeometrySummary(features);
    const findings = buildFindings(sourceMode, features, geometrySummary);

    const criticalCount = findings.filter((finding) => finding.level === "critical").length;
    const warningCount = findings.filter((finding) => finding.level === "warning").length;

    return NextResponse.json(
      {
        ok: criticalCount === 0,
        sentinel: "PantaAI Water Infrastructure Sentinel",
        phase: "1I",
        language: "el",
        authorityOwner: "Γιώργος",
        sourceMode,
        featureCount: features.length,
        geometrySummary,
        criticalCount,
        warningCount,
        recommendation:
          criticalCount > 0
            ? "Μην ανοίξεις πρόσβαση σε συνεργεία μέχρι να λυθούν τα κρίσιμα θέματα."
            : warningCount > 0
              ? "Μπορεί να συνεχιστεί έλεγχος, αλλά χρειάζονται τεχνικές διορθώσεις πριν την παραγωγή."
              : "Το layer φαίνεται έτοιμο για επόμενο ελεγχόμενο στάδιο.",
        findings,
        productionRules: [
          "Καμία δημόσια λήψη KMZ/KML.",
          "Καμία έγκριση χωρίς ταυτότητα, ρόλο, συσκευή, περιοχή και σκοπό.",
          "Το κινητό πρέπει να παίρνει μόνο ελαφρύ viewport layer.",
          "Το PantaAI εισηγείται, δεν αντικαθιστά την Αρχή.",
        ],
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-AI-Sentinel": "water-infrastructure-phase-1i",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        sentinel: "PantaAI Water Infrastructure Sentinel",
        phase: "1I",
        language: "el",
        authorityOwner: "Γιώργος",
        sourceMode: "error",
        featureCount: 0,
        geometrySummary: {},
        criticalCount: 1,
        warningCount: 0,
        recommendation:
          "Μην ανοίξεις πρόσβαση μέχρι να διορθωθεί το σφάλμα ανάγνωσης του δικτύου.",
        findings: [
          {
            level: "critical",
            title: "Σφάλμα ανάγνωσης δικτύου",
            detail: error instanceof Error ? error.message : "Άγνωστο σφάλμα.",
            action:
              "Έλεγξε local processed GeoJSON, production cloud URL και μετατροπή KMZ/KML.",
          },
        ],
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-AI-Sentinel": "water-infrastructure-phase-1i-error",
        },
      }
    );
  }
}