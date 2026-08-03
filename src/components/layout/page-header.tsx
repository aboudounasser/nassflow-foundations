export function ModulePage({ title, description }: { title: string; description: string }) {
  return (
    <section className="col-span-12">
      <h1 className="text-foreground">{title}</h1>
      <p className="mt-2 text-[16px] text-muted-foreground">{description}</p>
    </section>
  );
}
