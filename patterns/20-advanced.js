// Pattern 20: Advanced. Writer D.
// Demo 1 "alien-dictionary" (LC 269, Kahn's topological sort), demo 2 "burst-balloons" (LC 312, interval DP).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "advanced",
  num: 20,
  title: "Advanced",
  summary: "Hard problems are usually two known patterns joined together: build a graph from the input and topologically sort it, or define a DP over intervals by choosing the last action.",
  tags: ["topological sort", "kahn", "interval dp", "hard", "bfs state", "combine patterns"],

  demos: [
    {
      id: "alien-dictionary",
      title: "Alien Dictionary",
      lc: 269,
      problem: "A list of words is sorted by an unknown alphabet. Return the letters in an order that fits it, or <code>\"\"</code> if no order can (a cycle, or a longer word before its own prefix). <code>[\"wrt\",\"wrf\",\"er\",\"ett\",\"rftt\"]</code> gives <code>\"wertf\"</code>. This version uses <code>map</code> and <code>set</code> so the order of ties is alphabetical and the trace is repeatable.",
      code: [
        "string alienOrder(vector<string>& words) {",
        "    map<char, set<char>> adj;",
        "    map<char, int> indeg;",
        "    for (auto& w : words)",
        "        for (char c : w) indeg.emplace(c, 0);",
        "    for (int i = 0; i + 1 < (int)words.size(); i++) {",
        "        const string& a = words[i];",
        "        const string& b = words[i + 1];",
        "        int m = (int)min(a.size(), b.size()), j = 0;",
        "        while (j < m && a[j] == b[j]) j++;",
        "        if (j == m) {",
        "            if (a.size() > b.size()) return \"\";",
        "            continue;",
        "        }",
        "        if (adj[a[j]].insert(b[j]).second) indeg[b[j]]++;",
        "    }",
        "    queue<char> q;",
        "    for (auto& [c, d] : indeg) if (d == 0) q.push(c);",
        "    string order;",
        "    while (!q.empty()) {",
        "        char c = q.front(); q.pop();",
        "        order += c;",
        "        for (char nb : adj[c]) if (--indeg[nb] == 0) q.push(nb);",
        "    }",
        "    return order.size() == indeg.size() ? order : \"\";",
        "}",
      ],
      fields: [{ key: "words", label: "words", type: "strings", value: "wrt,wrf,er,ett,rftt" }],
      run(input, rec) {
        const words = input.words;
        if (words.some((w) => /[^\x21-\x7e]/.test(w))) { rec.error("Use plain ASCII letters with no spaces."); return null; }
        const esc = (x) => String(x).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
        const qt = (w) => `<b>"${esc(w)}"</b>`;
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        const adj = new Map();            // char -> Set, kept sorted on read
        const indeg = new Map();
        const edges = [];
        const q = [];
        let order = "";
        const sorted = () => [...indeg.keys()].sort();
        const nbrs = (c) => [...(adj.get(c) || [])].sort();

        const views = (o) => {
          o = o || {};
          const gm = {};
          for (const ch of order) gm[ch] = "done";
          for (const ch of q) gm[ch] = "hot";
          Object.assign(gm, o.nodeMarks || {});
          return [
            { id: "words", type: "array", label: "words", values: words.slice(),
              pointers: o.i === undefined ? {} : { a: o.i, b: o.i + 1 }, marks: o.wordMarks || {} },
            { id: "g", type: "graph", label: "letter graph (a → b means a comes before b)", directed: true,
              nodes: sorted().map((c) => ({ id: c, label: c })), edges: edges.map((e) => [e[0], e[1]]),
              marks: gm, edgeMarks: o.edgeMarks || {} },
            { id: "indeg", type: "grid", label: "indeg (how many letters must come first)",
              cells: [sorted().map((c) => indeg.get(c))], rowLabels: ["indeg"], colLabels: sorted(),
              marks: Object.fromEntries(Object.entries(o.degMarks || {}).map(([c, mk]) => [`0,${sorted().indexOf(c)}`, mk])) },
            { id: "q", type: "queue", label: "queue (indeg 0, ready)", items: q.slice(), marks: o.qMarks || {} },
            { id: "order", type: "calc", label: "order", value: `"${order}"` },
          ];
        };

        for (const w of words) for (const c of w) if (!indeg.has(c)) indeg.set(c, 0);
        frame({
          line: [4, 5], title: "Register every letter",
          t: `Every letter that appears gets a node with <code>indeg = 0</code>: ${sorted().map((c) => `<code>${esc(c)}</code>`).join(", ") || "none"}. A letter that never gets an edge can go anywhere, but it must still be in the answer.`,
          tip: "Only adjacent words give information, and only at their first differing letter. Everything after that letter says nothing about the order.",
          vars: { "words.size()": words.length, letters: indeg.size },
          views: views(),
        });

        let edgeTip = false;
        for (let i = 0; i + 1 < words.length; i++) {
          const a = words[i], b = words[i + 1];
          const m = Math.min(a.length, b.length);
          let j = 0;
          while (j < m && a[j] === b[j]) j++;
          if (j === m) {
            if (a.length > b.length) {
              frame({
                line: 12, title: "Prefix after its extension",
                t: `${qt(a)} comes before ${qt(b)}, but ${qt(b)} is a prefix of it. In any alphabet a prefix sorts first, so the list is invalid. Return <b>""</b>.`,
                tip: "This is the case people forget: no letters differ, so no edge, yet the input is still impossible.",
                vars: { i: i, j: j, m: m },
                views: views({ i: i, wordMarks: { [i]: "bad", [i + 1]: "bad" } }),
              });
              if (total > 40) rec.truncated(total - 40);
              return "";
            }
            frame({
              line: 13, title: "Prefix pair: no info",
              t: `${qt(a)} is a prefix of ${qt(b)} (or equal), which is fine in any alphabet. No letter differs, so there is no edge.`,
              vars: { i: i, j: j, m: m },
              views: views({ i: i, wordMarks: { [i]: "dim", [i + 1]: "dim" } }),
            });
            continue;
          }
          const x = a[j], y = b[j];
          if (!adj.has(x)) adj.set(x, new Set());
          const fresh = !adj.get(x).has(y);
          if (fresh) { adj.get(x).add(y); indeg.set(y, indeg.get(y) + 1); edges.push([x, y]); }
          frame({
            line: 15, title: fresh ? `Edge ${x} → ${y}` : `Edge ${x} → ${y} (again)`,
            t: `${qt(a)} vs ${qt(b)}: the first difference is at index ${j}, <code>${esc(x)}</code> vs <code>${esc(y)}</code>. So <code>${esc(x)}</code> comes before <code>${esc(y)}</code>. ${fresh ? `Add the edge and raise <code>indeg[${esc(y)}]</code> to ${indeg.get(y)}.` : "That edge is already there, so the set refuses it and indeg does not change."}`,
            tip: fresh && !edgeTip ? "The set matters: counting the same edge twice would leave indeg too high, and the letter would never reach the queue." : undefined,
            vars: { i: i, j: j, "a[j]": x, "b[j]": y },
            views: views({ i: i, wordMarks: { [i]: "hot", [i + 1]: "hot" }, nodeMarks: { [x]: "in", [y]: "new" }, edgeMarks: { [`${x}-${y}`]: "new" }, degMarks: { [y]: fresh ? "new" : "dim" } }),
          });
          if (fresh) edgeTip = true;
        }

        for (const c of sorted()) if (indeg.get(c) === 0) q.push(c);
        frame({
          line: 18, title: `Queue the ${q.length} free letter${q.length === 1 ? "" : "s"}`,
          t: q.length
            ? `Letters with <code>indeg = 0</code> have nothing that must come before them: ${q.map((c) => `<code>${esc(c)}</code>`).join(", ")}. They can go first.`
            : "No letter has <code>indeg = 0</code>, so every letter waits on another. That is a cycle; the queue starts empty.",
          tip: "Kahn's algorithm: repeatedly output a letter with no remaining prerequisites, then remove its outgoing edges.",
          vars: { "q.size()": q.length, letters: indeg.size },
          views: views({ degMarks: Object.fromEntries(q.map((c) => [c, "good"])) }),
        });

        while (q.length) {
          const c = q.shift();
          order += c;
          const freed = [], lowered = [];
          const em = {};
          for (const nb of nbrs(c)) {
            indeg.set(nb, indeg.get(nb) - 1);
            em[`${c}-${nb}`] = "dim";
            if (indeg.get(nb) === 0) { q.push(nb); freed.push(nb); } else lowered.push(nb);
          }
          const dm = {};
          for (const nb of freed) dm[nb] = "good";
          for (const nb of lowered) dm[nb] = "in";
          frame({
            line: [21, 23], title: `Take ${c}`,
            t: `Pop <code>${esc(c)}</code> and append it: <code>order = "${esc(order)}"</code>. ${nbrs(c).length ? `Its edges go to ${nbrs(c).map((z) => `<code>${esc(z)}</code>`).join(", ")}; each loses one prerequisite.${freed.length ? ` ${freed.map((z) => `<code>${esc(z)}</code>`).join(", ")} now ${freed.length === 1 ? "has" : "have"} indeg 0 and join${freed.length === 1 ? "s" : ""} the queue.` : ""}` : "It has no outgoing edges."}`,
            vars: { c: c, order: `"${order}"`, "q.size()": q.length },
            views: views({ nodeMarks: Object.assign({ [c]: "good" }, Object.fromEntries(freed.map((z) => [z, "hot"]))), edgeMarks: em, degMarks: dm }),
            moves: [{ from: ["q", 0], to: ["order", 0], label: c }],
          });
        }

        const ok = order.length === indeg.size;
        frame({
          line: 25, title: ok ? `Return "${order}"`.slice(0, 32) : "Cycle: return \"\"",
          t: ok
            ? `All ${indeg.size} letters came out, so the rules have no cycle. Return <b>"${esc(order)}"</b>.`
            : `Only ${order.length} of ${indeg.size} letters came out. The rest wait on each other in a cycle, so no alphabet fits. Return <b>""</b>.`,
          tip: "O(C + U) time and space, where C is the total length of all words and U the number of distinct letters (at most 26 here).",
          vars: { "order.size()": order.length, "indeg.size()": indeg.size },
          views: views({ nodeMarks: ok ? {} : Object.fromEntries(sorted().filter((c) => !order.includes(c)).map((c) => [c, "bad"])) }),
        });
        if (total > 40) rec.truncated(total - 40);
        return ok ? order : "";
      },
      expect: [
        [{ words: "wrt,wrf,er,ett,rftt" }, "wertf"],
        [{ words: "z,x" }, "zx"],
        [{ words: "z,x,z" }, ""],
        [{ words: "abc,ab" }, ""],
        [{ words: "ab,abc" }, "abc"],
        [{ words: "z" }, "z"],
        [{ words: "ac,ab,zc,zb" }, "aczb"],
      ],
    },
    {
      id: "burst-balloons",
      title: "Burst Balloons",
      lc: 312,
      problem: "Bursting balloon <code>i</code> earns <code>nums[i-1] · nums[i] · nums[i+1]</code> using its current neighbours (a missing neighbour counts as 1). Return the most coins from bursting all of them. <code>[3,1,5,8]</code> gives <code>167</code>. Keep the input to about 4 balloons so the table fits.",
      code: [
        "int maxCoins(vector<int>& nums) {",
        "    int n = nums.size();",
        "    vector<int> a(n + 2, 1);",
        "    for (int i = 0; i < n; i++) a[i + 1] = nums[i];",
        "    vector<vector<int>> dp(n + 2, vector<int>(n + 2, 0));",
        "    for (int len = 1; len <= n; len++)",
        "        for (int l = 1; l + len - 1 <= n; l++) {",
        "            int r = l + len - 1;",
        "            for (int k = l; k <= r; k++)  // k = last balloon burst in [l, r]",
        "                dp[l][r] = max(dp[l][r], dp[l][k - 1]",
        "                    + a[l - 1] * a[k] * a[r + 1] + dp[k + 1][r]);",
        "        }",
        "    return dp[1][n];",
        "}",
      ],
      fields: [{ key: "nums", label: "nums", type: "ints", value: "3,1,5,8" }],
      run(input, rec) {
        const nums = input.nums;
        if (nums.some((v) => v < 0 || v > 100)) { rec.error("Balloon values must be between 0 and 100."); return null; }
        if (nums.length > 12) { rec.error("Use at most 12 balloons so the table stays readable."); return null; }
        const n = nums.length;
        const a = [1].concat(nums, [1]);
        const dp = Array.from({ length: n + 2 }, () => new Array(n + 2).fill(0));
        const filled = new Set();
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        const key = (l, r) => `${l - 1},${r - 1}`;

        const views = (o) => {
          o = o || {};
          const cells = [], gm = {};
          for (let l = 1; l <= n; l++) {
            const row = [];
            for (let r = 1; r <= n; r++) {
              if (r < l) { row.push(""); gm[key(l, r)] = "dim"; }
              else row.push(filled.has(key(l, r)) ? dp[l][r] : "");
            }
            cells.push(row);
          }
          Object.assign(gm, o.gridMarks || {});
          return [
            { id: "a", type: "array", label: "a = 1 + nums + 1 (padded)", values: a.slice(), marks: o.aMarks || {}, ranges: o.ranges || [] },
            { id: "dp", type: "grid", label: "dp[l][r]: best for balloons l..r",
              cells: cells, rowLabels: nums.map((_, i) => `l=${i + 1}`), colLabels: nums.map((_, i) => `r=${i + 1}`),
              marks: gm, arrows: o.arrows || [] },
          ];
        };

        frame({
          line: [3, 5], title: "Pad with 1s, empty table",
          t: `Put a 1 at each end: <code>a = [${a.join(",")}]</code>, so the edge balloons always have two neighbours. <code>dp[l][r]</code> will hold the most coins from bursting only balloons <code>l..r</code>, while <code>a[l-1]</code> and <code>a[r+1]</code> are still standing.`,
          tip: "Think about the LAST balloon k burst in l..r, not the first. When k goes last, its neighbours are exactly a[l-1] and a[r+1], and the left and right parts never touch.",
          vars: { n: n },
          views: views(),
        });

        let lenTip = false;
        for (let len = 1; len <= n; len++) {
          for (let l = 1; l + len - 1 <= n; l++) {
            const r = l + len - 1;
            let bestK = l;
            const parts = [];
            for (let k = l; k <= r; k++) {
              const cand = dp[l][k - 1] + a[l - 1] * a[k] * a[r + 1] + dp[k + 1][r];
              parts.push(`k=${k}: ${dp[l][k - 1]} + ${a[l - 1]}·${a[k]}·${a[r + 1]} + ${dp[k + 1][r]} = ${cand}`);
              if (cand > dp[l][r]) { dp[l][r] = cand; bestK = k; }
            }
            filled.add(key(l, r));
            const arrows = [], gm = { [key(l, r)]: "new" };
            if (bestK - 1 >= l) { arrows.push([key(l, bestK - 1), key(l, r)]); gm[key(l, bestK - 1)] = "in"; }
            if (bestK + 1 <= r) { arrows.push([key(bestK + 1, r), key(l, r)]); gm[key(bestK + 1, r)] = "in"; }
            let tip;
            if (len === 2 && !lenTip) { tip = "Cells are filled by length, short to long, so both sub-intervals of any choice of k are already in the table."; lenTip = true; }
            frame({
              line: [9, 11], title: `dp[${l}][${r}] = ${dp[l][r]} (k=${bestK})`,
              t: `Balloons ${l}..${r} with neighbours <code>a[${l - 1}] = ${a[l - 1]}</code> and <code>a[${r + 1}] = ${a[r + 1]}</code>. Try each last balloon: ${parts.join("; ")}. Best is <b>${dp[l][r]}</b> with <code>k = ${bestK}</code> last.`,
              tip: tip,
              vars: { len: len, l: l, r: r, k: bestK, "dp[l][r]": dp[l][r] },
              views: views({
                aMarks: { [l - 1]: "in", [r + 1]: "in", [bestK]: "hot" },
                ranges: [{ from: l, to: r, mark: "good", label: `l..r` }],
                gridMarks: gm, arrows: arrows,
              }),
              moves: [{ from: ["a", bestK], to: ["dp", key(l, r)], label: `${a[l - 1] * a[bestK] * a[r + 1]}` }],
            });
          }
        }

        frame({
          line: 13, title: `Return dp[1][${n}] = ${dp[1][n]}`.slice(0, 32),
          t: n
            ? `The top-right cell covers every balloon. Return <b>${dp[1][n]}</b>.`
            : "There are no balloons, so the answer is <b>0</b>.",
          tip: "O(n³) time: n² cells, up to n choices of k each. O(n²) space for the table.",
          vars: { n: n, "dp[1][n]": dp[1][n] },
          views: views({ gridMarks: n ? { [key(1, n)]: "good" } : {} }),
        });
        if (total > 40) rec.truncated(total - 40);
        return dp[1][n];
      },
      expect: [
        [{ nums: "3,1,5,8" }, 167],
        [{ nums: "1,5" }, 10],
        [{ nums: "7" }, 7],
        [{ nums: "" }, 0],
        [{ nums: "0,0,0" }, 0],
        [{ nums: "2,3" }, 9],
      ],
    },
  ],

  explain: {
    plain: "The hard problems in this set are rarely a new idea. They join two familiar ones: turn the input into a graph and run a topological sort or a BFS over states, or define a DP over intervals where you choose which action happens last. The work is in spotting the hidden graph or the right subproblem.",
    spot: [
      "Pairs of items imply \"this before that\" (sorted words, prerequisites, row and column rules): build a directed graph and topologically sort it.",
      "Removing or merging items changes their neighbours, and the brute force tries every order: interval DP over [l, r], choosing the last action.",
      "The answer is the fewest moves between two board states (a sliding puzzle): BFS where each node is a whole state, encoded as a string.",
      "A plain DP or backtracking answer would repeat the same subproblem many times; memoising it is the speed-up.",
      "The constraints are small for a cubic or exponential method (n ≤ 300 for interval DP, a 2x3 board for state BFS).",
    ],
    notWhen: [
      "The dependencies already come as an explicit edge list with a yes/no question; that is the plain topological sort of LC 207 in Graphs.",
      "Each choice affects only the items on one side (a simple prefix); a 1D DP is enough.",
    ],
    template: [
      "// Kahn's topological sort over nodes 0..n-1; returns {} if there is a cycle.",
      "vector<int> topoSort(int n, const vector<pair<int, int>>& edges) {",
      "    vector<vector<int>> adj(n);",
      "    vector<int> indeg(n, 0), order;",
      "    for (auto& [u, v] : edges) { adj[u].push_back(v); indeg[v]++; }",
      "    queue<int> q;",
      "    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.push(i);",
      "    while (!q.empty()) {",
      "        int u = q.front(); q.pop();",
      "        order.push_back(u);",
      "        for (int v : adj[u]) if (--indeg[v] == 0) q.push(v);",
      "    }",
      "    if ((int)order.size() < n) return {};",
      "    return order;",
      "}",
      "",
      "// Interval DP: best[l][r] from smaller intervals, filled by length.",
      "int intervalDP(const vector<int>& a) {",
      "    int n = a.size();",
      "    if (n == 0) return 0;",
      "    vector<vector<int>> best(n, vector<int>(n, 0));",
      "    for (int len = 1; len <= n; len++)",
      "        for (int l = 0; l + len - 1 < n; l++) {",
      "            int r = l + len - 1;",
      "            for (int k = l; k <= r; k++)        // k = the choice made last",
      "                best[l][r] = max(best[l][r], (k > l ? best[l][k - 1] : 0) + a[k] + (k < r ? best[k + 1][r] : 0));",
      "        }",
      "    return best[0][n - 1];",
      "}",
    ],
    templateNotes: [
      "Kahn's algorithm outputs a node once all its prerequisites are out. If fewer than n nodes come out, the rest form a cycle.",
      "Count each edge once. Duplicate edges push indegree too high and a node never reaches the queue.",
      "Interval DP fills by length so every smaller interval is ready. The cost term (here <code>a[k]</code>) is where the problem's real formula goes.",
      "Choosing the last action, not the first, is what splits the interval into two independent halves.",
    ],
    variants: [
      ["Hidden-graph topological sort", "Build edges from comparisons or rules, then Kahn", "269, 2392"],
      ["Interval DP, last action", "dp[l][r] over a split point k", "312, 1039, 1000"],
      ["BFS over whole states", "Each node is a board or a string; edges are legal moves", "773, 752"],
      ["Backtracking with memo", "Build every answer, cache the results per suffix", "140"],
    ],
    mistakes: [
      "In Alien Dictionary, missing the invalid prefix case (<code>\"abc\"</code> before <code>\"ab\"</code>) and returning an order anyway.",
      "Comparing letters past the first difference, which adds edges the input never promised.",
      "Adding the same edge twice and counting indegree twice, so a letter never reaches the queue.",
      "In Burst Balloons, choosing the first balloon to burst. Its neighbours change afterwards, so the halves are not independent; choose the last.",
      "Filling the interval table row by row instead of by length, which reads cells that are not computed yet.",
    ],
    complexity: [
      ["Alien Dictionary (Kahn)", "O(C + U)", "O(U + edges)", "C = total letters across words; at most one edge per adjacent pair."],
      ["Burst Balloons (interval DP)", "O(n³)", "O(n²)", "n² intervals, n choices of the last balloon each."],
      ["Sliding Puzzle (state BFS)", "O(S · m)", "O(S)", "S = 6! = 720 board states, m moves per state."],
      ["Word Break II (memo)", "O(n · 2^n) worst case", "O(n · 2^n)", "The output itself can be exponential; memo keeps each suffix solved once."],
    ],
    sayIt: "For a hard problem I first ask which two known patterns it joins. In Alien Dictionary the sorted words hide a graph. Only adjacent words give information, and only at their first different letter, so each pair adds at most one edge from the earlier letter to the later one. If one word is a prefix of the word before it, the input is invalid and I return an empty string. Then I run Kahn's algorithm: queue every letter with indegree zero, pop one, append it, and lower the indegree of its neighbours. If not every letter comes out, there is a cycle. That is linear in the total length of the words. In Burst Balloons, I pad the array with ones and let dp of l and r be the best coins for balloons l to r. The key is to pick the balloon burst last: its neighbours are then fixed, and the two sides are independent. I fill the table by length, which gives O(n cubed) time and O(n squared) space.",
    followups: [
      ["How would you return every valid alien order, not just one?", "Backtrack over Kahn: at each step try every letter with indegree 0, recurse, then undo. The count can be exponential, so say so first."],
      ["Can Alien Dictionary use DFS instead of Kahn?", "Yes: DFS with three colours (unvisited, visiting, done). A back edge to a visiting node is a cycle; reverse the finish order to get the answer."],
      ["Why not choose the first balloon in Burst Balloons?", "After it bursts, its neighbours join, so the left and right parts affect each other's coins. Choosing the last one keeps the parts independent."],
      ["How would you speed up Burst Balloons memo vs table?", "Both are O(n³). The table avoids recursion depth and is easier to reason about; memo only visits reachable states, which here is all of them."],
    ],
    rubric: {
      strong: [
        "Named the two patterns being combined and how the input maps onto them (edges from adjacent words; dp over intervals with the last choice).",
        "Handled the special cases cleanly: duplicate edges, the invalid prefix and cycles, or the padded ends and the fill order.",
        "Gave time and space with the reason, and tested a small invalid or empty input out loud.",
      ],
      weak: [
        "Tried brute force over every order without finding the hidden structure.",
        "Added extra edges, counted an edge twice, or chose the first action in an interval DP.",
        "Could not explain why the method is correct or what its cost is.",
      ],
    },
  },

  quiz: [
    ["The words <code>\"abc\"</code> then <code>\"ab\"</code> appear next to each other in an Alien Dictionary input. What should the code do?",
      ["Add the edge c → b", "Return \"\": a word cannot come before its own prefix", "Ignore the pair, it gives no information", "Add the edge b → c"],
      1, "In any alphabet a prefix sorts first. Seeing the longer word first means the input is invalid, even though no letters differ."],
    ["In Burst Balloons, why does the DP pick the balloon burst LAST in <code>[l, r]</code>?",
      ["Because it gives the most coins", "Because the first balloon is always the smallest", "Because its neighbours are then fixed as a[l-1] and a[r+1], so the two sides are independent", "Because it lets the table be filled row by row"],
      2, "Bursting the first balloon makes its neighbours adjacent, which ties the left and right parts together. The last one splits them cleanly."],
    ["Kahn's algorithm finishes with fewer letters in <code>order</code> than there are letters in total. What does that mean?",
      ["Some letters never appeared in any word", "The queue was too small", "The graph had duplicate edges", "The remaining letters form a cycle, so no order exists"],
      3, "Letters on a cycle always keep indegree at least 1, so they never enter the queue. A short order means a cycle."],
  ],

  drills: [
    { prompt: "Words from an unknown language are given in sorted order. Work out an ordering of its letters that matches, or say none exists.",
      answer: "advanced", distractors: ["graphs-bfs-dfs", "tries", "greedy"],
      why: "A hidden graph: adjacent words give one before-after rule each. Topologically sort the letters and watch for cycles and the prefix trap." },
    { prompt: "Each balloon pays the product of its value and its two current neighbours when burst. Return the most you can collect by bursting them all.",
      answer: "advanced", distractors: ["dp-1d", "greedy", "backtracking"],
      why: "Interval DP: let k be the last balloon burst in [l, r], so its neighbours are fixed and the two sides split cleanly. O(n³)." },
    { prompt: "A 2 by 3 board holds tiles 1 to 5 and one gap. Return the fewest slides to reach the solved board, or -1.",
      answer: "advanced", distractors: ["graphs-bfs-dfs", "backtracking", "dp-2d"],
      why: "BFS where each node is a whole board encoded as a string; only 720 states exist." },
    { prompt: "Fill a k by k grid with the numbers 1 to k so that given pairs must appear above or below each other and given pairs must appear left or right of each other.",
      answer: "advanced", distractors: ["graphs-bfs-dfs", "backtracking", "greedy"],
      why: "Two independent topological sorts, one for rows and one for columns, then place each number at its row and column rank." },
    { prompt: "Given a string and a dictionary, return every sentence you can make by splitting the string into dictionary words.",
      answer: "advanced", distractors: ["backtracking", "tries", "dp-1d"],
      why: "Backtracking over split points joined with memoisation of each suffix, so repeated suffixes are solved once." },
    { prompt: "Choose the order to multiply a chain of matrices so that the total number of scalar multiplications is smallest.",
      answer: "advanced", distractors: ["dp-2d", "greedy", "dp-knapsack"],
      why: "Interval DP over the chain: dp[l][r] tries every split point k for the last multiplication." },
  ],

  flashcards: [
    { id: "adv-lc269", front: "Alien Dictionary (LC 269) with Kahn's algorithm: time and space?", back: "O(C + U) time, C = total letters in the words, U = distinct letters. O(U + edges) space, edges at most words - 1." },
    { id: "adv-lc312", front: "Burst Balloons (LC 312) with interval DP: time and space?", back: "O(n³) time: n² intervals times n choices of the last balloon. O(n²) space." },
    { id: "adv-kahn", front: "Kahn's topological sort on V nodes and E edges: time and space?", back: "O(V + E) time and space. A cycle exists when fewer than V nodes come out." },
    { id: "adv-lc773", front: "Sliding Puzzle (LC 773) with BFS over board states: time and space?", back: "O(6! · 6) time, about 720 states with up to 3 moves each; O(6!) space for the visited set." },
    { id: "adv-lc2392", front: "Build a Matrix With Conditions (LC 2392): time and space?", back: "O(k + R + C) time and space for two topological sorts, plus O(k²) to build the output grid." },
  ],

  problems: [269, 312, 140, 2392, 773],
});
