import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  PDFImage,
  rgb,
  type RGB,
} from "pdf-lib";
import { SITE } from "@/lib/config";
import {
  amountInIndianWords,
  formatBillPDFAmount,
  formatBillPDFDate,
  type BillItemInput,
} from "@/lib/bill-calc";

/**
 * A4 bill PDF rendered with the official brand mark and Noto Sans (which
 * contains the ₹ glyph that the built-in PDF fonts do not support).
 */

export type BillPdfBill = {
  bill_number: string;
  customer_name: string;
  bill_date: string;
  subtotal: number;
  shipping: number;
  total: number;
};

export type BillPdfItem = BillItemInput & { total: number };

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  navy: rgb(123 / 255, 45 / 255, 142 / 255),
  navySoft: rgb(143 / 255, 58 / 255, 163 / 255),
  pink: rgb(233 / 255, 30 / 255, 140 / 255),
  deepRose: rgb(199 / 255, 20 / 255, 111 / 255),
  ink: rgb(64 / 255, 36 / 255, 61 / 255),
  muted: rgb(122 / 255, 108 / 255, 125 / 255),
  blush: rgb(255 / 255, 240 / 255, 245 / 255),
  line: rgb(243 / 255, 213 / 255, 228 / 255),
  white: rgb(1, 1, 1),
  gold: rgb(255 / 255, 211 / 255, 78 / 255),
  stripe: rgb(253 / 255, 246 / 255, 250 / 255),
};

/* ------------------------------ Columns ------------------------------ */

const COLUMNS = [
  { key: "sno", label: "S.No", width: 26, align: "center" as const },
  { key: "product", label: "Product Name", width: 150, align: "left" as const },
  { key: "inch", label: "Inch", width: 54, align: "center" as const },
  { key: "pieces", label: "Pieces", width: 54, align: "center" as const },
  { key: "size", label: "Size", width: 50, align: "center" as const },
  { key: "nos", label: "Nos", width: 42, align: "center" as const },
  { key: "price", label: "Price", width: 70, align: "right" as const },
  { key: "total", label: "Total", width: 69.28, align: "right" as const },
];

const TABLE_HEADER_HEIGHT = 24;
const ROW_PADDING = 6;
const PAGE_BREAK_Y = 150;

/* ----------------------------- Resources ----------------------------- */

type FontBytes = { regular: Uint8Array; bold: Uint8Array };

let cachedFonts: Promise<FontBytes> | null = null;

function loadFontBytes(): Promise<FontBytes> {
  if (!cachedFonts) {
    const directory = path.join(process.cwd(), "public", "fonts");
    cachedFonts = Promise.all([
      readFile(path.join(directory, "NotoSans-Regular.ttf")),
      readFile(path.join(directory, "NotoSans-Bold.ttf")),
    ]).then(([regular, bold]) => ({
      regular: new Uint8Array(regular),
      bold: new Uint8Array(bold),
    }));
  }

  return cachedFonts;
}

let cachedLogo: Promise<Uint8Array | null> | null = null;

function loadLogoBytes(): Promise<Uint8Array | null> {
  if (!cachedLogo) {
    cachedLogo = readFile(
      path.join(process.cwd(), "public", "brand", "subha-fashion-factory-logo.png")
    )
      .then((buffer) => new Uint8Array(buffer))
      .catch(() => null);
  }

  return cachedLogo;
}

/* ------------------------------- Helpers ------------------------------ */

function instagramHandle() {
  try {
    const path = new URL(SITE.instagram).pathname.replace(/^\/+|\/+$/g, "");
    return path ? `@${path}` : SITE.instagram;
  } catch {
    return SITE.instagram;
  }
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const words = (text || "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    let piece = word;

    // Break a single word that is wider than the whole column.
    while (piece.length > 1 && font.widthOfTextAtSize(piece, size) > maxWidth) {
      let cut = piece.length - 1;
      while (
        cut > 1 &&
        font.widthOfTextAtSize(piece.slice(0, cut), size) > maxWidth
      ) {
        cut -= 1;
      }
      if (current) {
        lines.push(current);
        current = "";
      }
      lines.push(piece.slice(0, cut));
      piece = piece.slice(cut);
    }

    const candidate = current ? `${current} ${piece}` : piece;

    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = piece;
  }

  if (current) lines.push(current);
  return lines;
}

