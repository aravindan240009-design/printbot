import { DocumentItem, ServerQuote } from '../types';

/**
 * Resolves a range string (e.g. "1-3, 5, 8-") into a set of 1-indexed page numbers.
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || rangeStr.trim() === '' || rangeStr.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const trimmed = rangeStr.trim().toLowerCase();
  if (trimmed === 'odd') {
    const pages: number[] = [];
    for (let p = 1; p <= totalPages; p += 2) pages.push(p);
    return pages;
  }
  if (trimmed === 'even') {
    const pages: number[] = [];
    for (let p = 2; p <= totalPages; p += 2) pages.push(p);
    return pages;
  }

  const pagesSet = new Set<number>();
  const tokens = trimmed.split(',');

  for (const token of tokens) {
    const part = token.trim();
    if (!part) continue;

    // Match "start-end" or "start-" or "start"
    const match = part.match(/^(\d+)(?:-(\d*)?)?$/);
    if (match) {
      const start = parseInt(match[1], 10);
      let end = start;
      if (match[2] !== undefined) {
        end = match[2] === '' ? totalPages : parseInt(match[2], 10);
      }
      const actualStart = Math.max(1, Math.min(start, totalPages));
      const actualEnd = Math.max(1, Math.min(end, totalPages));
      const min = Math.min(actualStart, actualEnd);
      const max = Math.max(actualStart, actualEnd);

      for (let p = min; p <= max; p++) {
        pagesSet.add(p);
      }
    }
  }

  const result = Array.from(pagesSet).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i + 1);
}

/**
 * Validates if a page range expression is syntactically valid.
 */
export function isPageRangeValid(range: string): boolean {
  if (!range || range.trim() === '') return true;
  const t = range.trim().toLowerCase();
  if (t === 'all' || t === 'odd' || t === 'even') return true;
  return /^[1-9]\d*(?:-(?:[1-9]\d*)?)?(?:\s*,\s*[1-9]\d*(?:-(?:[1-9]\d*)?)?)*$/.test(range.trim());
}

/**
 * Inspects PDF / Image files in the browser to extract exact page counts and check encryption.
 */
export async function inspectFileMetadata(file: File): Promise<{ pageCount: number; isEncrypted: boolean }> {
  if (file.type.startsWith('image/')) {
    return { pageCount: 1, isEncrypted: false };
  }

  if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
    try {
      const buffer = await file.arrayBuffer();
      const text = new TextDecoder('latin1').decode(new Uint8Array(buffer));

      const isEncrypted = /\/Encrypt\b/.test(text);

      // Fast match on /Type /Page
      const pageMatches = text.match(/\/Type\s*\/Page\b/g);
      if (pageMatches && pageMatches.length > 0) {
        return { pageCount: pageMatches.length, isEncrypted };
      }

      // Catalog /Count fallback
      const countMatch = text.match(/\/Count\s+(\d+)/);
      if (countMatch && parseInt(countMatch[1], 10) > 0) {
        return { pageCount: parseInt(countMatch[1], 10), isEncrypted };
      }

      return { pageCount: 1, isEncrypted };
    } catch {
      return { pageCount: 1, isEncrypted: false };
    }
  }

  return { pageCount: 1, isEncrypted: false };
}

/**
 * Calculates deterministic pricing in INR paise matching the shop owner's official pricing table.
 */
export function calculateDocumentQuote(
  files: DocumentItem[],
  customRates?: {
    bwPerSideRupees?: number;
    colorPerSideRupees?: number;
    duplexDiscountPercent?: number;
  }
): ServerQuote {
  let totalLogicalPages = 0;
  let totalRenderedSides = 0;
  let totalSheets = 0;
  let totalPaise = 0;

  const bwRatePaise = Math.round((customRates?.bwPerSideRupees ?? 1.5) * 100);
  const colorRatePaise = Math.round((customRates?.colorPerSideRupees ?? 10.0) * 100);
  const grayscaleRatePaise = Math.round(bwRatePaise * 1.33);
  const duplexDiscountFactor = 1 - (customRates?.duplexDiscountPercent ?? 15) / 100;

  files.forEach((f) => {
    const rawPages = f.pageCount && f.pageCount > 0 ? f.pageCount : 1;
    const selectedPagesList = parsePageRange(f.options.pageRange, rawPages);
    const selectedPagesCount = selectedPagesList.length;

    const copies = Math.max(1, f.options.copies || 1);
    const nup = Math.max(1, f.options.nup || 1);
    const logical = selectedPagesCount * copies;
    totalLogicalPages += logical;

    const isDuplex = f.options.duplex === 'duplex_long' || f.options.duplex === 'duplex_short';
    const pagesAfterNup = Math.ceil(selectedPagesCount / nup);
    const sidesPerCopy = pagesAfterNup;
    const sheetsPerCopy = isDuplex ? Math.ceil(sidesPerCopy / 2) : sidesPerCopy;

    totalRenderedSides += sidesPerCopy * copies;
    totalSheets += sheetsPerCopy * copies;

    // Base rates in paise:
    const baseSideRate =
      f.options.colorMode === 'color'
        ? colorRatePaise
        : f.options.colorMode === 'grayscale'
        ? grayscaleRatePaise
        : bwRatePaise;

    const paperMultipliers: Record<string, number> = {
      A4: 1.0,
      A3: 2.0,
      A5: 0.8,
      Legal: 1.25,
      Letter: 1.0,
    };
    const paperMult = paperMultipliers[f.options.paperSize] || 1.0;

    // Paper GSM Surcharge per sheet
    const gsmSurchargePaise =
      f.options.paperGsm === '220' ? 400 : f.options.paperGsm === '100' ? 100 : 0;

    let filePaise = 0;
    for (let c = 0; c < copies; c++) {
      if (isDuplex) {
        const fullSheets = Math.floor(sidesPerCopy / 2);
        const hasOddSide = sidesPerCopy % 2 !== 0;
        const sheetPrintCost =
          Math.round(baseSideRate * paperMult) + Math.round(baseSideRate * duplexDiscountFactor * paperMult);
        filePaise += fullSheets * (sheetPrintCost + gsmSurchargePaise);
        if (hasOddSide) {
          filePaise += Math.round(baseSideRate * paperMult) + gsmSurchargePaise;
        }
      } else {
        filePaise += sidesPerCopy * (Math.round(baseSideRate * paperMult) + gsmSurchargePaise);
      }
    }

    // Finishing charges per copy
    if (f.options.finishing === 'staple') filePaise += 500 * copies;
    if (f.options.finishing === 'spiral') filePaise += 4000 * copies;
    if (f.options.finishing === 'hard_bind') filePaise += 15000 * copies;

    totalPaise += filePaise;
  });

  return {
    total_paise: totalPaise,
    total_rupees: totalPaise / 100,
    total_logical_pages: totalLogicalPages,
    total_rendered_sides: totalRenderedSides,
    total_physical_sheets: totalSheets,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    quote_hash: 'quote_' + Math.random().toString(36).substring(2, 10),
  };
}
