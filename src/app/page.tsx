import ChatWindow from "@/components/chat/ChatWindow";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-6 pt-8 sm:px-6">
      <header className="mb-6 border-b border-line pb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
          Skylark Drones · Internal Tool
        </p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-ink">
          Business Intelligence Agent
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/60">
          Ask about pipeline, deals, or work orders — every answer is pulled live from
          monday.com, not from a static export.
        </p>
      </header>

      <ChatWindow />
    </main>
  );
}
