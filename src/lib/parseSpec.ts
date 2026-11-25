export type InlineToken =
  | { kind: 'text'; value: string }
  | { kind: 'strong'; value: string }
  | { kind: 'em'; value: string };

export type SpecBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'invariant'; numeral: string; text: string };

export interface SpecSubsection {
  id: string;
  number: string;
  title: string;
  heading: string;
  blocks: SpecBlock[];
}

export interface SpecSection {
  id: string;
  number: string | null;
  title: string;
  shortTitle: string;
  heading: string;
  blocks: SpecBlock[];
  subsections: SpecSubsection[];
}

export interface SpecMetadata {
  title: string;
  subtitle: string;
  specification: string;
  version: string;
  date: string;
  classification: string;
  status: string;
  predecessors: string | null;
  lineage: string | null;
  closingColophon: string;
  byteLength: number;
  sha256: string;
}

export interface ParsedSpecification {
  meta: SpecMetadata;
  sections: SpecSection[];
}

export const CANONICAL_SHA256 =
  'a4cc1124dba29a55f9cf04c8e496d88852388a4a60987c1502333c625411ed0a';
export const CANONICAL_BYTE_LENGTH = 28920;

export function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern = /(\*\*[\s\S]+?\*\*|\*[^*\n]+?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: 'text', value: text.slice(lastIndex, match.index) });
    }
    const matched = match[0];
    if (matched.startsWith('**') && matched.endsWith('**')) {
      tokens.push({ kind: 'strong', value: matched.slice(2, -2) });
    } else if (matched.startsWith('*') && matched.endsWith('*')) {
      tokens.push({ kind: 'em', value: matched.slice(1, -1) });
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ kind: 'text', value: text.slice(lastIndex) });
  }

  return tokens;
}

function parseTableRow(line: string): string[] {
  const trimmed = line.trim();
  const inner = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  return inner.split('|').map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|(?:\s*:?-{3,}:?\s*\|)+$/.test(line.trim());
}

function parseSectionHeader(headingText: string): {
  id: string;
  number: string | null;
  title: string;
  shortTitle: string;
} {
  const numbered = headingText.match(/^(\d+)\.\s+(.+)$/);
  if (numbered) {
    const number = numbered[1];
    const title = numbered[2].trim();
    return {
      id: `sec-${number}`,
      number,
      title,
      shortTitle: title,
    };
  }

  const normalized = headingText.trim().toLowerCase();
  if (normalized === 'preamble') {
    return {
      id: 'preamble',
      number: null,
      title: headingText.trim(),
      shortTitle: 'Preamble',
    };
  }
  if (normalized === 'closing declaration') {
    return {
      id: 'closing-declaration',
      number: null,
      title: headingText.trim(),
      shortTitle: 'Closing Declaration',
    };
  }

  return {
    id: normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    number: null,
    title: headingText.trim(),
    shortTitle: headingText.trim(),
  };
}

function parseSubsectionHeader(headingText: string): {
  id: string;
  number: string;
  title: string;
} {
  const matched = headingText.match(/^(\d+\.\d+)\s+(.+)$/);
  if (matched) {
    const number = matched[1];
    return {
      id: `sec-${number.replace('.', '-')}`,
      number,
      title: matched[2].trim(),
    };
  }

  const specRef = headingText.match(/^(LPA\d{3})\s+\S+\s+(.+)$/);
  if (specRef) {
    return {
      id: `sub-${specRef[1].toLowerCase()}`,
      number: specRef[1],
      title: specRef[2].trim(),
    };
  }

  return {
    id: headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    number: '',
    title: headingText.trim(),
  };
}

