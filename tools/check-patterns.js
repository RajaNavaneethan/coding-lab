#!/usr/bin/env node
// Validates pattern files against the data contract in .work/PLAN.md.
//   node tools/check-patterns.js                     check every patterns/*.js
//   node tools/check-patterns.js patterns/02-x.js    check one or more files
//   node tools/check-patterns.js --dump patterns/02-x.js <demoId> [inputJSON]
//                                                    print the frames of a run (default input)
// Exit code 1 on any error. Prints "OK" per file when clean.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const FIELDS = require(path.join(ROOT, "fields.js"));

const PATTERN_IDS = ["two-pointers", "sliding-window", "prefix-sum-hashing", "binary-search", "linked-lists",
  "stacks-monotonic", "heaps", "trees", "tries", "graphs-bfs-dfs", "shortest-path-union-find", "backtracking",
  "dp-1d", "dp-2d", "dp-knapsack", "greedy", "intervals", "bit-manipulation", "math-design", "advanced"];
const MARKS = new Set(["hot", "good", "warn", "bad", "done", "new", "in", "dim", "path"]);
const MAX_FRAMES = 40;

// The 85 LC numbers, from data/problems.js if present, else from build_index.py.
function loadProblemNumbers() {
  const pj = path.join(ROOT, "data", "problems.js");
  if (fs.existsSync(pj)) {
    const ctx = { window: {} };
    vm.runInNewContext(fs.readFileSync(pj, "utf8"), ctx);
    return new Set((ctx.window.CIL_PROBLEMS || []).map((p) => p.lc));
  }
  const bi = "/Users/rnnavane/CODING/prep/html/build_index.py";
  if (!fs.existsSync(bi)) return null;
  const nums = [...fs.readFileSync(bi, "utf8").matchAll(/\((\d+),"[a-z0-9-]+","/g)].map((m) => +m[1]);
  return new Set(nums);
}
const PROBLEMS = loadProblemNumbers();

// ---------- helpers ----------
const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
const isStr = (x) => typeof x === "string";
const nonEmpty = (x) => isStr(x) && x.trim() !== "";
const isInt = (x) => Number.isInteger(x);
const prim = (x) => x === null || ["number", "string", "boolean"].includes(typeof x);
const words = (s) => s.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

function deepEq(a, b) {
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number") return Number.isNaN(a) && Number.isNaN(b);
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => deepEq(x, b[i]));
  if (isObj(a) && isObj(b)) {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => deepEq(a[k], b[k]));
  }
  return false;
}
const sortKey = (x) => JSON.stringify(x);
function compare(actual, expected, mode) {
  if (!mode) return deepEq(actual, expected);
  if (mode === "approx") return typeof actual === "number" && Math.abs(actual - expected) < 1e-6;
  if (mode === "set" || mode === "setDeep") {
    if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
    const norm = (arr) => arr.map((x) => (mode === "setDeep" && Array.isArray(x) ? [...x].sort((p, q) => (p < q ? -1 : p > q ? 1 : 0)) : x))
      .map(sortKey).sort();
    return deepEq(norm(actual), norm(expected));
  }
  return false;
}

// ---------- recorder ----------
function makeRec() {
  const frames = [];
  const st = { frames, truncated: null, errors: [], extra: 0, truncCalls: 0 };
  st.rec = {
    frame(f) { if (frames.length >= MAX_FRAMES) { st.extra++; return; } frames.push(f); },
    truncated(n) { st.truncCalls++; st.truncated = n; },
    full() { return frames.length >= MAX_FRAMES; },
    error(msg) { st.errors.push(String(msg)); },
  };
  return st;
}

// ---------- view validation ----------
function viewKeys(v) {
  // Returns a Set of string keys valid for marks/moves in this view.
  const idx = (n) => new Set(Array.from({ length: n }, (_, i) => String(i)));
  switch (v.type) {
    case "array": case "bars": return idx((v.values || []).length);
    case "string": return idx((v.value || "").length);
    case "stack": case "queue": case "deque": return idx((v.items || []).length);
    case "heap": return idx((v.values || []).length);
    case "callstack": return idx((v.frames || []).length);
    case "bits": return idx(v.width || 8);
    case "map": return new Set((v.entries || []).map((e) => String(e[0])));
    case "list": case "tree": case "forest": case "trie": case "graph": return new Set((v.nodes || []).map((n) => String(n.id)));
    case "intervals": return new Set((v.items || []).map((n) => String(n.id)));
    case "grid": {
      const s = new Set();
      (v.cells || []).forEach((row, r) => (row || []).forEach((_, c) => s.add(`${r},${c}`)));
      return s;
    }
    case "calc": return new Set();
    default: return null;
  }
}

function checkMarks(err, where, marks, keys) {
  if (marks === undefined) return;
  if (!isObj(marks)) return err(`${where}: must be an object`);
  for (const [k, m] of Object.entries(marks)) {
    if (!MARKS.has(m)) err(`${where}: mark "${m}" is not in the vocabulary`);
    if (keys && !keys.has(String(k))) err(`${where}: key "${k}" does not exist in the view`);
  }
}
function checkEdgeMarks(err, where, em, keys) {
  if (em === undefined) return;
  if (!isObj(em)) return err(`${where}: must be an object`);
  for (const [k, m] of Object.entries(em)) {
    if (!MARKS.has(m)) err(`${where}: mark "${m}" is not in the vocabulary`);
    const parts = k.split("-");
    if (parts.length !== 2 || !keys.has(parts[0]) || !keys.has(parts[1])) err(`${where}: edge key "${k}" must be "a-b" with both node ids existing`);
  }
}
function checkIndexPointers(err, where, ptrs, len) {
  if (ptrs === undefined) return;
  if (!isObj(ptrs)) return err(`${where}: must be an object`);
  for (const [n, i] of Object.entries(ptrs)) {
    if (i === null) continue;
    if (!isInt(i) || i < -1 || i > len) err(`${where}.${n} = ${i} is outside -1..${len}`);
  }
}
function checkIdPointers(err, where, ptrs, keys) {
  if (ptrs === undefined) return;
  if (!isObj(ptrs)) return err(`${where}: must be an object`);
  for (const [n, id] of Object.entries(ptrs)) if (id !== null && !keys.has(String(id))) err(`${where}.${n} = "${id}" is not a node id`);
}

function checkView(err, where, v) {
  if (!isObj(v)) return err(`${where}: view must be an object`);
  if (!nonEmpty(v.id)) err(`${where}: view needs a string id`);
  const keys = viewKeys(v);
  if (!keys) return err(`${where}: unknown view type "${v.type}"`);
  if (v.label !== undefined && !isStr(v.label)) err(`${where}: label must be a string`);
  const w = `${where} (${v.type} "${v.id}")`;
  switch (v.type) {
    case "array": case "bars": case "string": {
      let len;
      if (v.type === "string") { if (!isStr(v.value)) err(`${w}: value must be a string`); len = (v.value || "").length; }
      else {
        if (!Array.isArray(v.values) || !v.values.every(prim)) err(`${w}: values must be an array of primitives`);
        if (v.type === "bars" && Array.isArray(v.values) && !v.values.every((x) => typeof x === "number" && x >= 0)) err(`${w}: bar values must be numbers >= 0`);
        len = (v.values || []).length;
      }
      checkIndexPointers(err, `${w}.pointers`, v.pointers, len);
      checkMarks(err, `${w}.marks`, v.marks, keys);
      if (v.ranges !== undefined) {
        if (!Array.isArray(v.ranges)) err(`${w}.ranges must be an array`);
        else v.ranges.forEach((r, i) => {
          if (!isInt(r.from) || !isInt(r.to)) return err(`${w}.ranges[${i}] needs integer from/to`);
          if (r.from <= r.to && (r.from < 0 || r.to >= len)) err(`${w}.ranges[${i}] ${r.from}..${r.to} is outside 0..${len - 1}`);
          if (r.mark !== undefined && !MARKS.has(r.mark)) err(`${w}.ranges[${i}].mark "${r.mark}" is not in the vocabulary`);
        });
      }
      if (v.dir !== undefined && !["ltr", "rtl"].includes(v.dir)) err(`${w}.dir must be "ltr" or "rtl"`);
      if (v.water !== undefined && (!isObj(v.water) || Object.entries(v.water).some(([k, h]) => !keys.has(String(k)) || typeof h !== "number" || h < 0))) err(`${w}.water must map existing indexes to heights >= 0`);
      break;
    }
    case "map":
      if (!Array.isArray(v.entries) || !v.entries.every((e) => Array.isArray(e) && e.length === 2)) err(`${w}: entries must be [[key, value]]`);
      if (v.kind !== undefined && !["map", "set", "counter"].includes(v.kind)) err(`${w}: kind must be map/set/counter`);
      if (Array.isArray(v.entries) && new Set(v.entries.map((e) => String(e[0]))).size !== v.entries.length) err(`${w}: duplicate keys in entries`);
      checkMarks(err, `${w}.marks`, v.marks, keys);
      break;
    case "stack": case "queue": case "deque":
      if (!Array.isArray(v.items)) err(`${w}: items must be an array`);
      checkMarks(err, `${w}.marks`, v.marks, keys);
      break;
    case "heap":
      if (!Array.isArray(v.values)) err(`${w}: values must be an array`);
      if (!["min", "max"].includes(v.kind)) err(`${w}: kind must be "min" or "max"`);
      checkMarks(err, `${w}.marks`, v.marks, keys);
      break;
    case "callstack":
      if (!Array.isArray(v.frames) || !v.frames.every(isStr)) err(`${w}: frames must be an array of strings`);
      checkMarks(err, `${w}.marks`, v.marks, keys);
      break;
    case "bits":
      if (!isInt(v.value) || v.value < 0) err(`${w}: value must be an integer >= 0`);
      if (v.width !== undefined && (!isInt(v.width) || v.width < 1 || v.width > 32)) err(`${w}: width must be 1..32`);
      checkMarks(err, `${w}.marks`, v.marks, keys);
      break;
    case "list": {
      if (!Array.isArray(v.nodes)) { err(`${w}: nodes must be an array`); break; }
      if (keys.size !== v.nodes.length) err(`${w}: duplicate node ids`);
      if (v.next !== undefined) for (const [a, b] of Object.entries(v.next)) {
        if (!keys.has(a)) err(`${w}.next: "${a}" is not a node id`);
        if (b !== null && !keys.has(String(b))) err(`${w}.next.${a} -> "${b}" is not a node id`);
      }
      checkIdPointers(err, `${w}.pointers`, v.pointers, keys);
      checkMarks(err, `${w}.marks`, v.marks, keys);
      break;
    }
    case "tree": {
      if (!Array.isArray(v.nodes)) { err(`${w}: nodes must be an array`); break; }
      if (keys.size !== v.nodes.length) err(`${w}: duplicate node ids`);
      v.nodes.forEach((n) => ["left", "right"].forEach((s) => {
        if (n[s] !== null && n[s] !== undefined && !keys.has(String(n[s]))) err(`${w}: node ${n.id}.${s} -> "${n[s]}" is not a node id`);
      }));
      if (v.root !== null && v.root !== undefined && !keys.has(String(v.root))) err(`${w}: root "${v.root}" is not a node id`);
      checkIdPointers(err, `${w}.pointers`, v.pointers, keys);
      checkMarks(err, `${w}.marks`, v.marks, keys);
      checkEdgeMarks(err, `${w}.edgeMarks`, v.edgeMarks, keys);
      break;
    }
    case "forest": {
      if (!Array.isArray(v.nodes)) { err(`${w}: nodes must be an array`); break; }
      if (keys.size !== v.nodes.length) err(`${w}: duplicate node ids`);
      v.nodes.forEach((n) => { if (n.parent !== null && n.parent !== undefined && !keys.has(String(n.parent))) err(`${w}: node ${n.id}.parent "${n.parent}" is not a node id`); });
      checkIdPointers(err, `${w}.pointers`, v.pointers, keys);
      checkMarks(err, `${w}.marks`, v.marks, keys);
      checkEdgeMarks(err, `${w}.edgeMarks`, v.edgeMarks, keys);
      break;
    }
    case "trie": {
      if (!Array.isArray(v.nodes)) { err(`${w}: nodes must be an array`); break; }
      if (keys.size !== v.nodes.length) err(`${w}: duplicate node ids`);
      v.nodes.forEach((n) => (n.children || []).forEach((c) => { if (!keys.has(String(c))) err(`${w}: node ${n.id} child "${c}" is not a node id`); }));
      if (!keys.has(String(v.root))) err(`${w}: root "${v.root}" is not a node id`);
      checkIdPointers(err, `${w}.pointers`, v.pointers, keys);
      checkMarks(err, `${w}.marks`, v.marks, keys);
      break;
    }
    case "graph": {
      if (!Array.isArray(v.nodes)) { err(`${w}: nodes must be an array`); break; }
      if (keys.size !== v.nodes.length) err(`${w}: duplicate node ids`);
      v.nodes.forEach((n) => ["x", "y"].forEach((c) => { if (n[c] !== undefined && !(n[c] >= 0 && n[c] <= 1)) err(`${w}: node ${n.id}.${c} must be in 0..1`); }));
      (v.edges || []).forEach((e, i) => { if (!keys.has(String(e[0])) || !keys.has(String(e[1]))) err(`${w}.edges[${i}] references a missing node`); });
      checkMarks(err, `${w}.marks`, v.marks, keys);
      checkEdgeMarks(err, `${w}.edgeMarks`, v.edgeMarks, keys);
      if (v.badges !== undefined) for (const k of Object.keys(v.badges)) if (!keys.has(k)) err(`${w}.badges: "${k}" is not a node id`);
      break;
    }
    case "grid": {
      if (!Array.isArray(v.cells) || !v.cells.every((r) => Array.isArray(r) && r.every(prim))) { err(`${w}: cells must be a 2D array of primitives`); break; }
      if (v.rowLabels !== undefined && v.rowLabels.length !== v.cells.length) err(`${w}: rowLabels length ${v.rowLabels.length} != rows ${v.cells.length}`);
      if (v.colLabels !== undefined && v.cells.length && v.colLabels.length !== v.cells[0].length) err(`${w}: colLabels length ${v.colLabels.length} != cols ${v.cells[0].length}`);
      checkMarks(err, `${w}.marks`, v.marks, keys);
      (v.arrows || []).forEach((a, i) => { if (!Array.isArray(a) || !keys.has(String(a[0])) || !keys.has(String(a[1]))) err(`${w}.arrows[${i}] must be ["r,c","r,c"] of existing cells`); });
      break;
    }
    case "intervals":
      if (!Array.isArray(v.items) || !v.items.every((it) => it.id !== undefined && typeof it.start === "number" && typeof it.end === "number")) err(`${w}: items need id, start, end`);
      if (!Array.isArray(v.axis) || v.axis.length !== 2) err(`${w}: axis must be [min, max]`);
      checkMarks(err, `${w}.marks`, v.marks, keys);
      break;
    case "calc":
      if (!prim(v.value)) err(`${w}: value must be a number or string`);
      break;
  }
}

function moveKeyExists(views, ref) {
  if (!Array.isArray(ref) || ref.length !== 2) return false;
  const v = views.find((x) => x.id === ref[0]);
  if (!v) return false;
  const keys = viewKeys(v);
  return !!keys && (v.type === "calc" || keys.has(String(ref[1])));
}

function checkFrames(err, where, frames, codeLen) {
  let prevViews = [], tips = 0;
  frames.forEach((f, i) => {
    const fw = `${where} frame ${i + 1}`;
    if (!isObj(f)) return err(`${fw}: must be an object`);
    const lines = Array.isArray(f.line) ? f.line : [f.line];
    if (Array.isArray(f.line) && (f.line.length !== 2 || f.line[0] > f.line[1])) err(`${fw}: line range must be [start, end]`);
    lines.forEach((l) => { if (!isInt(l) || l < 1 || l > codeLen) err(`${fw}: line ${l} is outside 1..${codeLen}`); });
    if (!nonEmpty(f.title)) err(`${fw}: title missing`);
    else if (f.title.length > 32) err(`${fw}: title "${f.title}" is longer than 32 chars`);
    if (!nonEmpty(f.t)) err(`${fw}: caption t missing`);
    if (f.tip !== undefined) { if (!nonEmpty(f.tip)) err(`${fw}: tip must be a non-empty string`); tips++; }
    if (f.vars !== undefined) {
      if (!isObj(f.vars)) err(`${fw}: vars must be an object`);
      else for (const [k, x] of Object.entries(f.vars)) if (!prim(x)) err(`${fw}: vars.${k} must be a primitive`);
    }
    if (f.layout !== undefined && !["rows", "cols"].includes(f.layout)) err(`${fw}: layout must be rows/cols`);
    if (!Array.isArray(f.views) || !f.views.length) return err(`${fw}: views must be a non-empty array`);
    const ids = f.views.map((v) => v && v.id);
    if (new Set(ids).size !== ids.length) err(`${fw}: duplicate view ids`);
    f.views.forEach((v, j) => checkView(err, `${fw} views[${j}]`, v));
    if (i > 0 && prevViews.length && JSON.stringify(prevViews.map((v) => v.id)) !== JSON.stringify(ids)) {
      err(`${fw}: view ids/order changed (${prevViews.map((v) => v.id)} -> ${ids}); keep the same views in every frame`);
    }
    if (f.moves !== undefined) {
      if (!Array.isArray(f.moves)) err(`${fw}: moves must be an array`);
      else {
        if (f.moves.length > 3) err(`${fw}: more than 3 moves`);
        f.moves.forEach((m, k) => {
          if (!moveKeyExists(f.views, m.to)) err(`${fw} moves[${k}].to ${JSON.stringify(m.to)} does not exist in this frame`);
          if (!moveKeyExists(f.views, m.from) && !moveKeyExists(prevViews, m.from)) err(`${fw} moves[${k}].from ${JSON.stringify(m.from)} does not exist in this or the previous frame`);
          if (m.mark !== undefined && !MARKS.has(m.mark)) err(`${fw} moves[${k}].mark "${m.mark}" is not in the vocabulary`);
        });
      }
    }
    prevViews = f.views;
  });
  return tips;
}

function runDemo(demo, texts) {
  const { values, errors } = FIELDS.parseAll(demo.fields, texts);
  const st = makeRec();
  if (Object.keys(errors).length) return { parseErrors: errors, st };
  let answer, threw = null;
  try { answer = demo.run(values, st.rec); } catch (e) { threw = e; }
  return { answer, threw, st };
}

// ---------- pattern validation ----------
function checkPattern(p, file) {
  const errors = [];
  const where0 = `${path.basename(file)} [${p && p.id}]`;
  const err = (m) => errors.push(`${where0}: ${m}`);
  if (!isObj(p)) { err("record is not an object"); return errors; }
  const idx = PATTERN_IDS.indexOf(p.id);
  if (idx < 0) err(`id "${p.id}" is not one of the 20 fixed ids`);
  else {
    if (p.num !== idx + 1) err(`num ${p.num} should be ${idx + 1}`);
    const expectName = `${String(idx + 1).padStart(2, "0")}-${p.id}.js`;
    if (path.basename(file) !== expectName) err(`file should be named ${expectName}`);
  }
  ["title", "summary"].forEach((k) => { if (!nonEmpty(p[k])) err(`${k} missing`); });
  if (!Array.isArray(p.tags) || p.tags.length < 4 || p.tags.length > 8) err("tags must have 4-8 entries");

  // demos
  if (!Array.isArray(p.demos) || p.demos.length < 1 || p.demos.length > 2) err("demos must have 1 or 2 entries");
  else {
    const dids = new Set();
    p.demos.forEach((d, di) => {
      const dw = `demo ${d.id || di}`;
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.id || "")) err(`${dw}: id must be kebab-case`);
      if (dids.has(d.id)) err(`${dw}: duplicate demo id`); dids.add(d.id);
      ["title", "problem"].forEach((k) => { if (!nonEmpty(d[k])) err(`${dw}: ${k} missing`); });
      if (!isInt(d.lc)) err(`${dw}: lc must be a LeetCode number`);
      if (!Array.isArray(d.code) || !d.code.length || !d.code.every(isStr)) { err(`${dw}: code must be an array of strings`); return; }
      d.code.forEach((l, i) => { if (/\t/.test(l)) err(`${dw}: code line ${i + 1} has a tab (use spaces)`); if (/&lt;|&gt;|&amp;/.test(l)) err(`${dw}: code line ${i + 1} is HTML-escaped; write raw C++`); });
      if (!Array.isArray(d.fields) || !d.fields.length) { err(`${dw}: fields missing`); return; }
      d.fields.forEach((f) => {
        if (!nonEmpty(f.key) || !nonEmpty(f.label) || !FIELDS.TYPES.includes(f.type) || !isStr(f.value)) err(`${dw}: field ${JSON.stringify(f)} needs key, label, a known type and a string value`);
      });
      if (typeof d.run !== "function") { err(`${dw}: run must be a function`); return; }

      // default input
      const def = runDemo(d, {});
      if (def.parseErrors) err(`${dw}: default field values do not parse: ${JSON.stringify(def.parseErrors)}`);
      else if (def.threw) err(`${dw}: run threw on the default input: ${def.threw.stack || def.threw}`);
      else {
        if (def.st.frames.length < 3) err(`${dw}: default input produced only ${def.st.frames.length} frames`);
        if (def.st.errors.length) err(`${dw}: default input called rec.error: ${def.st.errors.join("; ")}`);
        if (def.st.extra > 0 && def.st.truncCalls !== 1) err(`${dw}: default input passed 40 frames; call rec.truncated(n) exactly once`);
        if (def.st.truncated !== null && !(isInt(def.st.truncated) && def.st.truncated >= 1)) err(`${dw}: rec.truncated(n) needs an integer n >= 1`);
        const tips = checkFrames(err, `${dw} (default input)`, def.st.frames, d.code.length);
        if (tips > 5) err(`${dw}: ${tips} frames carry a tip; use 3-5`);
        if (tips < 2) err(`${dw}: only ${tips} frames carry a tip; use 3-5`);
      }

      // expect cases
      if (!Array.isArray(d.expect) || d.expect.length < 3) err(`${dw}: expect needs at least 3 cases`);
      else d.expect.forEach((c, ci) => {
        const cw = `${dw} expect[${ci}]`;
        if (!Array.isArray(c) || c.length < 2 || c.length > 3 || !isObj(c[0])) return err(`${cw}: must be [inputs, expected, mode?]`);
        if (c[2] !== undefined && !["set", "setDeep", "approx"].includes(c[2])) return err(`${cw}: unknown mode "${c[2]}"`);
        for (const [k, v] of Object.entries(c[0])) {
          if (!d.fields.some((f) => f.key === k)) err(`${cw}: input key "${k}" is not a field`);
          if (!isStr(v)) err(`${cw}: input ${k} must be raw text (a string), got ${JSON.stringify(v)}`);
        }
        const r = runDemo(d, c[0]);
        if (r.parseErrors) return err(`${cw}: inputs do not parse: ${JSON.stringify(r.parseErrors)}`);
        if (r.threw) return err(`${cw}: run threw: ${r.threw.stack || r.threw}`);
        if (!compare(r.answer, c[1], c[2])) err(`${cw}: got ${JSON.stringify(r.answer)}, expected ${JSON.stringify(c[1])}${c[2] ? " (" + c[2] + ")" : ""}`);
        if (r.st.extra > 0 && r.st.truncCalls !== 1) err(`${cw}: passed 40 frames; call rec.truncated(n) exactly once`);
        checkFrames(err, cw, r.st.frames, d.code.length);
      });
    });
  }

  // explain
  const e = p.explain;
  if (!isObj(e)) err("explain missing");
  else {
    if (!nonEmpty(e.plain)) err("explain.plain missing");
    const arr = (k, lo, hi, test, desc) => {
      if (!Array.isArray(e[k]) || e[k].length < lo || e[k].length > hi) return err(`explain.${k} must have ${lo}-${hi} entries`);
      e[k].forEach((x, i) => { if (!test(x)) err(`explain.${k}[${i}] must be ${desc}`); });
    };
    const tuple = (n) => (x) => Array.isArray(x) && x.length === n && x.every(nonEmpty);
    arr("spot", 4, 6, nonEmpty, "a non-empty string");
    arr("notWhen", 1, 3, nonEmpty, "a non-empty string");
    arr("template", 8, 30, isStr, "a string (raw C++ line)");
    arr("templateNotes", 2, 8, nonEmpty, "a non-empty string");
    arr("variants", 2, 4, tuple(3), "[variant, when, LC numbers]");
    arr("mistakes", 4, 6, nonEmpty, "a non-empty string");
    arr("complexity", 2, 4, tuple(4), "[approach, time, space, why]");
    arr("followups", 3, 4, tuple(2), "[question, answer]");
    if (Array.isArray(e.template)) e.template.forEach((l, i) => { if (/&lt;|&gt;|&amp;/.test(l)) err(`explain.template line ${i + 1} is HTML-escaped`); });
    if (!nonEmpty(e.sayIt)) err("explain.sayIt missing");
    else { const n = words(e.sayIt); if (n < 120 || n > 185) err(`explain.sayIt is ${n} words; aim for 130-170`); }
    if (!isObj(e.rubric) || !Array.isArray(e.rubric.strong) || !Array.isArray(e.rubric.weak) || e.rubric.strong.length !== 3 || e.rubric.weak.length !== 3) err("explain.rubric needs exactly 3 strong and 3 weak points");
  }

  // quiz
  if (!Array.isArray(p.quiz) || p.quiz.length !== 3) err("quiz must have exactly 3 questions");
  else {
    p.quiz.forEach((q, i) => {
      if (!Array.isArray(q) || q.length !== 4 || !nonEmpty(q[0]) || !Array.isArray(q[1]) || q[1].length !== 4 || !isInt(q[2]) || q[2] < 0 || q[2] > 3 || !nonEmpty(q[3])) return err(`quiz[${i}] must be [question, [4 options], 0-3, explanation]`);
      if (new Set(q[1]).size !== 4) err(`quiz[${i}] has duplicate options`);
    });
    if (new Set(p.quiz.map((q) => q[2])).size === 1) err("quiz: all three correct answers sit at the same index; vary it");
  }

  // drills
  if (!Array.isArray(p.drills) || p.drills.length !== 6) err("drills must have exactly 6 entries");
  else p.drills.forEach((d, i) => {
    if (!nonEmpty(d.prompt) || !nonEmpty(d.why)) err(`drills[${i}] needs prompt and why`);
    if (d.answer !== p.id) err(`drills[${i}].answer must be "${p.id}"`);
    if (!Array.isArray(d.distractors) || d.distractors.length !== 3 || new Set(d.distractors).size !== 3 || d.distractors.some((x) => !PATTERN_IDS.includes(x) || x === p.id)) err(`drills[${i}].distractors must be 3 distinct other pattern ids`);
  });

  // flashcards
  if (!Array.isArray(p.flashcards) || p.flashcards.length !== 5) err("flashcards must have exactly 5 cards");
  else {
    const ids = new Set();
    p.flashcards.forEach((c, i) => {
      if (!isObj(c) || !/^[a-z0-9-]+$/.test(c.id || "") || !nonEmpty(c.front) || !nonEmpty(c.back)) err(`flashcards[${i}] needs {id (kebab-case), front, back}`);
      if (ids.has(c.id)) err(`flashcards[${i}]: duplicate id "${c.id}"`); ids.add(c.id);
    });
  }

  // problems
  if (!Array.isArray(p.problems) || !p.problems.length) err("problems must list LC numbers");
  else if (PROBLEMS) p.problems.forEach((n) => { if (!PROBLEMS.has(n)) err(`problems: LC ${n} is not one of the 85 worked problems`); });

  return errors;
}