function fitText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;

  let result = text;
  while (
    result.length > 1 &&
    font.widthOfTextAtSize(`${result}…`, size) > maxWidth
  ) {
    result = result.slice(0, -1);
  }

  return `${result}…`;
}

function drawRight(
  page: PDFPage,
  text: string,
  xRight: number,
  y: number,
  font: PDFFont,
  size: number,
  color: RGB = COLORS.ink
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: xRight - width, y, font, size, color });
}

function drawCentered(
  page: PDFPage,
  text: string,
  left: number,
  width: number,
  y: number,
  font: PDFFont,
  size: number,
  color: RGB = COLORS.ink
) {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: left + (width - textWidth) / 2,
    y,
    font,
    size,
    color,
  });
}

function drawLabel(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  color: RGB = COLORS.muted,
  size = 7
) {
  page.drawText(text.toUpperCase(), { x, y, font, size, color });
}

/* ------------------------------- Header ------------------------------- */

function drawBrandHeader(
  page: PDFPage,
  logo: PDFImage | null,
  regular: PDFFont,
  bold: PDFFont
) {
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 7,
    width: PAGE_WIDTH * 0.55,
    height: 7,
    color: COLORS.pink,
  });
  page.drawRectangle({
    x: PAGE_WIDTH * 0.55,
    y: PAGE_HEIGHT - 7,
    width: PAGE_WIDTH * 0.3,
    height: 7,
    color: COLORS.navy,
  });
  page.drawRectangle({
    x: PAGE_WIDTH * 0.85,
    y: PAGE_HEIGHT - 7,
    width: PAGE_WIDTH * 0.15,
    height: 7,
    color: COLORS.gold,
  });

  let textX = MARGIN;

  if (logo) {
    const logoHeight = 46;
    const logoWidth = (logo.width / logo.height) * logoHeight;
    page.drawImage(logo, {
      x: MARGIN,
      y: PAGE_HEIGHT - 44 - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
    textX = MARGIN + logoWidth + 12;
  }

  page.drawText("SUBHA FASHION FACTORY", {
    x: textX,
    y: PAGE_HEIGHT - 58,
    font: bold,
    size: 15,
    color: COLORS.navy,
  });
  page.drawText("Handmade & artificial flowers, crafted to last forever.", {
    x: textX,
    y: PAGE_HEIGHT - 71,
    font: regular,
    size: 7.5,
    color: COLORS.muted,
  });
  page.drawText(`WhatsApp ${SITE.whatsapp.display}`, {
    x: textX,
    y: PAGE_HEIGHT - 83,
    font: regular,
    size: 7.5,
    color: COLORS.muted,
  });

  drawRight(
    page,
    "BILL",
    PAGE_WIDTH - MARGIN,
    PAGE_HEIGHT - 62,
    bold,
    24,
    COLORS.pink
  );

  page.drawLine({
    start: { x: MARGIN, y: PAGE_HEIGHT - 99 },
    end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 99 },
    thickness: 0.8,
    color: COLORS.line,
  });
}

function drawRunningHeader(
  page: PDFPage,
  bill: BillPdfBill,
  regular: PDFFont,
  bold: PDFFont
) {
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 6,
    width: PAGE_WIDTH,
    height: 6,
    color: COLORS.navy,
  });
  page.drawText("SUBHA FASHION FACTORY", {
    x: MARGIN,
    y: PAGE_HEIGHT - 40,
    font: bold,
    size: 10,
    color: COLORS.navy,
  });
  drawRight(
    page,
    `Bill ${bill.bill_number}`,
    PAGE_WIDTH - MARGIN,
    PAGE_HEIGHT - 40,
    regular,
    8,
    COLORS.muted
  );
  page.drawLine({
    start: { x: MARGIN, y: PAGE_HEIGHT - 49 },
    end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 49 },
    thickness: 0.8,
    color: COLORS.line,
  });
}

