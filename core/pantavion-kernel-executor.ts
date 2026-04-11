export function runPantavionExecutionLayer(mission: any) {
  const intent = mission?.intent;

  if (intent === "build_website") {
    return {
      type: "app",
      name: "pantavion-generated-site",
      structure: {
        pages: ["home", "about", "contact"],
        stack: "Next.js + Tailwind",
      },
      codePreview: `
export default function Home() {
  return (
    <div className="p-10 text-white bg-black">
      <h1>Pantavion Generated Website</h1>
    </div>
  );
}
`,
    };
  }

  return {
    type: "noop",
    message: "No execution handler for this intent yet",
  };
}
