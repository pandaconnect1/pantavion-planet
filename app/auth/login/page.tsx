import LoginClient from "./LoginClient";

type SearchParams = Promise<{
  next?: string | string[];
  reset?: string | string[];
  error?: string | string[];
}>;

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
  const resetDone = firstParam(params.reset) === "success";
  const error = firstParam(params.error);

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto flex min-h-[72vh] max-w-md items-center">
        <div className="w-full">
          {resetDone ? (
            <div className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-100">
              Ο νέος κωδικός αποθηκεύτηκε. Συνδέσου τώρα με τον νέο κωδικό.
            </div>
          ) : null}
          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm leading-6 text-rose-100">
              Η σύνδεση απέτυχε. Έλεγξε το email/κωδικό ή χρησιμοποίησε «Ξέχασα τον κωδικό».
            </div>
          ) : null}
          <LoginClient nextPath={nextPath} />
        </div>
      </div>
    </main>
  );
}
