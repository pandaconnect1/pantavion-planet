import type { Metadata } from "next";

import WaterFaultRegistryClient from "./water-fault-registry-client";

export const metadata: Metadata = {
  title: "Μητρώο Βλαβών Ύδρευσης | Pantavion",
  description:
    "Πρώτο λειτουργικό μητρώο βλαβών ύδρευσης για καταχώρηση, προτεραιότητα, συνεργείο, υλικά και κατάσταση.",
};

export default function Page() {
  return <WaterFaultRegistryClient />;
}