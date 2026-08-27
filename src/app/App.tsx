import { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";
import { X, ChevronLeft, ChevronDown, ChevronUp, BookOpen } from "lucide-react";

// ── Pre-filled from Tune In ───────────────────────────────────────────────────

const PREFILLED = {
  summary:
    `You said that seeing your friends hanging out without you made you feel left out, and you were thinking, “Maybe they like each other more than me.”`,
  thought: "Maybe they like each other more than me.",
  emotion: "left out",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3 | 4;

const THINKING_STYLES = [
  {
    name: "Mental filter",
    desc: "Focusing on the negatives and overlooking the positives.",
  },
  {
    name: "Mind reading",
    desc: "Assuming you know what someone else is thinking without really knowing.",
  },
  {
    name: "Fortune Telling",
    desc: "Assuming something will go badly before you really know what will happen.",
  },
  {
    name: "Personalizing",
    desc: "Blaming yourself for something that isn't totally your fault.",
  },
  {
    name: "Blowing It Up & Brushing It Off",
    desc: "Making the bad stuff seem bigger while brushing off the good stuff.",
  },
  {
    name: "All-or-none thinking",
    desc: "Seeing things as one extreme or the other, with no in-between.",
  },
  {
    name: "Shoulds & musts",
    desc: 'Putting a lot of pressure on yourself with thoughts like "I should" or "I have to."',
  },
  {
    name: "Overgeneralizing",
    desc: "Taking one bad experience and feeling like it means things will always be that way.",
  },
  {
    name: "Labeling",
    desc: "Using one negative word or experience to define yourself or someone else.",
  },
  {
    name: "Emotional reasoning",
    desc: "Feeling like something must be true just because it feels true.",
  },
];

const DISPUTATION_QUESTIONS = [
  "What would you say to a friend who was having this thought?",
  "Is there another way this situation could turn out?",
  "What's something supportive you could say to yourself right now?",
  "Is this thought helping you manage tough feelings and meet your goals?",
  "How else might you think about the situation?",
];

interface JournalData {
  confirmStatus: "yes" | "kind-of" | "not-really" | null;
  correction: string;
  thinkingStyles: string[];
  evidenceFor: string;
  evidenceAgainst: string;
  disputationAnswers: Record<string, string>;
  balancedThought: string;
  emotionRating: number | null;
  thoughtBelief: number | null;
}

const EMPTY: JournalData = {
  confirmStatus: null,
  correction: "",
  thinkingStyles: [],
  evidenceFor: "",
  evidenceAgainst: "",
  disputationAnswers: {},
  balancedThought: "",
  emotionRating: null,
  thoughtBelief: null,
};

interface LibraryEntry {
  id: string;
  hotThought: string;
  balancedThought: string;
  helpfulness: number;
  date: string;
}

const SEED_LIBRARY: LibraryEntry[] = [
  {
    id: "1",
    hotThought: "Nobody actually wants me there.",
    balancedThought: "I feel nervous about being left out, but that doesn't mean people don't want me around. I've been included plenty of times before.",
    helpfulness: 6,
    date: "3 Jul 2025",
  },
  {
    id: "2",
    hotThought: "I'm the only one who doesn't know what they're doing.",
    balancedThought: "Everyone is figuring things out. I might be struggling right now but that doesn't mean I'm behind forever.",
    helpfulness: 5,
    date: "18 Jun 2025",
  },
  {
    id: "3",
    hotThought: "They're all talking about me.",
    balancedThought: "It felt like they were looking at me, but I don't actually know what they were saying. Most people are focused on their own thing.",
    helpfulness: 4,
    date: "2 Jun 2025",
  },
];


// ── Motion ────────────────────────────────────────────────────────────────────

const SLIDE = {
  enter: (d: number) => ({ x: d > 0 ? 36 : -36, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -36 : 36, opacity: 0 }),
};
const T = { duration: 0.26, ease: [0.32, 0, 0.67, 0] as [number, number, number, number] };

// ── Shared atoms ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
      {children}
    </p>
  );
}

function Question({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[17px] font-bold text-foreground leading-snug" style={{ fontFamily: "'Fredoka', system-ui, sans-serif" }}>{children}</h2>
  );
}

function BoxLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-bold text-foreground mb-1.5" style={{ fontFamily: "'Fredoka', system-ui, sans-serif" }}>{children}</p>
  );
}

