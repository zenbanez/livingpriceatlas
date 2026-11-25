import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { parseInlineTokens, type SpecBlock } from './lib/parseSpec';
import {
  ensurePulseWidgetMounted,
  isPulseConfigured,
  openPulseWidget,
} from './lib/pulse';
import {
  SPEC_SERIES,
  UPCOMING_SPECS,
  getFigureForSection,
  type SpecId,
} from './lib/specsCatalog';
import {
  loadSavedVotes,
  saveVotes,
  submitSectionReaction,
  type StoredVote,
  type VoteValue,
} from './lib/reactions';

function ThumbUpIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}

function ThumbDownIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 14V2" />
      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
    </svg>
  );
}

interface StakeholderLens {
  id: string;
  label: string;
  context: string;
  prompts: {
    question: string;
    specId: SpecId;
    sectionId: string;
    sectionLabel: string;
  }[];
}

const STAKEHOLDER_LENSES: StakeholderLens[] = [
  {
    id: 'engineers',
    label: 'Engineers & Technical Professionals',
    context:
      'Review technical specifications, work-item comparability, estimation triangulation, and explicit uncertainty boundaries.',
    prompts: [
      {
        question:
          'Do the eight epistemic properties (Observed, Declared, Corroborated, Derived, Inferred, Disputed, Stale, Superseded) give field engineers clean boundaries between measurement and estimation?',
        specId: 'LPA001',
        sectionId: 'sec-5-3',
        sectionLabel: 'LPA001 §5.3',
      },
      {
        question:
          'Does Economic Triangulation (Historical Projection, Market Reconstruction, Realized Experience) preserve independent examination before generating a Reasonable Cost Envelope?',
        specId: 'LPA003',
        sectionId: 'sec-14',
        sectionLabel: 'LPA003 §14',
      },
      {
        question:
          'How should post-completion variation orders, productivity evidence, and delivered quality enter Realization Records without distorting baseline references?',
        specId: 'LPA003',
        sectionId: 'sec-23',
        sectionLabel: 'LPA003 §23',
      },
    ],
  },
  {
    id: 'contractors',
    label: 'Contractors & Builders',
    context:
      'Examine how Realization Pathways, mobilization thresholds, schedule disruptions, and field risk show up in reasonable cost.',
    prompts: [
      {
        question:
          'Does the distinction between theoretical and contextual Realization Pathways protect builders from unrealistic unit-rate comparisons in remote or island works?',
        specId: 'LPA003',
        sectionId: 'sec-6',
        sectionLabel: 'LPA003 §6',
      },
      {
        question:
          'Are fixed costs, mobilization thresholds, and diseconomies of scale represented accurately enough across project sizes?',
        specId: 'LPA003',
        sectionId: 'sec-15',
        sectionLabel: 'LPA003 §15',
      },
      {
        question:
          'Does LPA004 let contractors report execution constraints safely without contributions being misread as contractual claim demands or used without permission?',
        specId: 'LPA004',
        sectionId: 'sec-6-3',
        sectionLabel: 'LPA004 §6.3',
      },
    ],
  },
  {
    id: 'suppliers',
    label: 'Suppliers & Manufacturers',
    context:
      'Stress-test commercial confidentiality, anticipatory demand visibility, and anticompetitive safeguards.',
    prompts: [
      {
        question:
          'Does Differentiated Disclosure cleanly separate private operational records from aggregated market intelligence?',
        specId: 'LPA004',
        sectionId: 'sec-12-2',
        sectionLabel: 'LPA004 §12.2',
      },
      {
        question:
          'What safeguards in LPA004 Section 19 prevent aggregated demand or regional supply observations from facilitating price coordination or oligopolistic reconstruction?',
        specId: 'LPA004',
        sectionId: 'sec-19',
        sectionLabel: 'LPA004 §19',
      },
      {
        question:
          'Does Market Readiness Intelligence help manufacturers and haulers prepare capacity ahead of pipeline bottlenecks without misrepresenting forecasts as orders?',
        specId: 'LPA004',
        sectionId: 'sec-17',
        sectionLabel: 'LPA004 §17',
      },
    ],
  },
  {
    id: 'government',
    label: 'Government Institutions',
    context:
      'Inspect how historical public benchmarks connect to Reasonable Cost Envelopes, Development Intent statuses, and Receiving Agencies.',
    prompts: [
      {
        question:
          'Does treating official baselines such as the DPWH Price Atlas 2022 as a Layer 1 reference (inherited into LPA002) fit real public budgeting and procurement review?',
        specId: 'LPA002',
        sectionId: 'sec-18',
        sectionLabel: 'LPA002 §18',
      },
      {
        question:
          'Are the Development Intent stages (Conceptual through Completed) clear enough to avoid double-counting overlapping project pipelines?',
        specId: 'LPA004',
        sectionId: 'sec-14',
        sectionLabel: 'LPA004 §14',
      },
      {
        question:
          'Does giving Receiving Agencies first-class stewardship in LPA004 connect initial construction expenditure with lifecycle performance and maintenance?',
        specId: 'LPA004',
        sectionId: 'sec-6-8',
        sectionLabel: 'LPA004 §6.8',
      },
    ],
  },
  {
    id: 'researchers',
    label: 'Researchers & Academics',
    context:
      'Evaluate foundational inheritance from Wisdom Infrastructure / ZenOS / Ugnayan, causal Cost Drivers, and variance attribution.',
    prompts: [
      {
        question:
          'Does LPA002 separate inherited ZenOS warrant/deliberation mechanisms cleanly from domain-specific Economic Objects and Reasonable Cost Envelopes?',
        specId: 'LPA002',
        sectionId: 'sec-4',
        sectionLabel: 'LPA002 §4',
      },
      {
        question:
          'Does Cost Driver causality ("Condition -> Operational -> Resource -> Economic Consequence") guard effectively against arbitrary regional multipliers?',
        specId: 'LPA003',
        sectionId: 'sec-10',
        sectionLabel: 'LPA003 §10',
      },
      {
        question:
          'What bias-correction methods are needed in LPA006 to account for selective participation and correlated transactions?',
        specId: 'LPA004',
        sectionId: 'sec-22',
        sectionLabel: 'LPA004 §22',
      },
    ],
  },
  {
    id: 'workers',
    label: 'Workers & Local Enterprises',
    context:
      'Check participation friction, local asset/hauling realities, and how ordinary-activity contributions generate reciprocal value.',
    prompts: [
      {
        question:
          'Does Evidence Generation Through Ordinary Activity let smaller hauling, quarry, and trade operators participate without duplicating paperwork?',
        specId: 'LPA004',
        sectionId: 'sec-8',
        sectionLabel: 'LPA004 §8',
      },
      {
        question:
          'Do overlapping participant profiles (for example, farmer and hauler, or local supplier and contractor) avoid penalizing mixed rural enterprises?',
        specId: 'LPA004',
        sectionId: 'sec-5',
        sectionLabel: 'LPA004 §5',
      },
      {
        question:
          'Do the participation flywheel and non-dependence rules ensure small enterprises can operate freely without lock-in?',
        specId: 'LPA004',
        sectionId: 'sec-25',
        sectionLabel: 'LPA004 §25',
      },
    ],
  },
  {
    id: 'communities',
    label: 'Communities & Civil Society',
    context:
      'Verify non-presumptive citizen observation, contributor safety, and accessible civic inspection of public project outcomes.',
    prompts: [
      {
        question:
          'Does LPA004 Section 21 let ordinary residents report seasonal flooding, impassable roads, or service gaps safely without requiring engineering jargon?',
        specId: 'LPA004',
        sectionId: 'sec-21',
        sectionLabel: 'LPA004 §21',
      },
      {
        question:
          'Does LPA003 Section 20.7 make clear that a Reasonable Cost Envelope cannot automatically accuse any party of wrongdoing without investigation?',
        specId: 'LPA003',
        sectionId: 'sec-20',
        sectionLabel: 'LPA003 §20',
      },
      {
        question:
          'Is public access to foundational intelligence protected against becoming a paywalled or contributor-only club?',
        specId: 'LPA004',
        sectionId: 'sec-7-5',
        sectionLabel: 'LPA004 §7.5',
      },
    ],
  },
];

