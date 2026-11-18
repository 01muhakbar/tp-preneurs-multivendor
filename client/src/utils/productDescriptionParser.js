/**
 * productDescriptionParser.js
 * Utility to parse formatted product descriptions into clean, sanitized HTML.
 * Supports:
 * - Bullets: lines starting with '• ', '- ', or '* ' -> <ul><li>...</li></ul>
 * - Numbered lists: lines starting with '1. ', '2. ', etc. -> <ol><li>...</li></ol>
 * - Bold text: **text** -> <strong>text</strong>
 * - Italic text: *text* -> <em>text</em>
 * - Dividers: --- or === -> <hr class="pdp26-desc-divider" />
 * - Paragraphs: separated by line breaks -> <p class="pdp26-desc-p">...</p>
 * - Native HTML: if the string already contains valid HTML tags, sanitizes safely.
 */

import { sanitizeRichTextHtml } from "./sanitizeRichTextHtml.js";

const HTML_BLOCK_TAGS_PATTERN = /<\/?(?:p|ul|ol|li|h[1-6]|div|br|strong|em|hr|table|blockquote)\b/i;

function formatInlineText(str) {
  if (!str) return "";
  let s = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold: **text**
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic: *text* (excluding bullet markers or remaining double-asterisks)
  s = s.replace(/(^|[^\*])\*([^\*\n]+?)\*([^\*]|$)/g, "$1<em>$2</em>$3");

  return s;
}

export function parseProductDescription(raw) {
  if (raw === null || raw === undefined) return "";
  const text = String(raw).trim();
  if (!text) return "";

  // If already full HTML block structure
  if (HTML_BLOCK_TAGS_PATTERN.test(text)) {
    return sanitizeRichTextHtml(text);
  }

  const lines = text.split(/\r?\n/);
  const blocks = [];
  let currentList = null; // { type: 'ul' | 'ol', items: [] }

  function flushList() {
    if (!currentList) return;
    const tag = currentList.type;
    const cls = tag === "ul" ? "pdp26-desc-list" : "pdp26-desc-list pdp26-desc-list--ordered";
    const itemsHtml = currentList.items
      .map((item) => `<li>${formatInlineText(item)}</li>`)
      .join("");
    blocks.push(`<${tag} class="${cls}">${itemsHtml}</${tag}>`);
    currentList = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Horizontal Divider
    if (/^---+$|^===+$/.test(trimmed)) {
      flushList();
      blocks.push('<hr class="pdp26-desc-divider" />');
      continue;
    }

    // Unordered bullet list: •, -, or *
    const bulletMatch = trimmed.match(/^(?:•|-|\*)\s+(.+)$/);
    if (bulletMatch) {
      if (currentList && currentList.type !== "ul") {
        flushList();
      }
      if (!currentList) {
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Ordered list: 1., 2., etc.
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      if (currentList && currentList.type !== "ol") {
        flushList();
      }
      if (!currentList) {
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numMatch[2]);
      continue;
    }

    // Normal paragraph line
    flushList();
    blocks.push(`<p class="pdp26-desc-p">${formatInlineText(trimmed)}</p>`);
  }

  flushList();
  return sanitizeRichTextHtml(blocks.join(""));
}

/**
 * Counts words in a string.
 */
export function countWords(text) {
  if (!text || typeof text !== "string") return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Determines whether description is long enough to require a collapse / "Selengkapnya" toggle.
 * Ideal threshold:
 * - More than 260 characters OR
 * - More than 4 lines of content OR
 * - More than 40 words
 */
export function isDescriptionCollapsible(raw) {
  if (!raw || typeof raw !== "string") return false;
  const text = raw.trim();
  if (!text) return false;

  const charCount = text.length;
  if (charCount > 260) return true;

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 3) return true;

  const wordCount = countWords(text);
  if (wordCount > 40) return true;

  return false;
}

export default parseProductDescription;
