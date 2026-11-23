#!/usr/bin/env node
// Whole-site check: node check.js
//  1. every pattern file passes tools/check-patterns.js (the data contract)
//  2. every frame of every demo lays out in engine.js without an error (node, no DOM)
//  3. the 85 problems in data/problems.js exist under problems/ with the rewritten nav,
//     a Pattern lesson link to a valid pattern id, and their assets
//  4. every pattern's problems[] LC exists; each demo lc is in CIL_PROBLEMS (else a note)
//  5. the pages load every pattern file by its PLAN.md name
// Exit code 1 on any error. Works with any subset of the 20 pattern files present.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname;
const CP = require(path.join(ROOT, "tools", "check-patterns.js"));
require(path.join(ROOT, "fields.js"));
const ENGINE = require(path.join(ROOT, "engine.js"));

const errors = [], notes = [];
const err = (m) => errors.push(m);
const note = (m) => notes.push(m);

// ---------- data/problems.js ----------
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "data", "problems.js"), "utf8"), ctx);
const PROBLEMS = ctx.window.CIL_PROBLEMS || [];
const INDEX = ctx.window.CIL_PATTERN_INDEX || [];
const byLc = new Map(PROBLEMS.map((p) => [p.lc, p]));
if (PROBLEMS.length !== 85) err(`data/problems.js has ${PROBLEMS.length} problems, expected 85`);
if (byLc.size !== PROBLEMS.length) err("data/problems.js has duplicate LC numbers");
if (INDEX.length !== 20 || INDEX.some((x, i) => x.id !== CP.PATTERN_IDS[i] || x.num !== i + 1)) err("CIL_PATTERN_INDEX does not match the 20 ids of PLAN.md");
for (const f of ["style.css", "viz.js"]) if (!fs.existsSync(path.join(ROOT, "problems", "assets", f))) err(`problems/assets/${f} is missing`);
PROBLEMS.forEach((p) => {
  const w = `LC ${p.lc}`;
  if (!CP.PATTERN_IDS.includes(p.pattern)) err(`${w}: pattern "${p.pattern}" is not a pattern id`);
  if (!["Easy", "Medium", "Hard"].includes(p.difficulty)) err(`${w}: difficulty "${p.difficulty}"`);
  const want = `problems/lc${String(p.lc).padStart(4, "0")}-${p.slug}.html`;
  if (p.file !== want) err(`${w}: file ${p.file}, expected ${want}`);
  const fp = path.join(ROOT, p.file);
  if (!fs.existsSync(fp)) return err(`${w}: ${p.file} does not exist`);
  const html = fs.readFileSync(fp, "utf8");
  const nav = html.match(/<a href="\.\.\/problems\.html">&larr; All problems<\/a><a href="\.\.\/index\.html#([a-z0-9-]+)">Pattern lesson<\/a>/g) || [];
  if (nav.length !== 1) err(`${w}: expected one rewritten nav with a Pattern lesson link, found ${nav.length}`);
  else {
    const id = nav[0].match(/#([a-z0-9-]+)"/)[1];
    if (!CP.PATTERN_IDS.includes(id)) err(`${w}: Pattern lesson link points at unknown id "${id}"`);
    else if (id !== p.pattern) err(`${w}: Pattern lesson link #${id} but data says ${p.pattern}`);
  }
  if (/href="index\.html"/.test(html)) err(`${w}: still links to index.html (the original problem index)`);
  (html.match(/(?:href|src)="(assets\/[^"]+)"/g) || []).forEach((m) => {
    const rel = m.replace(/^(?:href|src)="/, "").replace(/"$/, "");
    if (!fs.existsSync(path.join(path.dirname(fp), rel))) err(`${w}: missing asset ${rel}`);
  });
});
const copies = fs.existsSync(path.join(ROOT, "problems")) ? fs.readdirSync(path.join(ROOT, "problems")).filter((f) => /^lc\d{4}-.*\.html$/.test(f)) : [];
if (copies.length !== 85) err(`problems/ holds ${copies.length} lc*.html pages, expected 85`);

