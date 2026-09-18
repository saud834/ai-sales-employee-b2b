export interface EditableField {
  path: string[];
  value: string | number | boolean;
  type: "string" | "number" | "boolean";
}

/** Flattens a section's props into editable leaf fields, descending through
 * plain objects up to maxDepth. Arrays (lists of testimonials, menu items,
 * etc.) are intentionally left out of this simple editor — those are best
 * changed through the chat, where the AI can add/remove/reorder items. */
export function flattenEditableProps(
  props: Record<string, unknown>,
  maxDepth = 2
): EditableField[] {
  const out: EditableField[] = [];

  function walk(obj: Record<string, unknown>, prefix: string[], depth: number) {
    for (const [key, value] of Object.entries(obj)) {
      const path = [...prefix, key];
      if (value === null || value === undefined) continue;
      if (typeof value === "string") out.push({ path, value, type: "string" });
      else if (typeof value === "number") out.push({ path, value, type: "number" });
      else if (typeof value === "boolean") out.push({ path, value, type: "boolean" });
      else if (Array.isArray(value)) continue;
      else if (typeof value === "object" && depth < maxDepth) {
        walk(value as Record<string, unknown>, path, depth + 1);
      }
    }
  }

  walk(props, [], 1);
  return out;
}

export function setDeepClone<T>(source: T, path: string[], value: unknown): T {
  const clone = JSON.parse(JSON.stringify(source));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cursor: any = clone;
  for (let i = 0; i < path.length - 1; i++) {
    cursor = cursor[path[i]];
  }
  cursor[path[path.length - 1]] = value;
  return clone;
}

export function pathLabel(path: string[]): string {
  const words = path.map((p) => p.replace(/([A-Z])/g, " $1").toLowerCase());
  const label = words.join(" – ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}