function appendLinesAsBlocks(lines: string[], target: SpecBlock[]): void {
  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed === '---') {
      i += 1;
      continue;
    }

    if (trimmed.startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = parseTableRow(trimmed);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseTableRow(lines[i]));
        i += 1;
      }
      target.push({ type: 'table', headers, rows });
      continue;
    }

    const invariantInlineMatch = trimmed.match(/^\*\*([IVX]+)\.\*\*\s+(.+)$/);
    if (invariantInlineMatch) {
      target.push({
        type: 'invariant',
        numeral: invariantInlineMatch[1],
        text: invariantInlineMatch[2],
      });
      i += 1;
      continue;
    }

    const invariantWrappedMatch = trimmed.match(/^\*\*([IVX]+)\.\s+(.+?)\*\*$/);
    if (invariantWrappedMatch) {
      target.push({
        type: 'invariant',
        numeral: invariantWrappedMatch[1],
        text: invariantWrappedMatch[2],
      });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(lines[i].trim().slice(2));
        i += 1;
      }
      target.push({ type: 'unordered-list', items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const current = lines[i].trim();
        const orderedMatch = current.match(/^\d+\.\s+(.+)$/);
        if (!orderedMatch) {
          break;
        }
        items.push(orderedMatch[1]);
        i += 1;
      }
      target.push({ type: 'ordered-list', items });
      continue;
    }

    target.push({ type: 'paragraph', text: trimmed });
    i += 1;
  }
}

export function parseSpecification(
  rawMarkdown: string,
  expectedSha256: string = CANONICAL_SHA256
): ParsedSpecification {
  const normalized = rawMarkdown.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  const metaMap = new Map<string, string>();
  let title = 'The Living Price Atlas';
  let subtitle = '';
  let closingColophon = 'End of specification';

  let cursor = 0;
  while (cursor < lines.length) {
    const line = lines[cursor].trim();
    if (line === '---') {
      cursor += 1;
      break;
    }
    if (line.startsWith('# ')) {
      title = line.slice(2).trim();
    } else if (line.startsWith('## ')) {
      subtitle = line.slice(3).trim();
    } else {
      const metaMatch = line.match(/^\*\*([^*:]+):\*\*\s*(.+)$/);
      if (metaMatch) {
        metaMap.set(metaMatch[1].trim().toLowerCase(), metaMatch[2].trim());
      }
    }
    cursor += 1;
  }

  const sections: SpecSection[] = [];
  let currentSection: SpecSection | null = null;
  let currentSubsection: SpecSubsection | null = null;
  let pendingLines: string[] = [];

  const flushPending = () => {
    if (pendingLines.length === 0) {
      return;
    }
    if (currentSubsection) {
      appendLinesAsBlocks(pendingLines, currentSubsection.blocks);
    } else if (currentSection) {
      appendLinesAsBlocks(pendingLines, currentSection.blocks);
    }
    pendingLines = [];
  };

  for (let i = cursor; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    const colophonMatch = trimmed.match(/^\*(End of LPA\d{3})\*$/);
    if (colophonMatch) {
      closingColophon = colophonMatch[1];
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushPending();
      const heading = trimmed.slice(3).trim();
      const parsedHeader = parseSectionHeader(heading);
      currentSection = {
        ...parsedHeader,
        heading,
        blocks: [],
        subsections: [],
      };
      currentSubsection = null;
      sections.push(currentSection);
      continue;
    }

    if (trimmed.startsWith('### ') && currentSection) {
      flushPending();
      const heading = trimmed.slice(4).trim();
      const parsedSub = parseSubsectionHeader(heading);
      currentSubsection = {
        ...parsedSub,
        heading,
        blocks: [],
      };
      currentSection.subsections.push(currentSubsection);
      continue;
    }

    pendingLines.push(line);
  }

  flushPending();

  const byteLength = new TextEncoder().encode(normalized).byteLength;

  return {
    meta: {
      title,
      subtitle,
      specification: metaMap.get('specification') ?? 'LPA',
      version: metaMap.get('version') ?? '1.0',
      date: metaMap.get('date') ?? 'November 25, 2026',
      classification: metaMap.get('classification') ?? 'Specification',
      status: metaMap.get('status') ?? 'Proposed for adoption',
      predecessors: metaMap.get('predecessors') ?? metaMap.get('predecessor') ?? null,
      lineage: metaMap.get('foundational lineage') ?? null,
      closingColophon,
      byteLength,
      sha256: expectedSha256,
    },
    sections,
  };
}
