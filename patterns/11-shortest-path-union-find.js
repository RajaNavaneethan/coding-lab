// Pattern 11: Graphs: Shortest Path / Union-Find. Writer C.
// Demo 1 "network-delay" (LC 743, Dijkstra), demo 2 "redundant-connection" (LC 684, Union-Find).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "shortest-path-union-find",
  num: 11,
  title: "Graphs: Shortest Path / Union-Find",
  summary: "Dijkstra pops the closest unsettled node from a min-heap and relaxes its edges; Union-Find keeps a parent per node so two finds tell you if two nodes are already connected.",
  tags: ["dijkstra", "weighted graph", "shortest path", "union find", "disjoint set", "connected components", "cycle", "min-heap"],

  demos: [
    {
      id: "network-delay",
      title: "Network Delay Time",
      lc: 743,
      problem: "A signal leaves node <code>k</code>. Each <code>times[i] = [u, v, w]</code> is a one-way link that takes <code>w</code> time. Return how long until all <code>n</code> nodes have the signal, or <code>-1</code> if some node never gets it. <code>times = [[2,1,1],[2,3,1],[3,4,1]]</code>, <code>n = 4</code>, <code>k = 2</code> gives <code>2</code>.",
      code: [
        "int networkDelayTime(vector<vector<int>>& times, int n, int k) {",
        "    vector<vector<pair<int, int>>> adj(n + 1);  // adj[u] = {(v, w)}",
        "    for (auto& t : times) adj[t[0]].push_back({t[1], t[2]});",
        "    vector<int> dist(n + 1, INT_MAX);",
        "    dist[k] = 0;",
        "    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> pq;",
        "    pq.push({0, k});",
        "    while (!pq.empty()) {",
        "        auto [d, u] = pq.top(); pq.pop();",
        "        if (d > dist[u]) continue;  // stale entry",
        "        for (auto [v, w] : adj[u]) {",
        "            if (d + w < dist[v]) {",
        "                dist[v] = d + w;",
        "                pq.push({dist[v], v});",
        "            }",
        "        }",
        "    }",
        "    int ans = 0;",
        "    for (int i = 1; i <= n; i++) {",
        "        if (dist[i] == INT_MAX) return -1;",
        "        ans = max(ans, dist[i]);",
        "    }",
        "    return ans;",
        "}",
      ],
      fields: [
        { key: "times", label: "times [u, v, w]", type: "tuples", value: "2,1,1;2,3,1;3,4,1" },
        { key: "n", label: "n", type: "int", value: "4" },
        { key: "k", label: "k", type: "int", value: "2" },
      ],
      run(input, rec) {
        const times = input.times, n = input.n, k = input.k;
        if (n < 1 || n > 9) { rec.error("Use n from 1 to 9 so the graph stays readable."); return null; }
        if (k < 1 || k > n) { rec.error(`k must be between 1 and ${n}.`); return null; }
        for (const t of times) {
          if (t.length !== 3) { rec.error("Each edge is u,v,w."); return null; }
          if (t[0] < 1 || t[0] > n || t[1] < 1 || t[1] > n) { rec.error(`Node numbers must be between 1 and ${n}.`); return null; }
          if (t[2] < 0 || t[2] > 100) { rec.error("Times must be between 0 and 100. Dijkstra needs weights that are not negative."); return null; }
        }
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        const adj = Array.from({ length: n + 1 }, () => []);
        for (const t of times) adj[t[0]].push([t[1], t[2]]);
        const dist = new Array(n + 1).fill(Infinity);
        const pred = new Array(n + 1).fill(0);
        const done = new Set();
        const pq = [];
        const less = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
        const push = (item) => {
          pq.push(item);
          let i = pq.length - 1;
          while (i > 0) {
            const p = (i - 1) >> 1;
            if (!less(pq[i], pq[p])) break;
            [pq[i], pq[p]] = [pq[p], pq[i]];
            i = p;
          }
          return i;
        };
        const pop = () => {
          const top = pq[0], last = pq.pop();
          if (pq.length) {
            pq[0] = last;
            let i = 0;
            for (;;) {
              const a = 2 * i + 1, b = a + 1;
              let m = i;
              if (a < pq.length && less(pq[a], pq[m])) m = a;
              if (b < pq.length && less(pq[b], pq[m])) m = b;
              if (m === i) break;
              [pq[i], pq[m]] = [pq[m], pq[i]];
              i = m;
            }
          }
          return top;
        };
        const D = (x) => (x === Infinity ? "∞" : String(x));
        const P = (it) => `(${it[0]},${it[1]})`;

        const views = (o) => {
          o = o || {};
          const gm = {}, dm = { 0: "dim" }, em = {};
          for (const u of done) { gm[u] = "done"; dm[u] = "done"; }
          for (let v = 1; v <= n; v++) if (pred[v]) em[`${pred[v]}-${v}`] = "path";
          Object.assign(gm, o.gm || {});
          Object.assign(dm, o.dm || {});
          Object.assign(em, o.em || {});
          return [
            { id: "g", type: "graph", label: "network (badge = dist)", directed: true,
              nodes: Array.from({ length: n }, (_, i) => ({ id: String(i + 1), label: String(i + 1) })),
              edges: times.map((t) => [String(t[0]), String(t[1]), t[2]]),
              marks: gm, edgeMarks: em,
              badges: Object.fromEntries(Array.from({ length: n }, (_, i) => [String(i + 1), D(dist[i + 1])])) },
            { id: "pq", type: "heap", kind: "min", label: "pq (dist, node)", values: pq.map(P), marks: o.hm || {} },
            { id: "dist", type: "array", label: "dist (index 0 unused)", values: ["-"].concat(dist.slice(1).map(D)), marks: dm },
          ];
        };

        frame({
          line: [2, 3], title: "Build the adjacency list",
          t: `Store each link <code>u → v</code> with its time <code>w</code> under <code>adj[u]</code>: ${times.length} link${times.length === 1 ? "" : "s"} over ${n} node${n === 1 ? "" : "s"}. Every distance starts at infinity.`,
          vars: { n: n, k: k },
          views: views(),
        });

        dist[k] = 0;
        push([0, k]);
        frame({
          line: [4, 7], title: `Start at node ${k}`,
          t: `The signal starts at node ${k}, so <code>dist[${k}] = 0</code>. Push <code>(0, ${k})</code> onto the min-heap, which always hands back the smallest time first.`,
          tip: "<code>dist[v]</code> is the best time found so far, not the final one. A node's time is final only when its entry comes off the heap.",
          vars: { n: n, k: k, [`dist[${k}]`]: 0 },
          views: views({ dm: { [k]: "new" }, hm: { 0: "new" }, gm: { [k]: "new" } }),
          moves: [{ from: ["dist", k], to: ["pq", 0], label: "(0," + k + ")" }],
        });

        let settleTip = false, staleTip = false, lazyTip = false;
        while (pq.length) {
          const top = pop();
          const d = top[0], u = top[1];
          if (d > dist[u]) {
            frame({
              line: 10, title: `Skip stale (${d},${u})`,
              t: `Popped <code>(${d}, ${u})</code>, but <code>dist[${u}]</code> is already ${D(dist[u])}, smaller than ${d}. This entry is left over from before a better path was found, so skip it.`,
              tip: staleTip ? undefined : "This check replaces decrease-key. Pushing a fresh entry and skipping old ones keeps the code short and costs only O(log E) per extra entry.",
              vars: { d: d, u: u, [`dist[${u}]`]: D(dist[u]), "pq.size()": pq.length },
              views: views({ gm: { [u]: "dim" }, dm: { [u]: "in" } }),
              moves: [{ from: ["pq", 0], to: ["g", String(u)], label: P(top), mark: "dim" }],
            });
            staleTip = true;
            continue;
          }
          done.add(u);
          frame({
            line: 9, title: `Pop (${d},${u}): settle ${u}`,
            t: `<code>(${d}, ${u})</code> is the smallest time on the heap. Every other path would start from a time at least ${d} and only add non-negative weights, so node ${u} is settled at <b>${d}</b>.`,
            tip: settleTip ? undefined : "This is the greedy step. It is only safe because no weight is negative; with negative weights use Bellman-Ford.",
            vars: { d: d, u: u, [`dist[${u}]`]: d, "pq.size()": pq.length },
            views: views({ gm: { [u]: "hot" } }),
            moves: [{ from: ["pq", 0], to: ["g", String(u)], label: P(top) }],
          });
          settleTip = true;
          for (const [v, w] of adj[u]) {
            if (d + w < dist[v]) {
              const old = dist[v];
              dist[v] = d + w;
              pred[v] = u;
              const idx = push([dist[v], v]);
              let tip;
              if (old !== Infinity && !lazyTip) { tip = `The old entry for node ${v} with time ${old} stays in the heap. It will be popped later and skipped as stale.`; lazyTip = true; }
              frame({
                line: [13, 14], title: `Relax ${u} → ${v}: ${dist[v]}`,
                t: `<code>d + w = ${d} + ${w} = ${dist[v]}</code> beats <code>dist[${v}] = ${D(old)}</code>. Save it and push <code>(${dist[v]}, ${v})</code>.`,
                tip: tip,
                vars: { u: u, v: v, w: w, "d + w": dist[v], [`dist[${v}]`]: dist[v] },
                views: views({ gm: { [u]: "hot", [v]: "new" }, dm: { [v]: "new" }, hm: { [idx]: "new" }, em: { [`${u}-${v}`]: "hot" } }),
                moves: [{ from: ["dist", v], to: ["pq", idx], label: P([dist[v], v]) }],
              });
            } else {
              frame({
                line: 12, title: `No gain ${u} → ${v}`,
                t: `<code>d + w = ${d} + ${w} = ${d + w}</code> is not less than <code>dist[${v}] = ${D(dist[v])}</code>${done.has(v) ? `, and node ${v} is already settled` : ""}. Leave it.`,
                vars: { u: u, v: v, w: w, "d + w": d + w, [`dist[${v}]`]: D(dist[v]) },
                views: views({ gm: { [u]: "hot", [v]: "in" }, dm: { [v]: "in" }, em: { [`${u}-${v}`]: "dim" } }),
              });
            }
          }
        }

        let ans = 0, far = 1;
        for (let i = 1; i <= n; i++) {
          if (dist[i] === Infinity) {
            frame({
              line: 20, title: `Node ${i} unreached: -1`,
              t: `The heap is empty and <code>dist[${i}]</code> is still infinity: no path of links reaches node ${i} from node ${k}. Return <b>-1</b>.`,
              tip: "An empty heap means every node reachable from k is settled. Anything still at infinity is cut off.",
              vars: { i: i, [`dist[${i}]`]: "∞" },
              views: views({ gm: { [i]: "bad" }, dm: { [i]: "bad" } }),
            });
            if (total > 40) rec.truncated(total - 40);
            return -1;
          }
          if (dist[i] > ans) { ans = dist[i]; far = i; }
        }
        frame({
          line: 23, title: `Return ${ans}`,
          t: `Every node is settled. The last one to hear the signal is node ${far} at time ${ans}, so the whole network has it after <b>${ans}</b>.`,
          tip: "O((V + E) log E) time with a binary heap: each edge can push one entry and each entry is popped once. O(V + E) space.",
          vars: { ans: ans, node: far },
          views: views({ gm: { [far]: "good" }, dm: { [far]: "good" } }),
        });
        if (total > 40) rec.truncated(total - 40);
        return ans;
      },
      expect: [
        [{ times: "2,1,1;2,3,1;3,4,1", n: "4", k: "2" }, 2],
        [{ times: "1,2,1", n: "2", k: "1" }, 1],
        [{ times: "1,2,1", n: "2", k: "2" }, -1],
        [{ times: "1,2,5;1,3,1;3,2,1", n: "3", k: "1" }, 2],
        [{ times: "", n: "1", k: "1" }, 0],
        [{ times: "1,2,0;2,3,4;1,3,9", n: "3", k: "1" }, 4],
      ],
    },
    {
      id: "redundant-connection",
      title: "Redundant Connection",
      lc: 684,
      problem: "A tree with <code>n</code> nodes labelled 1 to <code>n</code> had one extra edge added. Given the <code>n</code> edges in order, return the edge that can be removed so the rest is a tree; if several work, return the one that appears last. <code>[[1,2],[2,3],[3,4],[1,4],[1,5]]</code> gives <code>[1,4]</code>.",
      code: [
        "class UF {",
        "    vector<int> parent, rk;",
        "public:",
        "    UF(int n) : parent(n), rk(n, 0) {",
        "        iota(parent.begin(), parent.end(), 0);",
        "    }",
        "    int find(int x) {",
        "        while (parent[x] != x) {",
        "            parent[x] = parent[parent[x]];  // path halving",
        "            x = parent[x];",
        "        }",
        "        return x;",
        "    }",
        "    bool unite(int a, int b) {",
        "        int ra = find(a), rb = find(b);",
        "        if (ra == rb) return false;  // already connected: cycle",
        "        if (rk[ra] < rk[rb]) swap(ra, rb);",
        "        parent[rb] = ra;",
        "        if (rk[ra] == rk[rb]) rk[ra]++;",
        "        return true;",
        "    }",
        "};",
        "",
        "vector<int> findRedundantConnection(vector<vector<int>>& edges) {",
        "    int n = edges.size();",
        "    UF uf(n + 1);  // nodes are 1..n",
        "    for (auto& e : edges) {",
        "        if (!uf.unite(e[0], e[1])) return e;",
        "    }",
        "    return {};",
        "}",
      ],
      fields: [{ key: "edges", label: "edges [a, b]", type: "tuples", value: "1,2;2,3;3,4;1,4;1,5" }],
      run(input, rec) {
        const edges = input.edges;
        const n = edges.length;
        if (n > 10) { rec.error("Use at most 10 edges so the forest stays readable."); return null; }
        for (const e of edges) {
          if (e.length !== 2) { rec.error("Each edge is a pair a,b."); return null; }
          if (e.some((x) => x < 1 || x > n)) { rec.error(`Node labels must be between 1 and ${n} (the number of edges).`); return null; }
        }
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        const parent = Array.from({ length: n + 1 }, (_, i) => i);
        const rk = new Array(n + 1).fill(0);
        let cur = -1, bad = -1;
        // find with path halving; records the nodes walked and any parent it rewrote
        const find = (x, walk, relinks) => {
          walk.push(x);
          while (parent[x] !== x) {
            const before = parent[x];
            parent[x] = parent[parent[x]];
            if (parent[x] !== before) relinks.push([x, before, parent[x]]);
            x = parent[x];
            walk.push(x);
          }
          return x;
        };

        const views = (o) => {
          o = o || {};
          const em = {};
          edges.forEach((_, i) => { em[i] = i < cur ? "done" : "dim"; });
          if (cur >= 0 && cur < n) em[cur] = "hot";
          if (bad >= 0) em[bad] = "bad";
          const pm = { 0: "dim" }, rm = { 0: "dim" };
          Object.assign(pm, o.pm || {});
          Object.assign(rm, o.rm || {});
          return [
            { id: "edges", type: "array", label: "edges, in order", values: edges.map((e) => `${e[0]}-${e[1]}`), marks: em, showIndex: false },
            { id: "f", type: "forest", label: "forest: each node points to its parent",
              nodes: Array.from({ length: n }, (_, i) => ({ id: String(i + 1), val: String(i + 1), parent: parent[i + 1] === i + 1 ? null : String(parent[i + 1]) })),
              marks: o.fm || {}, edgeMarks: o.fem || {} },
            { id: "parent", type: "array", label: "parent", values: parent.slice(), marks: pm },
            { id: "rk", type: "array", label: "rk (rank: upper bound on height)", values: rk.slice(), marks: rm },
          ];
        };

        frame({
          line: 26, title: "Every node is its own root",
          t: `There are ${n} edges, so the nodes are 1 to ${n}. <code>UF uf(${n + 1})</code> sets <code>parent[i] = i</code>: each node starts as its own one-node tree. Index 0 is unused.`,
          tip: "Two nodes are connected exactly when <code>find</code> gives them the same root. The trees here are not the input graph; they only record which nodes are already joined.",
          vars: { n: n },
          views: views(),
        });

        let unionTip = false, relinkTip = false;
        for (cur = 0; cur < n; cur++) {
          const [a, b] = edges[cur];
          const wa = [], wb = [], rel = [];
          const ra0 = find(a, wa, rel), rb0 = find(b, wb, rel);
          const fm = {}, fem = {};
          [...wa, ...wb].forEach((x) => { fm[x] = "path"; });
          for (let i = 0; i + 1 < wa.length; i++) fem[`${wa[i + 1]}-${wa[i]}`] = "path";
          for (let i = 0; i + 1 < wb.length; i++) fem[`${wb[i + 1]}-${wb[i]}`] = "path";
          fm[ra0] = "hot"; fm[rb0] = "hot";
          const pathTxt = (w) => (w.length > 1 ? w.join(" → ") : `${w[0]} (a root)`);
          let tip;
          if (rel.length && !relinkTip) { tip = "Path halving points a node at its grandparent while walking up. Later finds on the same path take fewer steps."; relinkTip = true; }
          const relTxt = rel.length ? ` On the way, ${rel.map((r) => `node ${r[0]} moved from parent ${r[1]} to ${r[2]}`).join(", ")}.` : "";
          if (ra0 === rb0) {
            bad = cur;
            frame({
              line: [15, 16], title: `Edge ${a}-${b}: same root ${ra0}`,
              t: `<code>find(${a})</code>: ${pathTxt(wa)}. <code>find(${b})</code>: ${pathTxt(wb)}. Both reach root ${ra0}, so ${a} and ${b} are already connected by earlier edges. Adding ${a}-${b} would close a cycle.${relTxt}`,
              tip: tip || "Any edge whose ends already share a root is extra. Since we scan in order, the first one found is the last edge of the cycle in input order, which is what the problem asks for.",
              vars: { a: a, b: b, ra: ra0, rb: rb0 },
              views: views({ fm: Object.assign(fm, { [a]: "bad", [b]: "bad" }), fem: fem }),
              moves: rel.slice(0, 3).map((r) => ({ from: ["f", String(r[0])], to: ["f", String(r[2])], label: "halve" })),
            });
            frame({
              line: 28, title: `Return [${a},${b}]`,
              t: `<code>unite</code> returned false, so return <b>[${a}, ${b}]</b>. Removing it leaves the other ${n - 1} edges, which form a tree.`,
              tip: "O(n · α(n)) time, close to O(n): α is the inverse Ackermann function, below 5 for any real input. O(n) space.",
              vars: { a: a, b: b },
              views: views({ fm: { [a]: "bad", [b]: "bad" } }),
            });
            if (total > 40) rec.truncated(total - 40);
            return [a, b];
          }
          let ra = ra0, rb = rb0;
          const swapped = rk[ra] < rk[rb];
          if (swapped) [ra, rb] = [rb, ra];
          parent[rb] = ra;
          const grew = rk[ra] === rk[rb];
          if (grew) rk[ra]++;
          const why = swapped ? `Root ${ra} has the higher rank (${rk[ra]} vs ${rk[rb]}), so ${rb} goes under it.`
            : grew ? `Both roots have rank ${rk[ra] - 1}, so ${rb} goes under ${ra} and <code>rk[${ra}]</code> rises to ${rk[ra]}.`
              : `Root ${ra} has rank ${rk[ra]}, more than ${rk[rb]}, so ${rb} goes under it.`;
          fm[rb] = "new"; fm[ra] = "good";
          frame({
            line: [15, 19], title: `Edge ${a}-${b}: join ${rb} under ${ra}`,
            t: `<code>find(${a})</code>: ${pathTxt(wa)}. <code>find(${b})</code>: ${pathTxt(wb)}. Roots ${ra0} and ${rb0} differ, so this edge joins two separate groups. ${why}${relTxt}`,
            tip: tip || (unionTip ? undefined : "Union by rank hangs the shorter tree under the taller one, so trees stay about log n tall even before path halving helps."),
            vars: { a: a, b: b, ra: ra, rb: rb, [`parent[${rb}]`]: ra, [`rk[${ra}]`]: rk[ra] },
            views: views({ fm: fm, fem: Object.assign(fem, { [`${ra}-${rb}`]: "new" }), pm: { [rb]: "new" }, rm: grew ? { [ra]: "new" } : {} }),
            moves: [{ from: ["f", String(rb)], to: ["parent", rb], label: String(ra) }],
          });
          if (!tip) unionTip = true;
        }
        cur = n;
        frame({
          line: 30, title: "No extra edge: return []",
          t: "Every edge joined two separate groups, so there is no cycle and nothing to remove. Return an empty list. (Valid LeetCode input always has one extra edge.)",
          vars: { n: n },
          views: views(),
        });
        if (total > 40) rec.truncated(total - 40);
        return [];
      },
      expect: [
        [{ edges: "1,2;2,3;3,4;1,4;1,5" }, [1, 4]],
        [{ edges: "1,2;1,3;2,3" }, [2, 3]],
        [{ edges: "1,2;2,3;3,1" }, [3, 1]],
        [{ edges: "3,4;1,2;2,4;3,5;2,5" }, [2, 5]],
        [{ edges: "1,4;3,4;1,3;1,2;4,5" }, [1, 3]],
        [{ edges: "1,2;2,3;3,4;4,5;5,6;1,6" }, [1, 6]],
      ],
    },
  ],

  explain: {
    plain: "Two tools for weighted and changing graphs. Dijkstra finds the shortest time from one source to every node when no weight is negative: a min-heap always hands back the closest node not yet settled. Union-Find (a disjoint set) keeps each group of connected nodes as a small tree, so asking \"are these two connected?\" or joining two groups costs almost O(1).",
    spot: [
      "Edges have <b>weights</b> (times, costs, prices) and the question asks for the cheapest or fastest route. Plain BFS only works when every edge costs the same.",
      "\"Minimum time for all nodes to receive\", \"path with the least effort\", \"cheapest route\": one source, non-negative weights. That is Dijkstra.",
      "A limit on the number of edges used (\"at most k stops\") changes the state. Think Bellman-Ford for k rounds, or Dijkstra over (node, stops).",
      "Edges arrive one at a time and you must know if two nodes are already connected, or which edge first closes a cycle. That is Union-Find.",
      "\"Number of connected components\", \"groups of accounts that share an email\", \"earliest time everyone is connected\": merge groups and count roots.",
    ],
    notWhen: [
      "Every edge has the same cost, or you just need reachability. Plain BFS or DFS is simpler and O(V + E).",
      "Some weights are negative. Dijkstra's greedy step breaks; use Bellman-Ford (or SPFA), which also detects negative cycles.",
      "You must delete edges or split groups. Union-Find only merges; rebuild, or process the operations in reverse as merges.",
    ],
    template: [
      "// Dijkstra from src over adj[u] = {(v, w)}, all w >= 0.",
      "vector<int> dijkstra(const vector<vector<pair<int, int>>>& adj, int src) {",
      "    vector<int> dist(adj.size(), INT_MAX);",
      "    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> pq;",
      "    dist[src] = 0;",
      "    pq.push({0, src});",
      "    while (!pq.empty()) {",
      "        auto [d, u] = pq.top(); pq.pop();",
      "        if (d > dist[u]) continue;           // stale entry",
      "        for (auto [v, w] : adj[u])",
      "            if (d + w < dist[v]) { dist[v] = d + w; pq.push({dist[v], v}); }",
      "    }",
      "    return dist;",
      "}",
      "",
      "// Union-Find with path halving and union by size.",
      "struct DSU {",
      "    vector<int> p, sz;",
      "    DSU(int n) : p(n), sz(n, 1) { iota(p.begin(), p.end(), 0); }",
      "    int find(int x) { while (p[x] != x) x = p[x] = p[p[x]]; return x; }",
      "    bool unite(int a, int b) {",
      "        a = find(a); b = find(b);",
      "        if (a == b) return false;            // already in one group",
      "        if (sz[a] < sz[b]) swap(a, b);",
      "        p[b] = a; sz[a] += sz[b];",
      "        return true;",
      "    }",
      "};",
    ],
    templateNotes: [
      "<code>greater&lt;&gt;</code> turns the max-heap into a min-heap, and the pair puts the distance first so it is what gets compared.",
      "The stale check replaces decrease-key: push a new entry whenever a distance drops and skip any entry whose distance is out of date.",
      "Relaxation: if going through <code>u</code> is faster than the best known way to <code>v</code>, record it and push.",
      "<code>find</code> walks to the root and points each node it passes at its grandparent, so paths get shorter over time.",
      "<code>unite</code> returns false when both ends already share a root: that edge closes a cycle, or the two items were already grouped.",
      "Union by size (or rank) hangs the smaller tree under the bigger one. With path halving, each operation is almost O(1).",
    ],
    variants: [
      ["Dijkstra, one source", "Non-negative weights, shortest time or cost to every node", "743, 1631"],
      ["Bounded number of edges", "At most k stops: Bellman-Ford for k + 1 rounds, copying dist each round", "787"],
      ["Union-Find for cycles", "The first edge whose ends share a root closes a cycle", "684, 261"],
      ["Union-Find for groups", "Merge every edge, then count roots or group items by root", "323, 547, 721"],
    ],
    mistakes: [
      "Using a max-heap by accident: <code>priority_queue&lt;pair&lt;int,int&gt;&gt;</code> pops the largest distance first. Add <code>greater&lt;&gt;</code>, or push negated distances.",
      "Forgetting the stale check, so an old, larger entry relaxes neighbours again. The answer stays right but the work can blow up.",
      "Marking a node visited when it is pushed instead of when it is popped. A later, shorter path to it is then ignored.",
      "Running Dijkstra with negative weights. A settled node can later get a shorter path, so the result is wrong.",
      "In Union-Find, comparing <code>parent[a] == parent[b]</code> instead of <code>find(a) == find(b)</code>. Two nodes in one group can have different parents.",
      "Linking <code>a</code> under <code>b</code> instead of root under root, which leaves the old root's tree behind and breaks the groups.",
    ],
    complexity: [
      ["Dijkstra with a binary heap", "O((V + E) log E)", "O(V + E)", "Each edge can push one entry; each entry is pushed and popped once at O(log E)."],
      ["Bellman-Ford, k rounds", "O(k · E)", "O(V)", "Each round relaxes every edge once; k rounds allow paths of up to k edges."],
      ["Union-Find, rank plus path compression", "O(α(n)) per operation", "O(n)", "α is the inverse Ackermann function, below 5 for any real n, so it is near O(1)."],
      ["Union-Find with no balancing", "O(n) per operation worst case", "O(n)", "A chain of unions can build a tree n tall. Shown to explain why rank and compression matter."],
    ],
    sayIt: "When the graph has weighted edges and I need the cheapest or fastest route from one source, and no weight is negative, I use Dijkstra. I keep a distance array that starts at infinity, set the source to zero and push it onto a min-heap of distance and node pairs. Each time I pop the smallest entry. If it is out of date I skip it. Otherwise that node is settled, because any other route would cost at least as much, and I relax its edges: if going through it is cheaper, I update the distance and push the new pair. That is O of V plus E times log E. When the question is about connectivity instead, like which edge closes a cycle or how many groups there are, I use Union-Find. Each node has a parent; find walks to the root and shortens the path, and union hangs the smaller root under the bigger one. Two nodes are connected when their roots match. Each operation is nearly constant time.",
    followups: [
      ["Why can't Dijkstra handle negative weights?", "It treats a popped node as final. A negative edge found later could make that node cheaper, but it will never be revisited. Bellman-Ford relaxes all edges repeatedly instead and also detects negative cycles."],
      ["How would you return the actual path, not just the distance?", "Keep a parent array: when you relax u to v, set parent[v] = u. Then walk back from the target to the source and reverse."],
      ["Why push duplicates instead of using decrease-key?", "std::priority_queue has no decrease-key. Pushing again and skipping stale entries costs at most E extra entries, so the bound is still O(E log E)."],
      ["When would you choose Union-Find over BFS or DFS for components?", "When edges arrive over time and you need the answer after each one, or you need the first edge that connects or cycles. BFS would redo the whole graph every time."],
    ],
    rubric: {
      strong: [
        "Picked the tool from the signal: weights and one source for Dijkstra, merging and \"already connected?\" for Union-Find, and said why BFS is not enough.",
        "Wrote the heap loop with the stale check and correct relaxation, or a find with compression and root-to-root union with rank or size.",
        "Stated the complexity with its reason and tested an edge case: an unreachable node, a node with no edges, or a self-contained cycle.",
      ],
      weak: [
        "Used plain BFS on weighted edges, or used Dijkstra with negative weights without noticing.",
        "Built a max-heap by mistake, marked nodes visited at push time, or compared parents instead of roots.",
        "Gave no complexity, or claimed O(V + E) for Dijkstra without the log factor from the heap.",
      ],
    },
  },

  quiz: [
    ["In Dijkstra with a <code>priority_queue</code>, why does the loop check <code>if (d &gt; dist[u]) continue;</code>?",
      ["To stop the loop once the target is reached", "To skip an old heap entry left over from before a shorter path to u was found", "To detect negative edge weights", "To avoid pushing the source twice"],
      1, "std::priority_queue cannot lower a key in place, so the code pushes a new pair each time a distance drops. The older, larger pair is still in the heap and must be ignored when it comes out."],
    ["Union-Find processes edges [1,2], [2,3], [1,3] in order. What happens on [1,3]?",
      ["find(1) and find(3) give the same root, so unite returns false: [1,3] closes a cycle", "Node 3 is attached under node 1 and rank of 1 rises to 2", "find(3) returns 3 because 3 was never a root", "The forest splits into two groups"],
      0, "After [1,2] and [2,3] nodes 1, 2 and 3 are in one tree. Both finds reach the same root, which means the new edge would join two nodes that are already connected."],
    ["Which change makes Dijkstra give a wrong answer?",
      ["Storing (dist, node) pairs instead of (node, dist) pairs", "Using an adjacency list instead of a matrix", "Allowing an edge with a negative weight", "Starting dist at INT_MAX instead of a large constant"],
      2, "Dijkstra settles a node the moment it is popped. A negative edge found later could lower that node's distance, but the algorithm never revisits it. Use Bellman-Ford for negative weights."],
  ],

  drills: [
    { prompt: "Each link between servers takes a known number of milliseconds in one direction. A message starts at one server. How long until every server has it?",
      answer: "shortest-path-union-find", distractors: ["graphs-bfs-dfs", "heaps", "greedy"],
      why: "Weighted directed edges and one source: Dijkstra gives each server's earliest arrival time, and the answer is the largest one." },
    { prompt: "You get a list of friendships, one at a time. After each one, report how many separate friend groups there are.",
      answer: "shortest-path-union-find", distractors: ["graphs-bfs-dfs", "prefix-sum-hashing", "intervals"],
      why: "Groups only merge and you need the count after every edge. Union-Find lowers the count by one on each successful union." },
    { prompt: "A grid holds heights. Moving between neighbours costs the absolute height difference, and a route's effort is its largest single step. Find the route from top-left to bottom-right with the least effort.",
      answer: "shortest-path-union-find", distractors: ["dp-2d", "graphs-bfs-dfs", "binary-search"],
      why: "Cells are nodes with weighted edges. Dijkstra works with max instead of sum, because the cost of a route never goes down as it grows." },
    { prompt: "Given flights with prices, find the cheapest way from one city to another using at most k stops.",
      answer: "shortest-path-union-find", distractors: ["dp-1d", "graphs-bfs-dfs", "greedy"],
      why: "Weighted shortest path with a limit on edges. Bellman-Ford run for k + 1 rounds respects the stop limit directly." },
    { prompt: "Several accounts each list some email addresses. Accounts that share any email belong to the same person. Merge them.",
      answer: "shortest-path-union-find", distractors: ["prefix-sum-hashing", "tries", "graphs-bfs-dfs"],
      why: "Sharing an email joins two accounts into one group. Union the accounts through each email, then group emails by their root." },
    { prompt: "An undirected graph that started as a tree has one extra edge. Return the edge you can remove so it is a tree again.",
      answer: "shortest-path-union-find", distractors: ["graphs-bfs-dfs", "advanced", "backtracking"],
      why: "Add edges one by one. The first edge whose two ends are already connected is the one that closed the cycle." },
  ],

  flashcards: [
    { id: "spuf-dijkstra", front: "Dijkstra with a binary heap: time and space?", back: "O((V + E) log E) time, since each edge may push one entry and each push or pop is O(log E). O(V + E) space." },
    { id: "spuf-bellman", front: "Bellman-Ford: time, and when do you need it?", back: "O(V · E), or O(k · E) for k rounds. Use it for negative weights or a limit on the number of edges." },
    { id: "spuf-uf-op", front: "Union-Find with rank and path compression: cost per operation?", back: "O(α(n)), the inverse Ackermann function. Below 5 for any real n, so effectively constant. O(n) space." },
    { id: "spuf-lc743", front: "Network Delay Time (LC 743): approach and time?", back: "Dijkstra from k, answer is the largest dist, -1 if any node stays at infinity. O((V + E) log E) time, O(V + E) space." },
    { id: "spuf-lc684", front: "Redundant Connection (LC 684): approach and time?", back: "Union-Find over the edges in order; return the first edge whose ends already share a root. O(n · α(n)) time, O(n) space." },
  ],

  problems: [743, 787, 323, 684],
});
