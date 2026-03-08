import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronLeft, Lightbulb, CheckCircle2 } from "lucide-react";
import MathMessage from "./MathMessage";

interface Step {
  title: string;
  content: string;
  question?: string;
  isFinal?: boolean;
}

function parseSteps(text: string): Step[] | null {
  const stepRegex = /###(STEP|FINAL)###\s*(.*)/g;
  const questionRegex = /###QUESTION###\s*(.*)/;
  const parts: Step[] = [];

  const blocks = text.split(/(?=###(?:STEP|FINAL)###)/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const headerMatch = trimmed.match(/^###(STEP|FINAL)###\s*(.*)/);
    if (!headerMatch) {
      // Not structured - return null to fall back to plain rendering
      if (parts.length === 0) return null;
      continue;
    }

    const isFinal = headerMatch[1] === "FINAL";
    const title = headerMatch[2].trim();
    const rest = trimmed.slice(headerMatch[0].length).trim();

    const questionMatch = rest.match(questionRegex);
    let content = rest;
    let question: string | undefined;

    if (questionMatch) {
      content = rest.slice(0, questionMatch.index).trim();
      question = questionMatch[1].trim();
    }

    parts.push({ title, content, question, isFinal });
  }

  return parts.length >= 2 ? parts : null;
}

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

function StepRenderer({ steps }: { steps: Step[] }) {
  const [visibleCount, setVisibleCount] = useState(1);
  const [showQuestion, setShowQuestion] = useState<number | null>(0);

  const allRevealed = visibleCount >= steps.length;

  const revealNext = () => {
    setShowQuestion(null);
    setVisibleCount((prev) => Math.min(prev + 1, steps.length));
    // Show the question for the newly revealed step after a brief delay
    setTimeout(() => {
      if (visibleCount < steps.length) {
        setShowQuestion(visibleCount);
      }
    }, 400);
  };

  return (
    <div className="flex flex-col gap-3">
      {steps.slice(0, visibleCount).map((step, i) => (
        <div
          key={i}
          className={`rounded-xl border p-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
            step.isFinal
              ? "border-primary/30 bg-primary/5"
              : "border-border bg-card"
          }`}
        >
          {/* Step header */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step.isFinal
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.isFinal ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className="text-sm font-semibold text-foreground">{step.title}</span>
          </div>

          {/* Step content */}
          <div className="mr-8 text-sm">
            <MathMessage text={step.content} />
          </div>

          {/* Guiding question */}
          {step.question && i === showQuestion && !step.isFinal && (
            <div className="mr-8 mt-3 flex items-start gap-2 rounded-lg bg-accent/50 p-2.5 text-sm animate-in fade-in duration-300">
              <Lightbulb className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <span className="text-accent-foreground">{step.question}</span>
            </div>
          )}
        </div>
      ))}

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
