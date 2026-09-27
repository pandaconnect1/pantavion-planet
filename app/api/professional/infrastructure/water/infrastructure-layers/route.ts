import "server-only";

import { NextResponse } from "next/server";

import {
  getPantavionInfrastructureOperationalLayer,
  getPantavionInfrastructureOperationalLayerCatalog,
} from "@/core/infrastructure/utility/pantavion-infrastructure-operational-layer-catalog";
import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function finite(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function validCyprusBbox(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
) {
  return (
    minLng >= 31.5 &&
    maxLng <= 35.2 &&
    minLat >= 34.0 &&
    maxLat <= 36.0 &&
    minLng < maxLng &&
    minLat < maxLat &&
    maxLng - minLng <= 1.5 &&
    maxLat - minLat <= 1.5
  );
}

export async function GET(request: Request) {
  const access = await authorizeWaterMapRequest(request);

  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: access.error },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const url = new URL(request.url);
  const layerId = (url.searchParams.get("layerId") || "").trim();

  if (!layerId) {
    return NextResponse.json(
      {
        ok: true,
        accessMode: access.mode,
        catalog: getPantavionInfrastructureOperationalLayerCatalog(),
      },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  }

  const layer = getPantavionInfrastructureOperationalLayer(layerId);
  if (!layer) {
    return NextResponse.json(
      { ok: false, error: "infrastructure_layer_not_found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (
    !layer.queryable ||
    !layer.serviceUrl ||
    layer.sourceLayerId === undefined ||
    (layer.truthState !== "LIVE_PUBLIC" && layer.truthState !== "REFERENCE_ONLY")
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "infrastructure_layer_source_not_connected",
        layer: {
          id: layer.id,
          name: layer.name,
          truthState: layer.truthState,
          warnings: layer.warnings,
        },
      },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  const minLng = finite(url.searchParams.get("minLng"));
  const minLat = finite(url.searchParams.get("minLat"));
  const maxLng = finite(url.searchParams.get("maxLng"));
  const maxLat = finite(url.searchParams.get("maxLat"));

  if (
    minLng === null ||
    minLat === null ||
    maxLng === null ||
    maxLat === null ||
    !validCyprusBbox(minLng, minLat, maxLng, maxLat)
  ) {
    return NextResponse.json(
      { ok: false, error: "infrastructure_layer_bbox_invalid" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const query = new URLSearchParams({
    where: "1=1",
    geometry: `${minLng},${minLat},${maxLng},${maxLat}`,
    geometryType: "esriGeometryEnvelope",
    spatialRel: "esriSpatialRelIntersects",
    inSR: "4326",
    outSR: "4326",
    outFields: "*",
    returnGeometry: "true",
    resultRecordCount: "1000",
    f: "geojson",
  });

  const endpoint = `${layer.serviceUrl}/${layer.sourceLayerId}/query?${query.toString()}`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        accept: "application/geo+json,application/json",
        "user-agent": "Pantavion-Infrastructure-GIS/1.0",
      },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`provider_http_${response.status}`);
    }

    const geojson = (await response.json()) as {
      type?: string;
      features?: unknown[];
      error?: unknown;
      exceededTransferLimit?: boolean;
    };

    if (geojson.error) {
      throw new Error("provider_query_error");
    }

    const features = Array.isArray(geojson.features) ? geojson.features : [];

    return NextResponse.json(
      {
        ok: true,
        accessMode: access.mode,
        layer: {
          id: layer.id,
          group: layer.group,
          name: layer.name,
          provider: layer.provider,
          truthState: layer.truthState,
          operationalUse: layer.operationalUse,
          coverage: layer.coverage,
          licenseOrAgreement: layer.licenseOrAgreement,
          sourceUpdatedAt: layer.sourceUpdatedAt ?? null,
          temporalCoverage: layer.temporalCoverage ?? null,
          technicalFields: layer.technicalFields,
          warnings: layer.warnings,
        },
        viewport: { minLng, minLat, maxLng, maxLat },
        featureCount: features.length,
        truncated:
          geojson.exceededTransferLimit === true || features.length >= 1000,
        geojson: {
          type: geojson.type || "FeatureCollection",
          features,
        },
      },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "infrastructure_layer_provider_failed",
        layer: {
          id: layer.id,
          name: layer.name,
          truthState: layer.truthState,
        },
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
