"use client";

import { useState } from "react";
import Link from "next/link";
import { WaterFaultFormAdvanced } from "./components/water-fault-form-advanced";

export default function WaterInfrastructurePage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "maps" | "register" | "faults" | "analytics"
  >("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">💧 Δίκτυο Νερού Pantavion</h1>
              <p className="text-blue-100 mt-2">
                Επαγγελματική Διαχείριση Υποδομών Διανομής Νερού
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Λεμεσός, Κύπρος</p>
              <p className="text-xs text-blue-200">10.270 στοιχεία δικτύου • 53.551 κόμβοι</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {(
              ["overview", "maps", "register", "faults", "analytics"] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab === "overview" && "📊 Επισκόπηση"}
                {tab === "maps" && "🗺️ Χάρτες"}
                {tab === "register" && "📋 Μητρώο"}
                {tab === "faults" && "⚠️ Βλάβες"}
                {tab === "analytics" && "📈 Ανάλυση"}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Stat Cards */}
              {[
                {
                  title: "Ρέγουλες Δικτύου",
                  value: "8,972",
                  icon: "🚰",
                  color: "blue",
                },
                {
                  title: "Υδροστόμια",
                  value: "1,018",
                  icon: "🔴",
                  color: "red",
                },
                {
                  title: "Αερικές Βάνες",
                  value: "195",
                  icon: "💨",
                  color: "cyan",
                },
                {
                  title: "Δεξαμενές",
                  value: "83",
                  icon: "🏭",
                  color: "amber",
                },
              ].map((stat) => (
                <div
                  key={stat.title}
                  className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500"
                >
                  <p className="text-gray-600 text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.icon} {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Κατάσταση Συστήματος
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-600 text-sm mb-2">Χάρτης A (Ζώντας Δίκτυο)</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-green-700">Λειτουργικό</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">53.551 κόμβοι • 20.000+ αγωγοί</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-2">Χάρτης B/D (Μητρώο)</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-green-700">Συγχρονισμένο</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">10.270 στοιχεία καταγεγραμμένα</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-2">Ανάλυση Απομόνωσης</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-yellow-700">Σε Εξέλιξη</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Υπολογισμός συνόλων ρέγουλας...</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Επαγγελματικές Λειτουργίες
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: "Χαρτογραφία Δικτύου",
                    description: "Αυθεντικό DWG με αριθμημένες ρέγουλες και στοιχεία",
                    icon: "🗺️",
                  },
                  {
                    title: "Μητρώο Στοιχείων",
                    description: "10.270 ρέγουλες, υδροστόμια, δεξαμενές αναζητήσιμα",
                    icon: "📋",
                  },
                  {
                    title: "Διαχείριση Βλαβών",
                    description: "Καταγραφή με μετρήσεις εκσκαφής, ονόματα συνεργείου",
                    icon: "⚠️",
                  },
                  {
                    title: "Ανάλυση Απομόνωσης",
                    description: "Αυτόματες προτάσεις κλεισίματος ρέγουλας ανά θέση",
                    icon: "🔐",
                  },
                  {
                    title: "Υδραυλικό Μοντέλο",
                    description: "Ανάλυση πίεσης, ζήτησης με προτάσεις αναβάθμισης",
                    icon: "📊",
                  },
                  {
                    title: "Διαχείριση Ζωνών",
                    description: "Όρια DMA, παρακολούθηση διαρροών, ισοζύγιο νερού",
                    icon: "🎯",
                  },
                ].map((feature) => (
                  <div key={feature.title} className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl mb-2">{feature.icon}</p>
                    <h3 className="font-bold text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Maps Tab */}
        {activeTab === "maps" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold mb-6">Χάρτες Δικτύου</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  href="/professional/infrastructure/water/master-b-mobile?viewId=A"
                  className="block p-6 border-2 border-blue-300 rounded-lg hover:border-blue-600 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold text-blue-600">📡 Χάρτης A - Ζώντας Δίκτυο</h3>
                  <p className="text-gray-600 mt-2">
                    Πραγματικό δίκτυο από τη Βάση (53.551 κόμβοι)
                  </p>
                </Link>

                <Link
                  href="/professional/infrastructure/water/master-b-mobile?viewId=B"
                  className="block p-6 border-2 border-cyan-300 rounded-lg hover:border-cyan-600 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold text-cyan-600">🗺️ Χάρτης B - Αυθεντικό</h3>
                  <p className="text-gray-600 mt-2">
                    Δεδομένα DWG (Oceanos 3.4 - Πλήρης ανάλυση)
                  </p>
                </Link>

                <Link
                  href="/professional/infrastructure/water/master-b-mobile?viewId=D"
                  className="block p-6 border-2 border-green-300 rounded-lg hover:border-green-600 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold text-green-600">🎯 Χάρτης D - Μητρώο</h3>
                  <p className="text-gray-600 mt-2">
                    Αριθμημένες ρέγουλες & υδροστόμια με δεδομένα απομόνωσης
                  </p>
                </Link>

                <Link
                  href="/professional/infrastructure/water/register"
                  className="block p-6 border-2 border-purple-300 rounded-lg hover:border-purple-600 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold text-purple-600">📑 Μητρώο</h3>
                  <p className="text-gray-600 mt-2">
                    Αναζήτηση 10.270 στοιχείων ανά οδό, περιοχή, αριθμό
                  </p>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Register Tab */}
        {activeTab === "register" && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-6">Μητρώο Στοιχείων</h2>
            <p className="text-gray-600 mb-4">
              Πλήρης κατάλογος 10.270 στοιχείων δικτύου νερού
            </p>
            <Link
              href="/professional/infrastructure/water/register"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              🔍 Προβολή Πλήρους Μητρώου
            </Link>
          </div>
        )}

        {/* Faults Tab */}
        {activeTab === "faults" && (
          <div className="space-y-6">
            <WaterFaultFormAdvanced />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-6">Ανάλυση & Αναφορές</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">
                  📊 Υδραυλικό Μοντέλο
                </h3>
                <p className="text-sm text-gray-600">
                  Ανάλυση πίεσης, ζήτησης, διαρροών με προτάσεις αναβάθμισης
                </p>
              </div>
              <div className="p-6 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">🎯 Ανάλυση Ζωνών</h3>
                <p className="text-sm text-gray-600">
                  Όρια DMA, ισοζύγιο νερού (πλαίσιο IWA)
                </p>
              </div>
              <div className="p-6 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">
                  📈 Μετρικές Απόδοσης
                </h3>
                <p className="text-sm text-gray-600">
                  Μη έσοδο νερό, ιστορικό βλαβών, χρόνοι απόκρισης
                </p>
              </div>
              <div className="p-6 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">
                  🔐 Ανάλυση Απομόνωσης
                </h3>
                <p className="text-sm text-gray-600">
                  Αυτόματα υπολογισμένα σύνολα κλεισίματος ρέγουλας
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">
            Επαγγελματική Διαχείριση Υποδομών Νερού • Pantavion 2026
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Κατασκευή με EPANET • PostGIS • Διεθνή Πρότυπα
          </p>
        </div>
      </footer>
    </div>
  );
}
