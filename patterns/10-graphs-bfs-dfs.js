// Pattern 10: Graphs: BFS / DFS. Writer B.
// Demo 1 "number-of-islands" (LC 200, BFS on a grid), demo 2 "course-schedule" (LC 207, Kahn's algorithm).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "graphs-bfs-dfs",
  num: 10,
  title: "Graphs: BFS / DFS",
  summary: "Explore everything reachable from a start, marking nodes as visited so each one is handled once: BFS spreads out in rings with a queue, DFS goes deep with recursion or a stack.",
  tags: ["graph", "grid", "bfs", "dfs", "connected components", "visited", "topological sort", "islands"],

  demos: [
    {
      id: "number-of-islands",
      title: "Number of Islands",
      lc: 200,
      problem: "A grid has land <code>'1'</code> and water <code>'0'</code>. Count the islands: groups of land joined up, down, left or right. <code>11000;11000;00100;00011</code> (one row per <code>;</code>) gives <code>3</code>.",
      code: [
        "int numIslands(vector<vector<char>>& grid) {",
        "    int R = (int)grid.size(), C = R ? (int)grid[0].size() : 0;",
        "    int count = 0;",
        "    int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};",
        "    for (int r = 0; r < R; r++)",
        "        for (int c = 0; c < C; c++) {",
        "            if (grid[r][c] != '1') continue;",
        "            count++;                          // a new island starts here",
        "            queue<pair<int, int>> q;",
        "            q.push({r, c});",
        "            grid[r][c] = '0';                 // mark on push, not on pop",
        "            while (!q.empty()) {",
        "                auto [i, j] = q.front(); q.pop();",
        "                for (int d = 0; d < 4; d++) {",
        "                    int ni = i + dr[d], nj = j + dc[d];",
        "                    if (ni >= 0 && ni < R && nj >= 0 && nj < C && grid[ni][nj] == '1') {",
        "                        grid[ni][nj] = '0';",
        "                        q.push({ni, nj});",
        "                    }",
        "                }",
        "            }",
        "        }",
        "    return count;",
        "}",
      ],
      fields: [{ key: "grid", label: "grid (rows split by ;)", type: "charGrid", value: "11000;11000;00100;00011" }],
      run(input, rec) {
        const grid = input.grid.map((row) => row.slice());
        const R = grid.length, C = R ? grid[0].length : 0;
        if (grid.some((row) => row.length !== C)) { rec.error("Every row must have the same length."); return null; }
        if (grid.some((row) => row.some((x) => x !== "0" && x !== "1"))) { rec.error("Cells must be 0 (water) or 1 (land)."); return null; }
        let count = 0;
        const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
        const island = {};           // "r,c" -> island number, for the marks
        const q = [];
        let shown = 0, hidden = 0;
        const frame = (f) => { if (shown < 40) { rec.frame(f); shown++; } else hidden++; };
        const views = (o) => {
          o = o || {};
          const gm = {};
          for (const [key, n] of Object.entries(island)) gm[key] = n === count ? "good" : "done";
          for (const [i, j] of q) gm[`${i},${j}`] = "path";
          Object.assign(gm, o.gm || {});
          return [
            { id: "grid", type: "grid", label: "grid (a sunk cell is set to 0)", cells: grid.map((row) => row.slice()),
              rowLabels: Array.from({ length: R }, (_, k) => String(k)), colLabels: Array.from({ length: C }, (_, k) => String(k)), marks: gm },
            { id: "q", type: "queue", label: "q (front on the left)", items: q.map(([i, j]) => `${i},${j}`), marks: o.qm || {} },
            { id: "count", type: "calc", label: "count", value: count },
          ];
        };

        frame({
          line: 3, title: "Scan the grid, count = 0",
          t: `Scan all ${R * C} cells row by row. Water and land we have already handled are skipped; the first fresh <code>'1'</code> we meet starts a new island.`,
          tip: "Each BFS sinks a whole island by setting its cells to <code>'0'</code>. So when the scan meets a <code>'1'</code>, it must belong to an island not seen yet.",
          vars: { R: R, C: C, count: 0 },
          views: views(),
        });

        let pushTip = false, edgeTip = false;
        for (let r = 0; r < R; r++) {
          for (let c = 0; c < C; c++) {
            if (grid[r][c] !== "1") continue;
            count++;
            q.length = 0;
            q.push([r, c]);
            grid[r][c] = "0";
            island[`${r},${c}`] = count;
            frame({
              line: [8, 11], title: `Island ${count} starts at ${r},${c}`,
              t: `Cell <code>(${r},${c})</code> is a fresh <code>'1'</code>, so a new island starts: <code>count = ${count}</code>. Push it and sink it right away.`,
              tip: pushTip ? undefined : "Sink a cell when you push it, not when you pop it. Otherwise two neighbours can both push the same cell before either pops it.",
              vars: { r: r, c: c, count: count, "q.size()": q.length },
              views: views({ gm: { [`${r},${c}`]: "new" }, qm: { 0: "new" } }),
              moves: [{ from: ["grid", `${r},${c}`], to: ["q", 0], label: `${r},${c}`, mark: "new" }, { from: ["grid", `${r},${c}`], to: ["count", 0], label: "+1", mark: "good" }],
            });
            pushTip = true;
            while (q.length) {
              const [i, j] = q.shift();
              frame({
                line: 13, title: `Pop ${i},${j}`,
                t: `Take <code>(${i},${j})</code> from the front of the queue and look at its four neighbours.`,
                vars: { i: i, j: j, count: count, "q.size()": q.length },
                views: views({ gm: { [`${i},${j}`]: "hot" } }),
              });
              const added = [], edge = [];
              for (let d = 0; d < 4; d++) {
                const ni = i + dr[d], nj = j + dc[d];
                if (ni >= 0 && ni < R && nj >= 0 && nj < C && grid[ni][nj] === "1") {
                  grid[ni][nj] = "0";
                  q.push([ni, nj]);
                  island[`${ni},${nj}`] = count;
                  added.push([ni, nj]);
                } else if (ni < 0 || ni >= R || nj < 0 || nj >= C) edge.push(d);
              }
              const gm = { [`${i},${j}`]: "hot" }, qm = {};
              added.forEach(([a, b], k) => { gm[`${a},${b}`] = "new"; qm[q.length - added.length + k] = "new"; });
              const showEdgeTip = !edgeTip && edge.length > 0;
              frame({
                line: added.length ? [17, 18] : 16, title: added.length ? `Sink and queue ${added.length}` : "No fresh land around",
                t: added.length
                  ? `${added.map(([a, b]) => `<code>(${a},${b})</code>`).join(", ")} ${added.length > 1 ? "are" : "is"} land next to <code>(${i},${j})</code>. Sink ${added.length > 1 ? "each" : "it"} and add ${added.length > 1 ? "them" : "it"} to the queue.`
                  : `Every neighbour of <code>(${i},${j})</code> is water, already sunk, or off the grid. Nothing is added.`,
                tip: showEdgeTip ? "The bounds check comes first in the condition, so <code>grid[ni][nj]</code> is never read outside the grid." : undefined,
                vars: { i: i, j: j, count: count, "q.size()": q.length },
                views: views({ gm: gm, qm: qm }),
                moves: added.slice(0, 3).map(([a, b], k) => ({ from: ["grid", `${a},${b}`], to: ["q", q.length - added.length + k], label: `${a},${b}`, mark: "new" })),
              });
              if (showEdgeTip) edgeTip = true;
            }
            frame({
              line: 12, title: `Island ${count} fully sunk`,
              t: `The queue is empty, so every land cell joined to <code>(${r},${c})</code> is sunk. Island ${count} is done; the scan goes on from the next cell.`,
              vars: { r: r, c: c, count: count, "q.size()": 0 },
              views: views({ gm: Object.fromEntries(Object.entries(island).filter(([, n]) => n === count).map(([key]) => [key, "done"])) }),
            });
          }
        }

        frame({
          line: 23, title: `Return ${count}`,
          t: R * C === 0 ? "The grid is empty, so there are <b>0</b> islands." : `The scan reached the last cell. There ${count === 1 ? "is" : "are"} <b>${count}</b> island${count === 1 ? "" : "s"}.`,
          tip: "O(R·C) time: each cell is scanned once and pushed at most once. The queue and the sunk marks need O(R·C) space in the worst case.",
          vars: { count: count },
          views: views({ gm: Object.fromEntries(Object.keys(island).map((key) => [key, "done"])) }),
        });
        if (hidden) rec.truncated(hidden);
        return count;
      },
      expect: [
        [{ grid: "11000;11000;00100;00011" }, 3],
        [{ grid: "11110;11010;11000;00000" }, 1],
        [{ grid: "0" }, 0],
        [{ grid: "1" }, 1],
        [{ grid: "101;010;101" }, 5],
        [{ grid: "111;101;111" }, 1],
      ],
    },
    {
      id: "course-schedule",
      title: "Course Schedule",
      lc: 207,
      problem: "There are <code>numCourses</code> courses. A pair <code>[a, b]</code> means you must take <code>b</code> before <code>a</code>. Return whether you can finish them all. <code>numCourses = 2</code>, <code>[[1,0]]</code> gives <code>true</code>; <code>[[1,0],[0,1]]</code> gives <code>false</code>.",
      code: [
        "bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {",
        "    vector<vector<int>> adj(numCourses);",
        "    vector<int> indeg(numCourses, 0);",
        "    for (auto& p : prerequisites) {         // [a, b]: take b before a",
        "        adj[p[1]].push_back(p[0]);",
        "        indeg[p[0]]++;",
        "    }",
        "    queue<int> q;",
        "    for (int i = 0; i < numCourses; i++)",
        "        if (indeg[i] == 0) q.push(i);       // nothing left to wait for",
        "    int taken = 0;",
        "    while (!q.empty()) {",
        "        int u = q.front(); q.pop();",
        "        taken++;",
        "        for (int v : adj[u])",
        "            if (--indeg[v] == 0) q.push(v);",
        "    }",
        "    return taken == numCourses;",
        "}",
      ],
      fields: [
        { key: "numCourses", label: "numCourses", type: "int", value: "2" },
        { key: "prerequisites", label: "prerequisites [a, b]", type: "tuples", value: "1,0" },
      ],
      run(input, rec) {
        const n = input.numCourses, pre = input.prerequisites;
        if (n < 1 || n > 20) { rec.error("numCourses must be between 1 and 20 here, so the graph fits on screen."); return null; }
        for (const p of pre) {
          if (p.length !== 2) { rec.error("Each prerequisite is a pair a,b."); return null; }
          if (p.some((x) => x < 0 || x >= n)) { rec.error(`Course numbers must be between 0 and ${n - 1}.`); return null; }
        }
        const adj = Array.from({ length: n }, () => []);
        const indeg = new Array(n).fill(0);
        const edges = [];
        const q = [];
        const taken = new Set();
        let takenCount = 0;
        let shown = 0, hidden = 0;
        const frame = (f) => { if (shown < 40) { rec.frame(f); shown++; } else hidden++; };
        const views = (o) => {
          o = o || {};
          const gm = {}, am = {};
          for (const u of taken) { gm[u] = "done"; am[u] = "done"; }
          for (const u of q) gm[u] = "path";
          Object.assign(gm, o.gm || {});
          Object.assign(am, o.am || {});
          return [
            { id: "g", type: "graph", label: "courses (an arrow b → a means take b first)", directed: true,
              nodes: Array.from({ length: n }, (_, k) => ({ id: String(k), label: String(k) })),
              edges: edges.map((e) => [String(e[0]), String(e[1])]),
              marks: gm, edgeMarks: o.em || {}, badges: Object.fromEntries(indeg.map((d, k) => [String(k), `in ${d}`])) },
            { id: "q", type: "queue", label: "q: courses ready to take", items: q.map(String), marks: o.qm || {} },
            { id: "indeg", type: "array", label: "indeg (prerequisites not yet taken)", values: indeg.slice(), marks: am },
            { id: "taken", type: "calc", label: "taken", value: takenCount },
          ];
        };

        frame({
          line: [2, 3], title: "Empty graph",
          t: `Make an empty adjacency list and an in-degree count for each of the ${n} courses. In-degree means how many prerequisites a course is still waiting for.`,
          vars: { numCourses: n, taken: 0 },
          views: views(),
        });

        let buildTip = false;
        for (const p of pre) {
          adj[p[1]].push(p[0]);
          indeg[p[0]]++;
          edges.push([p[1], p[0]]);
          frame({
            line: [5, 6], title: `Edge ${p[1]} → ${p[0]}`,
            t: `<code>[${p[0]}, ${p[1]}]</code>: course ${p[1]} must come before ${p[0]}. Add the arrow ${p[1]} → ${p[0]} and raise <code>indeg[${p[0]}]</code> to ${indeg[p[0]]}.`,
            tip: buildTip ? undefined : "The arrow points from the prerequisite to the course that needs it. Taking a course then means following its arrows and freeing what it unlocks.",
            vars: { a: p[0], b: p[1], [`indeg[${p[0]}]`]: indeg[p[0]] },
            views: views({ em: { [`${p[1]}-${p[0]}`]: "new" }, am: { [p[0]]: "new" } }),
          });
          buildTip = true;
        }

        for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
        frame({
          line: [9, 10], title: q.length ? `Seed queue: ${q.length} ready` : "Nothing is ready",
          t: q.length
            ? `Course${q.length > 1 ? "s" : ""} ${q.join(", ")} ${q.length > 1 ? "have" : "has"} in-degree 0, so ${q.length > 1 ? "they are" : "it is"} ready to take now. ${q.length > 1 ? "They go" : "It goes"} in the queue.`
            : "Every course waits for another one. With nothing to start from, no course can ever be taken.",
          tip: "This is Kahn's algorithm for topological order: repeatedly take a course with no prerequisites left, then remove its arrows.",
          vars: { "q.size()": q.length, taken: 0 },
          views: views({ qm: Object.fromEntries(q.map((_, k) => [k, "new"])), am: Object.fromEntries(q.map((u) => [u, "good"])) }),
          moves: q.slice(0, 3).map((u, k) => ({ from: ["indeg", u], to: ["q", k], label: String(u), mark: "new" })),
        });

        let unlockTip = false;
        while (q.length) {
          const u = q.shift();
          takenCount++;
          taken.add(u);
          frame({
            line: [13, 14], title: `Take course ${u}`,
            t: `Pop course ${u} and take it: <code>taken = ${takenCount}</code>. ${adj[u].length ? `Follow its arrow${adj[u].length > 1 ? "s" : ""} to ${adj[u].join(", ")}.` : "No course depends on it."}`,
            vars: { u: u, taken: takenCount, "q.size()": q.length },
            views: views({ gm: { [u]: "hot" } }),
            moves: [{ from: ["q", 0], to: ["taken", 0], label: String(u), mark: "good" }],
          });
          for (const v of adj[u]) {
            indeg[v]--;
            const ready = indeg[v] === 0;
            if (ready) q.push(v);
            frame({
              line: 16, title: ready ? `${v} is ready: queue it` : `indeg[${v}] drops to ${indeg[v]}`,
              t: ready
                ? `Course ${u} was the last prerequisite of ${v}: <code>indeg[${v}]</code> is now 0, so push ${v}.`
                : `Course ${v} still waits for ${indeg[v]} more prerequisite${indeg[v] > 1 ? "s" : ""}, so it stays out of the queue.`,
              tip: ready && !unlockTip ? "A course enters the queue exactly once, at the moment its count hits 0. That is why each node and each edge is handled once." : undefined,
              vars: { u: u, v: v, [`indeg[${v}]`]: indeg[v], taken: takenCount },
              views: views({ gm: { [u]: "hot", [v]: ready ? "new" : "warn" }, em: { [`${u}-${v}`]: "in" }, am: { [v]: ready ? "new" : "warn" }, qm: ready ? { [q.length - 1]: "new" } : {} }),
              moves: ready ? [{ from: ["indeg", v], to: ["q", q.length - 1], label: String(v), mark: "new" }] : undefined,
            });
            if (ready) unlockTip = true;
          }
        }

        const ok = takenCount === n;
        const stuck = [];
        for (let k = 0; k < n; k++) if (!taken.has(k)) stuck.push(k);
        frame({
          line: 18, title: ok ? "All taken: true" : `Stuck: false`,
          t: ok ? `All ${n} courses were taken, so a valid order exists: <b>true</b>.`
            : `Only ${takenCount} of ${n} courses were taken. Course${stuck.length > 1 ? "s" : ""} ${stuck.join(", ")} never reached in-degree 0, because they sit on or behind a cycle: <b>false</b>.`,
          tip: "O(V + E) time and space: each course is queued once and each arrow is followed once.",
          vars: { taken: takenCount, numCourses: n, result: ok },
          views: views({ gm: Object.fromEntries(stuck.map((k) => [k, "bad"])), am: Object.fromEntries(stuck.map((k) => [k, "bad"])) }),
        });
        if (hidden) rec.truncated(hidden);
        return ok;
      },
      expect: [
        [{ numCourses: "2", prerequisites: "1,0" }, true],
        [{ numCourses: "2", prerequisites: "1,0;0,1" }, false],
        [{ numCourses: "1", prerequisites: "" }, true],
        [{ numCourses: "4", prerequisites: "1,0;2,0;3,1;3,2" }, true],
        [{ numCourses: "3", prerequisites: "1,0;2,1;0,2" }, false],
        [{ numCourses: "5", prerequisites: "1,0;2,1;3,2;2,3" }, false],
        [{ numCourses: "1", prerequisites: "0,0" }, false],
      ],
    },
  ],

  explain: {
    plain: "A graph is a set of nodes joined by edges; a grid is a graph where each cell joins its neighbours. BFS and DFS both visit everything reachable from a start and mark each node as visited so it is handled once. BFS uses a queue and moves outward in rings, which also gives shortest paths when every edge costs the same.",
    spot: [
      "A grid of cells where you count, fill or measure connected regions (islands, flood fill, rotting oranges).",
      "\"Fewest steps\", \"minimum moves\", \"shortest transformation\" with every step costing 1: BFS from the start.",
      "Tasks with prerequisites, build order, \"can all be finished\": a directed graph with topological sort or cycle detection.",
      "Copy a graph, or find which cells can reach a border (LC 133, LC 417): one traversal with a visited map.",
      "The input is a list of pairs or edges and the question is about reachability or connected groups.",
    ],
    notWhen: [
      "Edges have different weights and you need the cheapest path: use Dijkstra with a heap.",
      "The question is only which nodes end up connected as edges arrive one by one: Union-Find is simpler.",
      "The structure is a tree with no cycles: plain tree recursion needs no visited set.",
    ],
    template: [
      "// BFS from a start node over an adjacency list. Returns the distance to every node (-1 = unreachable).",
      "vector<int> bfs(const vector<vector<int>>& adj, int start) {",
      "    vector<int> dist(adj.size(), -1);",
      "    queue<int> q;",
      "    dist[start] = 0;                     // mark when pushed",
      "    q.push(start);",
      "    while (!q.empty()) {",
      "        int u = q.front(); q.pop();",
      "        for (int v : adj[u]) {",
      "            if (dist[v] != -1) continue; // already visited",
      "            dist[v] = dist[u] + 1;",
      "            q.push(v);",
      "        }",
      "    }",
      "    return dist;",
      "}",
      "",
      "// DFS with recursion: mark, then visit unvisited neighbours.",
      "void dfs(const vector<vector<int>>& adj, int u, vector<bool>& seen) {",
      "    seen[u] = true;",
      "    for (int v : adj[u])",
      "        if (!seen[v]) dfs(adj, v, seen);",
      "}",
    ],
    templateNotes: [
      "Mark a node as visited when you push it, not when you pop it, or the same node can sit in the queue several times.",
      "In BFS the first time you reach a node is along a shortest path (unit weights), so <code>dist[u] + 1</code> is final.",
      "For a grid, the neighbours are the four cells <code>(r±1, c)</code> and <code>(r, c±1)</code>; check bounds before reading the cell.",
      "To count components, loop over every node and start a new BFS or DFS from each one not yet visited.",
      "For a directed graph with prerequisites, Kahn's algorithm (in-degree plus a queue) finds an order and detects a cycle in one pass.",
    ],
    variants: [
      ["Count components / flood fill", "Start a traversal from every unvisited node", "200, 695, 733"],
      ["Shortest steps, unit weights", "BFS level by level from the start", "127, 994, 1091"],
      ["Multi-source BFS", "Push every source first, then spread together", "994, 417, 542"],
      ["Topological sort / cycle check", "Kahn's in-degree queue, or DFS with three colours", "207, 210, 269"],
    ],
    mistakes: [
      "Marking visited on pop instead of on push, so the same cell is queued many times and the run slows down badly.",
      "Forgetting the visited check on a graph with cycles, so DFS or BFS loops forever.",
      "Reading <code>grid[ni][nj]</code> before checking that <code>ni</code> and <code>nj</code> are inside the grid.",
      "Reversing the prerequisite edge: <code>[a, b]</code> means b comes first, so the arrow is b → a and a's in-degree goes up.",
      "Using recursive DFS on a huge grid, which can overflow the call stack. Use BFS or an explicit stack.",
      "Using BFS for shortest paths when edges have different weights. That needs Dijkstra.",
    ],
    complexity: [
      ["BFS or DFS on a graph", "O(V + E)", "O(V)", "Each node is visited once and each edge is looked at once (twice if undirected)."],
      ["BFS or DFS on an R×C grid", "O(R·C)", "O(R·C)", "Each cell is a node with at most 4 edges; the visited marks or queue can hold every cell."],
      ["Kahn's topological sort", "O(V + E)", "O(V + E)", "Each course is queued once and each arrow lowers one in-degree once."],
    ],
    sayIt: "When the input is a grid or a list of edges and the question is about what is connected or reachable, I model it as a graph and traverse it. For counting regions like islands, I scan every cell, and each time I find unvisited land I add one to the count and run a BFS from it that marks the whole region. I mark a cell as visited when I push it, not when I pop it, so nothing enters the queue twice. If every step costs the same, BFS also gives the fewest steps, because it reaches nodes in order of distance. For prerequisites I build a directed graph from prerequisite to course, count in-degrees, and run Kahn's algorithm: start with every course that has none, and each time I take one, lower the counts of the courses it unlocks. If I take them all, there is no cycle. Time is O(V + E), or O(R times C) on a grid.",
    followups: [
      ["Would DFS work for Number of Islands?", "Yes. Recursive DFS that sinks each cell gives the same count in O(R·C). On a very large grid the recursion depth can hit R·C, so BFS or an explicit stack is safer."],
      ["How would you return a valid course order (LC 210)?", "Record each course as it is popped in Kahn's algorithm. If the list has every course, return it; otherwise return empty."],
      ["How do you detect a cycle with DFS instead?", "Colour nodes white, grey (on the current path) and black (finished). Reaching a grey node again means a back edge, so there is a cycle."],
      ["What if the grid is too big to fit in memory?", "Process it row by row with Union-Find over the current and previous row, merging islands that touch."],
    ],
    rubric: {
      strong: [
        "Turned the input into nodes and edges clearly and chose BFS, DFS or Kahn's algorithm for a stated reason.",
        "Marked visited at the right moment, checked bounds first, and got the edge direction right for directed graphs.",
        "Gave O(V + E) or O(R·C) time and the space for visited and the queue, and tested an empty or single-cell input and a cycle.",
      ],
      weak: [
        "Started coding without saying what a node and an edge are, or what visited means.",
        "Marked visited on pop, read cells out of bounds, or reversed the prerequisite edges.",
        "Used BFS for weighted shortest paths, or could not explain why each node is processed once.",
      ],
    },
  },

  quiz: [
    ["In grid BFS, why mark a cell as visited when it is pushed rather than when it is popped?",
      ["Because popping is slower than pushing", "Because the queue cannot hold duplicates", "So two neighbours cannot both push the same cell before it is popped", "So the answer comes out in sorted order"],
      2, "Between the push and the pop, other cells may see the same neighbour. Marking on push stops it from being queued again."],
    ["In LC 207, Kahn's algorithm takes only 3 of 5 courses before the queue empties. What does that mean?",
      ["The other 2 courses sit on or behind a cycle, so the answer is false", "The other 2 courses have no prerequisites", "The graph is undirected", "The algorithm must be run again from course 0"],
      0, "Courses on a cycle wait for each other, so their in-degree never reaches 0 and they never enter the queue."],
    ["Which problem should <b>not</b> use plain BFS for its answer?",
      ["Fewest moves for a knight to reach a square", "Fewest word changes from one word to another", "Cheapest flight route where each flight has a different price", "Minutes until all oranges rot"],
      2, "Plain BFS gives the fewest edges, not the lowest total weight. Different prices need Dijkstra with a heap."],
  ],

  drills: [
    { prompt: "Given a grid where 2 is a rotten orange, 1 a fresh one and 0 empty, each minute rot spreads to adjacent fresh oranges. Return the minutes until none are fresh, or -1.",
      answer: "graphs-bfs-dfs", distractors: ["dp-2d", "greedy", "shortest-path-union-find"],
      why: "Many starting points spreading one step per minute: a multi-source BFS that counts levels." },
    { prompt: "Given a node of a connected undirected graph, return a full copy of the graph with new nodes.",
      answer: "graphs-bfs-dfs", distractors: ["linked-lists", "trees", "backtracking"],
      why: "Traverse the graph with BFS or DFS and keep a map from each original node to its copy, which also serves as the visited set." },
    { prompt: "Given a list of tasks and pairs saying which task must finish before another, return an order that does every task, or an empty list if impossible.",
      answer: "graphs-bfs-dfs", distractors: ["greedy", "heaps", "intervals"],
      why: "Prerequisites form a directed graph. Kahn's algorithm (in-degree and a queue) gives a topological order or shows a cycle." },
    { prompt: "Given a height map, return the cells from which rain can flow to both the top-left ocean edge and the bottom-right ocean edge.",
      answer: "graphs-bfs-dfs", distractors: ["dp-2d", "two-pointers", "binary-search"],
      why: "Run a BFS inward from each ocean's border cells (moving to higher or equal cells) and return cells reached by both." },
    { prompt: "Given a start word, an end word and a word list, return the fewest single-letter changes to reach the end word, each step being a word in the list.",
      answer: "graphs-bfs-dfs", distractors: ["dp-1d", "tries", "backtracking"],
      why: "Words are nodes and one-letter changes are edges of cost 1. Fewest steps with equal costs is BFS." },
    { prompt: "Given a grid of 0s and 1s, return the area of the largest group of 1s joined up, down, left or right.",
      answer: "graphs-bfs-dfs", distractors: ["dp-2d", "prefix-sum-hashing", "shortest-path-union-find"],
      why: "Connected regions on a grid: BFS or DFS from each unvisited 1, counting cells as you mark them." },
  ],

  flashcards: [
    { id: "gr-bfs", front: "BFS or DFS on a graph with V nodes and E edges: time and space?", back: "O(V + E) time. O(V) space for the visited marks plus the queue or recursion stack." },
    { id: "gr-islands", front: "Number of Islands (LC 200) on an R×C grid: time and space?", back: "O(R·C) time. O(R·C) worst-case space for the queue or recursion; sinking cells in place avoids a separate visited array." },
    { id: "gr-kahn", front: "Course Schedule (LC 207) with Kahn's algorithm: time and space?", back: "O(V + E) time and O(V + E) space for the adjacency list, in-degrees and queue." },
    { id: "gr-unit", front: "Why does BFS give shortest paths only when all edges cost the same?", back: "BFS reaches nodes in order of edge count. With different weights, a path with more edges can be cheaper, so you need Dijkstra." },
    { id: "gr-clone", front: "Clone Graph (LC 133): time and space?", back: "O(V + E) time and O(V) space for the map from original node to copy." },
  ],

  problems: [200, 133, 207, 417, 127],
});
