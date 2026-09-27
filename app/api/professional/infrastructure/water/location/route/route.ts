import "server-only";

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_ROUTER = "https://router.project-osrm.org";

function finite(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function inCyprus(latitude: number, longitude: number) {
  return (
    latitude >= 34.35 &&
    latitude <= 35.75 &&
    longitude >= 32.15 &&
    longitude <= 34.75
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startLat = finite(url.searchParams.get("startLat"));
  const startLng = finite(url.searchParams.get("startLng"));
  const endLat = finite(url.searchParams.get("endLat"));
  const endLng = finite(url.searchParams.get("endLng"));

  if (
    startLat === null ||
    startLng === null ||
    endLat === null ||
    endLng === null ||
    !inCyprus(startLat, startLng) ||
    !inCyprus(endLat, endLng)
  ) {
    return NextResponse.json(
      { ok: false, error: "route_coordinates_invalid_or_outside_cyprus" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const baseUrl = (
    process.env.PANTAVION_ROUTING_BASE_URL || DEFAULT_ROUTER
  ).replace(/\/$/, "");

  const routeUrl =
    `${baseUrl}/route/v1/driving/` +
    `${startLng},${startLat};${endLng},${endLat}` +
    "?alternatives=false&steps=true&geometries=geojson&overview=full";

  try {
    const response = await fetch(routeUrl, {
      headers: {
        accept: "application/json",
        "user-agent": "Pantavion-Infrastructure-GIS/1.0",
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      throw new Error(`routing_provider_http_${response.status}`);
    }

    const json = (await response.json()) as {
      code?: string;
      routes?: Array<{
        distance?: number;
        duration?: number;
        geometry?: {
          type?: string;
          coordinates?: Array<[number, number]>;
        };
        legs?: Array<{
          steps?: Array<{
            distance?: number;
            duration?: number;
            name?: string;
            maneuver?: {
              type?: string;
              modifier?: string;
              location?: [number, number];
            };
          }>;
        }>;
      }>;
    };

    const route = json.routes?.[0];
    if (json.code !== "Ok" || !route?.geometry?.coordinates?.length) {
      return NextResponse.json(
        { ok: false, error: "route_not_found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        provider:
          process.env.PANTAVION_ROUTING_BASE_URL
            ? "pantavion-configured-router"
            : "osrm-community-bootstrap",
        distanceMeters: route.distance ?? null,
        durationSeconds: route.duration ?? null,
        geometry: route.geometry,
        steps:
          route.legs?.[0]?.steps?.map((step) => ({
            distanceMeters: step.distance ?? null,
            durationSeconds: step.duration ?? null,
            roadName: step.name || "",
            maneuverType: step.maneuver?.type || "",
            maneuverModifier: step.maneuver?.modifier || "",
            location: step.maneuver?.location || null,
          })) ?? [],
      },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "routing_failed",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