/* -------------------------------- Table ------------------------------- */

function columnLeft(index: number) {
  let left = MARGIN;
  for (let i = 0; i < index; i += 1) left += COLUMNS[i].width;
  return left;
}

function drawTableHeader(
  page: PDFPage,
  top: number,
  regular: PDFFont,
  bold: PDFFont
) {
  page.drawRectangle({
    x: MARGIN,
    y: top - TABLE_HEADER_HEIGHT,
    width: CONTENT_WIDTH,
    height: TABLE_HEADER_HEIGHT,
    color: COLORS.navy,
  });

  COLUMNS.forEach((column, index) => {
    const left = columnLeft(index);
    const baseline = top - TABLE_HEADER_HEIGHT + 9;

    if (column.align === "left") {
      page.drawText(column.label, {
        x: left + ROW_PADDING,
        y: baseline,
        font: bold,
        size: 7.5,
        color: COLORS.white,
      });
    } else if (column.align === "right") {
      drawRight(
        page,
        column.label,
        left + column.width - ROW_PADDING,
        baseline,
        bold,
        7.5,
        COLORS.white
      );
    } else {
      drawCentered(
        page,
        column.label,
        left,
        column.width,
        baseline,
        bold,
        7.5,
        COLORS.white
      );
    }
  });
}

function drawTableRow(
  page: PDFPage,
  top: number,
  values: string[],
  productLines: string[],
  rowHeight: number,
  alternate: boolean,
  regular: PDFFont,
  bold: PDFFont
) {
  if (alternate) {
    page.drawRectangle({
      x: MARGIN,
      y: top - rowHeight,
      width: CONTENT_WIDTH,
      height: rowHeight,
      color: COLORS.stripe,
    });
  }

  page.drawLine({
    start: { x: MARGIN, y: top - rowHeight },
    end: { x: PAGE_WIDTH - MARGIN, y: top - rowHeight },
    thickness: 0.5,
    color: COLORS.line,
  });

  COLUMNS.forEach((column, index) => {
    if (column.key === "product") return;

    const left = columnLeft(index);
    const baseline = top - rowHeight / 2 - 3;
    const value = fitText(
      values[index] ?? "",
      regular,
      8.5,
      column.width - ROW_PADDING * 2
    );

    if (column.align === "left") {
      page.drawText(value, {
        x: left + ROW_PADDING,
        y: baseline,
        font: regular,
        size: 8.5,
        color: COLORS.ink,
      });
    } else if (column.align === "right") {
      drawRight(
        page,
        value,
        left + column.width - ROW_PADDING,
        baseline,
        index === COLUMNS.length - 1 ? bold : regular,
        8.5,
        COLORS.ink
      );
    } else {
      drawCentered(
        page,
        value,
        left,
        column.width,
        baseline,
        regular,
        8.5,
        COLORS.ink
      );
    }
  });

  const productLeft = columnLeft(1);
  productLines.forEach((line, lineIndex) => {
    page.drawText(line, {
      x: productLeft + ROW_PADDING,
      y: top - 12 - lineIndex * 10.5,
      font: regular,
      size: 8.5,
      color: COLORS.ink,
    });
  });
}

/* -------------------------------- Footer ------------------------------ */

function drawFooter(page: PDFPage, regular: PDFFont, bold: PDFFont) {
  page.drawLine({
    start: { x: MARGIN, y: 52 },
    end: { x: PAGE_WIDTH - MARGIN, y: 52 },
    thickness: 0.6,
    color: COLORS.line,
  });

  drawCentered(
    page,
    "Thank you for shopping with Subha Fashion Factory!",
    MARGIN,
    CONTENT_WIDTH,
    38,
    bold,
    9,
    COLORS.deepRose
  );
  drawCentered(
    page,
    `Instagram ${instagramHandle()}  ·  WhatsApp ${SITE.whatsapp.display}`,
    MARGIN,
    CONTENT_WIDTH,
    27,
    regular,
    7,
    COLORS.muted
  );
  drawCentered(
    page,
    "This is a computer-generated bill and does not require a signature.",
    MARGIN,
    CONTENT_WIDTH,
    17,
    regular,
    6.5,
    COLORS.muted
  );
}

