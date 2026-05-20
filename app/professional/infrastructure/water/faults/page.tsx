import type { Metadata } from "next";

import WaterFaultRegistryClient from "./water-fault-registry-client";

export const metadata: Metadata = {
  title: "ητρώο λαβών Ύδρευσης | Pantavion",
  description:
    "ρώτο λειτουργικό μητρώο βλαβών ύδρευσης για καταχώρηση, προτεραιότητα, συνεργείο, υλικά και κατάσταση.",
};

export default function Page() {
  return <WaterFaultRegistryClient />;
}