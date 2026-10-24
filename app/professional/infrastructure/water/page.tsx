"use client";

import { useState } from "react";
import Link from "next/link";
import { WaterFaultRecorder } from "./components/water-fault-recorder";

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
              <h1 className="text-4xl font-bold">💧 Pantavion Water Network</h1>
              <p className="text-blue-100 mt-2">
                Professional Water Distribution Infrastructure Management
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Limassol, Cyprus</p>
              <p className="text-xs text-blue-200">10,270 network assets • 53,551 nodes</p>
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
                {tab === "overview" && "📊 Overview"}
                {tab === "maps" && "🗺️ Maps"}
                {tab === "register" && "📋 Register"}
                {tab === "faults" && "⚠️ Faults"}
                {tab === "analytics" && "📈 Analytics"}
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
                  title: "Network Valves",
                  value: "8,972",
                  icon: "🚰",
                  color: "blue",
                },
                {
                  title: "Hydrants",
                  value: "1,018",
                  icon: "🔴",
                  color: "red",
                },
                {
                  title: "Air Valves",
                  value: "195",
                  icon: "💨",
                  color: "cyan",
                },
                {
                  title: "Tanks",
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
                System Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-600 text-sm mb-2">Map A (Live Network)</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-green-700">Operational</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">53,551 nodes • 20,000+ pipes</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-2">Map B/D (Register)</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-green-700">Synced</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">10,270 assets catalogued</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-2">Isolation Analysis</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-yellow-700">In Progress</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Computing valve sets...</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Professional Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: "Network Mapping",
                    description: "Authentic DWG-derived tiles with valve numbering",
                    icon: "🗺️",
                  },
                  {
                    title: "Asset Register",
                    description: "10,270 valves, hydrants, tanks searchable by street/area",
                    icon: "📋",
                  },
                  {
                    title: "Fault Management",
                    description: "Record damage with excavation metrics, crew names, permits",
                    icon: "⚠️",
                  },
                  {
                    title: "Isolation Analysis",
                    description: "Automatic valve closure suggestions per fault location",
                    icon: "🔐",
                  },
                  {
                    title: "Hydraulic Modeling",
                    description: "EPANET-based pressure & demand analysis with upgrades",
                    icon: "📊",
                  },
                  {
                    title: "Zone Management",
                    description: "DMA boundaries, leakage tracking, water balance",
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
              <h2 className="text-2xl font-bold mb-6">Network Maps</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  href="/professional/infrastructure/water/master-b-mobile?viewId=A"
                  className="block p-6 border-2 border-blue-300 rounded-lg hover:border-blue-600 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold text-blue-600">📡 Map A - Live Network</h3>
                  <p className="text-gray-600 mt-2">
                    Real-time network from database (53,551 nodes, segments)
                  </p>
                </Link>

                <Link
                  href="/professional/infrastructure/water/master-b-mobile?viewId=B"
                  className="block p-6 border-2 border-cyan-300 rounded-lg hover:border-cyan-600 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold text-cyan-600">🗺️ Map B - Authentic</h3>
                  <p className="text-gray-600 mt-2">
                    DWG-derived tiles (v4 LOD levels for fast loading)
                  </p>
                </Link>

                <Link
                  href="/professional/infrastructure/water/master-b-mobile?viewId=D"
                  className="block p-6 border-2 border-green-300 rounded-lg hover:border-green-600 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold text-green-600">🎯 Map D - Register</h3>
                  <p className="text-gray-600 mt-2">
                    Valve markers with numbering & isolation data
                  </p>
                </Link>

                <Link
                  href="/professional/infrastructure/water/register"
                  className="block p-6 border-2 border-purple-300 rounded-lg hover:border-purple-600 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold text-purple-600">📑 Register</h3>
                  <p className="text-gray-600 mt-2">
                    Search assets by street, area, or number
                  </p>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Register Tab */}
        {activeTab === "register" && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-6">Asset Register</h2>
            <p className="text-gray-600 mb-4">
              Complete catalog of 10,270 water network assets
            </p>
            <Link
              href="/professional/infrastructure/water/register"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              🔍 View Full Register
            </Link>
          </div>
        )}

        {/* Faults Tab */}
        {activeTab === "faults" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold mb-6">Fault Management</h2>
              <p className="text-gray-600 mb-6">
                Record and track water distribution network damage events
              </p>
            </div>
            <WaterFaultRecorder />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-6">Analytics & Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">
                  📊 Hydraulic Model
                </h3>
                <p className="text-sm text-gray-600">
                  Pressure, demand, leakage analysis with upgrade proposals
                </p>
              </div>
              <div className="p-6 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">🎯 Zone Analysis</h3>
                <p className="text-sm text-gray-600">
                  DMA boundaries, water balance (IWA framework)
                </p>
              </div>
              <div className="p-6 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">
                  📈 Performance Metrics
                </h3>
                <p className="text-sm text-gray-600">
                  Non-revenue water, fault history, response times
                </p>
              </div>
              <div className="p-6 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">
                  🔐 Isolation Analysis
                </h3>
                <p className="text-sm text-gray-600">
                  Auto-computed valve closure sets per segment
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
            Professional Water Infrastructure Management • Pantavion 2026
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Built with EPANET • PostGIS • International Standards
          </p>
        </div>
      </footer>
    </div>
  );
}
