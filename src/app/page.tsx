import LinkScanner from "./components/LinkScanner";

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="bg-[#0b1a33] px-6 py-12 text-center text-white">
        <h1 className="text-4xl font-bold tracking-tight">Link Shield</h1>
        <p className="mt-3 text-lg text-slate-300">
          Vérifiez un lien avant de cliquer
        </p>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-10">
        <LinkScanner />
      </section>
    </main>
  );
}