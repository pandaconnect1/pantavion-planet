"use client";

import { useState } from "react";
import { useCallback } from "react";

interface FaultRecord {
  id?: string;
  asset_number?: string;
  street?: string;
  area_code?: string;
  fault_ref?: string;
  description?: string;
  severity?: "minor" | "major" | "critical";
  isolation_valves?: string[];
  status?: "open" | "in_progress" | "resolved";
  crew_names?: string[];
  photos_count?: number;
  excavation_depth_cm?: number;
  excavation_width_cm?: number;
  excavation_length_cm?: number;
  materials_damaged?: string[];
  permit_number?: string;
  opened_at?: string;
  resolved_at?: string;
}

export function WaterFaultRecorder() {
  const [fault, setFault] = useState<FaultRecord>({
    severity: "major",
    status: "open",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = useCallback(
    (key: keyof FaultRecord, value: any) => {
      setFault((prev) => ({ ...prev, [key]: value }));
      setError("");
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Generate fault reference if not provided
      const faultRef =
        fault.fault_ref || `FLT-${new Date().getTime()}`;

      const response = await fetch(
        "/api/professional/infrastructure/water/fault",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...fault,
            fault_ref: faultRef,
            opened_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to record fault");
      }

      setSuccess(true);
      setFault({ severity: "major", status: "open" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [fault]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        📝 Καταγραφή Βλάβης Δικτύου
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded border border-green-200">
          ✅ Βλάβη καταγράφηκε με επιτυχία
        </div>
      )}

      <div className="space-y-6">
        {/* Asset Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Αριθμός Περιουσίας (π.χ. 120-V0001)
          </label>
          <input
            type="text"
            placeholder="120-V0001"
            value={fault.asset_number || ""}
            onChange={(e) =>
              handleInputChange("asset_number", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Street */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Οδός
          </label>
          <input
            type="text"
            placeholder="Όνομα οδού"
            value={fault.street || ""}
            onChange={(e) => handleInputChange("street", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Area Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Κωδικός Περιοχής
          </label>
          <input
            type="text"
            placeholder="e.g. 120"
            value={fault.area_code || ""}
            onChange={(e) => handleInputChange("area_code", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Περιγραφή Βλάβης
          </label>
          <textarea
            placeholder="Περιγράψτε τη βλάβη..."
            value={fault.description || ""}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Σοβαρότητα
          </label>
          <select
            value={fault.severity || "major"}
            onChange={(e) =>
              handleInputChange(
                "severity",
                e.target.value as "minor" | "major" | "critical"
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="minor">🟡 Μικρή</option>
            <option value="major">🔴 Μεγάλη</option>
            <option value="critical">🔥 Κρίσιμη</option>
          </select>
        </div>

        {/* Excavation Dimensions */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Βάθος (cm)
            </label>
            <input
              type="number"
              value={fault.excavation_depth_cm || ""}
              onChange={(e) =>
                handleInputChange("excavation_depth_cm", parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Πλάτος (cm)
            </label>
            <input
              type="number"
              value={fault.excavation_width_cm || ""}
              onChange={(e) =>
                handleInputChange("excavation_width_cm", parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Μήκος (cm)
            </label>
            <input
              type="number"
              value={fault.excavation_length_cm || ""}
              onChange={(e) =>
                handleInputChange("excavation_length_cm", parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Permit Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Αριθμός Δελτίου Εκσκαφής
          </label>
          <input
            type="text"
            placeholder="EXC-2026-123"
            value={fault.permit_number || ""}
            onChange={(e) => handleInputChange("permit_number", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Crew Names */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ονόματα Ομάδας
          </label>
          <input
            type="text"
            placeholder="Όνομα 1, Όνομα 2, ..."
            value={(fault.crew_names || []).join(", ")}
            onChange={(e) =>
              handleInputChange(
                "crew_names",
                e.target.value.split(",").map((s) => s.trim())
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {loading ? "📤 Αποστολή..." : "✅ Αποθήκευση Βλάβης"}
          </button>
          <button
            onClick={() => setFault({ severity: "major", status: "open" })}
            className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 font-medium"
          >
            🔄 Καθαρισμός
          </button>
        </div>
      </div>
    </div>
  );
}
