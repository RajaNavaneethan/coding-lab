// Coding Interview Lab - trace engine.
//
// window.CIL_ENGINE.mountTrace(container, demo, opts) parses demo.fields with CIL_FIELDS, runs
// demo.run with a recorder (40-frame cap) and plays the frames on an SVG stage beside the C++
// code (current line highlighted), a variables panel, caption, GOOD TO KNOW tip, step timeline,
// Prev/Next/Replay/Autoplay/speed and a "Try your own input" editor.
// Returns { goto(i), next(), prev(), replay(), setAutoplay(on), rerun(texts), destroy(),
// frame, count }. opts: { patternId, startFrame (0-based), keys (default true), reduceMotion,
// onStep(i, count), onEnd(), stageOnly }.
//
// Keyed elements tween between frames: a key that persists slides and recolours, a new key pops
// in, a removed key fades out. Connectors that appear draw themselves; `moves` fly a copy of a
// tile along a curve. The layout half below has no DOM and also loads in node (check.js lays
// out every frame of every pattern with it).
(function (root) {
  "use strict";

  const MARKS = ["hot", "good", "warn", "bad", "done", "new", "in", "dim", "path"];
  const MARK_LABEL = {
    hot: "looking at now", good: "kept / answer", warn: "conflict", bad: "rejected / removed",
    done: "finished", new: "just written", in: "read to compute", dim: "stale / ignored", path: "on the path",
  };
  const MAX_FRAMES = 40;
  const CW = 0.61;                                  // monospace glyph width per font-size unit
  const tw = (s, size) => (typeof s === "number" ? s : String(s).length) * size * CW;   // s: text or a character count
  const mk = (m) => (MARKS.includes(m) ? m : null);
  const markIn = (marks, k) => (marks && typeof marks === "object" ? mk(marks[String(k)]) : null);
  const num = (x, d) => (typeof x === "number" && isFinite(x) ? x : d);

  function show(v) {
    if (v === null) return "null";
    if (v === undefined) return "";
    if (v === Infinity) return "∞";
    if (v === -Infinity) return "-∞";
    if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(+v.toFixed(4));
    if (Array.isArray(v)) return v.map(show).join(", ");
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  }
  function showAnswer(v) {
    if (Array.isArray(v)) return "[" + v.map(showAnswer).join(", ") + "]";
    if (typeof v === "string") return JSON.stringify(v);
    return show(v);
  }

  // ---------- recorder ----------
  function record(demo, texts) {
    const F = root.CIL_FIELDS;
    const parsed = F.parseAll(demo.fields || [], texts || {});
    // finalAppended: the run went past the cap and the last frame it passed to rec.frame is shown
    // after the first 40, so the trace still ends on the real final step.
    const out = { frames: [], truncated: 0, error: null, answer: undefined, threw: null, parseErrors: parsed.errors, finalAppended: false };
    if (Object.keys(parsed.errors).length) return out;
    let extra = 0, lastExtra = null;
    const rec = {
      frame(f) { if (out.frames.length < MAX_FRAMES) out.frames.push(f); else { extra++; lastExtra = f; } },
      truncated(n) { out.truncated = Math.max(1, Math.round(+n) || 1); },
      full() { return out.frames.length >= MAX_FRAMES; },
      error(msg) { if (!out.error) out.error = String(msg); },
    };
    try { out.answer = demo.run(parsed.values, rec); } catch (e) { out.threw = e; }
    out.frames = out.frames.filter((f) => f && typeof f === "object");
    if (lastExtra && typeof lastExtra === "object" && !out.threw) {
      out.frames.push(lastExtra);
      out.finalAppended = true;
      out.truncated = extra - 1;                    // exact: every frame past the cap except the one shown
    } else if (!out.truncated && extra) out.truncated = extra;
    return out;
  }

  // ---------- per-run statistics, so every frame of a run lays out in the same slot ----------
  function textsOf(v) {
    switch (v.type) {
      case "array": case "bars": return (v.values || []).map(show);
      case "string": return [...String(v.value || "")];
      case "stack": case "queue": case "deque": return (v.items || []).map(show);
      case "heap": return (v.values || []).map(show);
      case "callstack": return (v.frames || []).map(show);
      case "list": case "tree": case "forest": return (v.nodes || []).map((n) => show(n && n.val));
      case "trie": return (v.nodes || []).map((n) => show(n && n.ch));
      case "graph": return (v.nodes || []).map((n) => show(n && (n.label !== undefined ? n.label : n.id)));
      case "grid": return [].concat(...(v.cells || []).map((r) => (r || []).map(show)));
      case "intervals": return (v.items || []).map((it) => show(it.label !== undefined ? it.label : `[${it.start},${it.end}]`));
      case "map": return (v.entries || []).filter(Array.isArray).map((e) => show(e[0]));
      case "bits": case "calc": return [show(v.value)];
      default: return [];
    }
  }
  function pointerCounts(v) {               // pointers that sit on the same element, stacked in rows
    const by = {};
    Object.entries(v.pointers || {}).forEach(([, at]) => { if (at !== null && at !== undefined) by[String(at)] = (by[String(at)] || 0) + 1; });
    return Math.max(0, ...Object.values(by));
  }
  function computeStats(frames) {
    const S = {};
    frames.forEach((f) => (f.views || []).forEach((v) => {
      if (!v || typeof v !== "object" || !v.id) return;
      const s = S[v.id] || (S[v.id] = { maxText: 1, maxCount: 0, maxBar: 0, maxKey: 1, maxVal: 1, ptrRows: 0,
        rangeRows: 0, ptrLeft: false, ptrRight: false, lanes: 1, ptrNames: [], rowLab: 1, colLab: 1, hasDir: false });
      const t = textsOf(v);
      t.forEach((x) => { s.maxText = Math.max(s.maxText, x.length); });
      s.maxCount = Math.max(s.maxCount, t.length);
      Object.keys(v.pointers || {}).forEach((n) => { if (!s.ptrNames.includes(n)) s.ptrNames.push(n); });
      s.ptrRows = Math.max(s.ptrRows, pointerCounts(v));
      if (v.dir === "ltr" || v.dir === "rtl") s.hasDir = true;
      if (["array", "string", "bars"].includes(v.type)) {
        const len = t.length;
        Object.values(v.pointers || {}).forEach((i) => { if (i === -1) s.ptrLeft = true; if (i === len) s.ptrRight = true; });
        const vis = (v.ranges || []).filter((r) => r && r.from <= r.to).length;
        s.rangeRows = Math.max(s.rangeRows, vis, (v.ranges || []).length ? 1 : 0);
        if (v.type === "bars") (v.values || []).forEach((h, i) => { s.maxBar = Math.max(s.maxBar, num(h, 0) + num((v.water || {})[i], 0)); });
      }
      if (v.type === "map") (v.entries || []).forEach((e) => {
        if (!Array.isArray(e)) return;
        s.maxKey = Math.max(s.maxKey, show(e[0]).length); s.maxVal = Math.max(s.maxVal, show(e[1]).length);
      });
      if (v.type === "grid") {
        (v.rowLabels || []).forEach((x) => { s.rowLab = Math.max(s.rowLab, show(x).length); });
        (v.colLabels || []).forEach((x) => { s.colLab = Math.max(s.colLab, show(x).length); });
      }
      if (v.type === "intervals") (v.items || []).forEach((it, i) => { s.lanes = Math.max(s.lanes, (Number.isInteger(it.lane) ? it.lane : i) + 1); });
      if (v.type === "intervals" && typeof v.cursor === "number") s.hasCursor = true;
      if (v.type === "graph" && Object.values(v.badges || {}).some((b) => b !== undefined && b !== null && b !== "")) s.hasBadges = true;
      if (v.type === "calc" && v.label) s.maxText = Math.max(s.maxText, 1);
    }));
    return S;
  }

  // ---------- layout: each view becomes keyed primitives in its own local coordinates ----------
  // Primitive kinds (`p`): tile, row, calc, rect, label, pill, pointer, bracket, edge, line.
  // Keys starting with "@<index>" belong to positional containers (stack, queue, deque, heap,
  // callstack); the renderer swaps the index for a stable identity so a popped item slides.
  const T = 44, G = 8, TITLE = 24;
  const newL = () => ({ items: [], anchors: {}, w: 0, h: 0 });
  const put = (l, it) => (l.items.push(it), it);
  const anchor = (l, k, it, text) => { l.anchors[String(k)] = { x: it.geo.x, y: it.geo.y, w: it.geo.w, h: it.geo.h, text, ek: it.key }; };
  // View titles are upper-case 11px with .09em spacing: about 7.7 units a character. A long title
  // wraps at word breaks (up to 3 lines, then an ellipsis), and the view is at least as wide as its
  // title, so the stage never clips one.
  const TITLE_CW = 7.7, TITLE_CHARS = 64, TITLE_LH = 14;
  function wrapTitle(t) {
    const lines = [];
    let cur = "";
    String(t).split(/\s+/).filter(Boolean).forEach((w) => {
      while (w.length > TITLE_CHARS) { if (cur) { lines.push(cur); cur = ""; } lines.push(w.slice(0, TITLE_CHARS - 1) + "…"); w = ""; }
      if (!w) return;
      if (cur && cur.length + 1 + w.length > TITLE_CHARS) { lines.push(cur); cur = w; } else cur = cur ? cur + " " + w : w;
    });
    if (cur) lines.push(cur);
    if (lines.length > 3) { lines.length = 3; lines[2] = lines[2].slice(0, TITLE_CHARS - 1).replace(/\s*\S*$/, "") + " …"; }
    return lines.length ? lines : [String(t)];
  }
  function title(l, v, text) {
    const t = text !== undefined ? text : v.label;
    if (t === undefined || t === null || t === "") return 4;
    const lines = wrapTitle(t);
    put(l, { key: "title", p: "label", geo: { x: 0, y: 10 }, text: lines.join(" "), lines: lines.length > 1 ? lines : undefined, cls: "view-title", anchor: "start" });
    l.titleW = Math.max(...lines.map((x) => x.length)) * TITLE_CW + 4;
    return TITLE + TITLE_LH * (lines.length - 1);
  }
  const ptrClass = (s, name) => "p" + (Math.max(0, s.ptrNames.indexOf(name)) % 5);

  // Pointer arrows under a row of elements; several pointers on one element stack downwards.
  function pointersUnder(l, v, s, py, xOf, valid) {
    const used = {};
    Object.entries(v.pointers || {}).forEach(([name, at]) => {
      if (at === null || at === undefined || !valid(at)) return;
      const k = String(at), row = used[k] || 0;
      used[k] = row + 1;
      put(l, { key: "pt:" + name, p: "pointer", geo: { x: xOf(at), y: py + row * 26 }, text: name, cls: ptrClass(s, name) });
    });
    return s.ptrRows ? py + s.ptrRows * 26 + 2 : py - 6;
  }

  function layArray(v, s) {
    const l = newL();
    const isStr = v.type === "string", isBars = v.type === "bars";
    const vals = isStr ? [...String(v.value || "")] : (v.values || []);
    const n = vals.length;
    const fs = s.maxText <= 3 ? 16 : s.maxText <= 6 ? 14 : 12;      // long values get a smaller font, not a huge tile
    const cellW = isBars ? Math.max(34, tw(s.maxText, 12) + 14) : Math.max(T, tw(s.maxText, fs) + 16);
    const gap = isBars ? 6 : G, step = cellW + gap;
    const x0 = s.ptrLeft ? step : 0;
    const rowW = Math.max(n * step - gap, 60);
    let y = title(l, v);
    if (s.hasDir) {
      if (v.dir === "ltr" || v.dir === "rtl") {
        const a = x0 + 4, b = x0 + rowW - 4, rtl = v.dir === "rtl";
        // Own row under the title: the label, then the arrow under it.
        put(l, { key: "dirl", p: "label", geo: { x: (a + b) / 2, y: y + 4 }, text: rtl ? "sweep right to left" : "sweep left to right", cls: "sweep-label" });
        put(l, { key: "dir", p: "edge", geo: { x1: rtl ? b : a, y1: y + 17, cx: (a + b) / 2, cy: y + 17, x2: rtl ? a : b, y2: y + 17 }, arrow: true, cls: "sweep" });
      }
      y += 30;
    }
    y += s.rangeRows * 22;
    const top = y;
    const BH = 150, base = top + BH + 16;
    const sc = isBars ? BH / Math.max(1, s.maxBar) : 0;
    const water = v.water || {};
    vals.forEach((val, i) => {
      const x = x0 + i * step, m = markIn(v.marks, i);
      if (isBars) {
        const hv = Math.max(0, num(val, 0)), h = Math.max(3, hv * sc), wv = Math.max(0, num(water[i], 0)), wh = wv * sc;
        const bar = put(l, { key: "b" + i, p: "tile", geo: { x, y: base - h, w: cellW, h }, text: "", mark: m, cls: "bar", rx: 4 });
        put(l, { key: "w" + i, p: "rect", geo: { x: x + 1, y: base - h - wh, w: cellW - 2, h: wh }, cls: "water" + (wh ? "" : " empty") });
        put(l, { key: "v" + i, p: "label", geo: { x: x + cellW / 2, y: base - h - wh - 9 }, text: show(val) + (wv ? ` +${show(wv)}` : ""), cls: "bar-val" + (m ? " m-" + m : "") });
        anchor(l, i, bar, show(val));
      } else {
        const text = isStr ? (val === " " ? "␣" : val) : show(val);
        const tile = put(l, { key: "t" + i, p: "tile", geo: { x, y: top, w: cellW, h: T }, text, mark: m, fs });
        anchor(l, i, tile, text);
      }
    });
    if (!n) put(l, { key: "empty", p: "label", geo: { x: x0 + 30, y: top + T / 2 }, text: "empty", cls: "empty-note" });
    const rowBottom = isBars ? base : top + T;
    if (isBars) put(l, { key: "base", p: "line", geo: { x1: x0 - 6, y1: base, x2: x0 + rowW + 6, y2: base }, cls: "baseline" });
    let iy = rowBottom + 12;
    if (v.showIndex !== false) {
      vals.forEach((_, i) => put(l, { key: "i" + i, p: "label", geo: { x: x0 + i * step + cellW / 2, y: iy }, text: String(i), cls: "idx" }));
      iy += 12;
    }
    (v.ranges || []).forEach((r, k) => {
      if (!r || !(r.from <= r.to) || r.from < 0 || r.to >= n) return;
      const by = top - 8 - k * 22;
      put(l, { key: "rg" + k, p: "bracket", geo: { x1: x0 + r.from * step, x2: x0 + r.to * step + cellW, y: by }, text: r.label ? show(r.label) : "", mark: mk(r.mark) || "good" });
    });
    const bottom = pointersUnder(l, v, s, iy + 4, (i) => x0 + i * step + cellW / 2, (i) => Number.isInteger(i) && i >= -1 && i <= n);
    l.w = x0 + rowW + (s.ptrRight ? step : 0);
    l.h = Math.max(bottom, iy) + 6;
    return l;
  }

  function layMap(v, s) {
    const l = newL();
    const set = v.kind === "set";
    const kw = Math.max(46, tw(s.maxKey, 13) + 24), vw = set ? 0 : Math.max(46, tw(s.maxVal, 13) + 24);
    const rw = kw + vw, RH = 30, PER = 8, CG = 18;
    const cols = Math.max(1, Math.ceil(s.maxCount / PER));
    const y0 = title(l, v);
    const hy = y0 + 16;
    for (let c = 0; c < cols; c++) {
      put(l, { key: "hk" + c, p: "label", geo: { x: c * (rw + CG) + kw / 2, y: y0 + 6 }, text: set ? "value" : "key", cls: "col-head" });
      if (!set) put(l, { key: "hv" + c, p: "label", geo: { x: c * (rw + CG) + kw + vw / 2, y: y0 + 6 }, text: v.kind === "counter" ? "count" : "value", cls: "col-head" });
    }
    const entries = (v.entries || []).filter(Array.isArray);
    entries.forEach(([k, val], i) => {
      const c = Math.floor(i / PER), r = i % PER;
      const row = put(l, { key: "r:" + String(k), p: "row", geo: { x: c * (rw + CG), y: hy + r * RH, w: rw, h: RH - 5, kw: set ? rw : kw },
        text: /^\s+$/.test(show(k)) ? show(k).replace(/ /g, "␣") : show(k), text2: set ? "" : show(val), mark: markIn(v.marks, k) });
      anchor(l, k, row, set ? show(k) : show(val));
    });
    if (!entries.length) put(l, { key: "empty", p: "label", geo: { x: rw / 2, y: hy + 12 }, text: "empty", cls: "empty-note" });
    l.w = cols * (rw + CG) - CG;
    l.h = hy + Math.min(PER, Math.max(1, s.maxCount)) * RH;
    return l;
  }

  function layStack(v, s) {
    const l = newL();
    const call = v.type === "callstack";
    const items = call ? (v.frames || []) : (v.items || []);
    const n = items.length, bw = Math.max(76, tw(s.maxText, 14) + 30), bh = 32, gap = 5;
    const cap = Math.max(1, s.maxCount);
    const y0 = title(l, v, v.label || (call ? "call stack" : ""));
    const base = y0 + cap * (bh + gap) + 2;
    put(l, { key: "plate", p: "rect", geo: { x: -8, y: base, w: bw + 16, h: 6 }, cls: "plate" });
    items.forEach((it, i) => {
      const tile = put(l, { key: `@${i}/t`, p: "tile", geo: { x: 0, y: base - (i + 1) * (bh + gap) + gap, w: bw, h: bh }, text: show(it), mark: markIn(v.marks, i), fs: 14, rx: 7 });
      anchor(l, i, tile, show(it));
    });
    const tl = l.items.find((it) => it.key === "title");          // the name rides just above the top item
    if (tl) tl.geo.y = Math.max(10, base - Math.max(n, 1) * (bh + gap) - 6 - TITLE_LH * ((tl.lines || [1]).length - 1));
    if (n) put(l, { key: "top", p: "label", geo: { x: bw + 10, y: base - n * (bh + gap) + gap + bh / 2 }, text: call ? "← running" : "← top", cls: "side-note", anchor: "start" });
    else put(l, { key: "empty", p: "label", geo: { x: bw / 2, y: base - bh / 2 - 2 }, text: "empty", cls: "empty-note" });
    l.w = bw + 86;
    l.h = base + 10;
    return l;
  }

  function layQueue(v, s) {
    const l = newL();
    const items = v.items || [], n = items.length;
    const fs = s.maxText <= 3 ? 15 : s.maxText <= 6 ? 14 : 12;
    const cellW = Math.max(T, tw(s.maxText, fs) + 16), step = cellW + G, cap = Math.max(3, s.maxCount);
    const y0 = title(l, v, v.label || v.type) + 6;
    put(l, { key: "track", p: "rect", geo: { x: -8, y: y0 - 7, w: cap * step + 8, h: T + 14 }, cls: "lane" });
    items.forEach((it, i) => {
      const tile = put(l, { key: `@${i}/t`, p: "tile", geo: { x: i * step, y: y0, w: cellW, h: T }, text: show(it), mark: markIn(v.marks, i), fs });
      anchor(l, i, tile, show(it));
    });
    if (n) {
      put(l, { key: "front", p: "label", geo: { x: cellW / 2, y: y0 + T + 18 }, text: "front", cls: "side-note" });
      put(l, { key: "back", p: "label", geo: { x: (n - 1) * step + cellW / 2, y: y0 + T + (n > 1 ? 18 : 30) }, text: "back", cls: "side-note" });
    } else put(l, { key: "empty", p: "label", geo: { x: 40, y: y0 + T / 2 }, text: "empty", cls: "empty-note" });
    l.w = cap * step;
    l.h = y0 + T + 36;
    return l;
  }

  // A connector between two node centres, trimmed so it starts and ends on the node outline.
  function link(x1, y1, x2, y2, r1, r2, bend) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const cx = (x1 + x2) / 2 - (dy / len) * (bend || 0), cy = (y1 + y2) / 2 + (dx / len) * (bend || 0);
    const toward = (px, py, qx, qy, r) => { const ex = qx - px, ey = qy - py, el = Math.hypot(ex, ey) || 1; return [px + (ex / el) * r, py + (ey / el) * r]; };
    const [sx, sy] = toward(x1, y1, cx, cy, r1), [ex, ey] = toward(x2, y2, cx, cy, r2);
    return { x1: sx, y1: sy, cx, cy, x2: ex, y2: ey };
  }
  const nodeW = (s, fs, min) => Math.max(min || 38, tw(s.maxText, fs) + 18);

  function layHeap(v, s) {
    const l = newL();
    const vals = v.values || [], n = vals.length, cap = Math.max(1, s.maxCount);
    const D = Math.floor(Math.log2(cap)) + 1, leaves = 2 ** (D - 1);
    const nw = nodeW(s, 13), nh = 38, slot = nw + 12, treeW = leaves * slot;
    const cell = Math.max(34, tw(s.maxText, 13) + 14), aw = cap * (cell + 4) - 4;
    const W = Math.max(treeW, aw), tx = (W - treeW) / 2, ax = (W - aw) / 2;
    const y0 = title(l, v, (v.label ? v.label + " · " : "") + (v.kind === "max" ? "max-heap" : "min-heap"));
    const pos = (i) => { const L = Math.floor(Math.log2(i + 1)), p = i - (2 ** L - 1); return [tx + ((p + 0.5) * treeW) / 2 ** L, y0 + 22 + L * 60]; };
    vals.forEach((val, i) => {
      const [cx, cy] = pos(i);
      if (i > 0) {
        const [px, py] = pos((i - 1) >> 1);
        put(l, { key: "e" + i, p: "edge", geo: link(px, py, cx, cy, nh / 2, nh / 2, 0), mark: null });
      }
      const node = put(l, { key: `@${i}/n`, p: "tile", geo: { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh }, text: show(val), mark: markIn(v.marks, i), fs: 14, rx: nh / 2 });
      anchor(l, i, node, show(val));
    });
    const ay = y0 + 22 + D * 60 - 6;
    vals.forEach((val, i) => {
      put(l, { key: `@${i}/a`, p: "tile", geo: { x: ax + i * (cell + 4), y: ay, w: cell, h: 30 }, text: show(val), mark: markIn(v.marks, i), fs: 13, rx: 5, cls: "small" });
      put(l, { key: "ai" + i, p: "label", geo: { x: ax + i * (cell + 4) + cell / 2, y: ay + 41 }, text: String(i), cls: "idx" });
    });
    if (!n) put(l, { key: "empty", p: "label", geo: { x: W / 2, y: y0 + 22 }, text: "empty", cls: "empty-note" });
    l.w = W;
    l.h = ay + 50;
    return l;
  }

  function layList(v, s) {
    const l = newL();
    const nodes = (v.nodes || []).filter((x) => x && x.id !== undefined);
    const bw = Math.max(50, tw(s.maxText, 14) + 26), bh = 38, gapX = 52, step = bw + gapX;
    const y0 = title(l, v) + 46;
    const at = {};
    nodes.forEach((nd, i) => {
      at[String(nd.id)] = i;
      const tile = put(l, { key: "n:" + nd.id, p: "tile", geo: { x: i * step, y: y0, w: bw, h: bh }, text: show(nd.val), mark: markIn(v.marks, nd.id), fs: 15, rx: 8 });
      anchor(l, nd.id, tile, show(nd.val));
    });
    let stub = false;
    Object.entries(v.next || {}).forEach(([a, b]) => {
      const ia = at[a];
      if (ia === undefined) return;
      const xa = ia * step, yc = y0 + bh / 2;
      if (b === null) {
        stub = true;
        put(l, { key: `e:${a}>null`, p: "edge", geo: { x1: xa + bw, y1: yc, cx: xa + bw + 12, cy: yc, x2: xa + bw + 24, y2: yc }, arrow: true, cls: "next" });
        put(l, { key: "null:" + a, p: "label", geo: { x: xa + bw + 33, y: yc }, text: "∅", cls: "null-mark" });
        return;
      }
      const ib = at[String(b)];
      if (ib === undefined || ib === ia) return;
      const xb = ib * step, d = ib - ia;
      let geo;
      if (d === 1) geo = { x1: xa + bw, y1: yc, cx: xa + bw + gapX / 2, cy: yc, x2: xb, y2: yc };
      else {
        const hgt = Math.min(42, 16 + 8 * Math.abs(d)), sx = xa + bw * (d > 0 ? 0.72 : 0.28), ex = xb + bw * (d > 0 ? 0.28 : 0.72);
        geo = { x1: sx, y1: y0, cx: (sx + ex) / 2, cy: y0 - 2 * hgt, x2: ex, y2: y0 };
      }
      put(l, { key: `e:${a}>${b}`, p: "edge", geo, arrow: true, cls: "next" });
    });
    if (!nodes.length) put(l, { key: "empty", p: "label", geo: { x: 40, y: y0 + bh / 2 }, text: "empty list", cls: "empty-note" });
    const bottom = pointersUnder(l, v, s, y0 + bh + 10, (id) => at[String(id)] * step + bw / 2, (id) => at[String(id)] !== undefined);
    l.w = Math.max(80, nodes.length * step - gapX + (stub ? 52 : 0));
    l.h = bottom + 6;
    return l;
  }

  // Pointer name tags under nodes of a tree / forest / trie / graph.
  function nodeTags(l, v, s, posOf) {
    const used = {};
    let maxY = 0;
    Object.entries(v.pointers || {}).forEach(([name, id]) => {
      if (id === null || id === undefined) return;
      const p = posOf(String(id));
      if (!p) return;
      const k = String(id), row = used[k] || 0;
      used[k] = row + 1;
      const y = p.y + p.h + 12 + row * 20;
      put(l, { key: "pt:" + name, p: "pill", geo: { x: p.x + p.w / 2, y }, text: name, cls: "ptr-tag " + ptrClass(s, name) });
      maxY = Math.max(maxY, y + 12);
    });
    return maxY;
  }

  // Tidy layout for n-ary trees: leaves take consecutive slots, a parent sits over its children.
  function tidy(roots, kids, slot, LH, y0) {
    const pos = {}, seen = new Set();
    let leaf = 0, maxD = 0;
    function place(id, d) {
      seen.add(id);
      maxD = Math.max(maxD, d);
      const cs = (kids[id] || []).filter((c) => !seen.has(c));
      cs.forEach((c) => seen.add(c));
      if (!cs.length) { pos[id] = { slot: leaf++, d }; return; }
      cs.forEach((c) => place(c, d + 1));
      pos[id] = { slot: (pos[cs[0]].slot + pos[cs[cs.length - 1]].slot) / 2, d };
    }
    roots.forEach((r, i) => { if (seen.has(r)) return; if (i) leaf += 0.4; place(r, 0); });
    Object.values(pos).forEach((p) => { p.x = p.slot * slot; p.y = y0 + p.d * LH; });
    return { pos, width: Math.max(1, leaf) * slot, depth: maxD };
  }

  function layTreeish(v, s) {
    const l = newL();
    const nodes = (v.nodes || []).filter((x) => x && x.id !== undefined);
    const ids = nodes.map((n) => String(n.id)), byId = {};
    nodes.forEach((n) => { byId[String(n.id)] = n; });
    const kids = {}, parentOf = {};
    let roots = [];
    const addKid = (p, c) => { if (byId[c] && p !== c && parentOf[c] === undefined) { (kids[p] = kids[p] || []).push(c); parentOf[c] = p; } };
    if (v.type === "tree") {
      // In-order rank gives each binary-tree node its own column, so left stays left.
      nodes.forEach((n) => ["left", "right"].forEach((side) => { if (n[side] !== null && n[side] !== undefined) addKid(String(n.id), String(n[side])); }));
      roots = v.root !== null && v.root !== undefined && byId[String(v.root)] ? [String(v.root)] : [];
    } else if (v.type === "forest") {
      nodes.forEach((n) => { if (n.parent !== null && n.parent !== undefined) addKid(String(n.parent), String(n.id)); });
    } else {
      nodes.forEach((n) => (n.children || []).forEach((c) => addKid(String(n.id), String(c))));
      roots = v.root !== undefined && byId[String(v.root)] ? [String(v.root)] : [];
    }
    ids.forEach((id) => { if (parentOf[id] === undefined && !roots.includes(id)) roots.push(id); });
    const fs = v.type === "trie" ? 14 : 13;
    const nw = nodeW(s, fs, 38), nh = 38, slot = nw + 12, LH = 60;
    const y0 = title(l, v) + 2;
    let pos, width;
    if (v.type === "tree") {
      pos = {}; let rank = 0, maxD = 0; const seen = new Set();
      const walk = (id, d) => {
        if (!id || seen.has(id) || !byId[id]) return;
        seen.add(id); maxD = Math.max(maxD, d);
        const n = byId[id];
        walk(n.left === null || n.left === undefined ? null : String(n.left), d + 1);
        pos[id] = { x: rank++ * slot, y: y0 + d * LH };
        walk(n.right === null || n.right === undefined ? null : String(n.right), d + 1);
      };
      roots.forEach((r, i) => { if (i && !seen.has(r)) rank += 0.4; walk(r, 0); });
      width = Math.max(1, rank) * slot;
    } else ({ pos, width } = tidy(roots, kids, slot, LH, y0));
    let maxY = y0 + nh;
    nodes.forEach((n) => {
      const id = String(n.id), p = pos[id];
      if (!p) return;
      const text = v.type === "trie" ? (n.ch === undefined || n.ch === "" || id === String(v.root) && !n.ch ? "·" : show(n.ch)) : show(n.val);
      const node = put(l, { key: "n:" + id, p: "tile", geo: { x: p.x, y: p.y, w: nw, h: nh }, text, mark: markIn(v.marks, id), fs, rx: nh / 2,
        cls: v.type === "trie" && n.end ? "end" : "" });
      anchor(l, id, node, text);
      maxY = Math.max(maxY, p.y + nh);
    });
    Object.entries(kids).forEach(([p, cs]) => cs.forEach((c) => {
      const a = pos[p], b = pos[c];
      if (!a || !b) return;
      put(l, { key: `e:${p}-${c}`, p: "edge", geo: link(a.x + nw / 2, a.y + nh / 2, b.x + nw / 2, b.y + nh / 2, nh / 2, nh / 2, 0),
        mark: markIn(v.edgeMarks, `${p}-${c}`) });
    }));
    if (!nodes.length) put(l, { key: "empty", p: "label", geo: { x: 40, y: y0 + 16 }, text: "empty", cls: "empty-note" });
    const tagY = nodeTags(l, v, s, (id) => (pos[id] ? { x: pos[id].x, y: pos[id].y, w: nw, h: nh } : null));
    l.w = Math.max(80, width - 12);
    l.h = Math.max(maxY, tagY) + 8;
    return l;
  }

  const hashStr = (str) => { let h = 0; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };

  function layGraph(v, s) {
    const l = newL();
    const nodes = (v.nodes || []).filter((x) => x && x.id !== undefined), n = nodes.length;
    const allXY = n && nodes.every((nd) => typeof nd.x === "number" && typeof nd.y === "number");
    const r = Math.max(20, tw(s.maxText, 13) / 2 + 10), W = Math.max(420, Math.min(640, 150 + n * 60));
    const H = allXY || s.maxCount > 4 ? 300 : s.maxCount <= 2 ? 110 : 230;
    const y0 = title(l, v) + (s.hasBadges ? 10 : 0);              // room for badges over the top nodes
    const at = {};
    nodes.forEach((nd, i) => {
      let cx, cy;
      if (allXY) { cx = r + 8 + nd.x * (W - 2 * r - 16); cy = y0 + r + 8 + nd.y * (H - 2 * r - 16); }
      else {
        const ang = (n === 2 ? Math.PI : -Math.PI / 2) + (2 * Math.PI * i) / Math.max(1, n), R = n === 2 ? W / 2 - r - 40 : Math.min(W, H) / 2 - r - 12;
        cx = W / 2 + R * Math.cos(ang); cy = y0 + H / 2 + R * Math.sin(ang);
      }
      at[String(nd.id)] = { cx, cy };
      const text = show(nd.label !== undefined ? nd.label : nd.id);
      const node = put(l, { key: "n:" + nd.id, p: "tile", geo: { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r }, text, mark: markIn(v.marks, nd.id), fs: 14, rx: r });
      anchor(l, nd.id, node, text);
    });
    const edges = (v.edges || []).filter((e) => Array.isArray(e) && at[String(e[0])] && at[String(e[1])]);
    const has = new Set(edges.map((e) => `${e[0]}-${e[1]}`)), seenKey = {};
    edges.forEach((e) => {
      const a = String(e[0]), b = String(e[1]);
      if (a === b) return;
      let key = `e:${a}-${b}`;
      seenKey[key] = (seenKey[key] || 0) + 1;
      if (seenKey[key] > 1) key += "#" + seenKey[key];
      const pa = at[a], pb = at[b], len = Math.hypot(pb.cx - pa.cx, pb.cy - pa.cy);
      const both = v.directed && has.has(`${b}-${a}`);
      const bend = both ? 22 : Math.min(26, len * 0.12) * (hashStr(a < b ? a + b : b + a) % 2 ? 1 : -1) * (v.directed || a < b ? 1 : -1);
      const geo = link(pa.cx, pa.cy, pb.cx, pb.cy, r, r + (v.directed ? 2 : 0), bend);
      const m = markIn(v.edgeMarks, `${a}-${b}`) || (!v.directed ? markIn(v.edgeMarks, `${b}-${a}`) : null);
      put(l, { key, p: "edge", geo, arrow: !!v.directed, mark: m, cls: "gedge" });
      if (e[2] !== undefined && e[2] !== null) {
        const mx = 0.25 * geo.x1 + 0.5 * geo.cx + 0.25 * geo.x2, my = 0.25 * geo.y1 + 0.5 * geo.cy + 0.25 * geo.y2;
        put(l, { key: "w" + key, p: "pill", geo: { x: mx, y: my }, text: show(e[2]), cls: "weight" + (m ? " m-" + m : "") });
      }
    });
    Object.entries(v.badges || {}).forEach(([id, text]) => {
      const p = at[String(id)];
      if (p && text !== undefined && text !== null && text !== "") put(l, { key: "bd:" + id, p: "pill", geo: { x: p.cx + r * 0.9, y: p.cy - r - 11 }, text: show(text), cls: "badge" });   // clears the circle
    });
    const tagY = nodeTags(l, v, s, (id) => (at[id] ? { x: at[id].cx - r, y: at[id].cy - r, w: 2 * r, h: 2 * r } : null));
    if (!n) put(l, { key: "empty", p: "label", geo: { x: 40, y: y0 + 20 }, text: "empty graph", cls: "empty-note" });
    l.w = W + 24;
    l.h = Math.max(y0 + H, tagY) + 6;
    return l;
  }

  function layGrid(v, s) {
    const l = newL();
    const cells = (v.cells || []).filter(Array.isArray), rows = cells.length, cols = Math.max(0, ...cells.map((r) => r.length));
    const C = Math.max(34, tw(s.maxText, 13) + 14), GAP = 3, step = C + GAP;
    const rl = v.rowLabels ? Math.max(18, tw(s.rowLab, 11) + 12) : 0, cl = v.colLabels ? 18 : 0;
    const y0 = title(l, v), x0 = rl, top = y0 + cl;
    (v.colLabels || []).forEach((t, c) => put(l, { key: "cl" + c, p: "label", geo: { x: x0 + c * step + C / 2, y: y0 + 7 }, text: show(t), cls: "grid-label" }));
    (v.rowLabels || []).forEach((t, r) => put(l, { key: "rl" + r, p: "label", geo: { x: rl - 7, y: top + r * step + C / 2 }, text: show(t), cls: "grid-label", anchor: "end" }));
    cells.forEach((row, r) => row.forEach((val, c) => {
      const k = `${r},${c}`;
      const cell = put(l, { key: "c" + k, p: "tile", geo: { x: x0 + c * step, y: top + r * step, w: C, h: C }, text: show(val), mark: markIn(v.marks, k), fs: 13, rx: 5, cls: "cell" });
      anchor(l, k, cell, show(val));
    }));
    const centre = (k) => { const [r, c] = String(k).split(",").map(Number); return [x0 + c * step + C / 2, top + r * step + C / 2]; };
    (v.arrows || []).forEach((a) => {
      if (!Array.isArray(a) || !l.anchors[String(a[0])] || !l.anchors[String(a[1])]) return;
      const [x1, y1] = centre(a[0]), [x2, y2] = centre(a[1]);
      const diag = x1 !== x2 && y1 !== y2;
      put(l, { key: `a:${a[0]}>${a[1]}`, p: "edge", geo: link(x1, y1, x2, y2, 11, 13, diag ? 6 : 0), arrow: true, mark: "in", cls: "dep", layer: 2 });
    });
    if (!rows) put(l, { key: "empty", p: "label", geo: { x: 40, y: top + 12 }, text: "empty", cls: "empty-note" });
    l.w = Math.max(60, x0 + cols * step - GAP);
    l.h = top + rows * step + 4;
    return l;
  }

  function niceStep(span) {
    const raw = span / 10, p = 10 ** Math.floor(Math.log10(raw || 1));
    return [1, 2, 5, 10].map((m) => m * p).find((x) => x >= raw) || p * 10;
  }
  function layIntervals(v, s) {
    const l = newL();
    const ax = Array.isArray(v.axis) ? v.axis : [0, 10];
    const mn = num(ax[0], 0), mx = num(ax[1], mn + 10), span = mx - mn || 1, W = 640, sc = W / span, LH = 32;
    const y0 = title(l, v) + 8 + (s.hasCursor ? 26 : 0);      // the cursor pill gets its own band under the title
    const ay = y0 + s.lanes * LH + 4;
    const X = (t) => (t - mn) * sc;
    (v.items || []).forEach((it, i) => {
      if (!it || it.id === undefined) return;
      const lane = Number.isInteger(it.lane) ? it.lane : i;
      const x = X(num(it.start, mn)), w = Math.max(8, X(num(it.end, mn)) - x);
      const text = show(it.label !== undefined ? it.label : `[${show(it.start)},${show(it.end)}]`);
      const bar = put(l, { key: "iv:" + it.id, p: "tile", geo: { x, y: y0 + lane * LH, w, h: 24 }, text, mark: markIn(v.marks, it.id), fs: 12, rx: 6,
        cls: "ivl", textOut: tw(text, 12) + 8 > w });
      anchor(l, it.id, bar, text);
    });
    put(l, { key: "axis", p: "line", geo: { x1: -4, y1: ay, x2: W + 4, y2: ay }, cls: "axis" });
    const st = niceStep(span);
    for (let t = Math.ceil(mn / st) * st, k = 0; t <= mx + 1e-9 && k < 40; t += st, k++) {
      put(l, { key: "tk" + k, p: "line", geo: { x1: X(t), y1: ay, x2: X(t), y2: ay + 5 }, cls: "axis" });
      put(l, { key: "tl" + k, p: "label", geo: { x: X(t), y: ay + 14 }, text: show(+t.toFixed(6)), cls: "idx" });
    }
    if (typeof v.cursor === "number") {
      const cx = Math.max(-4, Math.min(W + 4, X(v.cursor)));
      put(l, { key: "cur", p: "line", geo: { x1: cx, y1: y0 - 8, x2: cx, y2: ay }, cls: "cursor" });
      put(l, { key: "curl", p: "pill", geo: { x: cx, y: y0 - 18 }, text: "x = " + show(v.cursor), cls: "cursor-tag" });
    }
    l.w = W + 30;
    l.h = ay + 24;
    return l;
  }

  function layBits(v, s) {
    const l = newL();
    const wd = Math.max(1, Math.min(32, Number.isInteger(v.width) ? v.width : 8)), val = Math.max(0, Math.floor(num(v.value, 0)));
    const C = 32, step = 36;
    const X = (i) => (wd - 1 - i) * step + (Math.floor((wd - 1) / 4) - Math.floor(i / 4)) * 8;
    const y0 = title(l, v) + 14;
    for (let i = 0; i < wd; i++) {
      const bit = Math.floor(val / 2 ** i) % 2;
      put(l, { key: "ix" + i, p: "label", geo: { x: X(i) + C / 2, y: y0 - 8 }, text: String(i), cls: "idx" });
      const tile = put(l, { key: "b" + i, p: "tile", geo: { x: X(i), y: y0, w: C, h: C + 4 }, text: String(bit), mark: markIn(v.marks, i), fs: 15, rx: 6, cls: bit ? "one" : "zero" });
      anchor(l, i, tile, String(bit));
    }
    const right = X(0) + C;
    put(l, { key: "val", p: "label", geo: { x: right + 14, y: y0 + C / 2 + 2 }, text: "= " + show(val), cls: "bits-val", anchor: "start" });
    l.w = right + 26 + tw("= " + "9".repeat(s.maxText), 15);
    l.h = y0 + C + 12;
    return l;
  }

  function layCalc(v, s) {
    const l = newL();
    const label = show(v.label !== undefined ? v.label : v.id);
    const w = Math.max(120, tw("9".repeat(s.maxText), 22) + 40, tw(label, 10.5) + 30), h = 64;
    const card = put(l, { key: "card", p: "calc", geo: { x: 0, y: 0, w, h }, text: show(v.value), label });
    l.anchors["*"] = { x: 0, y: 0, w, h, text: show(v.value), ek: card.key };
    l.w = w; l.h = h + 4;
    return l;
  }

  const LAYOUTS = { array: layArray, string: layArray, bars: layArray, map: layMap, stack: layStack, callstack: layStack,
    queue: layQueue, deque: layQueue, heap: layHeap, list: layList, tree: layTreeish, forest: layTreeish, trie: layTreeish,
    graph: layGraph, grid: layGrid, intervals: layIntervals, bits: layBits, calc: layCalc };
  const POSITIONAL = new Set(["stack", "queue", "deque", "heap", "callstack"]);
  const posValues = (v) => (v.type === "heap" ? v.values : v.type === "callstack" ? v.frames : v.items) || [];

  function layoutView(v, s) {
    const fn = LAYOUTS[v && v.type];
    if (!fn) {
      const l = newL();
      put(l, { key: "bad", p: "label", geo: { x: 0, y: 12 }, text: `unknown view type "${v && v.type}"`, cls: "view-error", anchor: "start" });
      l.w = 300; l.h = 24; l.error = true;
      return l;
    }
    const l = fn(v, s);
    if (l.titleW) l.w = Math.max(l.w, l.titleW);
    return l;
  }

  // Vertical extent of what a view really draws in one frame, in its own units.
  function extentOf(L) {
    let top = Infinity, bottom = -Infinity;
    const span = (a, b) => { top = Math.min(top, a); bottom = Math.max(bottom, b); };
    L.items.forEach((it) => {
      const g = it.geo;
      switch (it.p) {
        case "tile": case "row": case "calc": case "rect": if (g.h > 0) span(g.y, g.y + g.h); break;
        case "label": span(g.y - 8, g.y + 8 + TITLE_LH * ((it.lines || [1]).length - 1)); break;
        case "pill": span(g.y - 10, g.y + 10); break;
        case "pointer": span(g.y, g.y + 25); break;
        case "bracket": span(g.y - 14, g.y + 7); break;
        case "edge": { const m = (g.y1 + 2 * g.cy + g.y2) / 4; span(Math.min(g.y1, g.y2, m), Math.max(g.y1, g.y2, m)); break; }
        case "line": span(Math.min(g.y1, g.y2), Math.max(g.y1, g.y2)); break;
        default: break;
      }
    });
    if (!isFinite(top)) return { top: 0, bottom: L.h };
    return { top: Math.max(0, top - 2), bottom: Math.min(L.h, bottom + 4) };
  }
  // Containers whose drawn height follows their item count. Each frame packs them by what they
  // really draw, so an empty heap or a short stack does not leave a tall blank band.
  const PACKED = new Set(["stack", "callstack", "heap"]);

  // Lays out every frame of a run. Each view id gets one fixed slot (its largest size over the
  // run), so nothing jumps between frames. Rows stack the views (consecutive calc cards share a
  // row); "cols" puts them side by side. Wide rows scale down to fit 1000 units.
  const PAD = 24, VGAP = 22, HGAP = 34, MAXW = 1000;
  function layoutRun(frames) {
    const S = computeStats(frames);
    const errors = [];
    const per = frames.map((f, fi) => (f.views || []).filter((v) => v && v.id).map((v) => {
      let L;
      try { L = layoutView(v, S[v.id]); } catch (e) {
        errors.push(`frame ${fi + 1} view "${v.id}": ${e.message}`);
        L = newL(); put(L, { key: "bad", p: "label", geo: { x: 0, y: 12 }, text: `could not draw "${v.id}": ${e.message}`, cls: "view-error", anchor: "start" });
        L.w = 420; L.h = 24; L.error = true;
      }
      if (L.error && !errors.length) errors.push(`frame ${fi + 1} view "${v.id}" (${v.type}) could not be drawn`);
      L.id = v.id; L.type = v.type;
      return L;
    }));
    const size = {}, order = [];
    per.forEach((vs) => vs.forEach((L) => {
      if (!size[L.id]) { size[L.id] = { w: 0, h: 0, type: L.type }; order.push(L.id); }
      size[L.id].w = Math.max(size[L.id].w, L.w); size[L.id].h = Math.max(size[L.id].h, L.h);
    }));
    const cols = (frames.find((f) => f.layout) || {}).layout === "cols";
    const rows = [];
    order.forEach((id) => {
      const last = rows[rows.length - 1];
      if (cols && last) last.push(id);
      else if (last && size[id].type === "calc" && last.every((x) => size[x].type === "calc")) last.push(id);
      else rows.push([id]);
    });
    const slot = {};
    let contentW = 0;
    const fitted = rows.map((ids) => {
      const rw = ids.reduce((a, id) => a + size[id].w, 0) + HGAP * (ids.length - 1);
      const sc = Math.min(1, (MAXW - 2 * PAD) / Math.max(1, rw));
      contentW = Math.max(contentW, rw * sc);
      return { ids, rw, sc, rh: Math.max(...ids.map((id) => size[id].h)) * sc };
    });
    const W = Math.round(Math.max(600, Math.min(MAXW, contentW + 2 * PAD)));
    let y = PAD;
    fitted.forEach(({ ids, rw, sc, rh }) => {
      let x = (W - rw * sc) / 2;
      ids.forEach((id) => { slot[id] = { x, y, s: sc, w: size[id].w * sc, h: size[id].h * sc }; x += (size[id].w + HGAP) * sc; });
      y += rh + VGAP;
    });
    // Per-frame slots: same x, scale and width as the run slot; rows are packed from the top by
    // the height each view needs in that frame. Only PACKED containers change height between
    // frames, so other views move only when a heap or stack above them grows or shrinks.
    let H = 120;
    const frameSlots = per.map((vs) => {
      const here = {}, fs = {};
      vs.forEach((L) => { here[L.id] = PACKED.has(L.type) ? extentOf(L) : { top: 0, bottom: size[L.id].h }; });
      let fy = PAD;
      fitted.forEach(({ ids, sc }) => {
        const present = ids.filter((id) => here[id]);
        if (!present.length) return;
        const top = Math.min(...present.map((id) => here[id].top)), bottom = Math.max(...present.map((id) => here[id].bottom));
        present.forEach((id) => { fs[id] = Object.assign({}, slot[id], { y: fy - top * sc, h: (here[id].bottom - here[id].top) * sc }); });
        fy += (bottom - top) * sc + VGAP;
      });
      H = Math.max(H, Math.round(fy - VGAP + PAD));
      return fs;
    });
    const used = new Set();
    frames.forEach((f) => {
      (f.views || []).forEach((v) => {
        if (!v) return;
        [v.marks, v.edgeMarks].forEach((m) => m && typeof m === "object" && Object.values(m).forEach((x) => mk(x) && used.add(x)));
        (v.ranges || []).forEach((r) => r && r.from <= r.to && used.add(mk(r.mark) || "good"));
        if (v.type === "grid" && (v.arrows || []).some(Array.isArray)) used.add("in");     // dependency arrows draw in the `in` colour
      });
      (f.moves || []).forEach((m) => m && used.add(mk(m.mark) || "new"));
    });
    return { frames: per.map((vs, fi) => vs.map((L) => Object.assign(L, { slot: frameSlots[fi][L.id] || slot[L.id] }))), W, H, slot,
      marks: MARKS.filter((m) => used.has(m)), errors, stats: S };
  }

  // Anchor of a move key in one laid-out frame, in stage coordinates.
  function findAnchor(frameLayout, ref) {
    if (!frameLayout || !Array.isArray(ref)) return null;
    const L = frameLayout.find((x) => x.id === ref[0]);
    if (!L) return null;
    const a = L.type === "calc" ? L.anchors["*"] : L.anchors[String(ref[1])];
    if (!a) return null;
    const sl = L.slot;
    return { x: sl.x + a.x * sl.s, y: sl.y + a.y * sl.s, w: a.w * sl.s, h: a.h * sl.s, s: sl.s, text: a.text, ek: a.ek, view: L.id };
  }

  // ---------- C++ syntax colouring (returns HTML, input escaped) ----------
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const KW = new Set(("if else for while do return break continue switch case default class struct public private protected " +
    "const constexpr static inline virtual override new delete nullptr true false this using namespace template typename " +
    "sizeof operator try catch throw noexcept enum mutable explicit friend goto").split(" "));
  const TYPES = new Set(("int long short char bool void double float unsigned signed auto size_t string vector unordered_map " +
    "unordered_set map set multiset multimap pair queue stack deque priority_queue list array tuple greater less function " +
    "int64_t int32_t uint32_t uint64_t optional std ListNode TreeNode Node TrieNode LRUCache MedianFinder Trie").split(" "));
  function highlightLine(line) {
    const re = /(\/\/.*$)|(\/\*.*?\*\/)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(#\s*\w+)|(\b\d[\w.]*\b)|([A-Za-z_]\w*)|([\s\S])/g;
    let out = "", m;
    while ((m = re.exec(line))) {
      const [tok, com, com2, s1, s2, pre, nm, id] = m;
      if (com || com2) out += `<span class="tk-com">${esc(tok)}</span>`;
      else if (s1 || s2) out += `<span class="tk-str">${esc(tok)}</span>`;
      else if (pre) out += `<span class="tk-kw">${esc(tok)}</span>`;
      else if (nm) out += `<span class="tk-num">${esc(tok)}</span>`;
      else if (id) {
        if (KW.has(id)) out += `<span class="tk-kw">${id}</span>`;
        else if (TYPES.has(id)) out += `<span class="tk-type">${id}</span>`;
        else if (/^\s*\(/.test(line.slice(re.lastIndex))) out += `<span class="tk-fn">${id}</span>`;
        else out += id;
      } else out += esc(tok);
    }
    return out;
  }
  const highlight = (lines) => (lines || []).map((l) => highlightLine(String(l)));

  const core = { MARKS, MARK_LABEL, MAX_FRAMES, record, computeStats, layoutRun, layoutView, findAnchor, highlight, show, showAnswer, esc };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof document === "undefined") { root.CIL_ENGINE = core; return; }

  // ======================= DOM half: renderer and player =======================
  const SVGNS = "http://www.w3.org/2000/svg";
  const sv = (tag, attrs, parent) => {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const f1 = (x) => Math.round(x * 10) / 10;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const setR = (r, x, y, w, h, rx) => { r.setAttribute("x", f1(x)); r.setAttribute("y", f1(y)); r.setAttribute("width", f1(Math.max(0, w))); r.setAttribute("height", f1(Math.max(0, h))); r.setAttribute("rx", f1(rx)); };
  const cls = (base, it) => [base, it.cls || "", it.mark ? "m-" + it.mark : ""].join(" ").replace(/\s+/g, " ").trim();
  // requestAnimationFrame with a timer fallback, so tweens finish in background tabs and headless runs.
  const nextFrame = (fn) => {
    let done = false, a = 0, b = 0;
    const go = () => { if (done) return; done = true; cancelAnimationFrame(a); clearTimeout(b); fn(performance.now()); };
    a = requestAnimationFrame(go); b = setTimeout(go, 40);
    return () => { done = true; cancelAnimationFrame(a); clearTimeout(b); };
  };
  const reduceMQ = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  // Each primitive: layer (0 back, 1 middle, 2 front), build (create children once),
  // apply (geometry, called every tween tick), paint (classes and text).
  const PRIM = {
    tile: {
      layer: 1,
      build(e) {
        e.inner = sv("g", { class: "pop" }, e.g);
        e.sh = sv("rect", { class: "t-sh" }, e.inner);
        e.bx = sv("rect", { class: "t-bx" }, e.inner);
        e.ring = sv("rect", { class: "t-ring" }, e.inner);
        e.gl = sv("path", { class: "t-gl" }, e.inner);
        e.tx = sv("text", { class: "t-tx" }, e.inner);
      },
      apply(e, q) {
        const w = q.w, h = q.h, rx = Math.min(e.it.rx !== undefined ? e.it.rx : 8, h / 2, w / 2), off = h < 30 ? 2.5 : 3.5;
        e.g.setAttribute("transform", `translate(${f1(q.x)},${f1(q.y)})`);
        setR(e.sh, off, off, w, h, rx);
        setR(e.bx, 0, 0, w, h, rx);
        setR(e.ring, 4, 4, w - 8, h - 8, Math.max(0, rx - 4));
        e.gl.setAttribute("d", h < 18 || w < 14 ? "" : `M${f1(Math.max(rx, 5) + 1)},4.5 H${f1(w - Math.max(rx, 5) - 1)}`);
        e.tx.setAttribute("x", f1(e.it.textOut ? w + 6 : w / 2));
        e.tx.setAttribute("y", f1(h / 2 + 1));
      },
      paint(e, it) {
        e.g.setAttribute("class", cls("tile", it));
        e.tx.textContent = it.text;
        e.tx.setAttribute("font-size", it.fs || 16);
        e.tx.setAttribute("text-anchor", it.textOut ? "start" : "middle");
        e.tx.classList.toggle("out", !!it.textOut);
      },
    },
    row: {
      layer: 1,
      build(e) {
        e.inner = sv("g", { class: "pop" }, e.g);
        e.sh = sv("rect", { class: "t-sh" }, e.inner);
        e.bx = sv("rect", { class: "t-bx" }, e.inner);
        e.sep = sv("line", { class: "r-sep" }, e.inner);
        e.kt = sv("text", { class: "r-key" }, e.inner);
        e.vt = sv("text", { class: "r-val" }, e.inner);
      },
      apply(e, q) {
        e.g.setAttribute("transform", `translate(${f1(q.x)},${f1(q.y)})`);
        setR(e.sh, 2.5, 2.5, q.w, q.h, 6); setR(e.bx, 0, 0, q.w, q.h, 6);
        const kw = Math.min(q.kw, q.w);
        ["x1", "x2"].forEach((a) => e.sep.setAttribute(a, f1(kw)));
        e.sep.setAttribute("y1", 4); e.sep.setAttribute("y2", f1(q.h - 4));
        e.sep.style.display = kw >= q.w ? "none" : "";
        e.kt.setAttribute("x", f1(kw / 2)); e.kt.setAttribute("y", f1(q.h / 2 + 1));
        e.vt.setAttribute("x", f1(kw + (q.w - kw) / 2)); e.vt.setAttribute("y", f1(q.h / 2 + 1));
      },
      paint(e, it) { e.g.setAttribute("class", cls("row", it)); e.kt.textContent = it.text; e.vt.textContent = it.text2; },
    },
    calc: {
      layer: 1,
      build(e) {
        e.inner = sv("g", { class: "pop" }, e.g);
        e.sh = sv("rect", { class: "t-sh" }, e.inner);
        e.bx = sv("rect", { class: "t-bx" }, e.inner);
        e.lb = sv("text", { class: "c-label" }, e.inner);
        e.vt = sv("text", { class: "c-val" }, e.inner);
      },
      apply(e, q) {
        e.g.setAttribute("transform", `translate(${f1(q.x)},${f1(q.y)})`);
        setR(e.sh, 4, 4, q.w, q.h, 12); setR(e.bx, 0, 0, q.w, q.h, 12);
        e.lb.setAttribute("x", f1(q.w / 2)); e.lb.setAttribute("y", 17);
        e.vt.setAttribute("x", f1(q.w / 2)); e.vt.setAttribute("y", f1(q.h / 2 + 10));
      },
      paint(e, it) { e.g.setAttribute("class", cls("calc", it)); e.lb.textContent = it.label; e.vt.textContent = it.text; },
    },
    rect: {
      layer: 0,
      build(e) { e.r = sv("rect", {}, e.g); },
      apply(e, q) { setR(e.r, q.x, q.y, q.w, q.h, Math.min(4, q.h / 2)); },
      paint(e, it) { e.g.setAttribute("class", cls("shape", it)); },
    },
    line: {
      layer: 0,
      build(e) { e.l = sv("line", {}, e.g); },
      apply(e, q) { ["x1", "y1", "x2", "y2"].forEach((k) => e.l.setAttribute(k, f1(q[k]))); },
      paint(e, it) { e.g.setAttribute("class", cls("ln", it)); },
    },
    label: {
      layer: 2,
      build(e) { e.t = sv("text", {}, e.g); },
      apply(e, q) {
        e.t.setAttribute("x", f1(q.x)); e.t.setAttribute("y", f1(q.y));
        for (const ts of e.t.children) ts.setAttribute("x", f1(q.x));
      },
      paint(e, it) {
        e.g.setAttribute("class", cls("lbl", it));
        e.t.textContent = "";
        if (it.lines) {                                   // a wrapped view title: one tspan a line
          const x = f1((e.cur || it.geo).x);
          it.lines.forEach((s, i) => { const ts = sv("tspan", { x, dy: i ? 14 : 0 }, e.t); ts.textContent = s; });
        } else e.t.textContent = it.text;
        e.t.setAttribute("text-anchor", it.anchor || "middle");
      },
    },
    pill: {
      layer: 2,
      build(e) { e.sh = sv("rect", { class: "p-sh" }, e.g); e.bx = sv("rect", { class: "p-bx" }, e.g); e.t = sv("text", {}, e.g); },
      apply(e, q) { e.g.setAttribute("transform", `translate(${f1(q.x)},${f1(q.y)})`); },
      paint(e, it) {
        e.g.setAttribute("class", cls("pill-chip", it));
        e.t.textContent = it.text;
        const w = tw(it.text, 11) + 14, h = 19;
        setR(e.sh, -w / 2 + 2, -h / 2 + 2, w, h, h / 2); setR(e.bx, -w / 2, -h / 2, w, h, h / 2);
        e.t.setAttribute("y", 1);
      },
    },
    pointer: {
      layer: 2,
      build(e) { e.tri = sv("path", { class: "ptr-tri", d: "M0,0 l-6.5,10 h13 z" }, e.g); e.bx = sv("rect", { class: "p-bx" }, e.g); e.t = sv("text", {}, e.g); },
      apply(e, q) { e.g.setAttribute("transform", `translate(${f1(q.x)},${f1(q.y)})`); },
      paint(e, it) {
        e.g.setAttribute("class", cls("pointer", it));
        e.t.textContent = it.text;
        const w = tw(it.text, 11) + 12;
        setR(e.bx, -w / 2, 10, w, 15, 7.5);
        e.t.setAttribute("y", 18.5);
      },
    },
    bracket: {
      layer: 2,
      build(e) { e.pa = sv("path", {}, e.g); e.t = sv("text", {}, e.g); },
      apply(e, q) {
        e.pa.setAttribute("d", `M${f1(q.x1 + 1)},${f1(q.y + 7)} V${f1(q.y)} H${f1(q.x2 - 1)} V${f1(q.y + 7)}`);
        e.t.setAttribute("x", f1((q.x1 + q.x2) / 2)); e.t.setAttribute("y", f1(q.y - 5));
      },
      paint(e, it) { e.g.setAttribute("class", cls("bracket", it)); e.t.textContent = it.text; },
    },
    edge: {
      layer: 0,
      build(e) { e.pa = sv("path", {}, e.g); },
      apply(e, q) { e.pa.setAttribute("d", `M${f1(q.x1)},${f1(q.y1)} Q${f1(q.cx)},${f1(q.cy)} ${f1(q.x2)},${f1(q.y2)}`); },
      paint(e, it) {
        e.g.setAttribute("class", cls("edge", it));
        if (it.arrow && !e.drawing) e.pa.setAttribute("marker-end", `url(#${e.uid}-ar-${it.mark || "base"})`);
        else if (!it.arrow) e.pa.removeAttribute("marker-end");
      },
    },
  };
  const textKey = (it) => (it.p === "row" ? it.text + "|" + it.text2 : it.text);

  const ICON = {
    replay: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5l12 7-12 7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3Z"/></svg>',
    code: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/></svg>',
  };
  const PLAY = ICON.play + "Autoplay", PAUSE = ICON.pause + "Pause";
  const HINT = {
    string: "any text, taken exactly as typed", int: "a whole number, e.g. -12", num: "a number, e.g. 2.5",
    ints: "2,7,11,15 or [2, 7, 11, 15]", strings: 'eat,tea,"tan" or ["eat","tea"]', intGrid: "rows split by ; e.g. 1,1,0;0,1,1",
    charGrid: "rows split by ; e.g. ABCE;SFCS", tuples: "1,3;2,6;8,10 or [[1,3],[2,6]]", ops: "put(1,1) get(1) put(3,3)",
  };
  // Frame titles are shown as plain text, never as markup. An inert <template> parses the HTML
  // (scripts do not run and images do not load inside it), and textContent also decodes the
  // entities that patterns write with esc(). Use the result only with textContent or esc().
  const titleTpl = document.createElement("template");
  function plain(h) {
    if (h === undefined || h === null || h === "") return "";
    titleTpl.innerHTML = String(h);
    const t = titleTpl.content.textContent.replace(/\s+/g, " ").trim();
    titleTpl.innerHTML = "";
    return t;
  }

  function template(stageOnly) {
    return `
    <div class="trace${stageOnly ? " stage-only" : ""}">
      <div class="trace-main">
        <div class="stage-wrap">
          <div class="stage-bar">
            <div class="vars" aria-label="Variables"></div>
            <div class="stage-buttons">
              <button class="btn b-replay" title="Replay this step (R)">${ICON.replay}Replay</button>
              <button class="btn b-auto" title="Autoplay (A)">${PLAY}</button>
              <select class="btn b-speed" title="Animation speed" aria-label="Animation speed">
                <option value="0.6">0.6×</option><option value="1" selected>1×</option><option value="1.8">1.8×</option>
              </select>
            </div>
          </div>
          <svg class="stage" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMin meet" role="img" aria-label="Algorithm trace"></svg>
          <div class="stage-msg" hidden></div>
          <div class="legend"></div>
        </div>
        <div class="trace-timeline">
          <div class="timeline-head"><b>STEPS</b><span class="muted tl-count"></span></div>
          <ol class="timeline"></ol>
          <div class="timeline-more" hidden></div>
        </div>
        <div class="try-card">
          <div class="try-head"><b>${ICON.edit}TRY YOUR OWN INPUT</b><span class="chip try-custom" hidden>your input</span></div>
          <div class="try-fields"></div>
          <div class="try-msg" hidden></div>
          <div class="try-actions"><button class="btn primary b-run">Run this input</button><button class="btn b-reset">Reset to the example</button><span class="muted try-note">Enter runs it. Keep inputs small: a long run shows its first 40 steps and its last one.</span></div>
        </div>
      </div>
      <div class="trace-side">
        <div class="step-card">
          <div class="step-head"><b class="step-count"></b><span class="pill purple line-pill"></span></div>
          <h2 class="step-title"></h2>
          <div class="caption" aria-live="polite"></div>
          <div class="key-idea tip" hidden>${ICON.bulb}<div><div class="key-label">GOOD TO KNOW</div><p class="tip-text"></p></div></div>
          <div class="answer" hidden></div>
          <div class="step-nav"><button class="btn b-prev">← Back</button><button class="btn primary b-next"></button></div>
          <div class="hints"><kbd>←</kbd><kbd>→</kbd> step · <kbd>R</kbd> replay · <kbd>A</kbd> autoplay</div>
        </div>
        <div class="code-panel">
          <div class="code-head"><span>${ICON.code}C++17</span><span class="code-where"></span></div>
          <div class="code-body"></div>
        </div>
      </div>
    </div>`;
  }

  let instances = 0;
  function mountTrace(container, demo, opts) {
    opts = opts || {};
    const uid = "cil" + (++instances);
    const reduce = opts.reduceMotion !== undefined ? !!opts.reduceMotion : reduceMQ.matches;
    container.innerHTML = template(!!opts.stageOnly);
    const q = (c) => container.querySelector("." + c);
    const ui = {
      stage: q("stage"), vars: q("vars"), legend: q("legend"), msg: q("stage-msg"), replay: q("b-replay"), auto: q("b-auto"),
      speed: q("b-speed"), timeline: q("timeline"), tlCount: q("tl-count"), tlMore: q("timeline-more"), stepCount: q("step-count"),
      linePill: q("line-pill"), title: q("step-title"), caption: q("caption"), tip: q("tip"), tipText: q("tip-text"),
      answer: q("answer"), prev: q("b-prev"), next: q("b-next"), codeBody: q("code-body"), codeWhere: q("code-where"),
      tryFields: q("try-fields"), tryMsg: q("try-msg"), tryCustom: q("try-custom"), run: q("b-run"), reset: q("b-reset"),
    };
    const fields = Array.isArray(demo.fields) ? demo.fields : [];
    const defaults = {};
    fields.forEach((f) => { defaults[f.key] = f.value; });
    const storeKey = opts.patternId ? `${opts.patternId}/${demo.id}` : null;

    let run = null, lay = null, cur = -1, autoplay = false, autoTimer = 0, busyUntil = 0, texts = defaults, layers = {}, viewG = {}, flightLayer = null;
    let raf = 0, uidSeq = 0, destroyed = false;
    const els = new Map(), dying = new Map(), tweens = new Set(), flights = new Set();
    let uidState = {};
    const speed = () => parseFloat(ui.speed.value) || 1;
    const count = () => (run ? run.frames.length : 0);

    // ---------- tweening ----------
    function tick(now) {
      raf = 0;
      tweens.forEach((e) => {
        const t = Math.min(1, (now - e.t0) / e.dur), k = ease(Math.max(0, t)), g = {};
        for (const key in e.to) g[key] = e.from[key] + (e.to[key] - e.from[key]) * k;
        e.cur = g;
        PRIM[e.p].apply(e, g);
        if (t >= 1) tweens.delete(e);
      });
      if (tweens.size) raf = nextFrame(tick);
    }
    const sameGeo = (a, b) => a && Object.keys(b).every((k) => Math.abs((a[k] || 0) - b[k]) < 0.05);
    function tweenTo(e, geo, dur) {
      if (!dur || sameGeo(e.cur, geo)) { tweens.delete(e); e.cur = Object.assign({}, geo); PRIM[e.p].apply(e, e.cur); return; }
      e.from = Object.assign({}, geo, e.cur); e.to = Object.assign({}, geo); e.t0 = performance.now(); e.dur = dur;
      tweens.add(e);
      if (!raf) raf = nextFrame(tick);
    }
    function restartClass(node, c) { node.classList.remove(c); void node.getBoundingClientRect(); node.classList.add(c); }

    // Connectors that appear draw themselves from source to target; the arrowhead lands last.
    function drawIn(e, delay) {
      const pa = e.pa, len = pa.getTotalLength ? pa.getTotalLength() : 0, dur = 620 / speed();
      if (!len) return;
      clearTimeout(e.drawTimer);
      e.drawing = true;
      pa.removeAttribute("marker-end");
      pa.style.transition = "none";
      pa.style.strokeDasharray = `${len} ${len}`;
      pa.style.strokeDashoffset = len;
      void pa.getBoundingClientRect();
      pa.style.transition = `stroke-dashoffset ${dur}ms ease ${delay}ms`;
      pa.style.strokeDashoffset = 0;
      e.drawTimer = setTimeout(() => {
        e.drawing = false;
        pa.style.transition = ""; pa.style.strokeDasharray = ""; pa.style.strokeDashoffset = "";
        PRIM.edge.paint(e, e.it);
      }, dur + delay + 30);
    }

    // ---------- stage ----------
    // A view's place on the stage (CSS transform on the SVG group, so it can glide when a heap or
    // stack above it changes height between frames).
    const viewTransform = (sl) => `translate(${f1(sl.x)}px, ${f1(sl.y)}px) scale(${sl.s.toFixed(4)})`;
    function placeViews(L, D) {
      L.forEach((vl) => {
        const g = viewG[vl.id];
        if (!g || !vl.slot) return;
        const tr = viewTransform(vl.slot);
        if (g.lastTr === tr) return;
        g.style.transition = D && g.lastTr ? `transform ${Math.round(D)}ms cubic-bezier(.65, 0, .35, 1)` : "none";
        g.style.transform = tr;
        g.lastTr = tr;
      });
    }
    function clearStage() {
      tweens.clear(); killFlights();
      els.forEach((e) => clearTimeout(e.drawTimer));
      dying.forEach((e) => clearTimeout(e.timer));
      els.clear(); dying.clear(); uidState = {};
      ui.stage.innerHTML = "";
    }
    function buildStage() {
      clearStage();
      ui.stage.setAttribute("viewBox", `0 0 ${lay.W} ${lay.H}`);
      ui.stage.style.maxWidth = Math.round(lay.W * 1.12) + "px";   // small scenes do not blow up
      const defs = sv("defs", {}, ui.stage);
      ["base"].concat(MARKS).forEach((m) => {
        const mm = sv("marker", { id: `${uid}-ar-${m}`, viewBox: "0 0 10 10", refX: 7.5, refY: 5, markerWidth: 5, markerHeight: 5, orient: "auto-start-reverse", markerUnits: "strokeWidth" }, defs);
        sv("path", { d: "M0,1 L9,5 L0,9 z", class: "ar ar-" + m }, mm);
      });
      layers = {}; viewG = {};
      Object.entries(lay.slot).forEach(([id, sl]) => {
        const g = sv("g", { class: "view", "data-view": id }, ui.stage);
        g.style.transform = viewTransform(sl);
        viewG[id] = g;
        layers[id] = [sv("g", { class: "l-back" }, g), sv("g", { class: "l-mid" }, g), sv("g", { class: "l-front" }, g)];
      });
      flightLayer = sv("g", { class: "flights" }, ui.stage);
      ui.legend.innerHTML = lay.marks.map((m) => `<span><i class="lg m-${m}"></i>${MARK_LABEL[m]}</span>`).join("");
      ui.legend.hidden = !lay.marks.length;
    }

    // Positional containers (stack, queue, deque, heap, callstack) are keyed by index in the data.
    // To make a dequeued item slide left (or a heap swap trade places) the renderer gives each
    // item a stable identity by matching values against what is on screen now.
    function resolveUids(fi) {
      const map = {};
      (run.frames[fi].views || []).forEach((v) => {
        if (!v || !POSITIONAL.has(v.type)) return;
        const vals = posValues(v).map(show);
        const st = uidState[v.id] || { vals: [], uids: [] }, ov = st.vals, ou = st.uids;
        const nu = new Array(vals.length), used = new Set();
        let best = 0, bestHits = -1;
        for (let d = -3; d <= 3; d++) {
          let h = 0;
          vals.forEach((x, i) => { if (ov[i + d] === x) h++; });
          if (h > bestHits || (h === bestHits && Math.abs(d) < Math.abs(best))) { best = d; bestHits = h; }
        }
        vals.forEach((x, i) => { const j = i + best; if (ov[j] === x && !used.has(j)) { nu[i] = ou[j]; used.add(j); } });
        vals.forEach((x, i) => {
          if (nu[i] !== undefined) return;
          let bj = -1;
          ov.forEach((y, j) => { if (y === x && !used.has(j) && (bj < 0 || Math.abs(j - i) < Math.abs(bj - i))) bj = j; });
          if (bj >= 0) { nu[i] = ou[bj]; used.add(bj); }
        });
        vals.forEach((x, i) => { if (nu[i] === undefined) nu[i] = ++uidSeq; });
        uidState[v.id] = { vals, uids: nu };
        map[v.id] = nu;
      });
      return map;
    }
    const fullKey = (vid, key, uids) => vid + "|" + (key[0] === "@" ? key.replace(/^@(\d+)/, (_, i) => "#" + ((uids[vid] || [])[+i] !== undefined ? uids[vid][+i] : "x" + i)) : key);

    // Moves this frame, with source/target anchors resolved (source may come from the previous frame).
    function movesOf(fi, uids) {
      const f = run.frames[fi], L = lay.frames[fi], P = fi > 0 ? lay.frames[fi - 1] : null;
      return (Array.isArray(f.moves) ? f.moves.slice(0, 3) : []).map((m) => {
        if (!m) return null;
        const src = findAnchor(L, m.from) || findAnchor(P, m.from), dst = findAnchor(L, m.to);
        return src && dst ? { m, src, dst, key: fullKey(dst.view, dst.ek, uids) } : null;
      }).filter(Boolean);
    }

    // Puts frame fi on the stage. mode "anim" tweens and flies the frame's moves, "back" tweens
    // without moves, "instant" snaps (reduced motion, replay set-up).
    function render(fi, mode) {
      killFlights();
      const animate = !reduce && mode !== "instant", D = animate ? 520 / speed() : 0;
      const uids = resolveUids(fi), L = lay.frames[fi];
      placeViews(L, D);
      const moves = animate && mode === "anim" ? movesOf(fi, uids) : [];
      const targets = new Map(moves.map((mv) => [mv.key, mv]));
      const seen = new Set();
      L.forEach((vl) => {
        const lyr = layers[vl.id];
        if (!lyr) return;
        vl.items.forEach((it) => {
          const key = fullKey(vl.id, it.key, uids);
          if (seen.has(key) || !PRIM[it.p]) return;
          seen.add(key);
          let e = els.get(key), isNew = false;
          if (!e && dying.has(key)) { e = dying.get(key); clearTimeout(e.timer); dying.delete(key); e.g.classList.remove("exit"); els.set(key, e); }
          if (!e) {
            const layer = it.layer !== undefined ? it.layer : it.p === "line" && /cursor/.test(it.cls || "") ? 2 : PRIM[it.p].layer;
            e = { key, p: it.p, uid, g: sv("g", {}, lyr[layer]) };
            e.it = it;
            PRIM[it.p].build(e);
            els.set(key, e);
            isNew = true;
          }
          const before = e.text;
          e.it = it;
          if (isNew) { e.cur = Object.assign({}, it.geo); PRIM[it.p].apply(e, e.cur); } else tweenTo(e, it.geo, D);
          const target = targets.get(key);
          if (target && animate) {
            target.e = e;
            if (isNew) { PRIM[it.p].paint(e, it); e.g.style.opacity = "0"; target.reveal = true; }
            else if (before !== textKey(it)) target.pending = it;   // repaint when the copy lands
            else PRIM[it.p].paint(e, it);
          } else {
            PRIM[it.p].paint(e, it);
            if (animate && isNew) { if (it.p === "edge") drawIn(e, 60 / speed()); else restartClass(e.g, "enter"); }
            else if (animate && before !== undefined && before !== textKey(it) && it.p !== "edge") restartClass(e.g, "bump");
          }
          if (!target || !target.pending) e.text = textKey(it);
        });
      });
      els.forEach((e, key) => {
        if (seen.has(key)) return;
        els.delete(key); tweens.delete(e); clearTimeout(e.drawTimer);
        if (!animate) { e.g.remove(); return; }
        e.g.classList.add("exit");
        dying.set(key, e);
        e.timer = setTimeout(() => { e.g.remove(); dying.delete(key); }, 380);
      });
      busyUntil = performance.now() + D;
      moves.forEach((mv, k) => launch(mv, (90 + k * 150) / speed()));
    }

    // A copy of the source tile flies along a curve to the target, with its label pill riding on
    // top and a dashed trail drawing behind it, like a request hop in System Design Lab.
    function landOn(mv) {
      const e = mv.e;
      if (!e || mv.landed) return;
      mv.landed = true;
      if (mv.reveal) { e.g.style.opacity = ""; restartClass(e.g, "enter"); }
      if (mv.pending) { PRIM[e.p].paint(e, mv.pending); e.text = textKey(mv.pending); restartClass(e.g, "bump"); }
      restartClass(e.g, "land");
    }
    function launch(mv, delay) {
      const { src, dst, m } = mv;
      const w = Math.max(30, Math.min(src.w, 90)), h = Math.max(26, Math.min(src.h, 44));
      const sx = src.x + src.w / 2, sy = src.y + Math.min(src.h / 2, 22), dx = dst.x + dst.w / 2, dy = dst.y + Math.min(dst.h / 2, 22);
      const dist = Math.hypot(dx - sx, dy - sy);
      const cx = (sx + dx) / 2, cy = Math.max(14, Math.min(sy, dy) - Math.min(150, 46 + dist * 0.28));
      const g = sv("g", { class: "flight m-" + (mk(m.mark) || "new") }, flightLayer);
      const trail = sv("path", { class: "flight-trail", d: `M${f1(sx)},${f1(sy)} Q${f1(cx)},${f1(cy)} ${f1(dx)},${f1(dy)}` }, g);
      const tile = sv("g", { class: "flight-tile" }, g);
      const sc = (src.s + dst.s) / 2 || 1;
      setR(sv("rect", { class: "t-sh" }, tile), 3, 3, w, h, 8);
      setR(sv("rect", { class: "t-bx" }, tile), 0, 0, w, h, 8);
      const tt = sv("text", { class: "t-tx", x: f1(w / 2), y: f1(h / 2 + 1), "font-size": 15 }, tile);
      tt.textContent = src.text === undefined ? "" : src.text;
      if (m.label !== undefined && m.label !== null && m.label !== "") {
        const lbl = show(m.label), lw = tw(lbl, 11) + 14;
        const pg = sv("g", { class: "pill-chip flight-pill" }, tile);
        setR(sv("rect", { class: "p-sh" }, pg), w / 2 - lw / 2 + 2, -24, lw, 19, 9.5);
        setR(sv("rect", { class: "p-bx" }, pg), w / 2 - lw / 2, -26, lw, 19, 9.5);
        const pt = sv("text", { x: f1(w / 2), y: -15.5 }, pg);
        pt.textContent = lbl;
      }
      const len = trail.getTotalLength ? trail.getTotalLength() : dist;
      trail.style.strokeDasharray = `${len} ${len}`;
      trail.style.strokeDashoffset = len;
      const F = 780 / speed(), start = performance.now() + delay;
      const fl = { g, mv, done: false };
      flights.add(fl);
      busyUntil = Math.max(busyUntil, start + F + 120);
      const pos = (t) => { const u = 1 - t; return [u * u * sx + 2 * u * t * cx + t * t * dx, u * u * sy + 2 * u * t * cy + t * t * dy]; };
      const place = (t) => {
        const [x, y] = pos(t), k = 1 + 0.14 * Math.sin(Math.PI * t);
        tile.setAttribute("transform", `translate(${f1(x)},${f1(y)}) scale(${(sc * k).toFixed(3)}) translate(${f1(-w / 2)},${f1(-h / 2)})`);
      };
      place(0);
      g.style.opacity = "0";
      function step(now) {
        if (fl.done) return;
        if (now < start) { nextFrame(step); return; }
        g.style.opacity = "";
        const t = Math.min(1, (now - start) / F), p = ease(t);
        place(p);
        trail.style.strokeDashoffset = len * (1 - p);
        if (t < 1) { nextFrame(step); return; }
        fl.done = true;
        landOn(mv);
        g.classList.add("gone");
        setTimeout(() => { g.remove(); flights.delete(fl); }, 320);
      }
      nextFrame(step);
    }
    function killFlights() {
      flights.forEach((fl) => { if (!fl.done) { fl.done = true; landOn(fl.mv); } fl.g.remove(); });
      flights.clear();
    }

    // ---------- chrome: variables, code, caption, timeline ----------
    function buildCode() {
      const raw = Array.isArray(demo.code) ? demo.code : [], lines = highlight(raw);
      // A long line wraps; --hang indents its continuation rows 4 columns past the line's own
      // leading spaces, so a wrapped row reads as a continuation (styles.css .code-body .src).
      ui.codeBody.innerHTML = `<div class="code-hl" hidden></div>` + lines.map((h, i) =>
        `<div class="code-line"><span class="ln">${i + 1}</span><span class="src" style="--hang:${String(raw[i]).match(/^ */)[0].length + 4}">${
          // never wrap inside -> or ::, and keep a comment's // on the row of its first word
          (h || " ").replace(/-&gt;|::/g, (m) => `<span class="nb">${m}</span>`).replace(/\/\/ (?=\S)/g, "//\u00a0")}</span></div>`).join("");
    }
    let hlRange = null;
    function placeHl() {
      const rows = ui.codeBody.querySelectorAll(".code-line"), hl = ui.codeBody.querySelector(".code-hl");
      if (!hlRange || !rows.length) { hl.hidden = true; return; }
      const ra = rows[hlRange[0] - 1], rb = rows[hlRange[1] - 1];
      hl.hidden = false;
      hl.style.top = ra.offsetTop + "px";
      hl.style.height = rb.offsetTop + rb.offsetHeight - ra.offsetTop + "px";      // the whole wrapped line
    }
    function clearCode() {
      ui.codeBody.querySelectorAll(".code-line.cur").forEach((r) => r.classList.remove("cur"));
      hlRange = null; placeHl(); ui.codeWhere.textContent = "";
    }
    function paintCode(f) {
      const rows = ui.codeBody.querySelectorAll(".code-line");
      const ln = (Array.isArray(f.line) ? f.line : [f.line]).map((x) => parseInt(x, 10)).filter((x) => x >= 1 && x <= rows.length);
      rows.forEach((r) => r.classList.remove("cur"));
      if (!ln.length) { clearCode(); return; }
      const a = Math.min(...ln), b = Math.max(...ln);
      for (let k = a; k <= b; k++) rows[k - 1].classList.add("cur");
      const ra = rows[a - 1], rb = rows[b - 1];
      hlRange = [a, b];
      placeHl();
      ui.codeWhere.textContent = a === b ? `line ${a}` : `lines ${a}-${b}`;
      const body = ui.codeBody, top = ra.offsetTop, bottom = rb.offsetTop + rb.offsetHeight;
      if (top < body.scrollTop + 6 || bottom > body.scrollTop + body.clientHeight - 6) {
        const y = Math.max(0, top - body.clientHeight / 3);
        if (body.scrollTo) body.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" }); else body.scrollTop = y;
      }
    }
    function paintVars(i) {
      const v = run.frames[i].vars || {}, pv = i > 0 ? run.frames[i - 1].vars || {} : null;
      ui.vars.innerHTML = Object.keys(v).map((k) => {
        const added = pv && !Object.prototype.hasOwnProperty.call(pv, k), changed = pv && !added && pv[k] !== v[k];
        return `<div class="metric${changed ? " changed fresh" : added ? " added fresh" : ""}"><span>${esc(k)}</span><b>${esc(show(v[k]))}</b></div>`;
      }).join("");
    }
    const steps = (n) => `${n} more step${n === 1 ? "" : "s"}`;
    function buildTimeline() {
      const fr = run.frames, gapAt = run.finalAppended && run.truncated ? fr.length - 1 : -1;
      ui.timeline.innerHTML = fr.map((f, i) => {
        const t = esc(plain(f.title));
        const gap = i === gapAt ? `<li class="tl-gap"><span class="tl-dots">…</span><span class="tl-label">… and ${steps(run.truncated)} not shown</span></li>` : "";
        return `${gap}<li class="tl-step"><button data-step="${i}" title="${t}">${i + 1}</button><span class="tl-label">${t}</span></li>`;
      }).join("");
      ui.tlMore.hidden = !run.truncated || gapAt >= 0;
      ui.tlMore.textContent = run.truncated && gapAt < 0 ? `… and ${steps(run.truncated)} not shown. The trace keeps the first ${MAX_FRAMES}.` : "";
      fadeTimeline();
    }
    // Fade whichever edge of the timeline has more steps scrolled out of view, so a label cut by
    // the edge reads as "more this way" instead of a word cut in half.
    function fadeTimeline() {
      const ol = ui.timeline, max = ol.scrollWidth - ol.clientWidth;
      ol.classList.toggle("fade-l", ol.scrollLeft > 2);
      ol.classList.toggle("fade-r", max > 2 && ol.scrollLeft < max - 2);
    }
    function paintTimeline(i) {
      const items = ui.timeline.querySelectorAll("li.tl-step"), gap = ui.timeline.querySelector("li.tl-gap");
      items.forEach((li, k) => { li.className = "tl-step" + (k < i ? " past" : k === i ? " current" : ""); });
      if (gap) gap.className = "tl-gap" + (i === items.length - 1 ? " past" : "");
      const li = items[i], ol = ui.timeline;
      if (li) {
        const x = li.offsetLeft - ol.clientWidth / 2 + li.offsetWidth / 2;
        if (ol.scrollTo) ol.scrollTo({ left: Math.max(0, x), behavior: reduce ? "auto" : "smooth" }); else ol.scrollLeft = x;
      }
      fadeTimeline();
      ui.tlCount.textContent = `Step ${i + 1} of ${count()}${run.truncated ? ` (+${run.truncated} not shown)` : ""}`;
    }
    function paintAnswer(i) {
      const last = i === count() - 1;
      let html = "";
      if (last && run.error) html += `<div class="answer-chip bad"><span class="key-label">INPUT REJECTED</span><b>${esc(run.error)}</b></div>`;
      else if (last && run.threw) html += `<div class="answer-chip bad"><span class="key-label">TRACE ERROR</span><b>${esc(run.threw.message || run.threw)}</b></div>`;
      else if (last) html += `<div class="answer-chip"><span class="key-label">ANSWER</span><b>${esc(showAnswer(run.answer))}</b></div>`;
      if (last && run.truncated) html += run.finalAppended
        ? `<p class="more-note">${run.truncated} step${run.truncated === 1 ? "" : "s"} between step ${MAX_FRAMES} and this last one ${run.truncated === 1 ? "is" : "are"} not shown. The answer comes from the full run.</p>`
        : `<p class="more-note">… and ${steps(run.truncated)} not shown. The answer comes from the full run.</p>`;
      ui.answer.innerHTML = html;
      ui.answer.hidden = !html;
    }
    function paintChrome(i) {
      const f = run.frames[i], n = count();
      ui.stepCount.textContent = `STEP ${i + 1} / ${n}`;
      const ln = Array.isArray(f.line) ? f.line : [f.line];
      ui.linePill.textContent = ln.length > 1 && ln[0] !== ln[1] ? `LINES ${ln[0]}-${ln[1]}` : `LINE ${ln[0]}`;
      ui.linePill.hidden = false;
      ui.title.textContent = plain(f.title);                // text only: a title never injects markup
      ui.caption.innerHTML = f.t || "";
      ui.tip.hidden = !f.tip;
      if (f.tip) { ui.tipText.innerHTML = f.tip; restartClass(ui.tip, "show"); }
      paintAnswer(i);
      ui.prev.disabled = i === 0;
      if (i < n - 1) { ui.next.disabled = false; const nt = plain(run.frames[i + 1].title); ui.next.innerHTML = `<span class="next-label">Next: ${nt ? esc(nt) : "step " + (i + 2)}</span> <span>→</span>`; }
      else if (opts.onEnd) { ui.next.disabled = false; ui.next.innerHTML = `Finish <span>✓</span>`; }
      else { ui.next.disabled = true; ui.next.innerHTML = `End of trace`; }
      paintVars(i);
      paintCode(f);
      paintTimeline(i);
    }

    // ---------- navigation ----------
    function goto(i, mode) {
      if (!run || !count()) return;
      i = Math.max(0, Math.min(count() - 1, i | 0));
      const back = i < cur;
      cur = i;
      render(i, mode || (back ? "back" : "anim"));
      paintChrome(i);
      if (opts.onStep) opts.onStep(i, count());
      scheduleAuto();
    }
    function next() { if (!count()) return; if (cur < count() - 1) goto(cur + 1); else { setAutoplay(false); if (opts.onEnd) opts.onEnd(); } }
    function prev() { setAutoplay(false); if (cur > 0) goto(cur - 1, "back"); }
    function replay() {
      if (!count()) return;
      if (cur > 0) render(cur - 1, "instant");
      else { clearStage(); buildStage(); }
      void ui.stage.getBoundingClientRect();
      render(cur, "anim");
      paintChrome(cur);
      scheduleAuto();
    }
    function scheduleAuto() {
      clearTimeout(autoTimer);
      if (!autoplay) return;
      const wait = Math.max(0, busyUntil - performance.now()) + (reduce ? 1200 : 2100) / speed();
      autoTimer = setTimeout(() => {
        if (!autoplay || destroyed) return;
        if (cur < count() - 1) goto(cur + 1);
        else { setAutoplay(false); if (opts.onEnd) opts.onEnd(); }
      }, wait);
    }
    function setAutoplay(on, quiet) {
      autoplay = !!on && count() > 0;
      ui.auto.innerHTML = autoplay ? PAUSE : PLAY;
      ui.auto.classList.toggle("on", autoplay);
      clearTimeout(autoTimer);
      if (autoplay && !quiet) { if (cur >= count() - 1) goto(0); else scheduleAuto(); }
    }

    // ---------- try your own input ----------
    function readStored() {
      if (!storeKey) return null;
      try { const all = JSON.parse(localStorage.getItem("cil-input") || "{}"); return all && all[storeKey] ? all[storeKey] : null; } catch (e) { return null; }
    }
    function writeStored(t) {
      if (!storeKey) return;
      try {
        const all = JSON.parse(localStorage.getItem("cil-input") || "{}") || {};
        if (!t || fields.every((f) => t[f.key] === f.value)) delete all[storeKey]; else all[storeKey] = t;
        localStorage.setItem("cil-input", JSON.stringify(all));
      } catch (e) { /* storage full or blocked: the trace still runs */ }
    }
    function buildTry() {
      ui.tryFields.innerHTML = fields.map((f, i) => `
        <div class="try-row">
          <label for="${uid}-f${i}">${esc(f.label || f.key)}</label>
          <div><input id="${uid}-f${i}" data-key="${esc(f.key)}" type="text" spellcheck="false" autocomplete="off">
          <div class="try-hint">${esc(typeof f.hint === "string" && f.hint ? f.hint : HINT[f.type] || f.type)}</div><div class="try-error" hidden></div></div>
        </div>`).join("");
      ui.tryFields.querySelectorAll("input").forEach((inp) => {
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); runInput(); } });
      });
    }
    function setInputs(t) {
      ui.tryFields.querySelectorAll("input").forEach((inp) => { inp.value = t[inp.dataset.key] !== undefined ? t[inp.dataset.key] : ""; });
      ui.tryCustom.hidden = fields.every((f) => t[f.key] === f.value);
    }
    function showFieldErrors(errs) {
      ui.tryFields.querySelectorAll("input").forEach((inp) => {
        const box = inp.parentElement.querySelector(".try-error"), msg = errs && errs[inp.dataset.key];
        box.hidden = !msg; box.textContent = msg || "";
        inp.classList.toggle("bad", !!msg);
      });
    }
    function readInputs() {
      const t = {};
      ui.tryFields.querySelectorAll("input").forEach((inp) => { t[inp.dataset.key] = inp.value; });
      return t;
    }
    function runInput() {
      const t = readInputs(), r = record(demo, t);
      if (Object.keys(r.parseErrors).length) { showFieldErrors(r.parseErrors); setTryMsg("Fix the marked field, then run again. The trace below is unchanged.", true); return; }
      // The input parses but the algorithm rejects it (or the run fails) before any step: keep the
      // current trace whole and say why once, under the form, like a parse error.
      if (!r.frames.length && (r.error || r.threw)) {
        showFieldErrors(null);
        const why = String(r.error || r.threw.message || r.threw).trim();
        setTryMsg(`${r.error ? "This input is not valid" : "The trace failed on this input"}: ${why}${/[.!?]$/.test(why) ? "" : "."} The trace below is unchanged.`, true);
        return;
      }
      writeStored(t);
      load(r, t, 0);
    }
    function setTryMsg(text, bad) { ui.tryMsg.hidden = !text; ui.tryMsg.textContent = text || ""; ui.tryMsg.classList.toggle("bad", !!bad); }

    function load(r, t, start) {
      setAutoplay(false, true);
      run = r; texts = t; cur = -1;
      lay = layoutRun(r.frames);
      buildStage();
      buildTimeline();
      setInputs(t);
      showFieldErrors(r.parseErrors);
      let msg = "";
      if (Object.keys(r.parseErrors).length) msg = "The example input does not parse. See the marked field below.";
      else if (r.threw) msg = `The trace stopped with an error: ${r.threw.message || r.threw}`;
      else if (r.error && !r.frames.length) msg = `This input is not valid: ${r.error}`;
      else if (!r.frames.length) msg = "This run recorded no steps.";
      else if (lay.errors.length) msg = `Some views could not be drawn: ${lay.errors[0]}`;
      ui.msg.hidden = !msg;
      ui.msg.textContent = msg;
      ui.msg.classList.toggle("bad", !!msg);
      // Each message is said once: a run that stopped before any step (or threw) is explained on
      // the stage; a rejection after some steps is explained under the form.
      const onStage = !!(r.threw || (r.error && !r.frames.length));
      setTryMsg(!onStage && r.error ? `The algorithm rejected this input: ${r.error}` : "", true);
      container.querySelector(".trace").classList.toggle("empty", !r.frames.length);
      if (r.frames.length) goto(start || 0, "anim");
      else {
        // Nothing to show: clear every piece of the old trace, so no stale line or count is left.
        ui.vars.innerHTML = ""; ui.timeline.innerHTML = ""; ui.tlMore.hidden = true; ui.tlCount.textContent = "";
        ui.stepCount.textContent = "NO STEPS"; ui.linePill.textContent = ""; ui.linePill.hidden = true;
        ui.title.textContent = ""; ui.caption.textContent = ""; ui.tip.hidden = true; ui.answer.hidden = true;
        ui.prev.disabled = true; ui.next.disabled = true; ui.next.textContent = "No steps";
        clearCode();
      }
    }

    // ---------- wiring ----------
    ui.replay.onclick = () => replay();
    ui.auto.onclick = () => setAutoplay(!autoplay);
    ui.prev.onclick = () => prev();
    ui.next.onclick = () => { setAutoplay(false, true); next(); };
    ui.speed.onchange = () => scheduleAuto();
    ui.timeline.onclick = (e) => { const b = e.target.closest("button[data-step]"); if (b) { setAutoplay(false, true); goto(+b.dataset.step); } };
    ui.timeline.addEventListener("scroll", fadeTimeline, { passive: true });
    // Wrapped code lines change height when the panel width changes: keep the highlight on them.
    const resizer = typeof ResizeObserver === "function" ? new ResizeObserver(() => { placeHl(); fadeTimeline(); }) : null;
    if (resizer) { resizer.observe(ui.codeBody); resizer.observe(ui.timeline); }
    ui.run.onclick = () => runInput();
    ui.reset.onclick = () => { writeStored(null); load(record(demo, defaults), defaults, 0); };
    function onKey(e) {
      if (destroyed || !container.isConnected || container.offsetParent === null) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) { if (e.key === "Escape") t.blur(); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && t.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setAutoplay(false, true); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "r" || e.key === "R") replay();
      else if (e.key === "a" || e.key === "A") setAutoplay(!autoplay);
    }
    if (opts.keys !== false) document.addEventListener("keydown", onKey);

    buildCode();
    buildTry();
    let first = null, firstTexts = defaults;
    const stored = readStored();
    if (stored) {
      const t = Object.assign({}, defaults, stored), r = record(demo, t);
      if (!Object.keys(r.parseErrors).length && !r.threw && r.frames.length) { first = r; firstTexts = t; }
    }
    load(first || record(demo, defaults), firstTexts, opts.startFrame || 0);

    return {
      goto: (i) => goto(i, "anim"), next, prev, replay, setAutoplay,
      rerun(t) { const tt = Object.assign({}, defaults, t || {}), r = record(demo, tt); load(r, tt, 0); return r; },
      destroy() {
        destroyed = true; clearTimeout(autoTimer); killFlights(); tweens.clear();
        if (resizer) resizer.disconnect();
        if (raf) raf();
        document.removeEventListener("keydown", onKey);
        container.innerHTML = "";
      },
      get frame() { return cur; },
      get count() { return count(); },
      get run() { return run; },
    };
  }

  root.CIL_ENGINE = Object.assign({ mountTrace }, core);
})(typeof window !== "undefined" ? window : globalThis);
