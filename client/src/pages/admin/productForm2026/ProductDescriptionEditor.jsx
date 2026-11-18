import { useState, useRef, useMemo } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Minus,
  Eye,
  PenLine,
  HelpCircle,
} from "lucide-react";
import {
  parseProductDescription,
  countWords,
} from "../../../utils/productDescriptionParser.js";

const MAX_DESCRIPTION_LENGTH = 10000;

export default function ProductDescriptionEditor({
  value = "",
  onChange,
  disabled = false,
  label = "Deskripsi Lengkap Produk",
  required = false,
}) {
  const [activeTab, setActiveTab] = useState("write"); // 'write' | 'preview'
  const textareaRef = useRef(null);

  const rawText = String(value || "");
  const wordCount = useMemo(() => countWords(rawText), [rawText]);
  const charCount = rawText.length;

  const parsedHtml = useMemo(
    () => parseProductDescription(rawText),
    [rawText]
  );

  // Helper to wrap selected text or insert snippet
  const insertFormatting = (prefix, suffix = "", defaultText = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = rawText.slice(start, end);

    const replacement = selected
      ? `${prefix}${selected}${suffix}`
      : `${prefix}${defaultText}${suffix}`;

    const newText =
      rawText.slice(0, start) + replacement + rawText.slice(end);

    if (newText.length > MAX_DESCRIPTION_LENGTH) return;

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      if (selected) {
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = end + prefix.length;
      } else {
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = start + prefix.length + defaultText.length;
      }
    }, 0);
  };

  // Insert or toggle list bullet / numbering on current or selected lines
  const toggleLinePrefix = (prefixType) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;

    // Find the boundary of all selected lines
    const textBefore = rawText.slice(0, start);
    const lineStart = textBefore.lastIndexOf("\n") + 1;
    const textAfter = rawText.slice(end);
    const nextNewline = textAfter.indexOf("\n");
    const lineEnd = nextNewline === -1 ? rawText.length : end + nextNewline;

    const blockText = rawText.slice(lineStart, lineEnd);
    const lines = blockText.split("\n");

    const modifiedLines = lines.map((line, idx) => {
      if (prefixType === "bullet") {
        if (/^\s*•\s+/.test(line)) {
          return line.replace(/^\s*•\s+/, "");
        }
        if (/^\s*[-*]\s+/.test(line)) {
          return line.replace(/^\s*[-*]\s+/, "• ");
        }
        return `• ${line}`;
      } else if (prefixType === "number") {
        if (/^\s*\d+\.\s+/.test(line)) {
          return line.replace(/^\s*\d+\.\s+/, "");
        }
        return `${idx + 1}. ${line}`;
      }
      return line;
    });

    const newBlockText = modifiedLines.join("\n");
    const newText =
      rawText.slice(0, lineStart) + newBlockText + rawText.slice(lineEnd);

    if (newText.length > MAX_DESCRIPTION_LENGTH) return;

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = lineStart;
      textarea.selectionEnd = lineStart + newBlockText.length;
    }, 0);
  };

  // Keyboard shortcut & auto-continue bullet/number handling
  const handleKeyDown = (e) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Handle Ctrl+B (Bold) / Ctrl+I (Italic)
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        insertFormatting("**", "**", "teks tebal");
        return;
      }
      if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        insertFormatting("*", "*", "teks miring");
        return;
      }
    }

    // Handle Tab (Indent)
    if (e.key === "Tab") {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText =
        rawText.slice(0, start) + "  " + rawText.slice(end);
      onChange(newText);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
      return;
    }

    // Handle Enter (Auto-continue bullets and numbers)
    if (e.key === "Enter" && !e.shiftKey) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Only auto-continue if no range is selected
      if (start === end) {
        const textBefore = rawText.slice(0, start);
        const lastNewline = textBefore.lastIndexOf("\n");
        const currentLine = textBefore.slice(lastNewline + 1);

        // Check for bullet: •, -, or *
        const bulletMatch = currentLine.match(/^(\s*)(•|-|\*)\s+(.*)$/);
        if (bulletMatch) {
          const [, indent, , textAfter] = bulletMatch;
          if (!textAfter.trim()) {
            // User pressed Enter on an empty bullet line -> exit list!
            e.preventDefault();
            const lineStartPos = lastNewline + 1;
            const newText =
              rawText.slice(0, lineStartPos) + rawText.slice(start);
            onChange(newText);
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = lineStartPos;
            }, 0);
            return;
          }
          // Continue bullet on the next line
          e.preventDefault();
          const insertText = `\n${indent}• `;
          const newText =
            rawText.slice(0, start) + insertText + rawText.slice(start);
          onChange(newText);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd =
              start + insertText.length;
          }, 0);
          return;
        }

        // Check for numbering: 1., 2., etc.
        const numMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
        if (numMatch) {
          const [, indent, numStr, textAfter] = numMatch;
          if (!textAfter.trim()) {
            // Empty numbered item -> exit list!
            e.preventDefault();
            const lineStartPos = lastNewline + 1;
            const newText =
              rawText.slice(0, lineStartPos) + rawText.slice(start);
            onChange(newText);
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = lineStartPos;
            }, 0);
            return;
          }
          // Continue with next number
          e.preventDefault();
          const nextNum = parseInt(numStr, 10) + 1;
          const insertText = `\n${indent}${nextNum}. `;
          const newText =
            rawText.slice(0, start) + insertText + rawText.slice(start);
          onChange(newText);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd =
              start + insertText.length;
          }, 0);
          return;
        }
      }
    }
  };

  return (
    <div className="pde26-root">
      {/* Header with Title and Mode Tabs */}
      <div className="pde26-header">
        <div className="pde26-title-group">
          <label htmlFor="product-description-editor" className="pde26-label">
            {label}
            {required && <span className="apf26-required"> *</span>}
          </label>
          <span className="pde26-subtext">
            Jelaskan keunggulan produk, spesifikasi teknis, atau panduan pemakaian.
          </span>
        </div>

        <div className="pde26-tab-switch" role="tablist" aria-label="Mode Editor">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "write"}
            className={`pde26-tab-btn ${activeTab === "write" ? "is-active" : ""}`}
            onClick={() => setActiveTab("write")}
          >
            <PenLine size={14} />
            <span>Tulis</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "preview"}
            className={`pde26-tab-btn ${activeTab === "preview" ? "is-active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            <Eye size={14} />
            <span>Pratinjau</span>
          </button>
        </div>
      </div>

      {/* Editor Box */}
      <div className="pde26-box">
        {activeTab === "write" ? (
          <>
            {/* Formatting Toolbar */}
            <div className="pde26-toolbar" role="toolbar" aria-label="Alat Format Teks">
              <button
                type="button"
                className="pde26-tool-btn"
                title="Tebal / Bold (Ctrl+B)"
                disabled={disabled}
                onClick={() => insertFormatting("**", "**", "teks tebal")}
              >
                <Bold size={15} />
              </button>
              <button
                type="button"
                className="pde26-tool-btn"
                title="Miring / Italic (Ctrl+I)"
                disabled={disabled}
                onClick={() => insertFormatting("*", "*", "teks miring")}
              >
                <Italic size={15} />
              </button>

              <div className="pde26-toolbar-sep" />

              <button
                type="button"
                className="pde26-tool-btn"
                title="Daftar Poin (•)"
                disabled={disabled}
                onClick={() => toggleLinePrefix("bullet")}
              >
                <List size={15} />
              </button>
              <button
                type="button"
                className="pde26-tool-btn"
                title="Daftar Angka (1, 2, 3)"
                disabled={disabled}
                onClick={() => toggleLinePrefix("number")}
              >
                <ListOrdered size={15} />
              </button>
              <button
                type="button"
                className="pde26-tool-btn"
                title="Garis Pembatas (---)"
                disabled={disabled}
                onClick={() => insertFormatting("\n---\n", "")}
              >
                <Minus size={15} />
              </button>

              <div className="pde26-toolbar-hint">
                <HelpCircle size={13} />
                <span>Tekan Enter untuk poin/angka otomatis</span>
              </div>
            </div>

            {/* Main Textarea */}
            <textarea
              id="product-description-editor"
              name="description"
              ref={textareaRef}
              rows={8}
              disabled={disabled}
              value={rawText}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Contoh:&#10;Menyediakan aneka olahan singkong dengan cita rasa lezat dan gurih.&#10;&#10;Keunggulan:&#10;• Renyah dan higienis&#10;• Tanpa bahan pengawet&#10;&#10;Cara Konsumsi:&#10;1. Buka kemasan&#10;2. Nikmati bersama keluarga"
              className="pde26-textarea"
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
          </>
        ) : (
          /* Live Preview Mode */
          <div className="pde26-preview-container">
            <div className="pde26-preview-badge">Tampilan di Halaman Produk Pembeli:</div>
            {parsedHtml ? (
              <div
                className="pde26-preview-content pdp26-desc-content"
                dangerouslySetInnerHTML={{ __html: parsedHtml }}
              />
            ) : (
              <div className="pde26-preview-empty">
                Belum ada deskripsi yang ditulis. Klik tab <strong>Tulis</strong> untuk mulai membuat deskripsi produk.
              </div>
            )}
          </div>
        )}

        {/* Footer with Counters and Tips */}
        <div className="pde26-footer">
          <span className="pde26-tip">
            💡 Tips: Tekan <strong>Enter</strong> dua kali pada baris kosong untuk mengakhiri daftar poin.
          </span>
          <span className="pde26-counter">
            <strong>{wordCount}</strong> kata &nbsp;·&nbsp; {charCount} / {MAX_DESCRIPTION_LENGTH.toLocaleString("id-ID")} karakter
          </span>
        </div>
      </div>
    </div>
  );
}
