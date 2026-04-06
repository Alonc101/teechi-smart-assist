import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Lightbulb, CheckCircle2, HelpCircle, PencilLine, MessageCircle } from "lucide-react";
import MathMessage from "./MathMessage";

type BlockType = "step" | "final" | "hint" | "try" | "question";

interface Step {
  type: BlockType;
  title: string;
  content: string;
  question?: string;
}

// ──────────────────────────────────────────────
// Parser: handles ###STEP###, ###FINAL###, ###HINT###, ###TRY###, ###QUESTION###
// Falls back gracefully to plain text for conversational responses
// ──────────────────────────────────────────────

function parseSteps(text: string): Step[] | null {
  // Split at any known block marker
  const blocks = text.split(/(?=###(?:STEP|FINAL|HINT|TRY)###)/);
  const parts: Step[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const headerMatch = trimmed.match(/^###(STEP|FINAL|HINT|TRY)###\s*(.*)/);
    if (!headerMatch) {
      // Text before any marker — skip if we haven't started, otherwise ignore
      if (parts.length === 0) return null;
      continue;
    }

    const rawType = headerMatch[1].toLowerCase() as BlockType;
    const title = headerMatch[2].trim();
    const rest = trimmed.slice(headerMatch[0].length).trim();

    // Extract inline ###QUESTION### if present
    const questionRegex = /###QUESTION###\s*(.*)/;
    const questionMatch = rest.match(questionRegex);
    let content = rest;
    let question: string | undefined;

    if (questionMatch) {
      content = rest.slice(0, questionMatch.index).trim();
      question = questionMatch[1].trim();
    }

    parts.push({ type: rawType, title, content, question });
  }

  // Need at least 1 block to use structured rendering
  return parts.length >= 1 ? parts : null;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

interface MathSolutionStepsProps {
  text: string;
}

export default function MathSolutionSteps({ text }: MathSolutionStepsProps) {
  const steps = parseSteps(text);

  if (!steps) {
    return <MathMessage text={text} />;
  }

  return <StepRenderer steps={steps} />;
}

// ──────────────────────────────────────────────
// Block styles per type
// ──────────────────────────────────────────────

const blockStyles: Record<BlockType, { border: string; bg: string; iconBg: string; iconColor: string }> = {
  step:     { border: "border-border",       bg: "bg-card",        iconBg: "bg-muted",       iconColor: "text-muted-foreground" },
  final:    { border: "border-primary/30",   bg: "bg-primary/5",   iconBg: "bg-primary",     iconColor: "text-primary-foreground" },
  hint:     { border: "border-yellow-300/50", bg: "bg-yellow-50",  iconBg: "bg-yellow-400",  iconColor: "text-white" },
  try:      { border: "border-blue-300/50",  bg: "bg-blue-50",     iconBg: "bg-blue-500",    iconColor: "text-white" },
  question: { border: "border-purple-300/50", bg: "bg-purple-50",  iconBg: "bg-purple-500",  iconColor: "text-white" },
};

function BlockIcon({ type, index }: { type: BlockType; index: number }) {
  const size = "h-3.5 w-3.5";
  switch (type) {
    case "final":    return <CheckCircle2 className={size} />;
    case "hint":     return <Lightbulb className={size} />;
    case "try":      return <PencilLine className={size} />;
    case "question": return <HelpCircle className={size} />;
    default:         return <>{index + 1}</>;
  }
}

// ──────────────────────────────────────────────
// Renderer with progressive reveal
// ──────────────────────────────────────────────

function StepRenderer({ steps }: { steps: Step[] }) {
  // For a single block (like a hint or question), show it immediately
  const isSingleBlock = steps.length === 1;
  const [visibleCount, setVisibleCount] = useState(isSingleBlock ? 1 : 1);
  const [showQuestion, setShowQuestion] = useState<number | null>(0);

  const allRevealed = visibleCount >= steps.length;

  // Count only "step" type blocks for numbering
  let stepCounter = 0;

  const revealNext = () => {
    setShowQuestion(null);
    setVisibleCount((prev) => Math.min(prev + 1, steps.length));
    setTimeout(() => {
      if (visibleCount < steps.length) {
        setShowQuestion(visibleCount);
      }
    }, 400);
  };

  return (
    <div className="flex flex-col gap-3">
      {steps.slice(0, visibleCount).map((step, i) => {
        if (step.type === "step") stepCounter++;
        const displayIndex = stepCounter;
        const style = blockStyles[step.type] || blockStyles.step;

        return (
          <div
            key={i}
            className={`rounded-xl border p-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${style.border} ${style.bg}`}
          >
            {/* Block header */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${style.iconBg} ${style.iconColor}`}
              >
                <BlockIcon type={step.type} index={displayIndex - 1} />
              </div>
              <span className="text-sm font-semibold text-foreground">{step.title}</span>
            </div>

            {/* Block content */}
            {step.content && (
              <div className="mr-8 text-sm">
                <MathMessage text={step.content} />
              </div>
            )}

            {/* Guiding question */}
            {step.question && i === showQuestion && step.type !== "final" && (
              <div className="mr-8 mt-3 flex items-start gap-2 rounded-lg bg-accent/50 p-2.5 text-sm animate-in fade-in duration-300">
                <MessageCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span className="text-accent-foreground">{step.question}</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Next step button */}
      {!allRevealed && (
        <Button
          variant="outline"
          size="sm"
          onClick={revealNext}
          className="self-start gap-2 mr-8"
        >
          <ChevronDown className="h-4 w-4" />
          הצג צעד הבא
        </Button>
      )}
    </div>
  );
}
