import Water2GisPilotClient from "./water-2gis-pilot-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantavion Water · 2GIS Pilot",
  description:
    "Founder pilot for evaluating 2GIS building/address detail under the protected Pantavion Water network.",
};

export default function Water2GisPilotPage() {
  const mapKey = process.env.TWOGIS_MAPGL_KEY?.trim() || "";

  return <Water2GisPilotClient mapKey={mapKey} />;
}
