import JSZip from "jszip";
import * as XLSX from "xlsx";
import { extractText as pdfExtractText, getDocumentProxy } from "unpdf";
import type { ExtractedSegment, ExtractionResult, FileType } from "../types";

const decoder = new TextDecoder("utf-8");

function segmentsForPlainText(text: string): ExtractedSegment[] {
  // Split on blank lines into paragraph-ish segments so headings/lists chunk cleanly.
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((text) => ({ text }));
}

function extractTxtOrMd(bytes: ArrayBuffer): ExtractionResult {
  const text = decoder.decode(bytes);
  return { segments: segmentsForPlainText(text), pageOrSheetCount: 1 };
}

/** Minimal RFC4180-ish CSV parser: handles quoted fields, escaped quotes, and commas inside quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function rowsToSegments(rows: string[][], sheetName: string | undefined, rowsPerBatch = 40): ExtractedSegment[] {
  if (rows.length === 0) return [];
  const header = rows[0];
  const segments: ExtractedSegment[] = [];
  for (let i = 1; i < rows.length; i += rowsPerBatch) {
    const batch = rows.slice(i, i + rowsPerBatch);
    const lines = [
      `| ${header.join(" | ")} |`,
      `| ${header.map(() => "---").join(" | ")} |`,
      ...batch.map((r) => `| ${r.join(" | ")} |`),
    ];
    segments.push({
      text: lines.join("\n"),
      sheet_name: sheetName,
      page_number: sheetName ? undefined : Math.floor(i / rowsPerBatch) + 1,
    });
  }
  return segments;
}

function extractCsv(bytes: ArrayBuffer): ExtractionResult {
  const rows = parseCsv(decoder.decode(bytes));
  return { segments: rowsToSegments(rows, undefined), pageOrSheetCount: 1 };
}

function extractXlsx(bytes: ArrayBuffer): ExtractionResult {
  const workbook = XLSX.read(bytes, { type: "array" });
  const segments: ExtractedSegment[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false, defval: "" }) as unknown as string[][];
    const stringRows = rows.map((r) => r.map((c) => String(c ?? "")));
    segments.push(...rowsToSegments(stringRows, sheetName));
  }
  return { segments, pageOrSheetCount: workbook.SheetNames.length };
}

/** Pulls <w:t> text runs out of word/document.xml, tagging heading paragraphs via their pStyle. */
async function extractDocx(bytes: ArrayBuffer): Promise<ExtractionResult> {
  const zip = await JSZip.loadAsync(bytes);
  const xmlFile = zip.file("word/document.xml");
  if (!xmlFile) return { segments: [], pageOrSheetCount: 0 };
  const xml = await xmlFile.async("text");

  const paragraphs = xml.match(/<w:p\b[\s\S]*?<\/w:p>/g) ?? [];
  const segments: ExtractedSegment[] = [];
  let currentHeading: string | undefined;

  for (const para of paragraphs) {
    const textRuns = [...para.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((m) => decodeXmlEntities(m[1]));
    const text = textRuns.join("").trim();
    if (!text) continue;

    const styleMatch = para.match(/<w:pStyle\s+w:val="([^"]+)"/);
    const isListItem = /<w:numPr>/.test(para);
    const isHeading = !!styleMatch && /heading|title/i.test(styleMatch[1]);

    if (isHeading) {
      currentHeading = text;
      segments.push({ text, heading: text });
    } else {
      segments.push({ text: isListItem ? `- ${text}` : text, heading: currentHeading });
    }
  }

  return { segments, pageOrSheetCount: 1 };
}

/** Pulls <a:t> text runs out of each ppt/slides/slideN.xml in slide order. */
async function extractPptx(bytes: ArrayBuffer): Promise<ExtractionResult> {
  const zip = await JSZip.loadAsync(bytes);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml/)?.[1] ?? 0);
      const nb = Number(b.match(/slide(\d+)\.xml/)?.[1] ?? 0);
      return na - nb;
    });

  const segments: ExtractedSegment[] = [];
  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.file(slideFiles[i])!.async("text");
    const textRuns = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => decodeXmlEntities(m[1]));
    const text = textRuns.join(" ").trim();
    if (!text) continue;
    segments.push({ text, page_number: i + 1 });
  }
  return { segments, pageOrSheetCount: slideFiles.length };
}

async function extractPdf(bytes: ArrayBuffer): Promise<ExtractionResult> {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text, totalPages } = await pdfExtractText(pdf, { mergePages: false });
  const pages = Array.isArray(text) ? text : [text];
  const segments: ExtractedSegment[] = pages
    .map((pageText, i) => ({ text: pageText.trim(), page_number: i + 1 }))
    .filter((s) => s.text.length > 0);
  return { segments, pageOrSheetCount: totalPages };
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export function detectFileType(filename: string, mimeType: string): FileType | null {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  const map: Record<string, FileType> = {
    pdf: "pdf",
    xlsx: "xlsx",
    xls: "xlsx",
    csv: "csv",
    docx: "docx",
    pptx: "pptx",
    txt: "txt",
    md: "md",
    markdown: "md",
  };
  if (map[ext]) return map[ext];

  const mimeMap: Record<string, FileType> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/csv": "csv",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt",
    "text/markdown": "md",
  };
  return mimeMap[mimeType] ?? null;
}

export async function extractByType(fileType: FileType, bytes: ArrayBuffer): Promise<ExtractionResult> {
  switch (fileType) {
    case "txt":
    case "md":
      return extractTxtOrMd(bytes);
    case "csv":
      return extractCsv(bytes);
    case "xlsx":
      return extractXlsx(bytes);
    case "docx":
      return extractDocx(bytes);
    case "pptx":
      return extractPptx(bytes);
    case "pdf":
      return extractPdf(bytes);
  }
}
