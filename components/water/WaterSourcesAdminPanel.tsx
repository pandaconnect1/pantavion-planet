import type {
  PantavionArtifactIntakeAssessment,
  PantavionArtifactIntakeRule
} from "@/core/artifacts/artifact-intake-registry";

type Props = {
  rules: PantavionArtifactIntakeRule[];
  dwgAssessment: PantavionArtifactIntakeAssessment;
  geojsonAssessment: PantavionArtifactIntakeAssessment;
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#f6d37a]/30 bg-[#f6d37a]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f6d37a]">
      {children}
    </span>
  );
}

function AssessmentCard({
  title,
  assessment
}: {
  title: string;
  assessment: PantavionArtifactIntakeAssessment;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <Pill>{assessment.blocked ? "blocked" : "allowed"}</Pill>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-2">
        <p>Extension: {assessment.extension}</p>
        <p>Strategy: {assessment.recommendedUploadStrategy}</p>
        <p>Source class: {assessment.artifactClass}</p>
        <p>Private storage: {assessment.requiresPrivateStorage ? "required" : "not required"}</p>
        <p>SHA256: {assessment.requiresSha256 ? "required" : "not required"}</p>
        <p>Founder approval: {assessment.requiresFounderApproval ? "required" : "not required"}</p>
      </div>

      <div className="mt-4 rounded-2xl border border-[#f6d37a]/20 bg-[#f6d37a]/10 p-4 text-sm text-[#f7e5ad]">
        {assessment.notes[0]}
      </div>
    </div>
  );
}

export function WaterSourcesAdminPanel({
  rules,
  dwgAssessment,
  geojsonAssessment
}: Props) {
  return (
    <section className="space-y-8 text-white">
      <div className="rounded-3xl border border-[#f6d37a]/25 bg-[#050814] p-7 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#f6d37a]">
              Pantavion Water Sources
            </p>
            <h1 className="mt-3 text-3xl font-semibold">
              Artifact Intake / Upload Source Registry
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-white/65">
              This page is the admin intake surface for DWG, CAD, GIS, PDF and archive map
              artifacts. It does not upload bytes yet. It shows the real registry rules,
              source-truth gates, private storage requirements, SHA256 requirements and B/C
              binding status.
            </p>
          </div>
          <Pill>internal foundation</Pill>
        </div>

        <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
          DWG original source truth must not be committed to Git, placed in public folders,
          converted to GeoJSON/PDF/image as original, or rendered without a licensed CAD/DWG
          adapter and founder approval.
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AssessmentCard title="Original DWG intake example" assessment={dwgAssessment} />
        <AssessmentCard title="GeoJSON derivative intake example" assessment={geojsonAssessment} />
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#050814] p-6">
        <h2 className="text-xl font-semibold text-white">Supported intake rules</h2>
        <div className="mt-5 grid gap-4">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{rule.label}</p>
                  <p className="mt-1 text-xs text-white/50">
                    {rule.extensions.map((ext) => ext.toUpperCase()).join(", ")}
                  </p>
                </div>
                <Pill>{rule.allowedForPrivateUploadSession ? "private upload" : "metadata only"}</Pill>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-white/60 md:grid-cols-3">
                <p>Strategy: {rule.allowedForPrivateUploadSession ? "private upload session" : "metadata only"}</p>
                <p>Private storage: {rule.requiresPrivateStorage ? "yes" : "no"}</p>
                <p>SHA256: {rule.requiresSha256 ? "yes" : "no"}</p>
              </div>

              <p className="mt-3 text-sm text-white/60">{rule.notes[0]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
