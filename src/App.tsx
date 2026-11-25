import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import rawLpa001 from './corpus/LPA001-v1.0.md?raw';
import {
  CANONICAL_BYTE_LENGTH,
  CANONICAL_SHA256,
  parseInlineTokens,
  parseSpecification,
  type SpecBlock,
} from './lib/parseSpec';
import {
  ensurePulseWidgetMounted,
  isPulseConfigured,
  openPulseWidget,
} from './lib/pulse';

interface StakeholderLens {
  id: string;
  label: string;
  context: string;
  prompts: {
    question: string;
    sectionId: string;
    sectionLabel: string;
  }[];
}

const STAKEHOLDER_LENSES: StakeholderLens[] = [
  {
    id: 'engineers',
    label: 'Engineers & Technical Professionals',
    context:
      'Review how technical specifications, work-item scope, site difficulty, and uncertainty are represented.',
    prompts: [
      {
        question:
          'Do the eight epistemic properties (Observed, Declared, Corroborated, Derived, Inferred, Disputed, Stale, Superseded) give field engineers clean boundaries between measurement and estimation?',
        sectionId: 'sec-5-3',
        sectionLabel: '§5.3',
      },
      {
        question:
          'Which physical and site variables in Layer 4 (terrain, haul distance, access, geotechnical risk, weather exposure) are essential before comparing infrastructure unit costs?',
        sectionId: 'sec-6-4',
        sectionLabel: '§6.4',
      },
      {
        question:
          'How should post-completion realized quantities and variation orders enter Layer 5 without distorting baseline unit references?',
        sectionId: 'sec-6-5',
        sectionLabel: '§6.5',
      },
    ],
  },
  {
    id: 'contractors',
    label: 'Contractors & Builders',
    context:
      'Examine how field execution constraints, mobilization, payment risk, and scheduling conditions affect reasonable project cost.',
    prompts: [
      {
        question:
          'Does the spec protect contractors from false "overpricing" conclusions when remote logistics, night work, or phased ROW delays raise genuine execution cost?',
        sectionId: 'sec-4-5',
        sectionLabel: '§4.5',
      },
      {
        question:
          'Are the safeguards against strategic underbidding and distorted cost disclosures strong enough to preserve honest field reporting?',
        sectionId: 'sec-10',
        sectionLabel: '§10',
      },
      {
        question:
          'What challenge and clarification workflow would actually feel safe and fair for active builders to use?',
        sectionId: 'sec-15',
        sectionLabel: '§15',
      },
    ],
  },
  {
    id: 'suppliers',
    label: 'Suppliers & Manufacturers',
    context:
      'Stress-test commercial confidentiality, oligopolistic pricing detection, and seasonal material reality.',
    prompts: [
      {
        question:
          'Does Section 11 strike the right balance between anonymizing private commercial terms and preserving regional market transparency?',
        sectionId: 'sec-11',
        sectionLabel: '§11',
      },
      {
        question:
          'In concentrated markets with few regional quarries or batching plants, what corroboration rules stop a dominant actor from normalizing inflated quotes?',
        sectionId: 'sec-10',
        sectionLabel: '§10',
      },
      {
        question:
          'How should quotation expiry, volume tiers, and port-to-site freight volatility be reflected in Market Evidence?',
        sectionId: 'sec-6-3',
        sectionLabel: '§6.3',
      },
    ],
  },
  {
    id: 'government',
    label: 'Government Institutions',
    context:
      'Inspect how historical public price atlases connect cleanly to contextual budgeting without creating institutional capture.',
    prompts: [
      {
        question:
          'Does treating official baselines such as the DPWH Price Atlas 2022 as Layer 1 rather than absolute truth align with real procurement review needs?',
        sectionId: 'sec-6-1',
        sectionLabel: '§6.1',
      },
      {
        question:
          'Is the Scope of Authority boundary clear enough that the Atlas informs public budgeting without assuming statutory or audit authority?',
        sectionId: 'sec-17',
        sectionLabel: '§17',
      },
      {
        question:
          'What governance safeguards keep public-sector alignment collaborative while preserving independence across administrations?',
        sectionId: 'sec-16',
        sectionLabel: '§16',
      },
    ],
  },
  {
    id: 'researchers',
    label: 'Researchers & Academics',
    context:
      'Evaluate epistemic rigor, index construction, explicit uncertainty ranges, and immutable revision lineage.',
    prompts: [
      {
        question:
          'How should Layer 2 economic adjustment indices document methodology shifts, base-year rebasing, and basket composition over time?',
        sectionId: 'sec-6-2',
        sectionLabel: '§6.2',
      },
      {
        question:
          'Do the Disputed status and Coexistence of Competing Interpretations rules avoid premature consensus when regional evidence diverges?',
        sectionId: 'sec-5-6',
        sectionLabel: '§5.6',
      },
      {
        question:
          'What metadata schema is needed in LPA002 so historical snapshots remain reproducible without silent backfilling?',
        sectionId: 'sec-12',
        sectionLabel: '§12',
      },
    ],
  },
  {
    id: 'workers',
    label: 'Workers & Local Enterprises',
    context:
      'Check how skilled labor, local equipment availability, and rural trade ecosystems show up in regional cost reality.',
    prompts: [
      {
        question:
          'Do the principles account for genuine skilled-labor scarcity, safety compliance, and prevailing wage differences across provinces and islands?',
        sectionId: 'sec-5-1',
        sectionLabel: '§5.1',
      },
      {
        question:
          'Can small regional enterprises contribute verified observations without heavy administrative overhead?',
        sectionId: 'sec-4-4',
        sectionLabel: '§4.4',
      },
      {
        question:
          'When contributor identities require protection against commercial retaliation, what verification path keeps evidence accountable?',
        sectionId: 'sec-4-3',
        sectionLabel: '§4.3',
      },
    ],
  },
  {
    id: 'communities',
    label: 'Communities & Civil Society',
    context:
      'Verify readability, non-presumptive civic language, and citizens’ practical right to challenge local project assumptions.',
    prompts: [
      {
        question:
          'Does the Right to Understand and Challenge allow ordinary residents and civic groups to flag local conditions or missing context clearly?',
        sectionId: 'sec-15',
        sectionLabel: '§15',
      },
      {
        question:
          'Is Interpretation Without Presumption strong enough to prevent raw price variance from being misused as automated accusation?',
        sectionId: 'sec-13',
        sectionLabel: '§13',
      },
      {
        question:
          'If society still knows little about a rural item, does explicitly stating "We do not yet know" build greater civic trust?',
        sectionId: 'sec-4-1',
        sectionLabel: '§4.1',
      },
    ],
  },
];

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
  const spec = useMemo(() => parseSpecification(rawLpa001), []);
  const pulseConfigured = useMemo(() => isPulseConfigured(), []);

  const [activeLensIndex, setActiveLensIndex] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState('preamble');
  const [copyStatus, setCopyStatus] = useState('');
  const [pulseNoticeVisible, setPulseNoticeVisible] = useState(false);

  const activeLens = STAKEHOLDER_LENSES[activeLensIndex];

  useEffect(() => {
    ensurePulseWidgetMounted();
  }, []);

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
  }, [spec.sections]);

  async function handleCopy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`${label} copied to clipboard.`);
    } catch {
      setCopyStatus(`Copy unavailable in this browser; ${label} is shown in the provenance plate.`);
    }
  }

  function handleOpenFeedback(scrollFallback: boolean) {
    const opened = openPulseWidget();
    if (!opened) {
      setPulseNoticeVisible(true);
      if (scrollFallback) {
        document.getElementById('feedback')?.scrollIntoView();
      }
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

  const citationText = `The Living Price Atlas: Foundational Principles and Epistemic Framework (LPA001 v1.0, November 25, 2026). https://livingpriceatlas.banezglobal.com/ · sha256:${CANONICAL_SHA256}`;

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
              {spec.meta.specification} · v{spec.meta.version}
            </span>
          </div>

          <nav className="masthead-nav" aria-label="Primary navigation">
            <a href="#specification">Read Specification</a>
            <a href="#sec-19">12 Invariants</a>
            <a href="#feedback">Feedback &amp; Support</a>
            <a href="/LPA001-v1.0.md" download="LPA001-v1.0.md">
              Download .md
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
                <span>
                  {spec.meta.classification} · {spec.meta.status}
                </span>
              </p>

              <h1 id="hero-title" className="hero-title">
                The Living Price Atlas
              </h1>
              <p className="hero-subtitle">{spec.meta.subtitle}</p>
              <p className="hero-summary">
                Published openly so engineers, contractors, suppliers, public institutions,
                researchers, local enterprises, and citizens can examine LPA001 verbatim,
                challenge weak assumptions before downstream schemas lock in, and contribute
                expertise toward verifiable development cost intelligence.
              </p>

              <div className="hero-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleOpenFeedback(false)}
                >
                  Open Feedback &amp; Support Channel
                </button>
                <a className="btn btn-secondary" href="#preamble">
                  Jump to Preamble
                </a>
                <a
                  className="btn btn-secondary"
                  href="/LPA001-v1.0.md"
                  download="LPA001-v1.0.md"
                >
                  Download Verbatim Markdown
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
                    In the meantime, review any section below or file a section-cited issue at{' '}
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

            <aside className="provenance-plate" aria-label="Specification provenance">
              <div className="plate-header">
                <h2 className="plate-title">Specification Provenance</h2>
                <span className="plate-kicker tabular">{spec.meta.specification}</span>
              </div>

              <dl className="plate-list">
                <dt>Document ID</dt>
                <dd className="tabular">{spec.meta.specification}</dd>

                <dt>Version</dt>
                <dd className="tabular">{spec.meta.version}</dd>

                <dt>Published</dt>
                <dd className="tabular">{spec.meta.date}</dd>

                <dt>Status</dt>
                <dd>{spec.meta.status}</dd>

                <dt>Initial Baseline</dt>
                <dd>DPWH Price Atlas 2022</dd>

                <dt>Canonical Size</dt>
                <dd className="tabular">{CANONICAL_BYTE_LENGTH.toLocaleString('en-US')} bytes (LF)</dd>

                <dt>SHA-256</dt>
                <dd className="plate-mono tabular" title={CANONICAL_SHA256}>
                  {CANONICAL_SHA256.slice(0, 12)}...{CANONICAL_SHA256.slice(-8)}
                </dd>
              </dl>

              <div className="plate-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-compact"
                  onClick={() => handleCopy(CANONICAL_SHA256, 'SHA-256 checksum')}
                >
                  Copy SHA-256
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-compact"
                  onClick={() => handleCopy(citationText, 'Specification citation')}
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

        <section id="feedback" className="consultation" aria-labelledby="feedback-heading">
          <div className="container">
            <div className="section-header-row">
              <div className="consultation-intro">
                <h2 id="feedback-heading" className="band-title">
                  Open Call for Feedback &amp; Support
                </h2>
                <p className="band-copy">
                  Grounded in LPA001 Section 4.4 (Open Participation) and Section 15 (The Right to
                  Understand and Challenge). Pick your perspective below to focus your review.
                </p>
              </div>

              <div className="consultation-tracks">
                <article className="track-card">
                  <h3>1. Substantive Critique &amp; Challenge</h3>
                  <p>
                    Cite a section, epistemic property, or invariant where real-world construction,
                    logistics, or market incentives expose an ambiguity or blind spot.
                  </p>
                </article>
                <article className="track-card">
                  <h3>2. Ecosystem Support &amp; Collaboration</h3>
                  <p>
                    Offer regional domain context, historical records, research review, or pilot
                    collaboration ahead of LPA002 schema design.
                  </p>
                </article>
              </div>
            </div>

            <div className="lens-box">
              <div
                className="lens-tablist"
                role="tablist"
                aria-label="Participant perspectives from Section 4.4"
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
                      <li key={`${activeLens.id}-${item.sectionId}`}>
                        <span>{item.question}</span>
                        <a className="lens-ref tabular" href={`#${item.sectionId}`}>
                          [{item.sectionLabel}]
                        </a>
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

        <section id="specification" className="spec-workspace" aria-label="LPA001 Specification">
          <div className="container">
            <details className="mobile-toc">
              <summary>Jump to specification section</summary>
              <ul className="mobile-toc-list">
                {spec.sections.map((section) => (
                  <li key={`mobile-${section.id}`}>
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
                <p className="toc-heading">LPA001 · Table of Contents</p>
                <ol className="toc-list">
                  {spec.sections.map((section) => (
                    <li key={`toc-${section.id}`}>
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
                  </dl>
                </header>

                {spec.sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className="spec-section"
                    aria-labelledby={`heading-${section.id}`}
                  >
                    <div className="spec-h2-row">
                      <h2 id={`heading-${section.id}`} className="spec-h2">
                        {section.heading}
                      </h2>
                      <a
                        className="section-anchor tabular"
                        href={`#${section.id}`}
                        aria-label={`Link to ${section.heading}`}
                      >
                        #{section.id}
                      </a>
                    </div>

                    <div className="spec-prose">
                      {renderSpecBlocks(section.blocks, section.id)}
                    </div>

                    {section.subsections.map((sub) => (
                      <section
                        key={sub.id}
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
                        <div className="spec-prose">{renderSpecBlocks(sub.blocks, sub.id)}</div>
                      </section>
                    ))}
                  </section>
                ))}

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
            Atlas Project ({spec.meta.specification} v{spec.meta.version})
          </span>
          <div className="footer-links">
            <a href="https://banezglobal.com">banezglobal.com</a>
            <a href="/LPA001-v1.0.md" download="LPA001-v1.0.md">
              LPA001-v1.0.md
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
