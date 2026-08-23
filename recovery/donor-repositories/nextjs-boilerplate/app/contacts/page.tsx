"use client";

import { useState } from "react";

type ImportState = "idle" | "requesting" | "importing" | "done";

export default function ContactsPage() {
  const [state, setState] = useState<ImportState>("idle");

  const handleImport = () => {
    setState("requesting");
    setTimeout(() => {
      setState("importing");
      setTimeout(() => setState("done"), 1500);
    }, 800);
  };

  return (
    <div className="pv-page">
      <h1>Contacts & Friends Import</h1>
      <p className="pv-page-subtitle">
        Εδώ θα ζητάμε επίσημη άδεια από τον χρήστη για να διαβάσουμε επαφές από το κινητό
        και να βρούμε ποιοι φίλοι είναι ήδη στο Pantavion One.
      </p>

      <div className="pv-card">
        <ol className="pv-steps">
          <li>Ζητάμε άδεια για πρόσβαση στις επαφές.</li>
          <li>Στέλνουμε μόνο τα απαραίτητα hashed στοιχεία στον server.</li>
          <li>Βρίσκουμε ποιοι είναι ήδη στο Pantavion One.</li>
          <li>Προτείνουμε μαζική αποστολή αιτημάτων φιλίας / προσκλήσεων.</li>
        </ol>

        <button
          className="pv-button pv-button-primary"
          onClick={handleImport}
          disabled={state !== "idle" && state !== "done"}
        >
          {state === "idle" && "👥 Ξεκίνα mock import"}
          {state === "requesting" && "Αίτημα άδειας… (demo) "}
          {state === "importing" && "Εισαγωγή επαφών… (demo)"}
          {state === "done" && "Ολοκληρώθηκε το demo"}
        </button>
      </div>
    </div>
  );
}
