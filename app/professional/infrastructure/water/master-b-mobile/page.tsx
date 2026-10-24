"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { WaterMapRenderer } from "../components/water-map-renderer";

interface MapView {
  id: "A" | "B" | "D";
  label: string;
  description: string;
  color: string;
}

const mapViews: MapView[] = [
  {
    id: "A",
    label: "Χάρτης A - Ζώντας Δίκτυο",
    description: "Πραγματικό δίκτυο από τη Βάση Δεδομένων (53.551 κόμβοι)",
    color: "blue",
  },
  {
    id: "B",
    label: "Χάρτης B - Αυθεντικό DWG",
    description: "Δεδομένα από το αυθεντικό σχέδιο (Oceanos 3.4)",
    color: "cyan",
  },
  {
    id: "D",
    label: "Χάρτης D - Μητρώο",
    description: "Αριθμημένες ρέγουλες & υδροστόμια (10.270 στοιχεία)",
    color: "green",
  },
];

export default function WaterMapsPage() {
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<"A" | "B" | "D">("A");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const viewId = searchParams.get("viewId") as "A" | "B" | "D" | null;
    if (viewId && ["A", "B", "D"].includes(viewId)) {
      setActiveView(viewId);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [activeView]);

  const currentView = mapViews.find((m) => m.id === activeView)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold">🗺️ Δίκτυο Νερού Λεμεσού</h1>
          <p className="text-blue-100 mt-2">Διαδραστικοί χάρτες A, B, D</p>
        </div>
      </header>

      {/* View Selector */}
      <nav className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6 overflow-x-auto">
            {mapViews.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`py-4 px-4 border-b-2 font-medium whitespace-nowrap transition ${
                  activeView === view.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {view.label.split(" - ")[0]}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Map Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* View Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentView.label}
            </h2>
            <p className="text-gray-600">{currentView.description}</p>
          </div>

          {/* Map Canvas */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="relative w-full aspect-video bg-gray-100">
              <WaterMapRenderer
                mapType={activeView}
                showAssets={true}
                showNodes={activeView === "A"}
              />
            </div>

            {/* Map Controls */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 flex gap-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                🔍 Μεγέθυνση
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                📍 Εστίαση
              </button>
              <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 text-sm font-medium">
                ✏️ Επεξεργασία (Coming Soon)
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
                💾 Εξαγωγή
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Σύμβολα</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "🚰", label: "Ρέγουλα" },
                { icon: "🏭", label: "Δεξαμενή" },
                { icon: "🔴", label: "Υδροστόμιο" },
                { icon: "💨", label: "Αερική Βάνα" },
                { icon: "🔗", label: "Αγωγός" },
                { icon: "🔒", label: "Απομόνωση" },
                { icon: "⚠️", label: "Ζημιά" },
                { icon: "🎯", label: "Ενδιαφέρον" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-medium text-blue-900">Κόμβοι</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {activeView === "A" ? "53,551" : "N/A"}
              </p>
            </div>
            <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
              <p className="text-sm font-medium text-cyan-900">Αγωγοί</p>
              <p className="text-2xl font-bold text-cyan-600 mt-2">
                {activeView === "A" ? "20,000+" : "N/A"}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm font-medium text-green-900">Στοιχεία</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {activeView === "D" ? "10,270" : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">
            Δίκτυο Νερού Λεμεσού • Pantavion 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
