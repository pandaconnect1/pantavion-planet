"use client";

import { useState } from "react";
import { MOCK_ISOLATION_HINTS } from "@/lib/mock-water-data";

interface IsolationHintsProps {
  selectedAsset?: string;
  onHintSelect?: (affectedAssets: string[]) => void;
}

export function IsolationHints({
  selectedAsset,
  onHintSelect,
}: IsolationHintsProps) {
  const hints = selectedAsset
    ? MOCK_ISOLATION_HINTS[selectedAsset] || []
    : [];

  const handleShowIsolation = () => {
    if (selectedAsset && hints.length > 0) {
      onHintSelect?.(hints);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔐</span>
        <h3 className="font-bold text-gray-900">Υπόδειξη Απομόνωσης</h3>
      </div>

      {selectedAsset ? (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Ρέγουλα:</strong> {selectedAsset}
            </p>
          </div>

          {hints.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                ⚠️ Κλείσιμο επηρεάζει {hints.length} στοιχεία:
              </p>
              <div className="space-y-1">
                {hints.map((hint) => (
                  <div key={hint} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span className="text-gray-700">{hint}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleShowIsolation}
                className="w-full mt-3 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                🗺️ Προβολή στον χάρτη
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Δεν υπάρχουν στοιχεία που επηρεάζονται
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          Επιλέξτε ρέγουλα στο χάρτη για εμφάνιση υποδείξεων
        </p>
      )}
    </div>
  );
}
