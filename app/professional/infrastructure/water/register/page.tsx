"use client";

import { useState, useEffect } from "react";

interface Asset {
  area_code: string;
  area_name: string;
  street: string;
  kind: string;
  number: string;
  dn: string;
  name: string;
  origin: string;
}

export default function WaterRegisterPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sortBy, setSortBy] = useState<"area" | "street" | "number">("area");

  useEffect(() => {
    // Fetch assets from API (will be implemented)
    const fetchAssets = async () => {
      try {
        const response = await fetch(
          "/api/professional/infrastructure/water/faults?action=list_assets"
        );
        // For now, use mock data
        // const data = await response.json();
        // setAssets(data.assets || []);
        setAssets([]);
      } catch (error) {
        console.error("Failed to fetch assets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  // Filter and sort assets
  let filteredAssets = assets
    .filter(
      (a) =>
        (a.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.number.includes(searchTerm) ||
          a.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!filterArea || a.area_code === filterArea) &&
        (!filterType || a.kind === filterType)
    )
    .sort((a, b) => {
      if (sortBy === "area") {
        return a.area_code.localeCompare(b.area_code);
      } else if (sortBy === "street") {
        return a.street.localeCompare(b.street);
      } else {
        return a.number.localeCompare(b.number);
      }
    });

  const uniqueAreas = [...new Set(assets.map((a) => a.area_code))];
  const uniqueTypes = [...new Set(assets.map((a) => a.kind))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold">📋 Μητρώο Δικτύου Νερού</h1>
          <p className="text-blue-100 mt-2">
            {filteredAssets.length} στοιχεία (Σύνολο: {assets.length})
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="🔍 Αναζήτηση: οδός, αριθμός, όνομα..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="area">📍 Ταξινόμηση: Περιοχή</option>
                <option value="street">🛣️ Ταξινόμηση: Οδός</option>
                <option value="number">🔢 Ταξινόμηση: Αριθμός</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">📍 Όλες οι περιοχές</option>
                {uniqueAreas.sort().map((area) => (
                  <option key={area} value={area}>
                    Περιοχή {area}
                  </option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">🔧 Όλα τα είδη</option>
                {uniqueTypes.sort().map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Φόρτωση δεδομένων...</p>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Δεν βρέθηκαν αποτελέσματα</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                        Περιοχή
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                        Οδός
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                        Είδος
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                        Αριθμός
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                        DN/Διάμετρος
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                        Όνομα
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                        Προέλευση
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAssets.map((asset, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-blue-50 transition cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {asset.area_code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {asset.street}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {asset.kind}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {asset.number}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {asset.dn || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {asset.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {asset.origin || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {!loading && assets.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-900">Σύνολο</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {assets.length}
                </p>
              </div>
              <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                <p className="text-sm font-medium text-cyan-900">Ρέγουλες</p>
                <p className="text-2xl font-bold text-cyan-600 mt-2">
                  {assets.filter((a) => a.kind === "valve").length}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm font-medium text-green-900">Υδροστόμια</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {assets.filter((a) => a.kind === "hydrant").length}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm font-medium text-purple-900">Περιοχές</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {uniqueAreas.length}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
