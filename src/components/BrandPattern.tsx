export function BrandPattern() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute right-[-8rem] top-[-6rem] h-72 w-72 rounded-full border border-charcoal/10" />
      <div className="absolute right-10 top-20 h-20 w-20 rounded-full border border-clay/35" />
      <div className="absolute bottom-12 left-[-4rem] grid h-40 w-40 grid-cols-4 gap-2 opacity-35">
        {Array.from({ length: 16 }).map((_, index) => (
          <span
            key={index}
            className="rounded-full bg-charcoal/10"
            style={{ opacity: 0.25 + (index % 4) * 0.12 }}
          />
        ))}
      </div>
    </div>
  );
}
