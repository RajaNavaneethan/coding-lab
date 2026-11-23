// Problems tab: the 85 worked pages grouped by pattern, live search (/), difficulty filter.
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const INDEX = window.CIL_PATTERN_INDEX || [];
  const PROBLEMS = window.CIL_PROBLEMS || [];
  const LEVELS = ["Easy", "Medium", "Hard"];
  let level = null;

  const groups = INDEX.map((p) => ({ p, items: PROBLEMS.filter((x) => x.pattern === p.id) })).filter((g) => g.items.length);
  const pad2 = (n) => String(n).padStart(2, "0");

  function renderStatic() {
    $("group-nav").innerHTML = groups.map(({ p, items }) =>
      `<li><a href="#g-${p.id}"><span class="num">${pad2(p.num)}</span><span>${esc(p.title)}</span><span class="cnt">${items.length}</span></a></li>`).join("");
    $("side-total").textContent = `${PROBLEMS.length} problems`;
    $("groups").innerHTML = groups.map(({ p, items }) => `
      <section class="card prob-group" id="g-${p.id}">
        <div class="prob-group-head"><span class="num">${pad2(p.num)}</span><h2>${esc(p.title)}</h2><a class="lesson-chip" href="index.html#${p.id}">Pattern lesson →</a></div>
        <div class="dd-problems">${items.map((x) => `
          <div class="prob-row" data-level="${esc(x.difficulty)}" data-text="${esc(`${x.lc} lc${x.lc} ${x.title} ${x.slug} ${p.title} ${p.id} ${x.difficulty}`.toLowerCase())}">
            <span class="lcn">LC ${x.lc}</span><a class="pt" href="${esc(x.file)}">${esc(x.title)}</a>
            <span class="chip diff-${esc(x.difficulty)}">${esc(x.difficulty)}</span>
            <a class="lesson-chip" href="index.html#${p.id}">Lesson</a>
            <a class="lesson-chip" href="https://leetcode.com/problems/${esc(x.slug)}/" target="_blank" rel="noopener">LeetCode ↗</a>
          </div>`).join("")}</div>
      </section>`).join("");
  }
  function renderFilters() {
    const count = (l) => PROBLEMS.filter((x) => x.difficulty === l).length;
    $("filters").innerHTML = `<span class="muted" style="font-size:12px">Difficulty:</span>` +
      `<button class="chip${level ? "" : " active"}" data-level="">All ${PROBLEMS.length}</button>` +
      LEVELS.map((l) => `<button class="chip diff-${l}${level === l ? " active" : ""}" data-level="${l}">${level === l ? "✓ " : ""}${l} ${count(l)}</button>`).join("");
  }
  function filter() {
    const q = $("search").value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    document.querySelectorAll(".prob-group").forEach((g) => {
      let n = 0;
      g.querySelectorAll(".prob-row").forEach((r) => {
        const ok = (!level || r.dataset.level === level) && q.every((w) => r.dataset.text.includes(w));
        r.hidden = !ok;
        if (ok) n++;
      });
      g.hidden = !n;
      shown += n;
      const nav = document.querySelector(`.index-nav a[href="#${g.id}"] .cnt`);
      if (nav) nav.textContent = n;
    });
    $("match-count").textContent = q.length || level ? `${shown} of ${PROBLEMS.length} match` : `${PROBLEMS.length} problems`;
    $("empty").hidden = shown > 0;
  }

  $("filters").onclick = (e) => {
    const b = e.target.closest("button[data-level]");
    if (!b) return;
    level = b.dataset.level && level !== b.dataset.level ? b.dataset.level : null;
    renderFilters(); filter();
  };
  $("search").oninput = filter;
  $("search").onkeydown = (e) => { if (e.key === "Escape") $("search").blur(); };
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key === "/" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); $("search").focus(); }
  });
  $("theme").onclick = () => {
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("cil-theme", t); } catch (e) { /* storage blocked */ }
  };

  renderStatic(); renderFilters(); filter();
})();