function loadFile(file) {
  const ctx = { window: {}, console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, "utf8"), ctx, { filename: file });
  const recs = ctx.window.CIL_PATTERNS || [];
  // From here on, run() must be pure: touching these throws, and the checker reports it.
  const impure = (what) => () => { throw new Error(`run must be pure: it used ${what}`); };
  Object.defineProperty(ctx, "window", { get: impure("window") });
  Object.defineProperty(ctx, "document", { get: impure("document") });
  vm.runInContext("Math.random = undefined; Date = undefined;", ctx);
  return recs;
}

// ---------- main ----------
function main(argv) {
  if (argv[0] === "--dump") {
    const [file, demoId, inputJSON] = argv.slice(1);
    const p = loadFile(path.resolve(file))[0];
    const d = p.demos.find((x) => x.id === demoId) || p.demos[0];
    const r = runDemo(d, inputJSON ? JSON.parse(inputJSON) : {});
    if (r.parseErrors) { console.log("parse errors", r.parseErrors); return 1; }
    if (r.threw) { console.log(r.threw); return 1; }
    r.st.frames.forEach((f, i) => {
      const ln = Array.isArray(f.line) ? f.line : [f.line];
      console.log(`\n#${i + 1} line ${ln.join("-")}: ${d.code.slice(ln[0] - 1, ln[ln.length - 1]).map((s) => s.trim()).join(" | ")}`);
      console.log(`   ${f.title} :: ${f.t.replace(/<[^>]+>/g, "")}`);
      if (f.vars) console.log(`   vars ${JSON.stringify(f.vars)}`);
      if (f.tip) console.log(`   tip: ${f.tip.replace(/<[^>]+>/g, "")}`);
    });
    console.log(`\nanswer: ${JSON.stringify(r.answer)}  frames: ${r.st.frames.length}${r.st.truncated ? "  truncated +" + r.st.truncated : ""}`);
    return 0;
  }
  const files = argv.length ? argv.map((f) => path.resolve(f)) :
    (fs.existsSync(path.join(ROOT, "patterns")) ? fs.readdirSync(path.join(ROOT, "patterns")).filter((f) => f.endsWith(".js")).sort().map((f) => path.join(ROOT, "patterns", f)) : []);
  if (!files.length) { console.log("no pattern files found"); return 0; }
  let bad = 0;
  const seen = new Map();
  for (const file of files) {
    let recs;
    try { recs = loadFile(file); } catch (e) { console.log(`${path.basename(file)}: FAILED TO LOAD: ${e.stack || e}`); bad++; continue; }
    if (recs.length !== 1) { console.log(`${path.basename(file)}: must push exactly 1 pattern record, pushed ${recs.length}`); bad++; continue; }
    const errs = checkPattern(recs[0], file);
    if (seen.has(recs[0].id)) errs.push(`${path.basename(file)}: id "${recs[0].id}" also defined in ${seen.get(recs[0].id)}`);
    seen.set(recs[0].id, path.basename(file));
    if (errs.length) { bad++; errs.forEach((m) => console.log(m)); console.log(`${path.basename(file)}: ${errs.length} error(s)`); }
    else console.log(`${path.basename(file)}: OK`);
  }
  return bad ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { checkPattern, loadFile, runDemo, PATTERN_IDS, MARKS };