function JournalBox({
  value,
  onChange,
  placeholder,
  minHeight = 110,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ minHeight }}
      className="w-full bg-secondary/60 border border-border rounded-2xl px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow leading-relaxed"
    />
  );
}

function Divider() {
  return <div className="h-px bg-border my-1" />;
}

function HotThoughtCard({ thought }: { thought: string }) {
  return (
    <div className="rounded-2xl bg-secondary border border-accent/25 px-4 py-3.5" style={{ boxShadow: "0 0 16px rgba(255,209,102,0.08)" }}>
      <SectionLabel>Hot thought</SectionLabel>
      <p className="text-[15px] text-foreground leading-relaxed font-semibold">"{thought}"</p>
    </div>
  );
}

function Expandable({
  label,
  children,
  defaultOpen = false,
  labelClassName,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  labelClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border bg-card/80 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <span className={labelClassName ?? "text-[14px] font-bold text-foreground"}>{label}</span>
        {open ? (
          <ChevronUp size={16} className="text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SevenPointScale({
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  value: number | null;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 h-10 rounded-xl text-[13px] font-bold border transition-all active:scale-95 ${
              value === n
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-secondary/80 text-muted-foreground border-border hover:border-primary/50 hover:bg-secondary"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <span className="text-[10px] text-muted-foreground">{lowLabel}</span>
        <span className="text-[10px] text-muted-foreground">{highLabel}</span>
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-[15px] font-bold tracking-wide transition-all duration-150 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ boxShadow: "0 4px 20px rgba(124,77,255,0.4)", fontFamily: "'Fredoka', system-ui, sans-serif" }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-muted-foreground rounded-2xl py-3 text-[14px] font-semibold transition-colors hover:text-foreground active:opacity-70"
    >
      {children}
    </button>
  );
}

// ── Progress / Top nav ────────────────────────────────────────────────────────

const STEP_LABELS = ["Catch", "Thinking", "Check", "Change", "Review"];

function ProgressBar({ step }: { step: number }) {
  const pct = ((step + 1) / 5) * 100;
  return (
    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-primary rounded-full"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
    </div>
  );
}

function TopNav({
  step,
  onBack,
  onSkip,
  onExit,
}: {
  step: Step;
  onBack: () => void;
  onSkip: () => void;
  onExit: () => void;
}) {
  return (
    <div className="flex items-center gap-3 mb-5 flex-shrink-0">
      <button
        onClick={onBack}
        className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        aria-label="Back"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="flex-1 flex flex-col gap-1.5">
        <ProgressBar step={step} />
        <div className="flex justify-between">
          {STEP_LABELS.map((label, i) => (
            <span
              key={label}
              className={`text-[10px] font-semibold transition-colors ${
                i === step ? "text-accent" : "text-muted-foreground/40"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        {step < 5 && (
          <button
            onClick={onSkip}
            className="px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            Skip
          </button>
        )}
        <button
          onClick={onExit}
          className="p-2 -mr-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Exit"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}

// ── Screen 0: Catch ───────────────────────────────────────────────────────────

function CatchScreen({
  data,
  setData,
}: {
  data: JournalData;
  setData: React.Dispatch<React.SetStateAction<JournalData>>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-secondary border border-primary/20 px-4 py-4">
        <p className="text-[15px] text-foreground leading-relaxed">You said that seeing your friends hanging out without you made you feel left out, and you were thinking, <span className="font-semibold">"Maybe they like each other more than me."</span></p>
      </div>

      <div className="flex flex-col gap-3">
        <Question>Did we get that right?</Question>
        <div className="flex gap-2">
          {(["yes", "kind-of", "not-really"] as const).map((opt) => {
            const labels = { yes: "Yes", "kind-of": "Kind of", "not-really": "Not really" };
            const active = data.confirmStatus === opt;
            return (
              <button
                key={opt}
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    confirmStatus: opt,
                    correction: opt === "yes" ? "" : d.correction,
                  }))
                }
                className={`flex-1 py-3 rounded-xl text-[13px] font-bold border transition-all active:scale-95 ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/80 text-foreground border-border hover:border-primary/50 hover:bg-secondary"
                }`}
                style={{ fontFamily: "'Fredoka', system-ui, sans-serif" }}
              >
                {labels[opt]}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {(data.confirmStatus === "kind-of" || data.confirmStatus === "not-really") && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2"
            >
              <BoxLabel>What would you change or add?</BoxLabel>
              <JournalBox
                value={data.correction}
                onChange={(v) => setData((d) => ({ ...d, correction: v }))}
                placeholder="Describe the situation, feeling, or thought more accurately…"
                minHeight={90}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[15px] text-foreground leading-relaxed pt-1">We'll call this your <span className="font-bold italic">hot thought</span>, the thought that felt most upsetting or distressing in that moment.</p>
      </div>
    </div>
  );
}

// ── Screen 1: Unhelpful Thinking Styles ──────────────────────────────────────

function ThinkingStylesScreen({
  data,
  setData,
}: {
  data: JournalData;
  setData: React.Dispatch<React.SetStateAction<JournalData>>;
}) {
  const toggle = (name: string) => {
    setData((d) => ({
      ...d,
      thinkingStyles: d.thinkingStyles.includes(name)
        ? d.thinkingStyles.filter((s) => s !== name)
        : [...d.thinkingStyles, name],
    }));
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent mb-2">
          Thinking Traps
        </p>
        <p className="text-[15px] text-foreground leading-relaxed">
          Do any of these feel like they might be showing up in your thinking?
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {THINKING_STYLES.map((style) => {
          const active = data.thinkingStyles.includes(style.name);
          return (
            <button
              key={style.name}
              onClick={() => toggle(style.name)}
              className={`text-left px-3.5 py-3 rounded-xl border transition-all active:scale-[0.99] ${
                active
                  ? "bg-primary/25 border-primary/60 text-foreground"
                  : "bg-secondary/60 border-border text-foreground hover:border-primary/40 hover:bg-secondary"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`mt-0.5 w-4 h-4 rounded-md flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                    active ? "bg-primary border-primary" : "border-muted-foreground/40"
                  }`}
                >
                  {active && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-semibold leading-snug">{style.name}</p>
                  <p className="text-[12px] text-muted-foreground leading-snug mt-0.5">{style.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Screen 2: Check — intro + one-at-a-time questions ────────────────────────

function CheckScreen({
  data,
  setData,
}: {
  data: JournalData;
  setData: React.Dispatch<React.SetStateAction<JournalData>>;
}) {
  const hotThought =
    data.confirmStatus === "yes" || data.confirmStatus === null
      ? PREFILLED.thought
      : data.correction || PREFILLED.thought;

  const setAnswer = (q: string, v: string) =>
    setData((d) => ({ ...d, disputationAnswers: { ...d.disputationAnswers, [q]: v } }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent mb-2">DON'T GET STUCK</p>
        <p className="text-[16px] text-foreground leading-relaxed font-medium">
          Sometimes a thought feels completely true in the moment. Let's look at it from a few different angles.
        </p>
      </div>

      <HotThoughtCard thought={hotThought} />

      <Expandable label="Why are we doing this?" labelClassName="text-[11px] text-muted-foreground/60 font-medium">
        <p className="text-[12px] text-muted-foreground/70 leading-relaxed">
          Sometimes a hot thought feels really true in the moment, but might seem a bit extreme when you look at it up close. We want to hold on to the thoughts that help us manage tough emotions and meet our goals — and not get stuck on the ones that don't.
        </p>
      </Expandable>

      <p className="text-[12px] text-muted-foreground/70 -mt-2">Answer as many or as few as you'd like.</p>

      <div className="flex flex-col gap-5">
        {DISPUTATION_QUESTIONS.map((q) => (
          <div key={q} className="flex flex-col gap-2">
            <p className="text-[14px] font-semibold text-foreground leading-snug">{q}</p>
            <JournalBox
              value={data.disputationAnswers[q] ?? ""}
              onChange={(v) => setAnswer(q, v)}
              placeholder="Your thoughts…"
              minHeight={80}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Screen 3: Change ──────────────────────────────────────────────────────────

function ChangeScreen({
  data,
  setData,
}: {
  data: JournalData;
  setData: React.Dispatch<React.SetStateAction<JournalData>>;
}) {
  const hotThought =
    data.confirmStatus === "yes" || data.confirmStatus === null
      ? PREFILLED.thought
      : data.correction || PREFILLED.thought;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent mb-1">
          End Result
        </p>
        <p className="text-[16px] font-bold text-foreground">Balanced Thoughts</p>
      </div>

      {/* Hot thought + evidence reference */}
      <HotThoughtCard thought={hotThought} />

      {DISPUTATION_QUESTIONS.some((q) => data.disputationAnswers[q]) && (
        <div className="flex flex-col gap-2">
          {DISPUTATION_QUESTIONS.filter((q) => data.disputationAnswers[q]).map((q) => (
            <div key={q} className="rounded-2xl bg-secondary/80 border border-primary/20 px-4 py-3.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                {q}
              </p>
              <p className="text-[14px] text-foreground leading-relaxed">
                {data.disputationAnswers[q]}
              </p>
            </div>
          ))}
        </div>
      )}

      <Divider />

      <p className="text-[14px] text-muted-foreground leading-relaxed">Now&nbsp;&nbsp;let's put it all together! Instead of the hot thought, what might be a more helpful thought that considers all the info? Don't just try to be super positive - think about a thought that you could believe.</p>

      {/* Balanced thought box */}
      <div className="flex flex-col gap-2">
        <BoxLabel>Helpful, balanced thought/s</BoxLabel>
        <JournalBox
          value={data.balancedThought}
          onChange={(v) => setData((d) => ({ ...d, balancedThought: v }))}
          placeholder="Write a thought that feels fair and believable…"
          minHeight={140}
        />
      </div>
    </div>
  );
}

// ── Screen 5: Review ──────────────────────────────────────────────────────────

function ReviewScreen({
  data,
  setData,
  onAddToLibrary,
}: {
  data: JournalData;
  setData: React.Dispatch<React.SetStateAction<JournalData>>;
  onAddToLibrary: () => void;
}) {
  const hotThought =
    data.confirmStatus === "yes" || data.confirmStatus === null
      ? PREFILLED.thought
      : data.correction || PREFILLED.thought;

  return (
    <div className="flex flex-col gap-6">

      {/* Thought comparison */}
      <div className="flex flex-col gap-2">
        <div className="rounded-2xl bg-secondary border border-accent/20 px-4 py-3.5">
          <SectionLabel>Original hot thought</SectionLabel>
          <p className="text-[15px] text-foreground leading-relaxed">"{hotThought}"</p>
        </div>
        <div className="rounded-2xl bg-primary/15 border border-primary/30 px-4 py-3.5">
          <SectionLabel>Helpful, balanced thought</SectionLabel>
          <p className="text-[15px] text-foreground leading-relaxed">
            {data.balancedThought || (
              <span className="italic text-muted-foreground text-[14px]">Nothing written yet</span>
            )}
          </p>
        </div>
      </div>

      <Divider />

      {/* Re-rate Hot Thought */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent mb-1">
            Re-rate Hot Thought
          </p>
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            Now that you've looked at it another way, how much do you believe this earlier thought?
          </p>
        </div>
        <div className="rounded-2xl bg-secondary border border-accent/20 px-4 py-3.5">
          <p className="text-[13px] text-foreground/70 italic leading-snug mb-3">
            "{hotThought}"
          </p>
          <SevenPointScale
            value={data.emotionRating}
            onChange={(v) => setData((d) => ({ ...d, emotionRating: v }))}
            lowLabel="Don't believe it"
            highLabel="Completely true"
          />
        </div>
      </div>

      <Divider />

      {/* How Helpful Is This New Thought? */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent mb-1">
            How Helpful Is This New Thought?
          </p>
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            How helpful is this new thought?
          </p>
        </div>
        <div className="rounded-2xl bg-primary/15 border border-primary/30 px-4 py-3.5">
          <p className="text-[13px] text-foreground leading-relaxed mb-3">
            {data.balancedThought || (
              <span className="italic text-muted-foreground">Nothing written yet</span>
            )}
          </p>
          <SevenPointScale
            value={data.thoughtBelief}
            onChange={(v) => setData((d) => ({ ...d, thoughtBelief: v }))}
            lowLabel="Not helpful"
            highLabel="Really helpful"
          />
        </div>
      </div>

      <Divider />

      <button
        onClick={onAddToLibrary}
        className="w-full bg-accent text-accent-foreground rounded-2xl py-5 text-[17px] font-bold tracking-wide transition-all duration-150 active:scale-[0.98]"
        style={{ boxShadow: "0 4px 24px rgba(255,209,102,0.35)", fontFamily: "'Fredoka', system-ui, sans-serif" }}
      >
        Add to My Library!
      </button>
      <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed px-2">
        Adapted from <span className="italic">Back from the Bluez: Module 6 – Detective Work and Disputation</span>, Centre for Clinical Interventions (CCI), Government of Western Australia.
      </p>
    </div>
  );
}

// ── Library screen ────────────────────────────────────────────────────────────

const MEDAL = ["🥇", "🥈", "🥉"];

function LibraryScreen({
  entries,
  onBack,
}: {
  entries: LibraryEntry[];
  onBack: () => void;
}) {
  const sorted = [...entries].sort((a, b) => b.helpfulness - a.helpfulness);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 pt-3 pb-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Back"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-[20px] font-bold text-foreground leading-tight" style={{ fontFamily: "'Fredoka', system-ui, sans-serif" }}>My Library</h1>
          <p className="text-[12px] text-muted-foreground">Your most helpful thoughts, ranked.</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-lg">
          🔭
        </div>
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto px-5 pb-8"
        style={{ scrollbarWidth: "none" }}
      >
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 pb-16">
            <span className="text-4xl">🌙</span>
            <p className="text-[15px] font-semibold text-foreground">Nothing here yet</p>
            <p className="text-[13px] text-muted-foreground text-center max-w-[210px] leading-relaxed">
              Complete an activity and add your balanced thought to see it here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="rounded-2xl bg-card border border-border overflow-hidden"
              >
                {/* Rank row */}
                <div className={`flex items-center gap-2.5 px-4 py-2.5 ${i === 0 ? "bg-accent/10" : i === 1 ? "bg-secondary/80" : i === 2 ? "bg-secondary/60" : "bg-secondary/40"}`}>
                  <span className="text-[18px]">
                    {i < 3 ? MEDAL[i] : <span className="text-[13px] font-bold text-muted-foreground w-5 text-center">#{i + 1}</span>}
                  </span>
                  <div className="flex-1 flex gap-0.5">
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <div
                        key={n}
                        className={`flex-1 h-1.5 rounded-full ${n <= entry.helpfulness ? "bg-accent" : "bg-border"}`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-accent">{entry.helpfulness}/7</span>
                </div>

                {/* Content */}
                <div className="px-4 py-3.5 flex flex-col gap-2.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Balanced thought
                    </p>
                    <p className="text-[14px] text-foreground leading-relaxed">
                      {entry.balancedThought}
                    </p>
                  </div>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Original hot thought
                    </p>
                    <p className="text-[12px] text-muted-foreground italic leading-relaxed">
                      "{entry.hotThought}"
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">{entry.date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────────

function ExitModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ y: 36, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 36, opacity: 0 }}
        transition={T}
        className="relative w-full max-w-sm bg-card rounded-3xl p-6 border border-border"
        style={{ boxShadow: "0 0 60px rgba(124,77,255,0.3), 0 20px 40px rgba(0,0,0,0.5)" }}
      >
        <h3 className="text-[16px] font-bold text-foreground mb-1" style={{ fontFamily: "'Fredoka', system-ui, sans-serif" }}>Leave this session?</h3>
        <p className="text-[14px] text-muted-foreground mb-5">Your progress will not be saved.</p>
        <div className="flex flex-col gap-2">
          <PrimaryButton onClick={onConfirm}>Leave</PrimaryButton>
          <GhostButton onClick={onCancel}>Stay</GhostButton>
        </div>
      </motion.div>
    </div>
  );
}

function FinishModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={T}
        className="relative w-full max-w-sm bg-card rounded-3xl p-8 border border-border text-center"
        style={{ boxShadow: "0 0 60px rgba(124,77,255,0.3), 0 20px 40px rgba(0,0,0,0.5)" }}
      >
        <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto mb-4 text-xl">
          ✨
        </div>
        <h3 className="text-[17px] font-bold text-foreground mb-2" style={{ fontFamily: "'Fredoka', system-ui, sans-serif" }}>Well done</h3>
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-6">
          Examining your thoughts takes real effort. Come back whenever you need this space.
        </p>
        <PrimaryButton onClick={onClose}>Close</PrimaryButton>
      </motion.div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [step, setStep] = useState<Step>(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<JournalData>(EMPTY);
  const [showExit, setShowExit] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [library, setLibrary] = useState<LibraryEntry[]>(SEED_LIBRARY);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });

  const goTo = (next: Step) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
    setTimeout(scrollTop, 50);
  };

  const goNext = () => { if (step < 4) goTo((step + 1) as Step); };
  const goBack = () => { if (step > 0) goTo((step - 1) as Step); };
  const handleSkip = () => goNext();

  const reset = () => {
    setData(EMPTY);
    setStep(0);
  };

  const handleAddToLibrary = () => {
    const hotThought =
      data.confirmStatus === "yes" || data.confirmStatus === null
        ? PREFILLED.thought
        : data.correction || PREFILLED.thought;
    const entry: LibraryEntry = {
      id: Date.now().toString(),
      hotThought,
      balancedThought: data.balancedThought,
      helpfulness: data.thoughtBelief ?? 1,
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    };
    setLibrary((prev) => [entry, ...prev]);
    reset();
    setShowLibrary(true);
  };

  const screens: Record<Step, React.ReactNode> = {
    0: <CatchScreen data={data} setData={setData} />,
    1: <ThinkingStylesScreen data={data} setData={setData} />,
    2: <CheckScreen data={data} setData={setData} />,
    3: <ChangeScreen data={data} setData={setData} />,
    4: (
      <ReviewScreen
        data={data}
        setData={setData}
        onAddToLibrary={handleAddToLibrary}
      />
    ),
  };

  const canContinue = step === 0 ? data.confirmStatus !== null : true;

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden"
      style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}
    >
      <div
        className="relative z-10 w-full max-w-[390px] rounded-[2.5rem] overflow-hidden border border-border/50 flex flex-col"
        style={{
          height: "812px",
          background: "linear-gradient(160deg, #DDD7F2 0%, #EBE6F8 60%)",
          boxShadow: "0 0 80px rgba(124,77,255,0.28), 0 30px 60px rgba(0,0,0,0.6)"
        }}
      >
        {/* Status bar */}
        <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-7 pt-4 pb-1">
          <span className="text-[11px] font-semibold text-foreground/50">9:41</span>
          <div className="w-16 h-4 bg-foreground/8 rounded-full" />
          <div className="opacity-40">
            <div className="w-3 h-2 border border-foreground rounded-[2px]" />
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {showLibrary ? (
            <motion.div
              key="library"
              className="relative z-10 flex-1 flex flex-col overflow-hidden"
              initial={{ x: 36, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 36, opacity: 0 }}
              transition={T}
            >
              <LibraryScreen
                entries={library}
                onBack={() => setShowLibrary(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="journal"
              className="relative z-10 flex-1 flex flex-col overflow-hidden"
              initial={{ x: -36, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -36, opacity: 0 }}
              transition={T}
            >
              {/* Top nav */}
              <div className="flex-shrink-0 px-5 pt-3">
                <div className="flex items-center gap-3 mb-5">
                  <button
                    onClick={goBack}
                    className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    aria-label="Back"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <ProgressBar step={step} />
                    <div className="flex justify-between">
                      {["Catch", "Thinking", "Check", "Change", "Review"].map((label, i) => (
                        <span
                          key={label}
                          className={`text-[10px] font-semibold transition-colors ${i === step ? "text-accent" : "text-muted-foreground/40"}`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {step < 4 && (
                      <button
                        onClick={handleSkip}
                        className="px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
                      >
                        Skip
                      </button>
                    )}
                    <button
                      onClick={() => setShowLibrary(true)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative"
                      aria-label="My Library"
                    >
                      <BookOpen size={17} />
                      {library.length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-accent rounded-full text-accent-foreground text-[8px] font-bold flex items-center justify-center">
                          {library.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setShowExit(true)}
                      className="p-2 -mr-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      aria-label="Exit"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable body */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-5"
                style={{ scrollbarWidth: "none" }}
              >
                <AnimatePresence mode="wait" custom={dir} initial={false}>
                  <motion.div
                    key={step}
                    custom={dir}
                    variants={SLIDE}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={T}
                  >
                    {screens[step]}
                    <div className="h-32" />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Sticky footer — only on steps 0–3 */}
              {step < 4 && (
                <div className="flex-shrink-0 px-5 pb-8 pt-3" style={{ background: "linear-gradient(to top, #EBE6F8 60%, transparent)" }}>
                  <PrimaryButton onClick={goNext} disabled={!canContinue}>
                    Continue
                  </PrimaryButton>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showExit && (
          <ExitModal
            onConfirm={() => { reset(); setShowExit(false); }}
            onCancel={() => setShowExit(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
