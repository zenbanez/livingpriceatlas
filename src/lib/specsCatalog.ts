import rawLpa001 from '../corpus/LPA001-v1.0.md?raw';
import rawLpa002 from '../corpus/LPA002-v1.0.md?raw';
import rawLpa003 from '../corpus/LPA003-v1.0.md?raw';
import rawLpa004 from '../corpus/LPA004-v1.0.md?raw';
import { parseSpecification, type ParsedSpecification } from './parseSpec';

export type SpecId = 'LPA001' | 'LPA002' | 'LPA003' | 'LPA004';

export interface SpecSeriesItem {
  id: SpecId;
  shortTitle: string;
  focusSummary: string;
  downloadHref: string;
  downloadFilename: string;
  sha256: string;
  byteLength: number;
  invariantsSectionId: string;
  invariantsCount: number;
  parsed: ParsedSpecification;
}

export interface UpcomingSpec {
  id: string;
  title: string;
  focus: string;
}

export interface SpecFigure {
  specId: SpecId;
  sectionId: string;
  figureNumber: string;
  title: string;
  src: string;
  alt: string;
  caption: string;
}

const LPA001_SHA256 = 'a4cc1124dba29a55f9cf04c8e496d88852388a4a60987c1502333c625411ed0a';
const LPA002_SHA256 = '4214f463917b7297da20b058cbf4b11ae38c12f46d000a060fbd0927c33e90f3';
const LPA003_SHA256 = '42535796e33e184f5c3007c716a4c55737da5f799c35b7413783a8da49e8f2ba';
const LPA004_SHA256 = 'af431791af9c1f5ca55bdfdfcb2f1fb1451c10c504388f07c456db39825953ff';

export const SPEC_SERIES: SpecSeriesItem[] = [
  {
    id: 'LPA001',
    shortTitle: 'Foundational Principles & Epistemic Framework',
    focusSummary: 'Epistemic properties, six intelligence layers, anti-capture rules, and 12 core invariants.',
    downloadHref: '/LPA001-v1.0.md',
    downloadFilename: 'LPA001-v1.0.md',
    sha256: LPA001_SHA256,
    byteLength: 28920,
    invariantsSectionId: 'sec-19',
    invariantsCount: 12,
    parsed: parseSpecification(rawLpa001, LPA001_SHA256),
  },
  {
    id: 'LPA002',
    shortTitle: 'Domain Architecture & Foundational Inheritance',
    focusSummary: 'Inheritance from Wisdom Infrastructure, ZenOS, and Ugnayan; 10 semantic primitives; DPWH baseline.',
    downloadHref: '/LPA002-v1.0.md',
    downloadFilename: 'LPA002-v1.0.md',
    sha256: LPA002_SHA256,
    byteLength: 45707,
    invariantsSectionId: 'sec-24',
    invariantsCount: 12,
    parsed: parseSpecification(rawLpa002, LPA002_SHA256),
  },
  {
    id: 'LPA003',
    shortTitle: 'The Contextual Cost Model',
    focusSummary: 'Outcome orientation, Realization Pathways, Cost Drivers, Economic Triangulation, and Envelopes.',
    downloadHref: '/LPA003-v1.0.md',
    downloadFilename: 'LPA003-v1.0.md',
    sha256: LPA003_SHA256,
    byteLength: 56218,
    invariantsSectionId: 'sec-29',
    invariantsCount: 16,
    parsed: parseSpecification(rawLpa003, LPA003_SHA256),
  },
  {
    id: 'LPA004',
    shortTitle: 'Contribution & Participation Protocol',
    focusSummary: '10 participant profiles, reciprocal economic intelligence, anticipatory demand, and competition guards.',
    downloadHref: '/LPA004-v1.0.md',
    downloadFilename: 'LPA004-v1.0.md',
    sha256: LPA004_SHA256,
    byteLength: 65839,
    invariantsSectionId: 'sec-32',
    invariantsCount: 16,
    parsed: parseSpecification(rawLpa004, LPA004_SHA256),
  },
];

