type HighlightTextProps = {
  text: string;
  query: string;
};

export function HighlightText({ text, query }: HighlightTextProps) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return <>{text}</>;

  const index = text.toLowerCase().indexOf(cleanQuery.toLowerCase());
  if (index === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-clay/20 px-1 text-clay-900">
        {text.slice(index, index + cleanQuery.length)}
      </mark>
      {text.slice(index + cleanQuery.length)}
    </>
  );
}
