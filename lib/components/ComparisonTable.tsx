import { Container, SectionHeading } from "@/lib/components/ui";

export interface ComparisonRow {
  feature: string;
  values: Array<string | boolean>;
}

export interface ComparisonTableProps {
  heading?: string;
  columns: string[];
  rows: ComparisonRow[];
}

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return (
      <span aria-label={value ? "Included" : "Not included"} className={value ? "text-accent" : "text-ink/30"}>
        {value ? "✓" : "–"}
      </span>
    );
  }
  return <span>{value}</span>;
}

export default function ComparisonTable({ heading, columns, rows }: ComparisonTableProps) {
  return (
    <section aria-label={heading ?? "Comparison"} className="py-16 sm:py-20">
      <Container>
        {heading && <SectionHeading heading={heading} align="center" />}
        <div className="overflow-x-auto rounded-site border border-ink/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/5">
              <tr>
                <th scope="col" className="p-4 font-semibold text-ink">
                  Feature
                </th>
                {columns.map((col, i) => (
                  <th key={i} scope="col" className="p-4 font-semibold text-ink">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-t border-ink/10">
                  <th scope="row" className="p-4 font-medium text-ink">
                    {row.feature}
                  </th>
                  {row.values.map((v, vi) => (
                    <td key={vi} className="p-4 text-ink/80">
                      <Cell value={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}