// ---------- pattern files ----------
const PDIR = path.join(ROOT, "patterns");
const files = fs.existsSync(PDIR) ? fs.readdirSync(PDIR).filter((f) => f.endsWith(".js")).sort() : [];
const loaded = new Map();
const lines = [];
files.forEach((f) => {
  const fp = path.join(PDIR, f);
  let recs;
  try { recs = CP.loadFile(fp); } catch (e) { err(`${f}: failed to load: ${e.message}`); lines.push(`${f}: FAILED TO LOAD`); return; }
  if (recs.length !== 1) { err(`${f}: must push exactly 1 pattern record, pushed ${recs.length}`); return; }
  const p = recs[0];
  const errs = CP.checkPattern(p, fp);
  if (loaded.has(p.id)) errs.push(`${f}: id "${p.id}" also defined in ${loaded.get(p.id).file}`);
  loaded.set(p.id, { p, file: f });
  // Engine layout of every frame, default input and every expect case.
  (p.demos || []).forEach((d) => {
    if (typeof d.run !== "function") return;
    const inputs = [{}].concat((d.expect || []).map((c) => (c && typeof c[0] === "object" ? c[0] : {})));
    inputs.forEach((inp, k) => {
      const r = ENGINE.record(d, inp);
      if (r.threw || Object.keys(r.parseErrors).length) return;     // check-patterns reports these
      let L;
      try { L = ENGINE.layoutRun(r.frames); } catch (e) { errs.push(`${f} demo ${d.id} ${k ? "expect[" + (k - 1) + "]" : "default"}: engine layout threw: ${e.message}`); return; }
      L.errors.forEach((m) => errs.push(`${f} demo ${d.id} ${k ? "expect[" + (k - 1) + "]" : "default"}: engine could not draw ${m}`));
      if (!k && L.H > 900) note(`${f} demo ${d.id}: the stage is ${L.H} units tall; consider layout "cols" or fewer views`);
    });
    if (!byLc.has(d.lc)) note(`${f} demo ${d.id}: LC ${d.lc} is not among the 85 worked pages`);
  });
  (p.problems || []).forEach((n) => { if (!byLc.has(n)) errs.push(`${f}: problems lists LC ${n}, which is not in data/problems.js`); });
  errs.forEach(err);
  lines.push(errs.length ? `${f}: ${errs.length} error(s)` : `${f}: OK`);
});
const missing = CP.PATTERN_IDS.filter((id) => !loaded.has(id));
if (missing.length) note(`${missing.length} pattern file(s) not written yet: ${missing.join(", ")}`);

// ---------- pages ----------
const want = CP.PATTERN_IDS.map((id, i) => `patterns/${String(i + 1).padStart(2, "0")}-${id}.js`);
["index.html", "practice.html"].forEach((page) => {
  const html = fs.readFileSync(path.join(ROOT, page), "utf8");
  want.forEach((src) => { if (!html.includes(`<script src="${src}"></script>`)) err(`${page} does not load ${src}`); });
});
["index.html", "problems.html", "practice.html", "styles.css", "engine.js", "app.js", "problems-page.js", "practice/app.js", "fields.js", "README.md"]
  .forEach((f) => { if (!fs.existsSync(path.join(ROOT, f))) err(`${f} is missing`); });
// Dotfiles (.DS_Store from Finder, .gitignore, .work) are not served pages; skip them.
[...files, ...fs.readdirSync(ROOT)].forEach((f) => { if (!f.startsWith(".") && /[A-Z]/.test(f) && !/^README\.md$/.test(f)) err(`file name ${f} has capital letters (GitHub Pages is case-sensitive)`); });

// ---------- report ----------
lines.forEach((l) => console.log(l));
console.log(`problems: ${PROBLEMS.length} records, ${copies.length} pages copied`);
notes.forEach((m) => console.log("note: " + m));
errors.forEach((m) => console.log("ERROR: " + m));
console.log(errors.length ? `FAILED with ${errors.length} error(s)` : `OK: ${loaded.size} of 20 patterns, 85 problems`);
process.exit(errors.length ? 1 : 0);
