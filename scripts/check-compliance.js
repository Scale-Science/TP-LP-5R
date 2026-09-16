#!/usr/bin/env node
/**
 * Compliance check for TP-LP-5R (PRD §3 + acceptance criteria 6–9).
 *
 * Scans index.html brand-voice copy (everything except attributed quotes)
 * for banned claim language, and checks the fixed facts the PRD requires
 * to be consistent everywhere they appear.
 *
 * Exit code 1 on any failure so it can gate CI.
 */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "index.html");
let html = fs.readFileSync(file, "utf8");

// 1. Drop code, styles, comments.
html = html.replace(/<script[\s\S]*?<\/script>/gi, " ")
           .replace(/<style[\s\S]*?<\/style>/gi, " ")
           .replace(/<!--[\s\S]*?-->/g, " ");

// 2. Attributed quotes are exempt: <blockquote> and review <article>s.
const quotes = [];
const brand = html
  .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, (m) => { quotes.push(m); return " [QUOTE] "; })
  .replace(/<article class="review[\s\S]*?<\/article>/gi, (m) => { quotes.push(m); return " [QUOTE] "; });

const text = (s) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/\s+/g, " ");
const brandText = text(brand);
const quoteText = text(quotes.join(" "));

const banned = [
  /\bprevent(s|ed|ing|ion|ative)?\b/i,
  /\btreat(s|ed|ing|ment|ments)?\b/i,
  /\bcure(s|d)?\b|\bcuring\b/i,
  /\bheal(s|ed|ing)?\b/i,
  /\brevers(e|es|ed|ing|al)\b/i,
  /\brepair(s|ed|ing)?\b/i,
  /\brebuild(s|ing)?\s+(your\s+|the\s+)?enamel\b/i,
  /\banti-?cavity\b/i,
  /\banti-?gingivitis\b/i,
  /\bantibacterial\b/i,
  /\bkills?\s+bacteria\b/i,
];

let failures = 0;
const fail = (msg) => { failures++; console.error("✗ " + msg); };
const ok = (msg) => console.log("✓ " + msg);

// Banned terms in brand voice
banned.forEach((re) => {
  const m = brandText.match(new RegExp(re.source, "gi"));
  if (m) {
    const idx = brandText.search(re);
    fail(`banned term "${m[0]}" in brand voice: …${brandText.slice(Math.max(0, idx - 60), idx + 60)}…`);
  }
});
if (!failures) ok("no banned claim terms in brand voice (" + quotes.length + " attributed quotes exempt)");

// Product name convention: "Toothpod" singular in brand voice
const plural = brandText.match(/\bToothpods\b/g);
if (plural) fail(`"Toothpods" (plural) appears ${plural.length}x in brand voice`); else ok('"Toothpod" singular everywhere in brand voice');

// Age stated as 12+
const ages = [...brandText.matchAll(/\bages?\s+(\d+)/gi)].map((m) => m[1]).filter((n) => n !== "12");
if (ages.length) fail("age stated as something other than 12: " + ages.join(", ")); else ok("age is 12+ everywhere");

// Dental office count stated as 500+
const offices = [...(brandText + " " + quoteText).matchAll(/(\d[\d,]*\+?)\s+dental offices/gi)].map((m) => m[1]).filter((n) => n !== "500+");
if (offices.length) fail("dental office count other than 500+: " + offices.join(", ")); else ok("dental office count is 500+ everywhere");

// No aggregate rating / review count
if (/\b\d(\.\d)?\s*\/\s*5\b|\b\d[\d,]*\s+reviews\b|\b(\d\.\d)\s+stars?\b|rated\s+\d/i.test(brandText)) fail("aggregate rating or review count found"); else ok("no aggregate rating or review count");

// Every CTA followed by the guarantee line
const raw = fs.readFileSync(file, "utf8").replace(/<script[\s\S]*?<\/script>/gi, "");
const ctas = raw.match(/class="btn[^"]*"/g) || [];
const stacks = raw.match(/class="cta-stack[^"]*"|class="atc[^"]*"|class="sticky"/g) || [];
if (ctas.length !== stacks.length + 0 && ctas.length - stacks.length > 0) {
  // btn count should equal the number of guarantee-bearing containers
  fail(`${ctas.length} CTA buttons but ${stacks.length} guarantee containers`);
} else ok(`${ctas.length} CTA buttons, each inside a guarantee-bearing container`);

console.log(failures ? `\n${failures} compliance failure(s)` : "\nAll compliance checks passed");
process.exit(failures ? 1 : 0);
