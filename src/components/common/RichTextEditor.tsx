import React, { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  CheckSquare,
  Eye,
  Edit3,
  Sparkles,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  required?: boolean;
  minHeight?: string;
}

/**
 * Renders markdown-like formatted text with stylish UI elements
 */
export const FormattedContent: React.FC<{ content: string; className?: string }> = ({
  content,
  className = "",
}) => {
  if (!content) return null;

  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block check
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        renderedElements.push(
          <pre
            key={`code-${i}`}
            className="my-3 p-3.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto"
          >
            <code>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Heading 1
    if (line.startsWith("# ")) {
      renderedElements.push(
        <h3
          key={`h1-${i}`}
          className="text-base sm:text-lg font-black text-brand-500 dark:text-brand-400 mt-3 mb-1.5 pb-1 border-b border-brand-500/20"
        >
          {formatInline(line.replace(/^#\s+/, ""))}
        </h3>
      );
      continue;
    }

    // Heading 2
    if (line.startsWith("## ")) {
      renderedElements.push(
        <h4
          key={`h2-${i}`}
          className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-2.5 mb-1"
        >
          {formatInline(line.replace(/^##\s+/, ""))}
        </h4>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      renderedElements.push(
        <div
          key={`quote-${i}`}
          className="my-2 p-3 rounded-xl bg-amber-500/10 border-l-4 border-amber-500 text-slate-800 dark:text-slate-200 text-xs italic"
        >
          {formatInline(line.replace(/^>\s+/, ""))}
        </div>
      );
      continue;
    }

    // Bullet list
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const text = line.trim().replace(/^[-*]\s+/, "");
      renderedElements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-1 text-xs text-slate-700 dark:text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5" />
          <span>{formatInline(text)}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      renderedElements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-1 text-xs text-slate-700 dark:text-slate-300">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 shrink-0 mt-0.5">
            {numMatch[1]}
          </span>
          <span>{formatInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Task list / Checklist
    if (line.trim().startsWith("[x] ") || line.trim().startsWith("[ ] ")) {
      const isChecked = line.trim().startsWith("[x] ");
      const text = line.trim().substring(4);
      renderedElements.push(
        <div key={`check-${i}`} className="flex items-center gap-2 my-1 text-xs text-slate-700 dark:text-slate-300">
          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${
            isChecked ? "bg-emerald-500 border-emerald-600 text-white" : "border-slate-400 bg-transparent"
          }`}>
            {isChecked ? "✓" : ""}
          </span>
          <span className={isChecked ? "line-through opacity-70" : ""}>{formatInline(text)}</span>
        </div>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      renderedElements.push(<div key={`blank-${i}`} className="h-2" />);
      continue;
    }

    // Regular paragraph
    renderedElements.push(
      <p key={`p-${i}`} className="my-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
        {formatInline(line)}
      </p>
    );
  }

  return <div className={`space-y-0.5 ${className}`}>{renderedElements}</div>;
};

// Inline formatter for bold, italic, and code tags
function formatInline(text: string): React.ReactNode {
  // Split by bold (**bold**), italic (*italic*), inline code (`code`)
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }

    const chunk = match[0];
    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-bold text-slate-900 dark:text-white">
          {chunk.slice(2, -2)}
        </strong>
      );
    } else if (chunk.startsWith("*") && chunk.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic text-slate-800 dark:text-slate-200">
          {chunk.slice(1, -1)}
        </em>
      );
    } else if (chunk.startsWith("`") && chunk.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[11px] text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700"
        >
          {chunk.slice(1, -1)}
        </code>
      );
    }

    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Vazifa matnini yozing...",
  rows = 5,
  label,
  required = false,
  minHeight = "140px",
}) => {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormat = (before: string, after: string = "", defaultText: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end) || defaultText;

    const replacement = `${before}${selected}${after}`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + before.length + selected.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Matnga dizayn berish
          </span>
        </div>
      )}

      <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/90 shadow-sm focus-within:border-brand-500 transition-all">
        {/* Formatting Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-1 p-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs">
          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-0.5">
            <button
              type="button"
              onClick={() => insertFormat("**", "**", "Qalin matn")}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Qalin (Bold) - **matn**"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormat("*", "*", "Kursiv matn")}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Kursiv (Italic) - *matn*"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
            <button
              type="button"
              onClick={() => insertFormat("# ", "", "Asosiy Sarlavha")}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Katta Sarlavha (H1)"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormat("## ", "", "Kichik Sarlavha")}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="O'rta Sarlavha (H2)"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
            <button
              type="button"
              onClick={() => insertFormat("- ", "", "Band")}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Nuqtali Ro'yxat"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormat("1. ", "", "Birinchi band")}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Raqamli Ro'yxat"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormat("[x] ", "", "Bajariladigan topshiriq")}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Belgilash katagi (Checklist)"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
            <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
            <button
              type="button"
              onClick={() => insertFormat("> ", "", "Muhim eslatma yoki iqtibos")}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Iqtibos / Muhim eslatma"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormat("```\n", "\n```", "Kod yoki formula")}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Formatlangan Blok / Kod"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Edit / Preview Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-900 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeTab === "edit"
                  ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Edit3 className="w-3 h-3" /> Yozish
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeTab === "preview"
                  ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Eye className="w-3 h-3" /> Ko'rish
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === "edit" ? (
          <textarea
            ref={textareaRef}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ minHeight }}
            className="w-full p-3.5 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-y leading-relaxed font-sans"
          />
        ) : (
          <div
            style={{ minHeight }}
            className="p-4 bg-slate-50/50 dark:bg-slate-950/40 overflow-y-auto"
          >
            {value.trim() ? (
              <FormattedContent content={value} />
            ) : (
              <p className="text-xs text-slate-400 italic">
                Hozircha matn kiritilmagan. Yuqoridagi "Yozish" tugmasini bosing.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
