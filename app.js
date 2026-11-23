// Learn tab: sidebar of the 20 patterns, pattern header, demo switcher, Animation (engine.js) and
// Deep Dive tabs, the 3-question quiz, progress, search, dark mode and deep links:
//   #<patternId>  #<patternId>/<demoId>  #<patternId>/<demoId>/<n>  #<patternId>/deep-dive
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const E = window.CIL_ENGINE, esc = E.esc;
  const INDEX = window.CIL_PATTERN_INDEX || [];
  const PROBLEMS = window.CIL_PROBLEMS || [];
  const LOADED = {};
  (window.CIL_PATTERNS || []).forEach((p) => {
    if (p && typeof p.id === "string" && !LOADED[p.id] && Array.isArray(p.demos) && p.demos.length) LOADED[p.id] = p;
  });
  const pad2 = (n) => String(n).padStart(2, "0");
  const byLc = {};
  PROBLEMS.forEach((p) => { byLc[p.lc] = p; });
  const titleOf = (id) => ((INDEX.find((x) => x.id === id) || {}).title || id);
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? d : v; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) { /* storage blocked */ } };
  const store = {
    get done() { return load("cil-done", {}) || {}; },
    setDone(id, on) { const d = store.done; if (on) d[id] = true; else delete d[id]; save("cil-done", d); },
    get best() { return load("cil-quiz-best", {}) || {}; },
    saveBest(id, score) { const b = store.best; b[id] = Math.max(b[id] || 0, score); save("cil-quiz-best", b); },
    saveMissed(id, idx) { const m = load("cil-quiz-missed", {}) || {}; if (idx.length) m[id] = idx; else delete m[id]; save("cil-quiz-missed", m); },
    get last() { try { return localStorage.getItem("cil-last") || ""; } catch (e) { return ""; } },
    set last(v) { save("cil-last", v); },
  };

  let pattern = null, demo = null, view = "animation", trace = null;
  let quizAnswers = [], quizAttempt = 0, sayTimer = 0;

  // ---------- sidebar ----------
  function matches(entry, q) {
    if (!q) return true;
    const p = LOADED[entry.id];
    const text = [entry.title, entry.id, p ? p.summary : "", p ? (p.tags || []).join(" ") : "",
      p ? p.demos.map((d) => `${d.title} lc ${d.lc}`).join(" ") : ""].join(" ").toLowerCase();
    return q.split(/\s+/).every((w) => text.includes(w));
  }
  function renderNav() {
    const q = $("search").value.trim().toLowerCase();
    const done = store.done, best = store.best;
    $("nav").innerHTML = INDEX.filter((e) => matches(e, q)).map((e) => {
      const p = LOADED[e.id];
      if (!p) return `<li><button class="pattern-link soon" disabled title="This pattern is not written yet"><span class="num">${pad2(e.num)}</span><span class="name">${esc(e.title)}</span><span class="soon-tag">soon</span></button></li>`;
      const qn = (p.quiz || []).length, qb = best[e.id];
      const badge = qb === undefined ? "" : `<span class="quiz-badge${qb === qn ? " perfect" : ""}" title="Best quiz score">${qb === qn ? "★" : `${qb}/${qn}`}</span>`;
      return `<li><button class="pattern-link${pattern && pattern.id === e.id ? " active" : ""}${done[e.id] ? " done" : ""}" data-id="${e.id}">` +
        `<span class="num">${pad2(e.num)}</span><span class="name">${esc(e.title)}</span>${badge}<span class="tick">${done[e.id] ? "✓" : ""}</span></button></li>`;
    }).join("") || `<li class="muted" style="padding:6px 8px;font-size:12px">No pattern matches.</li>`;
    const loaded = INDEX.filter((e) => LOADED[e.id]);
    const n = INDEX.filter((e) => done[e.id]).length;
    const qTotal = loaded.reduce((s, e) => s + (LOADED[e.id].quiz || []).length, 0);
    const qRight = loaded.reduce((s, e) => s + (best[e.id] || 0), 0);
    $("pattern-total").textContent = `${loaded.length} of ${INDEX.length} ready`;
    $("top-progress").textContent = `✓ ${n} / ${INDEX.length} done`;
    $("side-progress").innerHTML = `<div class="row"><span>PROGRESS</span><span>${n} / ${INDEX.length}</span></div>` +
      `<div class="bar"><div style="width:${(100 * n) / Math.max(1, INDEX.length)}%"></div></div>` +
      `<div class="row quiz-row"><span>QUIZ BEST</span><span>${qRight} / ${qTotal}</span></div>`;
  }
  $("nav").onclick = (e) => { const b = e.target.closest("button[data-id]"); if (b) go(b.dataset.id); };

  // ---------- lesson header ----------
  function problemLinks(lc) {
    const p = byLc[lc];
    if (!p) return `<span class="chip flat">LC ${lc}</span>`;
    return `<a class="chip" href="${esc(p.file)}">Worked solution →</a>` +
      `<a class="chip" href="https://leetcode.com/problems/${esc(p.slug)}/" target="_blank" rel="noopener">LeetCode ${lc} ↗</a>`;
  }
  function renderHeader() {
    const p = pattern, entry = INDEX.find((x) => x.id === p.id) || { num: p.num };
    const qn = (p.quiz || []).length, best = store.best[p.id], done = !!store.done[p.id];
    const steps = trace ? trace.count : 0;
    $("lesson").innerHTML = `
      <div class="lesson-top">
        <div>
          <div class="crumb">Pattern ${pad2(entry.num)} of ${INDEX.length} &nbsp;/&nbsp; <b>${p.demos.length} demo${p.demos.length === 1 ? "" : "s"}</b></div>
          <h1>${esc(p.title)}</h1>
          <p id="summary" class="muted">${p.summary || ""}</p>
          <div class="tag-row">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        </div>
        <div class="chips">
          <span class="chip purple" id="step-chip">☰ ${steps} steps</span>
          ${qn ? `<button class="chip quiz-chip" id="open-quiz" title="Open the quiz">✎ Quiz${best !== undefined ? ` · best ${best}/${qn}` : ""}</button>` : ""}
          <button class="chip${done ? " green" : ""}" id="mark-done" title="Mark this pattern as finished">${done ? "✓ Done" : "Mark done"}</button>
        </div>
      </div>
      <div class="view-tabs">
        <button class="vtab" data-view="animation"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5l12 7-12 7z"/></svg>Animation</button>
        <button class="vtab" data-view="deep-dive"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>Deep Dive</button>
        <div class="demo-switch" id="demo-switch">${p.demos.length > 1 ? p.demos.map((d) =>
          `<button data-demo="${esc(d.id)}" title="${esc(d.title)}">LC ${d.lc} · ${esc(d.title)}</button>`).join("") : ""}</div>
      </div>
      <div id="view-animation">
        <div class="problem-card" id="problem"></div>
        <div id="trace"></div>
      </div>
      <div id="view-deepdive" hidden></div>`;
    $("lesson").querySelector(".view-tabs").onclick = (e) => {
      const b = e.target.closest(".vtab");
      if (b) { setView(b.dataset.view); return; }
      const d = e.target.closest("button[data-demo]");
      if (d && d.dataset.demo !== demo.id) openDemo(d.dataset.demo, 1);
    };
    if (qn) $("open-quiz").onclick = () => showQuiz(true);
    $("mark-done").onclick = () => { store.setDone(p.id, !store.done[p.id]); refreshChips(); renderNav(); };
  }
  function refreshChips() {
    const p = pattern, qn = (p.quiz || []).length, best = store.best[p.id], done = !!store.done[p.id];
    const md = $("mark-done");
    if (md) { md.textContent = done ? "✓ Done" : "Mark done"; md.classList.toggle("green", done); }
    const oq = $("open-quiz");
    if (oq) oq.textContent = `✎ Quiz${best !== undefined ? ` · best ${best}/${qn}` : ""}`;
    if ($("step-chip") && trace) $("step-chip").textContent = `☰ ${trace.count} steps`;
  }
  function setView(v) {
    view = v === "deep-dive" ? "deep-dive" : "animation";
    $("view-animation").hidden = view !== "animation";
    $("view-deepdive").hidden = view !== "deep-dive";
    $("demo-switch").hidden = view !== "animation";
    $("lesson").querySelectorAll(".vtab").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    if (view === "deep-dive") { if (trace) trace.setAutoplay(false); setHash(`${pattern.id}/deep-dive`); }
    else if (trace) setHash(`${pattern.id}/${demo.id}/${trace.frame + 1}`);
  }
  function setHash(h) {
    if (location.hash.slice(1) !== h) history.replaceState(null, "", "#" + h);
    store.last = h;
  }

  // ---------- animation ----------
  function openDemo(demoId, frame) {
    demo = pattern.demos.find((d) => d.id === demoId) || pattern.demos[0];
    $("demo-switch").querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.demo === demo.id));
    $("problem").innerHTML = `<div><h3>LC ${demo.lc} · ${esc(demo.title)}</h3><p>${demo.problem || ""}</p></div><div class="problem-links">${problemLinks(demo.lc)}</div>`;
    if (trace) trace.destroy();
    trace = null;
    try {
      trace = E.mountTrace($("trace"), demo, {
        patternId: pattern.id,
        startFrame: Math.max(0, (frame || 1) - 1),
        onStep: (i) => { if (view === "animation") setHash(`${pattern.id}/${demo.id}/${i + 1}`); },
        onEnd: finish,
      });
    } catch (e) {
      $("trace").innerHTML = `<div class="stage-msg bad">This demo could not start: ${esc(e.message)}</div>`;
    }
    refreshChips();
  }
  function finish() {
    store.setDone(pattern.id, true);
    refreshChips();
    renderNav();
    showQuiz(true);
  }

  // ---------- Deep Dive ----------
  const lcLinks = (text) => esc(text).replace(/\b(\d{1,4})\b/g, (m, n) => (byLc[+n] ? `<a href="${esc(byLc[+n].file)}" title="${esc(byLc[+n].title)}">${n}</a>` : m));
  function codeBlock(lines) {
    return `<div class="dd-code">${E.highlight(lines).map((h, i) => `<div class="code-line"><span class="ln">${i + 1}</span><span class="src">${h || " "}</span></div>`).join("")}</div>`;
  }
  function renderDeepDive() {
    const d = pattern.explain || {}, box = $("view-deepdive");
    const list = (arr, c) => `<ul class="${c || ""}">${(arr || []).map((x) => `<li>${x}</li>`).join("")}</ul>`;
    const nums = [...new Set([...(pattern.problems || []), ...PROBLEMS.filter((p) => p.pattern === pattern.id).map((p) => p.lc)])];
    const probs = nums.map((n) => {
      const p = byLc[n];
      if (!p) return `<div class="prob-row"><span class="lcn">LC ${n}</span><span class="pt">not among the 85 worked pages</span></div>`;
      const elsewhere = p.pattern !== pattern.id ? `<span class="where">filed under ${esc(titleOf(p.pattern))}</span>` : "";
      const rec = (pattern.problems || []).includes(n) ? "" : `<span class="where">also filed here</span>`;
      return `<div class="prob-row"><span class="lcn">LC ${n}</span><a class="pt" href="${esc(p.file)}">${esc(p.title)}</a>${elsewhere}${rec}<span class="chip diff-${esc(p.difficulty)}">${esc(p.difficulty)}</span><a class="lesson-chip" href="https://leetcode.com/problems/${esc(p.slug)}/" target="_blank" rel="noopener">LeetCode ↗</a></div>`;
    }).join("");
    const words = String(d.sayIt || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    box.innerHTML = `
      <div class="dd-block wide"><div class="key-label">PLAIN ENGLISH</div><p class="dd-plain">${d.plain || ""}</p></div>
      <div class="dd-grid">
        <div class="dd-block"><div class="key-label">HOW TO SPOT IT</div>${list(d.spot, "dd-spot")}</div>
        <div class="dd-block"><div class="key-label">WHEN NOT TO USE IT</div>${list(d.notWhen, "dd-not")}</div>
      </div>
      <div class="dd-block wide"><div class="key-label">TEMPLATE</div><div class="dd-template">${codeBlock(d.template)}<ol class="dd-notes">${(d.templateNotes || []).map((x) => `<li>${x}</li>`).join("")}</ol></div></div>
      <div class="dd-block wide"><div class="key-label">VARIANTS</div><table class="dd-table"><thead><tr><th>Variant</th><th>When it applies</th><th>Problems</th></tr></thead><tbody>${(d.variants || []).map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>LC ${lcLinks(r[2])}</td></tr>`).join("")}</tbody></table></div>
      <div class="dd-block wide"><div class="key-label">COMMON MISTAKES</div>${list(d.mistakes)}</div>
      <div class="dd-block wide"><div class="key-label">COMPLEXITY</div><table class="dd-table"><thead><tr><th>Approach</th><th>Time</th><th>Space</th><th>Why</th></tr></thead><tbody>${(d.complexity || []).map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join("")}</tbody></table></div>
      <div class="dd-block wide"><div class="key-label">SAY IT IN 60 SECONDS</div>
        <div class="dd-sayit-bar"><button class="btn primary" id="say-start">Start the 60-second timer</button><button class="btn" id="say-reveal">Show the answer</button><span class="dd-timer" id="say-clock">1:00</span><span class="muted">Say your own answer out loud first. This one is ${words} words, about a minute read aloud.</span></div>
        <p class="dd-sayit-text" id="say-text" hidden>${d.sayIt || ""}</p></div>
      <div class="dd-block wide"><div class="key-label">FOLLOW-UP QUESTIONS</div><ul class="dd-followups">${(d.followups || []).map(([q, a], i) => `<li><button class="btn dd-followup-q" data-fi="${i}">Q: ${q}</button><div class="dd-followup-a" id="dd-fa-${i}" hidden>${a}</div></li>`).join("")}</ul></div>
      <div class="dd-block wide"><div class="key-label">WORKED PROBLEMS</div><div class="dd-problems">${probs || '<span class="muted">None listed.</span>'}</div></div>
      <div class="dd-block wide"><button class="btn" id="dd-quiz">✎ Take the quiz</button></div>`;
    box.querySelectorAll(".dd-followup-q").forEach((b) => { b.onclick = () => { const a = $("dd-fa-" + b.dataset.fi); a.hidden = !a.hidden; }; });
    const clock = $("say-clock");
    const reveal = () => { clearInterval(sayTimer); $("say-text").hidden = false; };
    $("say-reveal").onclick = reveal;
    $("say-start").onclick = () => {
      clearInterval(sayTimer);
      $("say-text").hidden = true;
      let left = 60;
      clock.textContent = "1:00"; clock.classList.remove("over");
      sayTimer = setInterval(() => {
        left--;
        clock.textContent = `0:${pad2(Math.max(0, left))}`;
        if (left <= 0) { clock.textContent = "Time"; clock.classList.add("over"); reveal(); }
      }, 1000);
    };
    $("dd-quiz").onclick = () => showQuiz(true);
  }

  // ---------- quiz (same behaviour as SDL: shuffled on show and on Retry) ----------
  const LETTERS = ["A", "B", "C", "D", "E"];
  function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }
  function optionOrder(qi, n) {
    let seed = hash(`${pattern.id}:${qi}:${quizAttempt}`) >>> 0;
    const order = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) { seed = (seed * 1664525 + 1013904223) >>> 0; const j = seed % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
    return order;
  }
  function renderQuiz() {
    const qs = pattern.quiz || [];
    const answered = quizAnswers.filter((a) => a !== undefined).length;
    const correct = qs.filter((q, i) => quizAnswers[i] === q[2]).length;
    $("quiz-sub").textContent = ` · ${qs.length} questions on ${pattern.title}`;
    $("quiz-score").textContent = `${correct} / ${qs.length} correct`;
    $("quiz-score").className = "chip" + (answered === qs.length ? (correct === qs.length ? " green" : " orange") : "");
    $("quiz-list").innerHTML = qs.map(([question, options, answer, why], qi) => {
      const chosen = quizAnswers[qi], done = chosen !== undefined, order = optionOrder(qi, options.length);
      const opts = order.map((oi, pos) => {
        let c = "quiz-opt";
        if (done && oi === answer) c += " right"; else if (done && oi === chosen) c += " wrong";
        return `<button class="${c}" data-q="${qi}" data-o="${oi}" ${done ? "disabled" : ""}><i>${LETTERS[pos]}</i><span>${options[oi]}</span></button>`;
      }).join("");
      const verdict = !done ? "" : chosen === answer ? `<div class="quiz-why ok"><b>Correct.</b> ${why}</div>`
        : `<div class="quiz-why bad"><b>Not quite.</b> The answer is ${LETTERS[order.indexOf(answer)]}. ${why}</div>`;
      return `<li class="${done ? "answered" : ""}"><p class="quiz-q">${question}</p><div class="quiz-opts">${opts}</div>${verdict}</li>`;
    }).join("");
    const fin = answered === qs.length && qs.length > 0;
    $("quiz-result").hidden = !fin;
    if (fin) $("quiz-result").textContent = correct === qs.length ? `All ${qs.length} correct.` :
      `You got ${correct} of ${qs.length}. Best so far: ${store.best[pattern.id]}/${qs.length}. The missed ones wait for you in Practice → Missed.`;
  }
  function showQuiz(scroll) {
    if (!(pattern.quiz || []).length) return;
    quizAnswers = []; quizAttempt++;
    $("quiz").hidden = false;
    renderQuiz();
    if (scroll) $("quiz").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }
  $("quiz-list").onclick = (e) => {
    const b = e.target.closest("button[data-q]");
    if (!b || b.disabled) return;
    const qi = +b.dataset.q, oi = +b.dataset.o, qs = pattern.quiz;
    if (quizAnswers[qi] !== undefined) return;
    quizAnswers[qi] = oi;
    if (quizAnswers.filter((a) => a !== undefined).length === qs.length) {
      store.saveBest(pattern.id, qs.filter((q, i) => quizAnswers[i] === q[2]).length);
      store.saveMissed(pattern.id, qs.map((_, i) => i).filter((i) => quizAnswers[i] !== qs[i][2]));
      refreshChips(); renderNav();
    }
    renderQuiz();
  };
  $("quiz-retry").onclick = () => { quizAnswers = []; quizAttempt++; renderQuiz(); };

  // ---------- routing ----------
  function parseHash(h) {
    const [id, a, b] = String(h || "").replace(/^#/, "").split("/");
    if (a === "deep-dive") return { id, view: "deep-dive" };
    return { id, demo: a, frame: parseInt(b, 10) || 1, view: "animation" };
  }
  function renderSoon(id) {
    if (trace) { trace.destroy(); trace = null; }
    pattern = null;
    const e = INDEX.find((x) => x.id === id);
    $("lesson").innerHTML = `<div class="soon-card"><div class="crumb">Pattern ${e ? pad2(e.num) : "?"}</div><h1>${esc(e ? e.title : id)}</h1>
      <p class="muted">${e ? "This pattern is coming soon. Its lesson file is not written yet." : "There is no pattern with that name."}</p>
      <p><a class="btn" href="#${esc(INDEX.find((x) => LOADED[x.id]) ? INDEX.find((x) => LOADED[x.id]).id : "")}">Open the first ready pattern</a></p></div>`;
    $("quiz").hidden = true;
    document.title = "Coding Interview Lab";
    renderNav();
  }
  function open(h) {
    const r = parseHash(h);
    const p = LOADED[r.id];
    if (!p) { renderSoon(r.id); return; }
    const samePattern = pattern && pattern.id === p.id;
    pattern = p;
    if (!samePattern) {
      clearInterval(sayTimer);
      $("quiz").hidden = true; quizAnswers = [];
      renderHeader();
      renderDeepDive();
      document.title = `${p.title} · Coding Interview Lab`;
    }
    const d = p.demos.find((x) => x.id === r.demo) || (demo && samePattern ? demo : p.demos[0]);
    if (!samePattern || !demo || d.id !== demo.id || (r.view === "animation" && r.demo && trace && r.frame - 1 !== trace.frame)) openDemo(d.id, r.view === "animation" ? r.frame : 1);
    setView(r.view);
    renderNav();
  }
  function go(id) { open(id); window.scrollTo({ top: 0, behavior: "auto" }); }

  // ---------- wiring ----------
  $("search").oninput = renderNav;
  $("search").onkeydown = (e) => {
    if (e.key === "Enter") { const q = $("search").value.trim().toLowerCase(); const hit = INDEX.find((x) => LOADED[x.id] && matches(x, q)); if (hit) { go(hit.id); $("search").blur(); } }
    if (e.key === "Escape") $("search").blur();
  };
  $("theme").onclick = () => {
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    save("cil-theme", t);
  };
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key === "/" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); $("search").focus(); }
  });
  window.addEventListener("hashchange", () => open(location.hash));

  const first = INDEX.find((x) => LOADED[x.id]);
  const start = location.hash.length > 1 ? location.hash : store.last ? "#" + store.last : first ? "#" + first.id : "";
  if (start) open(start); else renderSoon("");
})();
