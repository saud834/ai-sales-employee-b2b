import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { detectFileType, extractByType } from "../src/lib/extract";

describe("detectFileType", () => {
  it("detects by extension", () => {
    expect(detectFileType("report.pdf", "")).toBe("pdf");
    expect(detectFileType("data.XLSX", "")).toBe("xlsx");
    expect(detectFileType("notes.md", "")).toBe("md");
  });

  it("falls back to mime type when extension is unknown", () => {
    expect(detectFileType("upload", "text/csv")).toBe("csv");
  });

  it("returns null for unsupported types", () => {
    expect(detectFileType("archive.zip", "application/zip")).toBeNull();
  });
});

describe("extractByType: txt/md", () => {
  it("splits on blank lines into segments", async () => {
    const text = "Paragraph one.\n\nParagraph two.\n\nParagraph three.";
    const result = await extractByType("txt", new TextEncoder().encode(text).buffer as ArrayBuffer);
    expect(result.segments).toHaveLength(3);
    expect(result.segments[1].text).toBe("Paragraph two.");
  });
});

describe("extractByType: csv", () => {
  it("parses quoted fields and commas inside quotes", async () => {
    const csv = 'name,note\n"Doe, Jane","says ""hi"""\nJohn,plain';
    const result = await extractByType("csv", new TextEncoder().encode(csv).buffer as ArrayBuffer);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].text).toContain("Doe, Jane");
    expect(result.segments[0].text).toContain('says "hi"');
  });
});

describe("extractByType: xlsx", () => {
  it("extracts rows per sheet with the sheet name attached", async () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Name", "Amount"],
      ["Widget", "10"],
      ["Gadget", "20"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

    const result = await extractByType("xlsx", buf);
    expect(result.pageOrSheetCount).toBe(1);
    expect(result.segments[0].sheet_name).toBe("Sales");
    expect(result.segments[0].text).toContain("Widget");
  });
});

describe("extractByType: docx", () => {
  it("extracts paragraph text and flags headings", async () => {
    const documentXml = `<?xml version="1.0"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Introduction</w:t></w:r></w:p>
          <w:p><w:r><w:t>This is body text.</w:t></w:r></w:p>
        </w:body>
      </w:document>`;
    const zip = new JSZip();
    zip.file("word/document.xml", documentXml);
    const buf = await zip.generateAsync({ type: "arraybuffer" });

    const result = await extractByType("docx", buf);
    expect(result.segments.find((s) => s.heading === "Introduction")).toBeTruthy();
    expect(result.segments.some((s) => s.text === "This is body text.")).toBe(true);
  });
});

describe("extractByType: pptx", () => {
  it("extracts text per slide in order with slide number as page_number", async () => {
    const slide1 = `<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:t>Slide One</a:t></p:sld>`;
    const slide2 = `<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:t>Slide Two</a:t></p:sld>`;
    const zip = new JSZip();
    zip.file("ppt/slides/slide1.xml", slide1);
    zip.file("ppt/slides/slide2.xml", slide2);
    const buf = await zip.generateAsync({ type: "arraybuffer" });

    const result = await extractByType("pptx", buf);
    expect(result.pageOrSheetCount).toBe(2);
    expect(result.segments[0]).toMatchObject({ text: "Slide One", page_number: 1 });
    expect(result.segments[1]).toMatchObject({ text: "Slide Two", page_number: 2 });
  });
});
