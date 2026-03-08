import Latex from "react-latex-next";
import "katex/dist/katex.min.css";

interface MathMessageProps {
  text: string;
}

export default function MathMessage({ text }: MathMessageProps) {
  return (
    <div className="whitespace-pre-wrap math-message">
      <Latex>{text}</Latex>
    </div>
  );
}
