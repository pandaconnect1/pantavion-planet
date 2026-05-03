import Link from "next/link";

const email = "info.pandaconnect@gmail.com";

const feedbackOptions = [
  {
    title: "Μου αρέσει / I like it",
    text: "Στείλε γρήγορα ότι σου άρεσε το Pantavion.",
    body:
      "Hello Pantavion,\n\nI visited pantavion.com and I like the direction.\n\nWhat I liked:\n\nMy country/language:\n\nName, optional:\n"
  },
  {
    title: "Δεν κατάλαβα κάτι / I did not understand something",
    text: "Πες τι σε μπέρδεψε για να το κάνουμε πιο απλό.",
    body:
      "Hello Pantavion,\n\nI visited pantavion.com and I did not understand this part:\n\nPage or button:\n\nWhat confused me:\n\nMy country/language:\n"
  },
  {
    title: "Θέλω πρόσκληση / I want access",
    text: "Ζήτα πρόσκληση για early access ή ενημέρωση.",
    body:
      "Hello Pantavion,\n\nI want early access or updates for Pantavion.\n\nName:\nCountry:\nLanguage:\nUse case:\n"
  },
  {
    title: "Βρήκα πρόβλημα / I found a problem",
    text: "Ανάφερε λάθος, νεκρό κουμπί, γλώσσα, SOS κείμενο ή τεχνικό θέμα.",
    body:
      "Hello Pantavion,\n\nI found a problem on pantavion.com.\n\nPage:\nProblem:\nDevice/browser:\nLanguage:\nScreenshot available: yes/no\n"
  },
  {
    title: "Θέλω να βοηθήσω / I want to help",
    text: "Για μεταφράσεις, δοκιμές, συνεργασία, κοινότητες ή ιδρύματα.",
    body:
      "Hello Pantavion,\n\nI want to help Pantavion.\n\nName:\nCountry:\nLanguage:\nHow I can help:\nOrganization, optional:\n"
  }
];

function mailtoFor(body: string) {
  return `mailto:${email}?subject=${encodeURIComponent(
    "Pantavion feedback"
  )}&body=${encodeURIComponent(body)}`;
}

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex w-fit rounded-full border border-[#d7b56d]/40 px-4 py-2 text-sm text-[#f6d889] hover:border-[#f6d889]"
        >
          ← Pantavion
        </Link>

        <div className="rounded-[2rem] border border-[#d7b56d]/25 bg-[#0b1b31]/90 p-6 shadow-2xl md:p-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.32em] text-[#f6d889]">
            Pantavion Feedback
          </p>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Στείλε γνώμη για το Pantavion.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Βοήθησε να γίνει το Pantavion πιο καθαρό, πιο ασφαλές και πιο χρήσιμο
            για ανθρώπους, οικογένειες, ηλικιωμένους, νέους, κοινότητες και
            επαγγελματίες σε όλο τον κόσμο.
          </p>

          <div className="mt-8 rounded-2xl border border-red-400/35 bg-red-950/35 p-4 text-sm leading-6 text-red-100">
            <strong>Emergency boundary:</strong> This feedback page is not an
            emergency dispatch channel. In immediate danger, use your local
            emergency number and your trusted contacts first.
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {feedbackOptions.map((option) => (
              <a
                key={option.title}
                href={mailtoFor(option.body)}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-[#f6d889]/70 hover:bg-white/[0.07]"
              >
                <h2 className="text-xl font-semibold text-[#f6d889]">
                  {option.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {option.text}
                </p>
                <span className="mt-4 inline-flex text-sm font-semibold text-white">
                  Send feedback →
                </span>
              </a>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
            <p>
              Email destination: <span className="text-slate-200">{email}</span>
            </p>
            <Link href="/sos" className="font-semibold text-[#f6d889]">
              Open SOS safety layer →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
