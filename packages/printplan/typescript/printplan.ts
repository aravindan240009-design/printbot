/** Dependency-free reference adapter. The versioned JSON Schema owns structure. */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { NormalizedPlan } from './types.ts';
export type { PrintPlanV1, NormalizedPlan } from './types.ts';

type Json = any;
const schema = JSON.parse(readFileSync(new URL('../schema.v1.json', import.meta.url), 'utf8'));
const papers: Record<string, number[]> = { A3: [297000,420000], A4: [210000,297000], A5: [148000,210000], Letter: [215900,279400], Legal: [215900,355600] };
const fail = (message: string): never => { throw new Error(message); };

function structural(value: Json, rule: Json): void {
  if (rule.anyOf) {
    if (!rule.anyOf.some((branch: Json) => { try { structural(value, branch); return true; } catch { return false; } })) fail('schema anyOf');
    return;
  }
  const types = Array.isArray(rule.type) ? rule.type : [rule.type];
  const matches = (type: string) => type === 'null' ? value === null : type === 'integer' ? Number.isSafeInteger(value) : type === 'array' ? Array.isArray(value) : type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value) : typeof value === type;
  if (!types.some(matches)) fail('schema type');
  if (rule.const !== undefined && value !== rule.const) fail('schema const');
  if (rule.enum && !rule.enum.includes(value)) fail('schema enum');
  if (typeof value === 'number' && (value < rule.minimum || value > rule.maximum)) fail('schema bounds');
  if (typeof value === 'string') {
    if ([...value].length < (rule.minLength ?? 0) || [...value].length > (rule.maxLength ?? Infinity)) fail('schema string length');
    if (rule.pattern && value.match(new RegExp(rule.pattern, 'u'))?.[0] !== value) fail('schema pattern');
  }
  if (Array.isArray(value)) {
    if (value.length < rule.minItems || value.length > rule.maxItems) fail('schema array bounds');
    if (rule.uniqueItems && new Set(value.map(v => JSON.stringify(v))).size !== value.length) fail('schema unique');
    value.forEach(item => structural(item, rule.items));
  } else if (value !== null && typeof value === 'object') {
    for (const key of rule.required) if (!Object.hasOwn(value, key)) fail('schema required');
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(rule.properties, key)) fail('schema unknown field');
      structural(value[key], rule.properties[key]);
    }
  }
}

export function resolve_ranges(text: string, count: number, parity = 'all'): number[] {
  if (!Number.isSafeInteger(count) || count < 1 || count > 10000 || typeof text !== 'string' || text.length < 1 || text.length > 512 || !['all','odd','even'].includes(parity)) fail('invalid selection');
  const pages = new Set<number>();
  for (const item of text.split(',')) {
    if (item.match(/^[1-9][0-9]*(?:-(?:[1-9][0-9]*)?)?$/)?.[0] !== item) fail('invalid range grammar');
    const bounds = item.split('-');
    const start = Number(bounds[0]), end = bounds.length === 2 ? (bounds[1] ? Number(bounds[1]) : count) : start;
    if (!(1 <= start && start <= end && end <= count)) fail('range outside document');
    for (let page = start; page <= end; page++) pages.add(page);
  }
  const result = [...pages].filter(p => parity === 'all' || p % 2 === (parity === 'odd' ? 1 : 0)).sort((a,b) => a-b);
  if (!result.length) fail('empty selection');
  return result;
}

function canonical(value: Json): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}

export function render_hash(plan: Json, normalized: Json): string {
  return createHash('sha256').update(canonical({ files: plan.files, settings: plan.settings, sides: normalized.sides }), 'utf8').digest('hex');
}

export function validate(plan: Json, expected_shop: string): NormalizedPlan {
  structural(plan, schema);
  if (plan.shop_id !== expected_shop) fail('tenant mismatch');
  const s = plan.settings, c = plan.capabilities;
  if (s.booklet || s.photo !== null || s.bin_id !== null) fail('unsupported executable operation');
  if (s.width_um !== papers[s.paper_size][0] || s.height_um !== papers[s.paper_size][1]) fail('named paper dimensions mismatch');
  const m = s.margins_um;
  const [width,height] = s.orientation === 'landscape' ? [s.height_um,s.width_um] : [s.width_um,s.height_um];
  if (m.left + m.right >= width || m.top + m.bottom >= height) fail('margins leave no area');
  for (const [requested,supported] of [['color','color_modes'],['duplex','duplex_modes'],['paper_size','paper_sizes'],['media','media']]) if (!c[supported].includes(s[requested])) fail('capability mismatch');
  if (s.copies > c.max_copies) fail('copy capability');
  if (new Set(plan.files.map((f: Json) => f.file_id)).size !== plan.files.length) fail('duplicate file identity');
  const selected = plan.files.map((f: Json) => resolve_ranges(f.range, f.page_count, f.parity));
  const logical = selected.reduce((n: number, pages: number[]) => n + pages.length, 0) * s.copies;
  if (logical > 100000) fail('logical impression limit');
  const duplex = s.duplex !== 'simplex';
  const templates = selected.map((pages: number[], index: number) => {
    const units: number[][] = [];
    for (let i = 0; i < pages.length; i += s.pages_per_sheet) units.push(pages.slice(i, i+s.pages_per_sheet));
    if (duplex && units.length % 2) units.push([]);
    return { index, units };
  });
  const sides: Json[] = [];
  function append(index: number, numbers: number[], copy: number) {
    if (sides.length >= 100000) fail('rendered side limit');
    sides.push({file_index:index,page_numbers:numbers,copy_index:copy,blank:numbers.length === 0});
  }
  if (s.collate) {
    for (let copy=0; copy<s.copies; copy++) for (const {index,units} of templates) for (const numbers of units) append(index,numbers,copy);
  } else {
    const step = duplex ? 2 : 1;
    for (const {index,units} of templates) for (let i=0;i<units.length;i+=step) for (let copy=0;copy<s.copies;copy++) for (const numbers of units.slice(i,i+step)) append(index,numbers,copy);
  }
  const padding = sides.filter(side => side.blank).length;
  const normalized = {selected_pages:selected,sides,logical_pages:logical,marked_sides:sides.length-padding,padding_sides:padding,physical_sheets:sides.length/(duplex?2:1)};
  if (render_hash(plan,normalized) !== plan.render_hash) fail('render recipe hash mismatch');
  return normalized;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cases = JSON.parse(readFileSync(new URL('../../../fixtures/printplan/cases.json', import.meta.url), 'utf8'));
  for (const test of cases) {
    let result: Json;
    try { result = validate(test.plan,test.expected_shop); } catch (error) {
      if (test.expected) throw new Error(test.name + ': unexpected rejection: ' + error);
      continue;
    }
    if (!test.expected || canonical(result) !== canonical(test.expected)) throw new Error(test.name + ': parity mismatch');
  }
  console.log(`PASS ${cases.length} shared PrintPlan fixtures`);
}
