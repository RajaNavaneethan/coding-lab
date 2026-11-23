/* Shared diagram helpers for the DSA revision pages.
 * Every helper returns an HTML/SVG string; insert it with element.innerHTML.
 * Highlight classes (same meaning everywhere):
 *   in   = inside current window / visited          (blue)
 *   new  = element being processed right now        (yellow)
 *   gone = dropped / removed / rejected             (red, struck through)
 *   keep = part of the answer / finished            (green)
 *   hit  = matched / special                        (purple)
 *   dim  = not relevant yet                         (grey)
 *   wall / water = for grid / height problems
 */
const VIZ = (() => {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const asFn = (x, dflt) => typeof x === 'function' ? x : (i => (x && x[i] !== undefined ? x[i] : dflt));

  const SVGCOL = {
    '':   { fill:'#ffffff', stroke:'#475569', text:'#1f2933' },
    in:   { fill:'#dbeafe', stroke:'#3b82f6', text:'#1f2933' },
    new:  { fill:'#fde68a', stroke:'#d97706', text:'#1f2933' },
    gone: { fill:'#fecaca', stroke:'#b91c1c', text:'#7f1d1d' },
    keep: { fill:'#bbf7d0', stroke:'#15803d', text:'#1f2933' },
    hit:  { fill:'#e9d5ff', stroke:'#7c3aed', text:'#1f2933' },
    dim:  { fill:'#f8fafc', stroke:'#cbd5e1', text:'#94a3b8' },
  };
  const col = c => SVGCOL[c || ''] || SVGCOL[''];

  /* 1-D array / string.
     opts.cls   : array, object {i:cls} or fn(i, v) -> class
     opts.ptrs  : {i: 'L'} or {i: ['L','R']}  (labels drawn under the cell)
     opts.notes : {i: 'text'} small orange note under a cell
     opts.index : show indices row (default true)
     opts.small : smaller cells
     opts.labels: custom header labels instead of indices (array)          */
  function strip(values, opts = {}) {
    const vals = typeof values === 'string' ? [...values] : values;
    const cls = typeof opts.cls === 'function' ? opts.cls : asFn(opts.cls, '');
    const ptrs = opts.ptrs || {}, notes = opts.notes || {};
    const sm = opts.small ? ' small' : '';
    const w = opts.small ? 30 : 42;
    let h = '';
    if (opts.index !== false) {
      const labels = opts.labels || vals.map((_, i) => i);
      h += '<div class="idx">' + labels.map(l => `<span style="min-width:${w}px">${esc(l)}</span>`).join('') + '</div>';
    }
    h += '<div class="strip">' + vals.map((v, i) => {
      const n = notes[i] !== undefined ? ` data-note="${esc(notes[i])}"` : '';
      return `<div class="cell ${cls(i, v) || ''}${sm}"${n}>${esc(v)}</div>`;
    }).join('') + '</div>';
    const anyPtr = Object.keys(ptrs).length;
    if (anyPtr) {
      h += '<div class="ptr">' + vals.map((_, i) => {
        let p = ptrs[i]; if (p === undefined) return `<span style="min-width:${w}px"></span>`;
        if (!Array.isArray(p)) p = [p];
        return `<span style="min-width:${w}px">` + p.map((x, j) => `<span class="p${j % 4}" style="min-width:0">${esc(x)}</span>`).join(' ') + '</span>';
      }).join('') + '</div>';
    }
    if (Object.keys(notes).length) h += '<div style="height:14px"></div>';
    return `<div class="figure">${h}</div>`;
  }

  /* 2-D grid. opts.cls fn(r, c, v) -> class, opts.small, opts.index (row/col headers, default true) */
  function grid(m, opts = {}) {
    const R = m.length, C = R ? m[0].length : 0;
    const cls = opts.cls || (() => '');
    const sm = opts.small ? ' small' : '';
    const w = opts.small ? 30 : 42;
    const showIdx = opts.index !== false;
    let h = `<div class="grid" style="grid-template-columns:${showIdx ? '18px ' : ''}repeat(${C}, ${w}px)">`;
    if (showIdx) { h += '<span></span>'; for (let c = 0; c < C; c++) h += `<span style="font-size:11px;color:#616e7c;text-align:center">${c}</span>`; }
    for (let r = 0; r < R; r++) {
      if (showIdx) h += `<span style="font-size:11px;color:#616e7c;align-self:center">${r}</span>`;
      for (let c = 0; c < C; c++) {
        const note = opts.notes && opts.notes[r + ',' + c];
        h += `<div class="cell ${cls(r, c, m[r][c]) || ''}${sm}"${note !== undefined ? ` data-note="${esc(note)}"` : ''}>${esc(m[r][c])}</div>`;
      }
    }
    return `<div class="figure">${h}</div></div>`;
  }

  /* Bar chart. entries: [[label, value, cls?], ...]  cls: hl | hl2 | hl3  opts.scale px per unit */
  function bars(entries, opts = {}) {
    const vals = entries.map(e => Math.abs(e[1]));
    const mx = Math.max(1, ...vals);
    const scale = opts.scale || Math.min(16, 90 / mx);
    return '<div class="bars">' + entries.map(([l, v, c]) =>
      `<div class="bar ${c || ''}"><b>${esc(v)}</b><div style="height:${Math.max(2, Math.abs(v) * scale)}px"></div>${esc(l)}</div>`).join('') + '</div>';
  }

  /* Linked list. values array. opts.cls fn(i)/obj, opts.labels {i:'slow'}, opts.cycleTo index (draws a back arrow note),
     opts.nullEnd (default true), opts.title text before the list */
  function list(values, opts = {}) {
    const cls = typeof opts.cls === 'function' ? opts.cls : asFn(opts.cls, '');
    const labels = opts.labels || {};
    let h = '<div class="llist">';
    if (opts.title) h += `<span style="font-size:13px;color:#616e7c;margin-right:8px">${esc(opts.title)}</span>`;
    values.forEach((v, i) => {
      const lb = labels[i] !== undefined ? ` data-label="${esc(labels[i])}"` : '';
      h += `<div class="lnode ${cls(i, v) || ''}"${lb}>${esc(v)}</div>`;
      if (i < values.length - 1) h += '<div class="larrow">&rarr;</div>';
    });
    if (opts.cycleTo !== undefined && opts.cycleTo !== null) h += `<div class="larrow">&#8634;</div><span class="lnull">back to index ${opts.cycleTo} (${esc(values[opts.cycleTo])})</span>`;
    else if (opts.nullEnd !== false) h += '<div class="larrow">&rarr;</div><span class="lnull">null</span>';
    return `<div class="figure" style="padding-top:14px">${h}</div></div>`;
  }

  /* Vertical stack, bottom first. opts.cls fn(i)/obj, opts.title */
  function stack(values, opts = {}) {
    const cls = typeof opts.cls === 'function' ? opts.cls : asFn(opts.cls, '');
    const inner = values.map((v, i) => `<div class="cell small ${cls(i, v) || ''}">${esc(v)}</div>`).join('');
    return `<div style="display:inline-flex;flex-direction:column;align-items:center;margin-right:14px">
      ${opts.title ? `<div style="font-size:12px;color:#616e7c">${esc(opts.title)}</div>` : ''}
      <div class="vstack">${inner || '<span style="font-size:11px;color:#94a3b8;text-align:center">empty</span>'}</div></div>`;
  }

  /* Build a tree from LeetCode level order (null for missing). Returns root {val, id, left, right}; id = index in array */
  function buildTree(arr) {
    if (!arr.length || arr[0] === null) return null;
    const root = { val: arr[0], id: 0, left: null, right: null }, q = [root];
    let i = 1;
    while (q.length && i < arr.length) {
      const n = q.shift();
      if (i < arr.length && arr[i] !== null) { n.left = { val: arr[i], id: i, left: null, right: null }; q.push(n.left); } i++;
      if (i < arr.length && arr[i] !== null) { n.right = { val: arr[i], id: i, left: null, right: null }; q.push(n.right); } i++;
    }
    return root;
  }

  /* Binary tree SVG. arr = LeetCode level order or a root from buildTree.
     opts.cls {id: cls} or fn(node) ; opts.notes {id:'text'} drawn beside node; opts.edgeCls {childId: cls} colours edge to that child */
  function tree(arr, opts = {}) {
    const root = Array.isArray(arr) ? buildTree(arr) : arr;
    if (!root) return '<div class="caption">(empty tree)</div>';
    const pos = []; let x = 0, maxD = 0;
    (function ino(n, d) { if (!n) return; ino(n.left, d + 1); pos.push({ n, x: x++, d }); maxD = Math.max(maxD, d); ino(n.right, d + 1); })(root, 0);
    const DX = 52, DY = 64, R = 18, PAD = 30;
    const P = new Map(pos.map(p => [p.n, { x: PAD + p.x * DX, y: PAD + p.d * DY }]));
    const W = PAD * 2 + (x - 1) * DX + 60, H = PAD * 2 + maxD * DY;
    const cls = typeof opts.cls === 'function' ? opts.cls : (n => (opts.cls || {})[n.id] || '');
    const notes = opts.notes || {}, ecls = opts.edgeCls || {};
    let e = '', v = '';
    pos.forEach(({ n }) => {
      const a = P.get(n);
      [n.left, n.right].forEach(ch => {
        if (!ch) return; const b = P.get(ch); const c = ecls[ch.id];
        e += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${c ? col(c).stroke : '#94a3b8'}" stroke-width="${c ? 3 : 2}"/>`;
      });
      const k = col(cls(n));
      v += `<circle cx="${a.x}" cy="${a.y}" r="${R}" fill="${k.fill}" stroke="${k.stroke}" stroke-width="2"/>`;
      v += `<text x="${a.x}" y="${a.y + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="${k.text}">${esc(n.val)}</text>`;
      if (notes[n.id] !== undefined) v += `<text x="${a.x + R + 4}" y="${a.y - R + 2}" font-size="11" font-weight="700" fill="#d97706">${esc(notes[n.id])}</text>`;
    });
    return `<svg class="figure" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${e}${v}</svg>`;
  }

  /* Graph SVG.
     nodes: [{id, x, y, label?}] (x,y in px) ; edges: [[u, v, w?], ...]
     opts.directed, opts.nodeCls {id:cls}, opts.edgeCls {"u-v": cls}, opts.notes {id:'text'}, opts.w/opts.h svg size, opts.dashed {"u-v":true} */
  let mk = 0;
  function graph(nodes, edges, opts = {}) {
    const id = 'ah' + (mk++);
    const N = new Map(nodes.map(n => [String(n.id), n]));
    const R = 18;
    const W = opts.w || Math.max(...nodes.map(n => n.x)) + 50, H = opts.h || Math.max(...nodes.map(n => n.y)) + 40;
    const nc = opts.nodeCls || {}, ec = opts.edgeCls || {}, notes = opts.notes || {}, dashed = opts.dashed || {};
    let defs = '';
    if (opts.directed) Object.entries(SVGCOL).forEach(([k, c]) => {
      defs += `<marker id="${id}${k}" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" refX="10" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${k ? c.stroke : '#64748b'}"/></marker>`;
    });
    let e = '', v = '';
    edges.forEach(([a, b, w]) => {
      const A = N.get(String(a)), B = N.get(String(b)); if (!A || !B) return;
      const key = a + '-' + b, c = ec[key] || (!opts.directed ? ec[b + '-' + a] : '') || '';
      const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
      const x1 = A.x + dx / L * R, y1 = A.y + dy / L * R, x2 = B.x - dx / L * (R + (opts.directed ? 3 : 0)), y2 = B.y - dy / L * (R + (opts.directed ? 3 : 0));
      const stroke = c ? col(c).stroke : '#64748b';
      e += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${c ? 3 : 2}"${dashed[key] ? ' stroke-dasharray="6,4"' : ''}${opts.directed ? ` marker-end="url(#${id}${c})"` : ''}/>`;
      if (w !== undefined && w !== null) {
        const mx = (A.x + B.x) / 2 - dy / L * 11, my = (A.y + B.y) / 2 + dx / L * 11;
        e += `<text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#334155">${esc(w)}</text>`;
      }
    });
    nodes.forEach(n => {
      const k = col(nc[n.id]);
      v += `<circle cx="${n.x}" cy="${n.y}" r="${R}" fill="${k.fill}" stroke="${k.stroke}" stroke-width="2"/>`;
      v += `<text x="${n.x}" y="${n.y + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="${k.text}">${esc(n.label !== undefined ? n.label : n.id)}</text>`;
      if (notes[n.id] !== undefined) v += `<text x="${n.x}" y="${n.y - R - 5}" text-anchor="middle" font-size="11" font-weight="700" fill="#d97706">${esc(notes[n.id])}</text>`;
    });
    return `<svg class="figure" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${e}${v}</svg>`;
  }

  /* Nodes laid out on a circle, handy when you don't want to pick coordinates. ids: array of ids */
  function circleLayout(ids, cx = 160, cy = 130, r = 100) {
    return ids.map((id, i) => ({ id, x: Math.round(cx + r * Math.cos(-Math.PI / 2 + 2 * Math.PI * i / ids.length)),
                                     y: Math.round(cy + r * Math.sin(-Math.PI / 2 + 2 * Math.PI * i / ids.length)) }));
  }

  /* Flow diagram of the algorithm's steps. boxes: [{title, lines:[...], color:'yellow'|'red'|'green'|'blue'|'purple'}]
     opts.loop: text under the dashed arrow from last back to first (omit for no loop) */
  function flow(boxes, opts = {}) {
    const C = { yellow:['#fef3c7','#d97706'], red:['#fee2e2','#b91c1c'], green:['#dcfce7','#15803d'], blue:['#dbeafe','#3b82f6'], purple:['#f3e8ff','#7c3aed'] };
    const n = boxes.length, gap = 40, W = 880, bw = (W - 20 - gap * (n - 1)) / n;
    const maxLines = Math.max(...boxes.map(b => (b.lines || []).length));
    const bh = 46 + maxLines * 20, H = bh + (opts.loop ? 60 : 30);
    const id = 'fl' + (mk++);
    let s = `<defs><marker id="${id}" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" refX="9" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#334155"/></marker></defs>`;
    boxes.forEach((b, i) => {
      const x = 10 + i * (bw + gap), [f, st] = C[b.color] || C.blue;
      s += `<rect x="${x}" y="15" width="${bw}" height="${bh}" rx="10" fill="${f}" stroke="${st}" stroke-width="2"/>`;
      s += `<text x="${x + bw / 2}" y="42" text-anchor="middle" font-size="15" font-weight="700">${esc(b.title)}</text>`;
      (b.lines || []).forEach((l, j) => s += `<text x="${x + bw / 2}" y="${66 + j * 20}" text-anchor="middle" font-size="12.5">${esc(l)}</text>`);
      if (i < n - 1) s += `<line x1="${x + bw + 2}" y1="${15 + bh / 2}" x2="${x + bw + gap - 4}" y2="${15 + bh / 2}" stroke="#334155" stroke-width="2" marker-end="url(#${id})"/>`;
    });
    if (opts.loop && n > 1) {
      const x0 = 10 + bw / 2, x1 = 10 + (n - 1) * (bw + gap) + bw / 2, y = 15 + bh;
      s += `<path d="M${x1},${y + 2} C${x1},${y + 34} ${x0},${y + 34} ${x0},${y + 4}" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="5,4" marker-end="url(#${id})"/>`;
      s += `<text x="${(x0 + x1) / 2}" y="${y + 40}" text-anchor="middle" font-size="12" fill="#475569">${esc(opts.loop)}</text>`;
    }
    return `<svg class="figure" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">${s}</svg>`;
  }

  /* One trace step card. visual + text are HTML strings. wide=true stacks them vertically. */
  function step(title, visual, text, wide) {
    return `<div class="step${wide ? ' wide' : ''}"><div>${title ? `<h4>${title}</h4>` : ''}${visual}</div><div class="text">${text || ''}</div></div>`;
  }

  function table(headers, rows) {
    return '<table><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>' +
      rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('') + '</table>';
  }

  /* Interactive input box. fields: [{id, label, value, size}] ; run(values) must return HTML for the trace.
     Renders into element #hostId: controls + output. Runs once immediately. */
  function controls(hostId, fields, run, hint) {
    const host = document.getElementById(hostId);
    const ctl = document.createElement('div'); ctl.className = 'controls box';
    ctl.innerHTML = fields.map(f => `<label>${esc(f.label)} <input data-f="${f.id}" value="${esc(f.value)}" size="${f.size || 16}"></label>`).join('') +
      '<button>Trace it</button>' + `<span class="hint">${hint || 'Change the input and press Trace it. The trace is produced by running the algorithm.'}</span>`;
    const out = document.createElement('div');
    host.appendChild(ctl); host.appendChild(out);
    const go = () => {
      const vals = {}; ctl.querySelectorAll('input').forEach(i => vals[i.dataset.f] = i.value);
      try { out.innerHTML = run(vals); } catch (err) { out.innerHTML = `<div class="box trap">Could not parse input: ${esc(err.message)}</div>`; }
    };
    ctl.querySelector('button').onclick = go;
    ctl.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }));
    go();
  }

  /* Parse helpers for inputs: "[1,2,3]" or "1,2,3" ; "[[1,2],[3,4]]" ; tree "[3,9,20,null,null,15,7]" */
  const parse = {
    arr: s => { s = s.trim(); if (!s.startsWith('[')) s = '[' + s + ']'; return JSON.parse(s); },
    mat: s => JSON.parse(s.trim()),
    tree: s => JSON.parse(s.trim().replace(/\bnull\b/g, 'null')),
    int: s => { const v = parseInt(s, 10); if (isNaN(v)) throw new Error('expected an integer'); return v; },
    str: s => s.trim().replace(/^"|"$/g, ''),
    strs: s => JSON.parse(s.trim()),
  };

  return { esc, strip, grid, bars, list, stack, tree, buildTree, graph, circleLayout, flow, step, table, controls, parse };
})();