function resolveInitialSpecId(): SpecId {
  if (typeof window === 'undefined') {
    return 'LPA001';
  }
  const params = new URLSearchParams(window.location.search);
  const qSpec = params.get('spec')?.toUpperCase();
  if (qSpec === 'LPA001' || qSpec === 'LPA002' || qSpec === 'LPA003' || qSpec === 'LPA004') {
    return qSpec;
  }
  const hashSpec = window.location.hash.replace('#', '').toUpperCase();
  if (
    hashSpec === 'LPA001' ||
    hashSpec === 'LPA002' ||
    hashSpec === 'LPA003' ||
    hashSpec === 'LPA004'
  ) {
    return hashSpec;
  }
  return 'LPA001';
}

function renderInlineText(text: string, keyPrefix: string) {
  const tokens = parseInlineTokens(text);
  return tokens.map((token, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (token.kind === 'strong') {
      return <strong key={key}>{token.value}</strong>;
    }
    if (token.kind === 'em') {
      return <em key={key}>{token.value}</em>;
    }
    return <span key={key}>{token.value}</span>;
  });
}

function renderSpecBlocks(blocks: SpecBlock[], blockPrefix: string): ReactNode[] {
  const output: ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === 'invariant') {
      const invariants: Extract<SpecBlock, { type: 'invariant' }>[] = [];
      while (i < blocks.length) {
        const nextBlock = blocks[i];
        if (nextBlock.type !== 'invariant') {
          break;
        }
        invariants.push(nextBlock);
        i += 1;
      }
      output.push(
        <div className="invariants-ledger" key={`${blockPrefix}-invariants-${i}`}>
          {invariants.map((inv) => (
            <div className="invariant-card" key={`${blockPrefix}-inv-${inv.numeral}`}>
              <span className="invariant-numeral">{inv.numeral}.</span>
              <div className="invariant-text">
                {renderInlineText(inv.text, `${blockPrefix}-inv-text-${inv.numeral}`)}
              </div>
            </div>
          ))}
        </div>
      );
      continue;
    }

    if (block.type === 'paragraph') {
      output.push(
        <p key={`${blockPrefix}-p-${i}`}>
          {renderInlineText(block.text, `${blockPrefix}-p-${i}`)}
        </p>
      );
    } else if (block.type === 'unordered-list') {
      output.push(
        <ul key={`${blockPrefix}-ul-${i}`}>
          {block.items.map((item, idx) => (
            <li key={`${blockPrefix}-ul-${i}-${idx}`}>
              {renderInlineText(item, `${blockPrefix}-ul-${i}-${idx}`)}
            </li>
          ))}
        </ul>
      );
    } else if (block.type === 'ordered-list') {
      output.push(
        <ol key={`${blockPrefix}-ol-${i}`}>
          {block.items.map((item, idx) => (
            <li key={`${blockPrefix}-ol-${i}-${idx}`}>
              {renderInlineText(item, `${blockPrefix}-ol-${i}-${idx}`)}
            </li>
          ))}
        </ol>
      );
    } else if (block.type === 'table') {
      output.push(
        <div className="spec-table-wrap" key={`${blockPrefix}-tbl-${i}`}>
          <table className="spec-table">
            <thead>
              <tr>
                {block.headers.map((header, idx) => (
                  <th scope="col" key={`${blockPrefix}-th-${idx}`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIdx) => (
                <tr key={`${blockPrefix}-row-${rowIdx}`}>
                  {row.map((cell, cellIdx) => (
                    <td key={`${blockPrefix}-cell-${rowIdx}-${cellIdx}`}>
                      {renderInlineText(cell, `${blockPrefix}-cell-${rowIdx}-${cellIdx}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    i += 1;
  }

  return output;
}

export default function App() {
  const pulseConfigured = useMemo(() => isPulseConfigured(), []);

  const [activeSpecId, setActiveSpecId] = useState<SpecId>(() => resolveInitialSpecId());
  const [pendingScrollAnchor, setPendingScrollAnchor] = useState<string | null>(null);
  const [activeLensIndex, setActiveLensIndex] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState('preamble');
  const [copyStatus, setCopyStatus] = useState('');
  const [pulseNoticeVisible, setPulseNoticeVisible] = useState(false);
  const [votes, setVotes] = useState<Record<string, StoredVote>>(() => loadSavedVotes());
  const [lastVotedKey, setLastVotedKey] = useState<string | null>(null);
  const [reactionSavedOffline, setReactionSavedOffline] = useState(false);

  const activeSpecItem = useMemo(
    () => SPEC_SERIES.find((item) => item.id === activeSpecId) ?? SPEC_SERIES[0],
    [activeSpecId]
  );
  const spec = activeSpecItem.parsed;
  const activeLens = STAKEHOLDER_LENSES[activeLensIndex];
  const totalInvariants = useMemo(
    () => SPEC_SERIES.reduce((sum, item) => sum + item.invariantsCount, 0),
    []
  );

  useEffect(() => {
    ensurePulseWidgetMounted();
  }, []);

  useEffect(() => {
    if (!pendingScrollAnchor || typeof document === 'undefined') {
      return;
    }
    const timer = window.requestAnimationFrame(() => {
      document.getElementById(pendingScrollAnchor)?.scrollIntoView();
      setActiveSectionId(pendingScrollAnchor);
      setPendingScrollAnchor(null);
    });
    return () => window.cancelAnimationFrame(timer);
  }, [activeSpecId, pendingScrollAnchor]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const targets = spec.sections
      .map((sec) => document.getElementById(sec.id))
      .filter((el): el is HTMLElement => el !== null);

    if (targets.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0 && visible[0].target.id) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-18% 0px -68% 0px',
        threshold: 0,
      }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeSpecId, spec.sections]);

  const navigateToSpecSection = useCallback((specId: SpecId, anchorId: string) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('spec', specId);
      url.hash = anchorId;
      window.history.replaceState(null, '', url.toString());
    }
    setCopyStatus('');
    setActiveSpecId(specId);
    setPendingScrollAnchor(anchorId);
  }, []);

  async function handleCopy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`${label} copied to clipboard.`);
    } catch {
      setCopyStatus(`Copy unavailable in this browser; ${label} is shown in the provenance plate.`);
    }
  }

  function handleOpenFeedback(scrollFallback: boolean, prefillTag?: string) {
    const opened = openPulseWidget(prefillTag);
    if (!opened) {
      setPulseNoticeVisible(true);
      if (scrollFallback) {
        document.getElementById('feedback')?.scrollIntoView();
      }
    }
  }

  async function handleVote(
    specId: SpecId,
    sectionId: string,
    sectionHeading: string,
    choice: StoredVote
  ) {
    const key = `${specId}_${sectionId}`;
    const current = votes[key];
    const nextVote: VoteValue = current === choice ? 'none' : choice;

    const nextVotes: Record<string, StoredVote> = { ...votes };
    if (nextVote === 'none') {
      delete nextVotes[key];
      if (lastVotedKey === key) {
        setLastVotedKey(null);
      }
    } else {
      nextVotes[key] = nextVote;
      setLastVotedKey(key);
    }

    setVotes(nextVotes);
    saveVotes(nextVotes);
    setReactionSavedOffline(false);

    const ok = await submitSectionReaction({
      specId,
      sectionId,
      sectionHeading,
      vote: nextVote,
    });
    if (!ok && nextVote !== 'none') {
      setReactionSavedOffline(true);
    }
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, idx: number) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActiveLensIndex((idx + 1) % STAKEHOLDER_LENSES.length);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActiveLensIndex((idx - 1 + STAKEHOLDER_LENSES.length) % STAKEHOLDER_LENSES.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveLensIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveLensIndex(STAKEHOLDER_LENSES.length - 1);
    }
  }

  const citationText = `The Living Price Atlas: ${activeSpecItem.shortTitle} (${activeSpecItem.id} v${spec.meta.version}, ${spec.meta.date}). https://livingpriceatlas.banezglobal.com/?spec=${activeSpecItem.id} · sha256:${activeSpecItem.sha256}`;

  return (
    <>
      <a className="skip-link" href="#specification">
        Skip to specification text
      </a>

      <header className="masthead">
        <div className="container masthead-inner">
          <div className="masthead-brand">
            <a className="brand-home" href="https://banezglobal.com">
              Bañez Global
            </a>
            <span className="brand-divider" aria-hidden="true">
              /
            </span>
            <span className="brand-spec tabular">
              LPA001 to LPA004 · v{spec.meta.version}
            </span>
          </div>

          <nav className="masthead-nav" aria-label="Primary navigation">
            <a href="#series">Specifications (1 to 4)</a>
            <a href="#specification">Read {activeSpecItem.id}</a>
            <a href={`#${activeSpecItem.invariantsSectionId}`}>
              {activeSpecItem.invariantsCount} Invariants
            </a>
            <a href="#feedback">Feedback &amp; Support</a>
            <a href={activeSpecItem.downloadHref} download={activeSpecItem.downloadFilename}>
              Download {activeSpecItem.id}
            </a>
            <button
              type="button"
              className="btn btn-primary btn-compact"
              onClick={() => handleOpenFeedback(true)}
            >
              Share Feedback
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="container hero-grid">
            <div className="hero-lead">
              <p className="status-line">
                <span className="status-dot" aria-hidden="true" />
                <span className="tabular">
                  Living Price Atlas Series · LPA001 to LPA004 (v1.0) · {totalInvariants} Invariants
                </span>
              </p>

              <h1 id="hero-title" className="hero-title">
                The Living Price Atlas
              </h1>
              <p className="hero-subtitle">
                From Foundational Epistemic Principles (LPA001) to Domain Inheritance (LPA002),
                Contextual Cost Modeling (LPA003), and Reciprocal Participation (LPA004)
              </p>
              <p className="hero-summary">
                Published openly so engineers, contractors, suppliers, public institutions,
                researchers, local enterprises, and citizens can inspect the full specification stack
                verbatim, challenge weak assumptions before LPA005 to LPA009 lock in, and help build
                verifiable development cost intelligence.
              </p>

              <div className="hero-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleOpenFeedback(false)}
                >
                  Open Feedback &amp; Support Channel
                </button>
                <a className="btn btn-secondary" href="#series">
                  Browse All 4 Specifications
                </a>
                <a
                  className="btn btn-secondary"
                  href={activeSpecItem.downloadHref}
                  download={activeSpecItem.downloadFilename}
                >
                  Download {activeSpecItem.id} Markdown
                </a>
              </div>

              {pulseNoticeVisible && !pulseConfigured && (
                <div className="pulse-notice" role="status">
                  <p>
                    <strong>Interactive Pulse feedback widget is completing setup.</strong> Once
                    wired to the Living Price Atlas Pulse tenant, this button opens live chat
                    directly inside the page.
                  </p>
                  <p>
                    In the meantime, review any specification below or file a section-cited issue at{' '}
                    <a
                      href="https://github.com/zenbanez/livingpriceatlas/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      github.com/zenbanez/livingpriceatlas
                    </a>
                    .
                  </p>
                </div>
              )}
            </div>

            <aside className="provenance-plate" aria-label="Active specification provenance">
              <div className="plate-header">
                <h2 className="plate-title">Specification Provenance</h2>
                <span className="plate-kicker tabular">{activeSpecItem.id}</span>
              </div>

              <dl className="plate-list">
                <dt>Document ID</dt>
                <dd className="tabular">
                  {spec.meta.specification} · v{spec.meta.version}
                </dd>

                <dt>Title</dt>
                <dd>{activeSpecItem.shortTitle}</dd>

                <dt>Classification</dt>
                <dd>{spec.meta.classification}</dd>

                {spec.meta.predecessors && (
                  <>
                    <dt>Predecessors</dt>
                    <dd className="tabular">{spec.meta.predecessors}</dd>
                  </>
                )}

                {spec.meta.lineage && (
                  <>
                    <dt>Lineage</dt>
                    <dd>{spec.meta.lineage}</dd>
                  </>
                )}

                <dt>Published</dt>
                <dd className="tabular">
                  {spec.meta.date} ({spec.meta.status})
                </dd>

                <dt>Canonical Size</dt>
                <dd className="tabular">
                  {activeSpecItem.byteLength.toLocaleString('en-US')} bytes (LF)
                </dd>

                <dt>SHA-256</dt>
                <dd className="plate-mono tabular" title={activeSpecItem.sha256}>
                  {activeSpecItem.sha256.slice(0, 12)}...{activeSpecItem.sha256.slice(-8)}
                </dd>
              </dl>

              <div className="plate-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-compact"
                  onClick={() =>
                    handleCopy(activeSpecItem.sha256, `${activeSpecItem.id} SHA-256 checksum`)
                  }
                >
                  Copy SHA-256
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-compact"
                  onClick={() => handleCopy(citationText, `${activeSpecItem.id} citation`)}
                >
                  Copy Citation
                </button>
                <a
                  className="plate-repo-link"
                  href="https://github.com/zenbanez/livingpriceatlas"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Public Source Repo
                </a>
              </div>

              <p className="copy-feedback" aria-live="polite">
                {copyStatus}
              </p>
            </aside>
          </div>
        </section>

        <section id="series" className="series-band" aria-labelledby="series-heading">
          <div className="container">
            <div className="series-header">
              <div>
                <h2 id="series-heading" className="band-title">
                  Specification Series (LPA001 to LPA004)
                </h2>
                <p className="band-copy">
                  Select a published specification to inspect its full verbatim text, inline
                  architectural diagrams, and invariant ledger.
                </p>
              </div>
              <span className="series-meta tabular">
                4 Published · 5 Figures · 5 Upcoming (LPA005 to LPA009)
              </span>
            </div>

            <div className="series-grid" role="group" aria-label="Published specifications">
              {SPEC_SERIES.map((item) => {
                const isActive = item.id === activeSpecId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="series-card"
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => navigateToSpecSection(item.id, 'specification')}
                  >
                    <div className="series-card-top">
                      <span className="series-card-id tabular">{item.id}</span>
                      <span className="series-card-inv tabular">
                        {item.invariantsCount} Invariants
                      </span>
                    </div>
                    <span className="series-card-title">{item.shortTitle}</span>
                    <span className="series-card-desc">{item.focusSummary}</span>
                  </button>
                );
              })}
            </div>

            <div className="roadmap-strip">
              <p className="roadmap-heading">
                Upcoming Subsequent Specifications (Planned Accountability Lineage)
              </p>
              <ul className="roadmap-list">
                {UPCOMING_SPECS.map((up) => (
                  <li key={up.id}>
                    <span className="roadmap-id tabular">{up.id}</span>
                    <span className="roadmap-title">{up.title}</span>
                    <span className="roadmap-focus">{up.focus}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="feedback" className="consultation" aria-labelledby="feedback-heading">
          <div className="container">
            <div className="section-header-row">
              <div className="consultation-intro">
                <h2 id="feedback-heading" className="band-title">
                  Open Call for Feedback &amp; Support
                </h2>
                <p className="band-copy">
                  Grounded in LPA001 Sections 4.4 and 15 alongside LPA004 (Contribution and
                  Participation Protocol). Choose a perspective to jump straight to relevant sections
                  across the four specifications.
                </p>
              </div>

              <div className="consultation-tracks">
                <article className="track-card">
                  <h3>1. Substantive Critique &amp; Challenge</h3>
                  <p>
                    Cite a specification section, Cost Driver, or invariant where real-world field
                    conditions or competition dynamics expose an ambiguity or gap.
                  </p>
                </article>
                <article className="track-card">
                  <h3>2. Ecosystem Support &amp; Collaboration</h3>
                  <p>
                    Offer domain evidence, historical datasets, receiving-agency experience, or
                    regional piloting ahead of LPA005 to LPA009.
                  </p>
                </article>
              </div>
            </div>

            <div className="lens-box">
              <div
                className="lens-tablist"
                role="tablist"
                aria-label="Participant perspectives from LPA001 Section 4.4 and LPA004 Section 6"
              >
                {STAKEHOLDER_LENSES.map((lens, idx) => {
                  const selected = idx === activeLensIndex;
                  return (
                    <button
                      key={lens.id}
                      id={`tab-${lens.id}`}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-controls={`panel-${lens.id}`}
                      tabIndex={selected ? 0 : -1}
                      className="lens-tab"
                      onClick={() => setActiveLensIndex(idx)}
                      onKeyDown={(e) => handleTabKeyDown(e, idx)}
                    >
                      {lens.label}
                    </button>
                  );
                })}
              </div>

              <div
                id={`panel-${activeLens.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${activeLens.id}`}
                className="lens-panel"
              >
                <div className="lens-questions-col">
                  <h3 className="lens-heading">{activeLens.label}</h3>
                  <p className="lens-context">{activeLens.context}</p>
                  <ol className="lens-questions">
                    {activeLens.prompts.map((item) => (
                      <li key={`${activeLens.id}-${item.specId}-${item.sectionId}`}>
                        <span>{item.question}</span>
                        <button
                          type="button"
                          className="lens-ref tabular"
                          onClick={() => navigateToSpecSection(item.specId, item.sectionId)}
                        >
                          [{item.sectionLabel}]
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="lens-cta-col">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleOpenFeedback(false)}
                  >
                    Start Conversation in Pulse
                  </button>
                  <p className="signin-note">
                    You can message directly in the Pulse widget right away, or use 1-click Google
                    Sign-In inside the widget header if you want your thread saved for follow-up.
                  </p>
                  {pulseNoticeVisible && !pulseConfigured && (
                    <div className="pulse-notice" role="status">
                      <p>
                        Pulse tenant onboarding is in progress for{' '}
                        <span className="tabular">livingpriceatlas.banezglobal.com</span>. Once
                        configured, clicking this button opens the live Pulse assistant directly.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="specification"
          className="spec-workspace"
          aria-label={`${activeSpecItem.id} Specification Reader`}
        >
          <div className="container">
            <details className="mobile-toc">
              <summary>
                {activeSpecItem.id}: Jump to section ({spec.sections.length} sections)
              </summary>
              <ul className="mobile-toc-list">
                {spec.sections.map((section) => (
                  <li key={`mobile-${activeSpecItem.id}-${section.id}`}>
                    <a className="toc-link" href={`#${section.id}`}>
                      <span className="toc-num tabular">
                        {section.number ? section.number.padStart(2, '0') : '·'}
                      </span>
                      <span>{section.shortTitle}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </details>

            <div className="spec-layout">
              <nav className="toc-rail" aria-label="Specification sections">
                <p className="toc-heading tabular">{activeSpecItem.id} · Table of Contents</p>
                <ol className="toc-list">
                  {spec.sections.map((section) => (
                    <li key={`toc-${activeSpecItem.id}-${section.id}`}>
                      <a
                        className="toc-link"
                        href={`#${section.id}`}
                        aria-current={activeSectionId === section.id ? 'location' : undefined}
                      >
                        <span className="toc-num tabular">
                          {section.number ? section.number.padStart(2, '0') : '·'}
                        </span>
                        <span>{section.shortTitle}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              <article className="spec-document">
                <header className="spec-doc-header">
                  <h2 className="spec-doc-title">{spec.meta.title}</h2>
                  <p className="spec-doc-subtitle">{spec.meta.subtitle}</p>
                  <dl className="spec-doc-meta">
                    <dt>Specification:</dt>
                    <dd className="tabular">{spec.meta.specification}</dd>
                    <dt>Version:</dt>
                    <dd className="tabular">{spec.meta.version}</dd>
                    <dt>Date:</dt>
                    <dd className="tabular">{spec.meta.date}</dd>
                    <dt>Classification:</dt>
                    <dd>{spec.meta.classification}</dd>
                    <dt>Status:</dt>
                    <dd>{spec.meta.status}</dd>
                    {spec.meta.predecessors && (
                      <>
                        <dt>Predecessors:</dt>
                        <dd className="tabular">{spec.meta.predecessors}</dd>
                      </>
                    )}
                    {spec.meta.lineage && (
                      <>
                        <dt>Foundational lineage:</dt>
                        <dd>{spec.meta.lineage}</dd>
                      </>
                    )}
                  </dl>
                </header>

                {spec.sections.map((section) => {
                  const sectionFigure = getFigureForSection(activeSpecItem.id, section.id);
                  const reactionKey = `${activeSpecItem.id}_${section.id}`;
                  const currentVote = votes[reactionKey];
                  const showReactionBar = lastVotedKey === reactionKey && currentVote !== undefined;
                  const prefillPrefix =
                    currentVote === 'up'
                      ? `[+1 ${activeSpecItem.id} #${section.id} (${section.shortTitle})] `
                      : `[Review ${activeSpecItem.id} #${section.id} (${section.shortTitle})] `;

                  return (
                    <section
                      key={`${activeSpecItem.id}-${section.id}`}
                      id={section.id}
                      className="spec-section"
                      aria-labelledby={`heading-${section.id}`}
                    >
                      <div className="spec-h2-row">
                        <h2 id={`heading-${section.id}`} className="spec-h2">
                          {section.heading}
                        </h2>
                        <div className="spec-h2-tools">
                          <div
                            className="reaction-group"
                            role="group"
                            aria-label={`Feedback on ${section.heading}`}
                          >
                            <button
                              type="button"
                              className="reaction-btn reaction-up"
                              aria-pressed={currentVote === 'up'}
                              aria-label={`Thumbs up on ${section.heading}`}
                              title="Sound and clear"
                              onClick={() =>
                                handleVote(activeSpecItem.id, section.id, section.heading, 'up')
                              }
                            >
                              <ThumbUpIcon />
                            </button>
                            <button
                              type="button"
                              className="reaction-btn reaction-down"
                              aria-pressed={currentVote === 'down'}
                              aria-label={`Thumbs down on ${section.heading}`}
                              title="Needs revision or question"
                              onClick={() =>
                                handleVote(activeSpecItem.id, section.id, section.heading, 'down')
                              }
                            >
                              <ThumbDownIcon />
                            </button>
                          </div>
                          <a
                            className="section-anchor tabular"
                            href={`#${section.id}`}
                            aria-label={`Link to ${section.heading}`}
                          >
                            #{section.id}
                          </a>
                        </div>
                      </div>

                      {showReactionBar && (
                        <div className="section-reaction-bar" role="status">
                          <span>
                            {currentVote === 'up'
                              ? `Feedback saved for ${activeSpecItem.id} · ${section.shortTitle}.`
                              : `Flagged for review on ${activeSpecItem.id} · ${section.shortTitle}.`}
                            {reactionSavedOffline ? ' (offline: saved locally)' : ''}
                          </span>
                          <button
                            type="button"
                            className="reaction-note-link"
                            onClick={() => handleOpenFeedback(true, prefillPrefix)}
                          >
                            {currentVote === 'up'
                              ? 'Add a note in Pulse'
                              : 'Share what needs work in Pulse'}
                          </button>
                        </div>
                      )}

                      <div className="spec-prose">
                        {renderSpecBlocks(section.blocks, `${activeSpecItem.id}-${section.id}`)}
                      </div>

                      {sectionFigure && (
                        <figure className="spec-figure">
                          <img
                            src={sectionFigure.src}
                            alt={sectionFigure.alt}
                            loading="lazy"
                          />
                          <figcaption className="spec-figure-caption">
                            <span>{sectionFigure.caption}</span>
                            <a
                              href={sectionFigure.src}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open full figure
                            </a>
                          </figcaption>
                        </figure>
                      )}

                      {section.subsections.map((sub) => (
                        <section
                          key={`${activeSpecItem.id}-${sub.id}`}
                          id={sub.id}
                          className="spec-subsection"
                          aria-labelledby={`heading-${sub.id}`}
                        >
                          <div className="spec-h3-row">
                            <h3 id={`heading-${sub.id}`} className="spec-h3">
                              {sub.heading}
                            </h3>
                            <a
                              className="section-anchor tabular"
                              href={`#${sub.id}`}
                              aria-label={`Link to ${sub.heading}`}
                            >
                              #{sub.id}
                            </a>
                          </div>
                          <div className="spec-prose">
                            {renderSpecBlocks(sub.blocks, `${activeSpecItem.id}-${sub.id}`)}
                          </div>
                        </section>
                      ))}
                    </section>
                  );
                })}

                <p className="spec-colophon">{spec.meta.closingColophon}</p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span>
            Stewarded under <a href="https://banezglobal.com">Bañez Global</a> · The Living Price
            Atlas Project (LPA001 to LPA004 v1.0)
          </span>
          <div className="footer-links">
            <a href="https://banezglobal.com">banezglobal.com</a>
            <a href={activeSpecItem.downloadHref} download={activeSpecItem.downloadFilename}>
              {activeSpecItem.downloadFilename}
            </a>
            <a
              href="https://github.com/zenbanez/livingpriceatlas"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
