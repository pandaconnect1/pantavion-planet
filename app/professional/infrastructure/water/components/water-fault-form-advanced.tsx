"use client";

import { useState, useRef } from "react";

interface Material {
  id: string;
  name: string;
  type: "pipe" | "valve" | "tank" | "soil";
  unit: string;
  quantity: number;
  condition: "good" | "damaged" | "broken";
  photo?: string;
  notes?: string;
}

interface ExcavationData {
  width_cm: number;
  length_cm: number;
  depth_cm: number;
  soil_type: "asphalt" | "concrete" | "soil" | "rock" | "mixed";
  volume_m3: number;
}

export function WaterFaultFormAdvanced() {
  const [activeSection, setActiveSection] = useState<
    "location" | "damage" | "materials" | "excavation" | "photos" | "review"
  >("location");

  const [fault, setFault] = useState({
    asset_number: "",
    street: "",
    area_code: "",
    description: "",
    severity: "major" as "minor" | "major" | "critical",
  });

  const [materials, setMaterials] = useState<Material[]>([]);
  const [excavation, setExcavation] = useState<ExcavationData>({
    width_cm: 0,
    length_cm: 0,
    depth_cm: 0,
    soil_type: "soil",
    volume_m3: 0,
  });

  const [photos, setPhotos] = useState<Array<{ url: string; type: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateVolume = () => {
    const volume =
      (excavation.width_cm * excavation.length_cm * excavation.depth_cm) /
      1000000; // Convert cm³ to m³
    setExcavation((prev) => ({ ...prev, volume_m3: volume }));
  };

  const addMaterial = () => {
    const newMaterial: Material = {
      id: `MAT-${Date.now()}`,
      name: "",
      type: "pipe",
      unit: "meter",
      quantity: 0,
      condition: "good",
    };
    setMaterials((prev) => [...prev, newMaterial]);
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPhotos((prev) => [
            ...prev,
            { url: event.target?.result as string, type: "excavation" },
          ]);
        };
        reader.readAsDataURL(files[i]);
      }
    }
  };

  const sections = [
    { id: "location", label: "📍 Θέση & Περιοχή", icon: "📍" },
    { id: "damage", label: "⚠️ Περιγραφή Ζημιάς", icon: "⚠️" },
    { id: "materials", label: "🔧 Υλικά", icon: "🔧" },
    { id: "excavation", label: "🪓 Εκσκαφή", icon: "🪓" },
    { id: "photos", label: "📸 Φωτογραφίες", icon: "📸" },
    { id: "review", label: "✅ Ανασκόπηση", icon: "✅" },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6">
        <h2 className="text-3xl font-bold">💧 Αναλυτική Καταγραφή Βλάβης</h2>
        <p className="text-blue-100 mt-1">
          Πλήρης τεκμηρίωση με φωτογραφίες, υλικά, και μετρήσεις
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex overflow-x-auto bg-gray-100 border-b">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as typeof activeSection)}
            className={`px-4 py-3 font-medium whitespace-nowrap transition ${
              activeSection === section.id
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-700 hover:bg-white"
            }`}
          >
            {section.icon} {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-8 space-y-6">
        {/* Location Section */}
        {activeSection === "location" && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">
              📍 Αναγνώριση Τοποθεσίας
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="π.χ. 120-V0001"
                value={fault.asset_number}
                onChange={(e) =>
                  setFault({ ...fault, asset_number: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Όνομα Οδού"
                value={fault.street}
                onChange={(e) => setFault({ ...fault, street: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Κωδικός Περιοχής"
                value={fault.area_code}
                onChange={(e) =>
                  setFault({ ...fault, area_code: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={fault.severity}
                onChange={(e) =>
                  setFault({
                    ...fault,
                    severity: e.target.value as any,
                  })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="minor">🟡 Μικρή</option>
                <option value="major">🔴 Μεγάλη</option>
                <option value="critical">🔥 Κρίσιμη</option>
              </select>
            </div>
            <button
              onClick={() => setActiveSection("damage")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium mt-4"
            >
              Επόμενο →
            </button>
          </div>
        )}

        {/* Damage Description */}
        {activeSection === "damage" && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">⚠️ Περιγραφή</h3>
            <textarea
              placeholder="Περιγράψτε τη ζημιά λεπτομερώς..."
              value={fault.description}
              onChange={(e) =>
                setFault({ ...fault, description: e.target.value })
              }
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setActiveSection("location")}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              >
                ← Πίσω
              </button>
              <button
                onClick={() => setActiveSection("materials")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Επόμενο →
              </button>
            </div>
          </div>
        )}

        {/* Materials Section */}
        {activeSection === "materials" && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">🔧 Υλικά</h3>
            <div className="space-y-3">
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  className="p-4 border border-gray-300 rounded-lg space-y-2"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Όνομα υλικού"
                      value={mat.name}
                      onChange={(e) =>
                        updateMaterial(mat.id, { name: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <select
                      value={mat.type}
                      onChange={(e) =>
                        updateMaterial(mat.id, { type: e.target.value as any })
                      }
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="pipe">Αγωγός</option>
                      <option value="valve">Βάνα</option>
                      <option value="tank">Δεξαμενή</option>
                      <option value="soil">Έδαφος</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Ποσότητα"
                      value={mat.quantity}
                      onChange={(e) =>
                        updateMaterial(mat.id, {
                          quantity: parseInt(e.target.value),
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Μονάδα"
                      value={mat.unit}
                      onChange={(e) =>
                        updateMaterial(mat.id, { unit: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <select
                      value={mat.condition}
                      onChange={(e) =>
                        updateMaterial(mat.id, { condition: e.target.value as any })
                      }
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="good">Καλό</option>
                      <option value="damaged">Ζημιάχ</option>
                      <option value="broken">Σπασμένο</option>
                    </select>
                  </div>
                  <button
                    onClick={() => deleteMaterial(mat.id)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    🗑️ Διαγραφή
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addMaterial}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              + Προσθήκη Υλικού
            </button>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setActiveSection("damage")}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              >
                ← Πίσω
              </button>
              <button
                onClick={() => setActiveSection("excavation")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Επόμενο →
              </button>
            </div>
          </div>
        )}

        {/* Excavation Section */}
        {activeSection === "excavation" && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">🪓 Εκσκαφή</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Πλάτος (cm)
                </label>
                <input
                  type="number"
                  value={excavation.width_cm}
                  onChange={(e) => {
                    setExcavation({
                      ...excavation,
                      width_cm: parseInt(e.target.value),
                    });
                    calculateVolume();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Μήκος (cm)
                </label>
                <input
                  type="number"
                  value={excavation.length_cm}
                  onChange={(e) => {
                    setExcavation({
                      ...excavation,
                      length_cm: parseInt(e.target.value),
                    });
                    calculateVolume();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Βάθος (cm)
                </label>
                <input
                  type="number"
                  value={excavation.depth_cm}
                  onChange={(e) => {
                    setExcavation({
                      ...excavation,
                      depth_cm: parseInt(e.target.value),
                    });
                    calculateVolume();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Είδος Εδάφους
                </label>
                <select
                  value={excavation.soil_type}
                  onChange={(e) =>
                    setExcavation({
                      ...excavation,
                      soil_type: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="asphalt">Άσφαλτος</option>
                  <option value="concrete">Σκυρόδεμα</option>
                  <option value="soil">Χώμα</option>
                  <option value="rock">Βράχος</option>
                  <option value="mixed">Μικτό</option>
                </select>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-lg font-bold text-blue-900">
                💧 Κυβικά Μέτρα: {excavation.volume_m3.toFixed(2)} m³
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Υπολογίζεται αυτόματα από τις διαστάσεις
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setActiveSection("materials")}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              >
                ← Πίσω
              </button>
              <button
                onClick={() => setActiveSection("photos")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Επόμενο →
              </button>
            </div>
          </div>
        )}

        {/* Photos Section */}
        {activeSection === "photos" && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">📸 Φωτογραφίες</h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 font-medium"
            >
              📤 Ανέβασμα Φωτογραφιών
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <div className="grid grid-cols-3 gap-4">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={photo.url}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                    <button
                      onClick={() =>
                        setPhotos((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      🗑️ Διαγραφή
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setActiveSection("excavation")}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              >
                ← Πίσω
              </button>
              <button
                onClick={() => setActiveSection("review")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Τελική Ανασκόπηση →
              </button>
            </div>
          </div>
        )}

        {/* Review Section */}
        {activeSection === "review" && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">✅ Ανασκόπηση</h3>
            <div className="bg-gray-50 p-6 rounded-lg space-y-3">
              <h4 className="font-bold">📍 Θέση</h4>
              <p className="text-sm text-gray-600">
                {fault.asset_number} • {fault.street} • Περιοχή {fault.area_code}
              </p>

              <h4 className="font-bold mt-4">⚠️ Σοβαρότητα</h4>
              <p className="text-sm text-gray-600">{fault.severity}</p>

              <h4 className="font-bold mt-4">🔧 Υλικά ({materials.length})</h4>
              <div className="text-sm text-gray-600 space-y-1">
                {materials.map((m) => (
                  <p key={m.id}>
                    • {m.name} - {m.quantity} {m.unit} ({m.condition})
                  </p>
                ))}
              </div>

              <h4 className="font-bold mt-4">🪓 Εκσκαφή</h4>
              <p className="text-sm text-gray-600">
                {excavation.width_cm}cm × {excavation.length_cm}cm ×{" "}
                {excavation.depth_cm}cm = {excavation.volume_m3.toFixed(2)} m³ ({excavation.soil_type})
              </p>

              <h4 className="font-bold mt-4">📸 Φωτογραφίες</h4>
              <p className="text-sm text-gray-600">{photos.length} φωτογραφίες ανεβασμένες</p>
            </div>

            <button
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold text-lg"
            >
              ✅ Αποθήκευση Πλήρους Καταγραφής
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
