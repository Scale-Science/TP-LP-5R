#!/usr/bin/env node
/**
 * Builds the Shopify theme files from index.html (the source of truth).
 *
 *   shopify/sections/tp-lp-5r.liquid      page markup + CSS + JS as one section
 *   shopify/layout/tp-lp-5r.liquid        minimal layout (no theme header/footer)
 *   shopify/templates/page.tp-lp-5r.json  page template wiring the two together
 *   shopify/assets/*                       the images not already on the store CDN
 *
 * Run: node scripts/build-shopify.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "shopify");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

const pick = (re, label) => {
  const m = html.match(re);
  if (!m) throw new Error("Could not find " + label + " in index.html");
  return m[1];
};

const style = pick(/<style>([\s\S]*?)<\/style>/, "<style>");
const script = pick(/<script>([\s\S]*?)<\/script>/, "<script>");
const body = pick(/<body>([\s\S]*?)<script>/, "<body>");
const preload = pick(/(<link rel="preload" as="image"[^>]*>)/, "hero preload");
const fonts = pick(/(<link href="https:\/\/fonts\.googleapis\.com[^>]*>)/, "fonts link");

// Liquid would try to parse these; refuse to build if they ever creep in.
for (const chunk of [style, script, body]) {
  if (/\{\{|\{%/.test(chunk)) throw new Error("index.html contains {{ or {% which Liquid would interpret — escape it first");
}

// Local assets -> theme assets via asset_url.
const assetsDir = path.join(root, "assets");
const localAssets = fs.readdirSync(assetsDir);
const liquidify = (s) =>
  s.replace(/assets\/([A-Za-z0-9._-]+)/g, (m, name) => {
    if (!localAssets.includes(name)) throw new Error("Referenced asset not in /assets: " + name);
    return `{{ '${name}' | asset_url }}`;
  });

const section = `{%- comment -%}
  TP-LP-5R · Toothpod landing page · generated from index.html by scripts/build-shopify.js
  Do not edit by hand: change index.html and rebuild.
{%- endcomment -%}
<style>${liquidify(style)}</style>
${liquidify(body).trim()}
<script>${script}</script>

{% schema %}
{
  "name": "TP LP 5R (Toothpod)",
  "settings": [],
  "presets": [{ "name": "TP LP 5R (Toothpod)" }]
}
{% endschema %}
`;

const layout = `<!doctype html>
<html lang="{{ request.locale.iso_code }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{{ page_title }}</title>
  {%- if page_description -%}<meta name="description" content="{{ page_description | escape }}">{%- endif -%}
  <link rel="canonical" href="{{ canonical_url }}">
  {%- comment -%} Paid-traffic landing page: keep it out of organic search. Remove if it should rank. {%- endcomment -%}
  <meta name="robots" content="noindex">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ${preload}
  ${fonts}
  {{ content_for_header }}
</head>
<body>
  {{ content_for_layout }}
</body>
</html>
`;

const template = {
  layout: "tp-lp-5r",
  sections: { main: { type: "tp-lp-5r", settings: {} } },
  order: ["main"],
};

const write = (rel, content) => {
  const p = path.join(out, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log("wrote", path.relative(root, p), `(${(Buffer.byteLength(content) / 1024).toFixed(1)} KB)`);
};

write("sections/tp-lp-5r.liquid", section);
write("layout/tp-lp-5r.liquid", layout);
write("templates/page.tp-lp-5r.json", JSON.stringify(template, null, 2) + "\n");
for (const name of localAssets) {
  fs.mkdirSync(path.join(out, "assets"), { recursive: true });
  fs.copyFileSync(path.join(assetsDir, name), path.join(out, "assets", name));
  console.log("copied", "shopify/assets/" + name);
}
