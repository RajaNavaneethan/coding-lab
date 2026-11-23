// Practice tab: four tools, deep-linked as practice.html#drills, #mock, #missed, #flashcards.
// Each tool renders into #practice-tool-view; route() picks one from location.hash.
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const INDEX = window.CIL_PATTERN_INDEX || [];
  const PROBLEMS = window.CIL_PROBLEMS || [];
  const LOADED = {};
  (window.CIL_PATTERNS || []).forEach((p) => { if (p && typeof p.id === "string" && !LOADED[p.id]) LOADED[p.id] = p; });
  const titleOf = (id) => ((INDEX.find((x) => x.id === id) || {}).title || id);
  const loadedIds = INDEX.map((x) => x.id).filter((id) => LOADED[id]);
  const view = () => $("practice-tool-view");
  const DAY = 86400000;

  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? d : v; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } };
  function addIdx(key, pid, i) { const m = load(key, {}) || {}; const a = m[pid] || []; if (!a.includes(i)) a.push(i); m[pid] = a; save(key, m); }
  function dropIdx(key, pid, i) { const m = load(key, {}) || {}; const a = (m[pid] || []).filter((x) => x !== i); if (a.length) m[pid] = a; else delete m[pid]; save(key, m); }

  const TOOLS = [
    { id: "drills", title: "Which pattern is this?", desc: "A problem as an interviewer says it. Pick the pattern from four, then read why.", render: renderDrills },
    { id: "mock", title: "Timed mock interview", desc: "A random problem, staged timer (clarify, approach, code, test, complexity), then a self-check scorecard.", render: renderMock },
    { id: "missed", title: "Missed questions", desc: "Retry the quiz questions and drills you got wrong. Each leaves the list once you get it right.", render: renderMissed },
    { id: "flashcards", title: "Complexity flashcards", desc: "Time and space of each approach, spaced out in five Leitner boxes.", render: renderFlashcards },
  ];
  function renderIndex() {
    $("practice-nav").innerHTML = `<li><a href="#" data-id="">All tools</a></li>` + TOOLS.map((t) => `<li><a href="#${t.id}" data-id="${t.id}">${esc(t.title)}</a></li>`).join("");
    $("tool-grid").innerHTML = TOOLS.map((t) => `<a class="card tool-card" href="#${t.id}"><h3>${esc(t.title)}</h3><p>${esc(t.desc)}</p></a>`).join("");
  }
  const patternSelect = (id, val, allLabel) => `<select class="btn" id="${id}"><option value="">${esc(allLabel)}</option>${loadedIds.map((p) => `<option value="${p}"${p === val ? " selected" : ""}>${esc(titleOf(p))}</option>`).join("")}</select>`;
  const noPatterns = (title) => `<h2>${esc(title)}</h2><p class="muted">No pattern files are loaded yet, so there is nothing to practise here.</p>`;

  // ---------- (a) drills: which pattern is this? ----------
  const drillState = { filter: "", right: 0, total: 0, streak: 0, best: 0 };
  function renderDrills() {
    if (!loadedIds.length) { view().innerHTML = noPatterns("Which pattern is this?"); return; }
    const pool = [];
    loadedIds.forEach((pid) => (LOADED[pid].drills || []).forEach((d, di) => { if (!drillState.filter || drillState.filter === pid) pool.push({ pid, di, d }); }));
    const item = pick(pool);
    const s = drillState;
    view().innerHTML = `
      <h2>Which pattern is this?</h2>
      <div class="tool-bar">${patternSelect("drill-filter", s.filter, "All loaded patterns")}
        <div class="score-strip"><span class="chip green">Score ${s.right} / ${s.total}</span><span class="chip orange">Streak ${s.streak}</span><span class="chip">Best streak ${s.best}</span></div></div>
      <div class="drill-card">
        <div class="key-label">THE INTERVIEWER SAYS</div>
        <p class="drill-prompt">${item ? item.d.prompt : "No drills in this pattern."}</p>
        <div class="quiz-opts" id="drill-opts"></div>
        <div class="quiz-why" id="drill-why" hidden></div>
        <div class="drill-actions"><button class="btn primary" id="drill-next">Next drill →</button></div>
      </div>`;
    $("drill-filter").onchange = (e) => { s.filter = e.target.value; renderDrills(); };
    $("drill-next").onclick = renderDrills;
    if (!item) return;
    const choices = shuffle([item.d.answer].concat(item.d.distractors || []).slice(0, 4));
    $("drill-opts").innerHTML = choices.map((c, i) => `<button class="quiz-opt" data-c="${esc(c)}"><i>${"ABCD"[i]}</i><span>${esc(titleOf(c))}</span></button>`).join("");
    $("drill-opts").onclick = (e) => {
      const b = e.target.closest("button[data-c]");
      if (!b || b.disabled) return;
      const ok = b.dataset.c === item.d.answer;
      $("drill-opts").querySelectorAll("button").forEach((x) => { x.disabled = true; if (x.dataset.c === item.d.answer) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      s.total++;
      if (ok) { s.right++; s.streak++; s.best = Math.max(s.best, s.streak); dropIdx("cil-drill-missed", item.pid, item.di); }
      else { s.streak = 0; addIdx("cil-drill-missed", item.pid, item.di); }
      const why = $("drill-why");
      why.hidden = false;
      why.className = "quiz-why " + (ok ? "ok" : "bad");
      why.innerHTML = `<b>${ok ? "Correct." : `It is ${esc(titleOf(item.d.answer))}.`}</b> ${item.d.why} <a href="index.html#${item.d.answer}">Open the lesson →</a>`;
      view().querySelector(".score-strip").innerHTML = `<span class="chip green">Score ${s.right} / ${s.total}</span><span class="chip orange">Streak ${s.streak}</span><span class="chip">Best streak ${s.best}</span>`;
    };
  }

  // ---------- (b) timed mock interview ----------
  const STAGES = [
    { key: "clarify", name: "Clarify", minutes: 5, prompt: "Restate the problem in your own words. Ask about input size, value ranges, empty input, duplicates, and what to return when there is no answer." },
    { key: "approach", name: "Approach", minutes: 10, prompt: "Say the brute force and its cost first. Then name the pattern you would use, why it fits, and the invariant it keeps. Agree on the plan before writing code." },
    { key: "code", name: "Code", minutes: 20, prompt: "Write the C++ solution on paper or in an editor. Talk while you write: say what each loop keeps true and why each branch exists." },
    { key: "test", name: "Test", minutes: 5, prompt: "Trace a small example by hand, line by line. Then try the edge cases: empty input, one element, all values equal, the largest input." },
    { key: "complexity", name: "Complexity", minutes: 5, prompt: "State time and space with the reason for each. Name one follow-up you could handle and how your code would change." },
  ];
  const GENERIC_RUBRIC = {
    strong: ["Clarified inputs, edge cases and the expected output before coding.", "Named the approach and its invariant, then wrote clean code that matched it.", "Stated time and space with a reason and traced one example and one edge case."],
    weak: ["Started coding before agreeing on the approach.", "Skipped edge cases such as empty input or a single element.", "Gave the complexity without a reason, or did not test the code."],
  };
  let mockTimer = 0;
  function renderMock() {
    if (!PROBLEMS.length) { view().innerHTML = `<h2>Timed mock interview</h2><p class="muted">data/problems.js is missing.</p>`; return; }
    const opts = INDEX.map((p) => {
      const items = PROBLEMS.filter((x) => x.pattern === p.id);
      return items.length ? `<optgroup label="${esc(p.title)}">${items.map((x) => `<option value="${x.lc}">LC ${x.lc} · ${esc(x.title)}</option>`).join("")}</optgroup>` : "";
    }).join("");
    view().innerHTML = `
      <h2>Timed mock interview</h2>
      <p class="muted">Five stages, 45 minutes in all. The pattern stays hidden until the scorecard, as it would in a real round.</p>
      <div class="tool-bar"><select class="btn" id="mock-pick"><option value="">Random problem</option>${opts}</select><button class="btn primary" id="mock-start">Start the mock interview</button></div>
      <div id="mock-body"></div>
      <div class="key-label" style="margin-top:18px">PAST ROUNDS</div><ul class="history" id="mock-history"></ul>`;
    $("mock-start").onclick = () => startMock($("mock-pick").value ? +$("mock-pick").value : null);
    renderHistory();
  }
  function renderHistory() {
    const all = load("cil-mock-results", []) || [];
    $("mock-history").innerHTML = all.length ? all.slice(0, 20).map((r) => {
      const p = PROBLEMS.find((x) => x.lc === r.lc);
      return `<li><span class="when">${esc(new Date(r.date).toLocaleString())}</span><span class="chip ${r.score >= 5 ? "green" : r.score >= 3 ? "amber" : "red"}">${esc(r.score)} / 6</span><b>LC ${esc(r.lc)} ${p ? esc(p.title) : ""}</b><span class="note">${esc(r.notes || "")}</span></li>`;
    }).join("") : `<li class="muted">No rounds saved yet.</li>`;
  }
  function startMock(lc) {
    const prob = lc ? PROBLEMS.find((x) => x.lc === lc) : pick(PROBLEMS);
    let stage = 0, left = STAGES[0].minutes * 60, paused = false;
    clearInterval(mockTimer);
    const head = `<div class="drill-card" style="margin-bottom:12px"><div class="key-label">YOUR PROBLEM</div>
      <h3 style="margin:2px 0 6px">LC ${prob.lc} · ${esc(prob.title)} <span class="chip diff-${esc(prob.difficulty)}">${esc(prob.difficulty)}</span></h3>
      <a class="lesson-chip" href="https://leetcode.com/problems/${esc(prob.slug)}/" target="_blank" rel="noopener">Read it on LeetCode ↗</a></div>`;
    function paint() {
      const s = STAGES[stage];
      $("mock-body").innerHTML = head + `
        <div class="stage-progress">${STAGES.map((_, i) => `<div class="stage-dot ${i < stage ? "done" : i === stage ? "active" : ""}"></div>`).join("")}</div>
        <div class="stage-names">${STAGES.map((x) => `<span>${x.name} ${x.minutes}m</span>`).join("")}</div>
        <div class="stage-timer"><div><b>${esc(s.name)}</b> <span class="muted">· stage ${stage + 1} of ${STAGES.length}</span></div>
          <span class="recall-timer${paused ? " paused" : ""}" id="mock-clock">${fmtClock(left)}</span></div>
        <p class="stage-prompt">${esc(s.prompt)}</p>
        <div class="drill-actions"><button class="btn" id="mock-pause">${paused ? "Resume" : "Pause"}</button>
          <button class="btn primary" id="mock-skip">${stage === STAGES.length - 1 ? "Finish → scorecard" : "Next stage →"}</button>
          <button class="btn" id="mock-end">End now → scorecard</button></div>`;
      $("mock-pause").onclick = () => { paused = !paused; paint(); };
      $("mock-skip").onclick = advance;
      $("mock-end").onclick = () => { clearInterval(mockTimer); scorecard(prob); };
    }
    function advance() {
      if (stage < STAGES.length - 1) { stage++; left = STAGES[stage].minutes * 60; paint(); }
      else { clearInterval(mockTimer); scorecard(prob); }
    }
    paint();
    mockTimer = setInterval(() => {
      if (paused) return;
      left--;
      const c = $("mock-clock");
      if (c) c.textContent = fmtClock(Math.max(0, left));
      if (left <= 0) advance();
    }, 1000);
  }
  function scorecard(prob) {
    const pat = LOADED[prob.pattern];
    const rub = pat && pat.explain && pat.explain.rubric && (pat.explain.rubric.strong || []).length ? pat.explain.rubric : GENERIC_RUBRIC;
    $("mock-body").innerHTML = `
      <div class="drill-card">
        <div class="key-label">SELF-CHECK · LC ${prob.lc} ${esc(prob.title)}</div>
        <p>This problem is filed under <b>${esc(titleOf(prob.pattern))}</b>. <a href="${esc(prob.file)}">Worked solution →</a> · <a href="index.html#${prob.pattern}">Pattern lesson →</a>${pat ? "" : " <span class=\"muted\">(that lesson is not written yet, so this is the general rubric)</span>"}</p>
        <div class="rubric-cols scorecard">
          <div class="strong"><div class="key-label">DID YOU DO THIS?</div>${rub.strong.map((x, i) => `<label><input type="checkbox" data-kind="strong" data-i="${i}"> <span>${x}</span></label>`).join("")}</div>
          <div class="weak"><div class="key-label">DID YOU AVOID THIS? TICK EACH ONE YOU AVOIDED</div>${rub.weak.map((x, i) => `<label><input type="checkbox" data-kind="weak" data-i="${i}"> <span>${x}</span></label>`).join("")}</div>
        </div>
        <div class="key-label" style="margin-top:12px">NOTES</div>
        <textarea class="notes" id="mock-notes" placeholder="What to practise next time"></textarea>
        <div class="drill-actions"><button class="btn primary" id="mock-save">Save this round</button><span class="muted" id="mock-saved" hidden>Saved.</span></div>
      </div>`;
    $("mock-save").onclick = () => {
      const score = view().querySelectorAll('.scorecard input:checked').length;
      const all = load("cil-mock-results", []) || [];
      all.unshift({ lc: prob.lc, date: new Date().toISOString(), score, notes: $("mock-notes").value.trim() });
      save("cil-mock-results", all.slice(0, 50));
      $("mock-saved").hidden = false; $("mock-save").disabled = true;
      renderHistory();
    };
  }

  // ---------- (c) missed questions: quiz misses and drill misses ----------
  function renderMissed() {
    const items = [];
    let skipped = 0;
    const qm = load("cil-quiz-missed", {}) || {}, dm = load("cil-drill-missed", {}) || {};
    Object.keys(qm).forEach((pid) => (qm[pid] || []).forEach((qi) => {
      const q = LOADED[pid] && (LOADED[pid].quiz || [])[qi];
      if (q) items.push({ kind: "quiz", pid, i: qi, text: q[0], options: q[1].map((o, k) => ({ k, html: o })), answer: q[2], why: q[3] }); else skipped++;
    }));
    Object.keys(dm).forEach((pid) => (dm[pid] || []).forEach((di) => {
      const d = LOADED[pid] && (LOADED[pid].drills || [])[di];
      if (d) items.push({ kind: "drill", pid, i: di, text: d.prompt, options: [d.answer].concat(d.distractors || []).map((c) => ({ k: c, html: esc(titleOf(c)) })), answer: d.answer, why: d.why }); else skipped++;
    }));
    const note = skipped ? `<p class="muted">${skipped} item${skipped === 1 ? " belongs" : "s belong"} to patterns that are not loaded here.</p>` : "";
    if (!items.length) {
      view().innerHTML = `<h2>Missed questions</h2><p class="muted">Nothing to review. Wrong answers from the quizzes on the Learn tab and from the drills land here.</p>${note}`;
      return;
    }
    view().innerHTML = `<h2>Missed questions</h2><p class="muted" id="missed-count"></p>${note}<ol class="missed-list" id="missed-list"></ol>`;
    const left = () => { const n = view().querySelectorAll(".missed-item:not(.cleared)").length; $("missed-count").textContent = n ? `${n} to clear. A right answer removes an item from the list.` : "All cleared."; };
    $("missed-list").innerHTML = items.map((it, idx) => `<li class="card missed-item" id="mi-${idx}"></li>`).join("");
    items.forEach((it, idx) => paintItem(it, idx));
    left();
    function paintItem(it, idx) {
      const li = $("mi-" + idx);
      li.classList.remove("cleared");
      li.innerHTML = `<div class="from">${it.kind === "quiz" ? "Quiz" : "Drill"} · ${esc(titleOf(it.pid))}</div><p class="quiz-q" style="margin-top:4px">${it.text}</p>
        <div class="quiz-opts">${shuffle(it.options).map((o, n) => `<button class="quiz-opt" data-k="${esc(o.k)}"><i>${"ABCD"[n]}</i><span>${o.html}</span></button>`).join("")}</div>
        <div class="quiz-why" hidden></div>`;
      li.querySelector(".quiz-opts").onclick = (e) => {
        const b = e.target.closest("button[data-k]");
        if (!b || b.disabled) return;
        const ok = String(b.dataset.k) === String(it.answer);
        li.querySelectorAll(".quiz-opt").forEach((x) => { x.disabled = true; if (String(x.dataset.k) === String(it.answer)) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        const why = li.querySelector(".quiz-why");
        why.hidden = false;
        why.className = "quiz-why " + (ok ? "ok" : "bad");
        why.innerHTML = `<b>${ok ? "Correct. Cleared from the list." : "Not quite."}</b> ${it.why}` + (ok ? "" : ` <button class="btn small" data-retry>↺ Retry</button>`);
        if (ok) { dropIdx(it.kind === "quiz" ? "cil-quiz-missed" : "cil-drill-missed", it.pid, it.i); li.classList.add("cleared"); }
        else why.querySelector("[data-retry]").onclick = () => paintItem(it, idx);
        left();
      };
    }
  }

  // ---------- (d) complexity flashcards, Leitner boxes 1-5 ----------
  const WAIT = { 1: 0, 2: 1 * DAY, 3: 3 * DAY, 4: 7 * DAY, 5: 14 * DAY };   // time until a card in that box is due again
  const fc = { filter: "", queue: [], flipped: false, all: false };
  const flashState = () => load("cil-flash", {}) || {};
  function deck() {
    const out = [];
    loadedIds.forEach((pid) => { if (!fc.filter || fc.filter === pid) (LOADED[pid].flashcards || []).forEach((c) => out.push({ pid, c })); });
    return out;
  }
  const cardState = (st, x) => (st[x.pid] && st[x.pid][x.c.id]) || null;
  function buildQueue() {
    const st = flashState(), now = Date.now();
    const cards = deck().filter((x) => fc.all || !cardState(st, x) || cardState(st, x).due <= now);
    fc.queue = shuffle(cards).sort((a, b) => ((cardState(st, a) || { box: 0 }).box - (cardState(st, b) || { box: 0 }).box));
    fc.flipped = false;
  }
  function renderFlashcards(rebuild) {
    if (!loadedIds.length) { view().innerHTML = noPatterns("Complexity flashcards"); return; }
    if (rebuild !== false) buildQueue();
    const st = flashState(), now = Date.now(), all = deck();
    const boxes = [0, 1, 2, 3, 4, 5].map((b) => all.filter((x) => (cardState(st, x) ? cardState(st, x).box : 0) === b).length);
    const due = all.filter((x) => !cardState(st, x) || cardState(st, x).due <= now).length;
    const card = fc.queue[0];
    const cs = card ? cardState(st, card) : null;
    let body;
    if (card) {
      body = `<div class="flashcard${fc.flipped ? " back" : ""}" id="fc-card" tabindex="0" role="button" aria-label="Flip the card">
          <div class="tag">${esc(titleOf(card.pid))} · ${cs ? "box " + cs.box : "new card"}</div>
          ${fc.flipped ? `<div class="hint" style="margin:0 0 8px">${card.c.front}</div>` : ""}<div class="face">${fc.flipped ? card.c.back : card.c.front}</div>
          <div class="hint">${fc.flipped ? "Did you have it?" : "Answer in your head, then click or press Space to flip"}</div></div>
        <div class="drill-actions" style="justify-content:center">${fc.flipped ? `<button class="btn" id="fc-again">↺ Again</button><button class="btn primary" id="fc-got">✓ Got it</button>` : `<button class="btn primary" id="fc-flip">Flip</button>`}</div>`;
    } else {
      const next = all.map((x) => cardState(st, x)).filter(Boolean).map((s) => s.due).filter((d) => d > now).sort((a, b) => a - b)[0];
      body = `<div class="flashcard"><div class="face">Nothing is due${fc.filter ? " in this pattern" : ""}.</div><div class="hint">${next ? "Next card is due " + new Date(next).toLocaleString() + "." : ""}</div></div>
        <div class="drill-actions" style="justify-content:center"><button class="btn primary" id="fc-all">Study all ${all.length} cards anyway</button></div>`;
    }
    view().innerHTML = `
      <h2>Complexity flashcards</h2>
      <div class="tool-bar">${patternSelect("fc-filter", fc.filter, "All loaded patterns")}<span class="chip amber">${due} due now</span><span class="chip">${fc.queue.length} left in this round</span></div>
      <div class="box-strip">${["new", 1, 2, 3, 4, 5].map((b, i) => `<span class="chip${cs && cs.box === b ? " cur" : ""}" title="${i ? `box ${b}: seen again after ${WAIT[b] / DAY || 0} day(s)` : "not seen yet"}">${i ? "box " + b : "new"} · ${boxes[i]}</span>`).join("")}</div>
      ${body}
      <p class="muted" style="text-align:center;font-size:11.5px">Got it moves a card up one box (due again after 1, 3, 7, 14 days). Again sends it back to box 1 and to the end of this round.</p>`;
    $("fc-filter").onchange = (e) => { fc.filter = e.target.value; fc.all = false; renderFlashcards(); };
    const flip = () => { fc.flipped = !fc.flipped; renderFlashcards(false); };
    if ($("fc-card")) { $("fc-card").onclick = flip; $("fc-card").focus({ preventScroll: true }); }
    if ($("fc-flip")) $("fc-flip").onclick = flip;
    if ($("fc-all")) $("fc-all").onclick = () => { fc.all = true; renderFlashcards(); };
    const grade = (ok) => {
      const s = flashState(), cur = cardState(s, card) || { box: 0, due: 0 };
      const box = ok ? Math.min(5, Math.max(1, cur.box) + 1) : 1;
      (s[card.pid] = s[card.pid] || {})[card.c.id] = { box, due: Date.now() + (ok ? WAIT[box] : 0) };
      save("cil-flash", s);
      fc.queue.shift();
      if (!ok) fc.queue.push(card);
      fc.flipped = false;
      renderFlashcards(false);
    };
    if ($("fc-got")) $("fc-got").onclick = () => grade(true);
    if ($("fc-again")) $("fc-again").onclick = () => grade(false);
  }
  document.addEventListener("keydown", (e) => {
    if (location.hash !== "#flashcards" || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || "")) return;
    if (e.key === " " && fc.queue.length && !fc.flipped) { e.preventDefault(); fc.flipped = true; renderFlashcards(false); }
  });

  // ---------- routing ----------
  function route() {
    clearInterval(mockTimer);
    const id = location.hash.slice(1);
    const tool = TOOLS.find((t) => t.id === id);
    $("practice-index-view").hidden = !!tool;
    view().hidden = !tool;
    $("practice-nav").querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.dataset.id === (tool ? tool.id : "")));
    document.title = tool ? `${tool.title} · Practice · Coding Interview Lab` : "Practice · Coding Interview Lab";
    if (tool) { tool.render(); window.scrollTo(0, 0); }
  }
  renderIndex();
  route();
  window.addEventListener("hashchange", route);
  $("theme").onclick = () => {
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("cil-theme", t); } catch (e) { /* storage blocked */ }
  };
})();
