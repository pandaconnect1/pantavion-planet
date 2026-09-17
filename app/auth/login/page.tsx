import LoginClient from "./LoginClient";

type SearchParams = Promise<{ next?: string | string[] }>;

function firstParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/profile";
  return value;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const nextPath = safeNextPath(firstParam(params.next));

  return (
    <section className="pv-section">
      <div className="pv-container">
        <LoginClient nextPath={nextPath} />
      </div>
    </section>
  );
}
