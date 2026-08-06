import { BottomNavigation } from "@/components/bottom-navigation";

export function PlaceholderScreen({ title, description }: { title: string; description: string }) {
  return (
    <main className="app-frame">
      <div className="content">
        <header className="header">
          <div>
            <p className="eyebrow">Hưng Phát</p>
            <h1 className="title">{title}</h1>
          </div>
        </header>
        <section className="hero">
          <h2>{title}</h2>
          <p>{description}</p>
        </section>
      </div>
      <BottomNavigation />
    </main>
  );
}