/* ------------------------------- Render ------------------------------- */

export async function buildBillPdf(
  bill: BillPdfBill,
  items: BillPdfItem[]
): Promise<Uint8Array> {
  const [fontBytes, logoBytes] = await Promise.all([
    loadFontBytes(),
    loadLogoBytes(),
  ]);

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const regular = await pdf.embedFont(fontBytes.regular, { subset: true });
  const bold = await pdf.embedFont(fontBytes.bold, { subset: true });

  let logo: PDFImage | null = null;
  if (logoBytes) {
    try {
      logo = await pdf.embedPng(logoBytes);
    } catch {
      logo = null;
    }
  }

  pdf.setTitle(`Bill ${bill.bill_number} — ${bill.customer_name}`);
  pdf.setAuthor("Subha Fashion Factory");
  pdf.setSubject("Bill");
  pdf.setCreator("Subha Fashion Factory");

  const firstPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawBrandHeader(firstPage, logo, regular, bold);

  // Billed-to card
  const cardTop = PAGE_HEIGHT - 116;
  const cardHeight = 64;
  firstPage.drawRectangle({
    x: MARGIN,
    y: cardTop - cardHeight,
    width: CONTENT_WIDTH,
    height: cardHeight,
    color: COLORS.blush,
  });
  firstPage.drawRectangle({
    x: MARGIN,
    y: cardTop - cardHeight,
    width: 3,
    height: cardHeight,
    color: COLORS.pink,
  });

  drawLabel(firstPage, "Billed to", MARGIN + 14, cardTop - 16, bold, COLORS.deepRose);
  firstPage.drawText(bill.customer_name, {
    x: MARGIN + 14,
    y: cardTop - 35,
    font: bold,
    size: 14,
    color: COLORS.ink,
  });
  firstPage.drawText(
    `${items.length} ${items.length === 1 ? "item" : "items"} on this bill`,
    {
      x: MARGIN + 14,
      y: cardTop - 49,
      font: regular,
      size: 7.5,
      color: COLORS.muted,
    }
  );

  const infoRight = PAGE_WIDTH - MARGIN - 14;
  drawLabel(firstPage, "Bill number", infoRight - 120, cardTop - 16, bold, COLORS.deepRose);
  drawRight(
    firstPage,
    bill.bill_number,
    infoRight,
    cardTop - 17,
    bold,
    10,
    COLORS.ink
  );
  drawLabel(firstPage, "Bill date", infoRight - 120, cardTop - 36, bold, COLORS.deepRose);
  drawRight(
    firstPage,
    formatBillPDFDate(bill.bill_date),
    infoRight,
    cardTop - 40,
    regular,
    9,
    COLORS.ink
  );

  // Table
  let page = firstPage;
  let top = cardTop - cardHeight - 26;
  drawTableHeader(page, top, regular, bold);
  top -= TABLE_HEADER_HEIGHT;

  items.forEach((item, index) => {
    const productLines = wrapText(item.product_name, regular, 8.5, 150 - ROW_PADDING * 2).slice(
      0,
      4
    );
    const rowHeight = Math.max(24, productLines.length * 10.5 + 11);

    if (top - rowHeight < PAGE_BREAK_Y) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawRunningHeader(page, bill, regular, bold);
      top = PAGE_HEIGHT - 64;
      drawTableHeader(page, top, regular, bold);
      top -= TABLE_HEADER_HEIGHT;
    }

    const values = [
      String(index + 1),
      item.product_name,
      item.inch || "—",
      item.pieces || "—",
      item.size || "—",
      Number(item.nos) % 1 === 0 ? String(item.nos) : Number(item.nos).toFixed(2),
      formatBillPDFAmount(item.price),
      formatBillPDFAmount(item.total),
    ];

    drawTableRow(
      page,
      top,
      values,
      productLines,
      rowHeight,
      index % 2 === 1,
      regular,
      bold
    );
    top -= rowHeight;
  });

  // Totals + amount in words
  const totalsHeight = 68;
  if (top - totalsHeight < 100) {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawRunningHeader(page, bill, regular, bold);
    top = PAGE_HEIGHT - 64;
  }

  const wordsWidth = 292;
  const totalsWidth = CONTENT_WIDTH - wordsWidth - 12;
  const wordsX = MARGIN;
  const totalsX = MARGIN + wordsWidth + 12;
  const blockBottom = top - totalsHeight;

  page.drawRectangle({
    x: wordsX,
    y: blockBottom,
    width: wordsWidth,
    height: totalsHeight,
    color: COLORS.blush,
  });
  drawLabel(page, "Amount in words", wordsX + 12, top - 16, bold, COLORS.deepRose);
  const wordLines = wrapText(
    amountInIndianWords(bill.total),
    regular,
    8,
    wordsWidth - 24
  ).slice(0, 4);
  wordLines.forEach((line, index) => {
    page.drawText(line, {
      x: wordsX + 12,
      y: top - 31 - index * 10,
      font: index === 0 ? bold : regular,
      size: 8,
      color: COLORS.ink,
    });
  });

  const rows: { label: string; value: string; strong?: boolean }[] = [
    { label: "Subtotal", value: formatBillPDFAmount(bill.subtotal) },
    { label: "Shipping charges", value: formatBillPDFAmount(bill.shipping) },
    { label: "Final total", value: formatBillPDFAmount(bill.total), strong: true },
  ];

  let rowTop = top;
  rows.forEach((row) => {
    const height = row.strong ? 28 : 20;

    if (row.strong) {
      page.drawRectangle({
        x: totalsX,
        y: rowTop - height,
        width: totalsWidth,
        height,
        color: COLORS.deepRose,
      });
      page.drawText(row.label.toUpperCase(), {
        x: totalsX + 10,
        y: rowTop - height + 10,
        font: bold,
        size: 7.5,
        color: COLORS.white,
      });
      drawRight(
        page,
        row.value,
        totalsX + totalsWidth - 10,
        rowTop - height + 8.5,
        bold,
        11,
        COLORS.white
      );
    } else {
      page.drawText(row.label, {
        x: totalsX + 10,
        y: rowTop - height + 7,
        font: regular,
        size: 8,
        color: COLORS.muted,
      });
      drawRight(
        page,
        row.value,
        totalsX + totalsWidth - 10,
        rowTop - height + 7,
        regular,
        8,
        COLORS.ink
      );
      page.drawLine({
        start: { x: totalsX, y: rowTop - height },
        end: { x: totalsX + totalsWidth, y: rowTop - height },
        thickness: 0.5,
        color: COLORS.line,
      });
    }

    rowTop -= height;
  });

  // Signature (only when there is room above the footer)
  if (blockBottom > 120) {
    const signatureY = blockBottom - 48;
    drawRight(
      page,
      "For Subha Fashion Factory",
      PAGE_WIDTH - MARGIN,
      signatureY,
      bold,
      8,
      COLORS.ink
    );
    page.drawLine({
      start: { x: PAGE_WIDTH - MARGIN - 140, y: signatureY - 26 },
      end: { x: PAGE_WIDTH - MARGIN, y: signatureY - 26 },
      thickness: 0.6,
      color: COLORS.line,
    });
    drawRight(
      page,
      "Authorised Signatory",
      PAGE_WIDTH - MARGIN,
      signatureY - 38,
      regular,
      7,
      COLORS.muted
    );
  }

  const pages = pdf.getPages();
  pages.forEach((currentPage, index) => {
    drawFooter(currentPage, regular, bold);
    if (pages.length > 1) {
      drawRight(
        currentPage,
        `Page ${index + 1} of ${pages.length}`,
        PAGE_WIDTH - MARGIN,
        17,
        regular,
        6.5,
        COLORS.muted
      );
    }
  });

  return pdf.save();
}
