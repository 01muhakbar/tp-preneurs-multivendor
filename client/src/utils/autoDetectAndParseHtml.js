/**
 * autoDetectAndParseHtml.js
 * Utility to auto-detect, decode, normalize, and format HTML markup tags
 * in rich legal documents (Privacy Policy, Terms & Conditions, and Storefront pages).
 *
 * Automatically converts entity-encoded HTML (&lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, etc.)
 * or typed/pasted raw HTML strings into live rendered, sanitized HTML elements.
 */

import { sanitizeRichTextHtml } from "./sanitizeRichTextHtml.js";

const KNOWN_HTML_TAGS_PATTERN =
  /<\/?(?:h[1-6]|p|strong|b|em|i|u|ul|ol|li|a|br|div|span|blockquote|hr|table|tr|td|th)\b/i;

const ENTITY_ENCODED_TAGS_PATTERN =
  /&lt;\/?(?:h[1-6]|p|strong|b|em|i|u|ul|ol|li|a|br|div|span|blockquote|hr|table|tr|td|th)\b/i;

/**
 * Checks whether the given string contains entity-encoded HTML tags (&lt;h2, &lt;p, etc.)
 */
export function isEntityEncodedHtml(str) {
  if (!str || typeof str !== "string") return false;
  return ENTITY_ENCODED_TAGS_PATTERN.test(str);
}

/**
 * Checks whether the given string contains actual HTML tags (<h2, <p, etc.)
 */
export function hasHtmlMarkup(str) {
  if (!str || typeof str !== "string") return false;
  return KNOWN_HTML_TAGS_PATTERN.test(str);
}

/**
 * Recursively decodes HTML entities into real characters up to a safe depth limit.
 */
export function decodeHtmlEntities(str) {
  if (!str || typeof str !== "string") return "";
  let decoded = str;
  let previous = "";
  let iterations = 0;

  while (decoded !== previous && iterations < 5) {
    previous = decoded;
    // Decode HTML entities
    decoded = decoded
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&amp;/gi, "&");

    iterations++;
    // If no more encoded tags remain, stop early
    if (!isEntityEncodedHtml(decoded)) break;
  }

  return decoded;
}

/**
 * Auto-detects and parses HTML content:
 * 1. Automatically decodes entity-encoded tags (&lt;h2&gt; -> <h2>).
 * 2. If valid HTML is detected, sanitizes and returns clean HTML.
 * 3. If raw plain text without tags is passed, formats into clean <p> blocks.
 */
export function autoDetectAndParseHtml(raw) {
  if (raw === null || raw === undefined) return "";
  let text = String(raw).trim();
  if (!text) return "";

  // 1. If content is entity-encoded HTML, decode it first
  if (isEntityEncodedHtml(text)) {
    text = decodeHtmlEntities(text);
  }

  // 2. If content has HTML markup, sanitize and return
  if (hasHtmlMarkup(text)) {
    return sanitizeRichTextHtml(text);
  }

  // 3. Fallback for plain text: wrap paragraphs in <p> tags
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length > 0) {
    const formatted = paragraphs
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");
    return sanitizeRichTextHtml(formatted);
  }

  return sanitizeRichTextHtml(text);
}

/**
 * Formats/beautifies an HTML string for the Code View / Source Editor
 * so that each block tag starts on a clean new line.
 */
export function formatHtmlForSourceView(html) {
  if (!html || typeof html !== "string") return "";
  let formatted = autoDetectAndParseHtml(html);

  // Add line breaks after major block closing tags
  formatted = formatted
    .replace(/(<\/(?:h[1-6]|p|ul|ol|blockquote)>)/gi, "$1\n\n")
    .replace(/(<\/li>)/gi, "$1\n")
    .replace(/(<br\s*\/?>)/gi, "$1\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return formatted;
}

export default autoDetectAndParseHtml;