export const UPCOMING_SPECS: UpcomingSpec[] = [
  {
    id: 'LPA005',
    title: 'Economic Stewardship and Governance',
    focus: 'Validation authority, conflict-of-interest controls, disclosure governance, and dispute resolution.',
  },
  {
    id: 'LPA006',
    title: 'Economic Reasoning and Intelligence',
    focus: 'Deterministic cost composition, AI extraction/explanation boundaries, and empirical synthesis.',
  },
  {
    id: 'LPA007',
    title: 'Economic Knowledge Lifecycle',
    focus: 'Temporal validity, realized project calibration, model evolution, and non-destructive revision.',
  },
  {
    id: 'LPA008',
    title: 'Public Intelligence and Accessibility',
    focus: 'Understandable, inspectable, and challengeable civic cost intelligence across media.',
  },
  {
    id: 'LPA009',
    title: 'Philippine Infrastructure Reference Implementation',
    focus: 'DPWH Price Atlas 2022 ingestion, Eastern Visayas regional focus, and realized infrastructure calibration.',
  },
];

export const SPEC_FIGURES: SpecFigure[] = [
  {
    specId: 'LPA003',
    sectionId: 'sec-14',
    figureNumber: 'Figure 3.1',
    title: 'Economic Triangulation',
    src: '/figures/LPA003-fig-01-economic-triangulation.png',
    alt: 'Diagram of Economic Triangulation showing Historical projection (benchmarks and indices), Market reconstruction (current inputs and conditions), and Realized experience (completed project evidence) converging on the central Reasonable Cost Envelope.',
    caption:
      'Figure 3.1: Economic Triangulation across three independently examinable estimation pathways converging on a Reasonable Cost Envelope (LPA003 Section 14).',
  },
  {
    specId: 'LPA003',
    sectionId: 'sec-20',
    figureNumber: 'Figure 3.2',
    title: 'Contextual Cost Model',
    src: '/figures/LPA003-fig-02-contextual-cost-model.jpg',
    alt: 'Flowchart of the Contextual Cost Model moving from Intended Outcome and Realization Pathways through Cost Composition, Cost Drivers, Market Forces, and Time and Uncertainty into Economic Triangulation, Reasonable Cost Envelope (lower to upper bound), Realized Outcome, and Empirical Calibration.',
    caption:
      'Figure 3.2: End-to-end Contextual Cost Model from Intended Outcome through Realization Pathways, Cost Drivers, Triangulation, Reasonable Cost Envelope, and Empirical Calibration (LPA003 Section 20).',
  },
  {
    specId: 'LPA004',
    sectionId: 'sec-7',
    figureNumber: 'Figure 4.1',
    title: 'Reciprocal Economic Intelligence Ecosystem',
    src: '/figures/LPA004-fig-01-reciprocal-ecosystem.png',
    alt: 'Radial diagram placing Living Price Atlas Reciprocal intelligence at the center with bidirectional arrows to Planning agencies, Suppliers, Contractors, Receiving agencies, Communities, and Engineers, comparing Distributed knowledge (what society encounters) with Reciprocal intelligence (what society receives).',
    caption:
      'Figure 4.1: Bidirectional knowledge exchange connecting six core societal participant groups around Reciprocal Economic Intelligence (LPA004 Section 7).',
  },
  {
    specId: 'LPA004',
    sectionId: 'sec-17',
    figureNumber: 'Figure 4.2',
    title: 'Anticipatory Demand and Market Readiness',
    src: '/figures/LPA004-fig-02-anticipatory-demand-readiness.png',
    alt: 'Flowchart moving from Development Intent to Anticipated Resource Requirements and Aggregated Demand Intelligence, branching out to independent preparation by Manufacturers, Suppliers, Logistics providers, and Contractors toward Improved Market Readiness and feedback loops from contemporary prices and realized experience.',
    caption:
      'Figure 4.2: Translating Development Intent into Aggregated Demand Intelligence for independent preparation across supply, production, logistics, and contracting (LPA004 Section 17).',
  },
  {
    specId: 'LPA004',
    sectionId: 'sec-26',
    figureNumber: 'Figure 4.3',
    title: 'The Participation Flywheel',
    src: '/figures/LPA004-fig-03-participation-flywheel.png',
    alt: 'Circular flywheel diagram showing Participation in ordinary activity leading to More evidence (richer knowledge), Better intelligence (useful forecasts), Improved outcomes (market readiness), and Greater trust (increased utility), orbiting Reciprocal Economic Intelligence.',
    caption:
      'Figure 4.3: The Participation Flywheel linking ordinary-activity contribution, richer evidence, reciprocal utility, and earned institutional trust (LPA004 Section 26).',
  },
];

export function getFigureForSection(specId: SpecId, sectionId: string): SpecFigure | undefined {
  return SPEC_FIGURES.find((fig) => fig.specId === specId && fig.sectionId === sectionId);
}
