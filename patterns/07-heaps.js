// Pattern 07: Heaps / Priority Queue. Writer B.
// Demo 1 "median-stream" (LC 295, ops), demo 2 "kth-largest" (LC 215).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "heaps",
  num: 7,
  title: "Heaps / Priority Queue",
  summary: "Keep a pile where the smallest (or largest) item is always on top, so you can take the best item in O(log n) without sorting everything.",
  tags: ["heap", "priority queue", "top k", "kth largest", "median", "merge k"],

  demos: [
    {
      id: "median-stream",
      title: "Find Median from Data Stream",
      lc: 295,
      problem: "Numbers arrive one at a time. <code>addNum(x)</code> stores one; <code>findMedian()</code> returns the median of all numbers so far. <code>addNum(5) addNum(15) addNum(1) findMedian() addNum(3) findMedian()</code> gives <code>[null,null,null,5,null,4]</code>.",
      code: [
        "class MedianFinder {",
        "    priority_queue<int> lo;                              // max-heap: lower half",
        "    priority_queue<int, vector<int>, greater<int>> hi;   // min-heap: upper half",
        "public:",
        "    void addNum(int num) {",
        "        if (lo.empty() || num <= lo.top()) lo.push(num);",
        "        else hi.push(num);",
        "        // keep lo.size() == hi.size() or hi.size() + 1",
        "        if (lo.size() > hi.size() + 1) { hi.push(lo.top()); lo.pop(); }",
        "        else if (hi.size() > lo.size()) { lo.push(hi.top()); hi.pop(); }",
        "    }",
        "    double findMedian() {",
        "        if (lo.size() > hi.size()) return lo.top();",
        "        return (lo.top() + (double)hi.top()) / 2.0;",
        "    }",
        "};",
      ],
      fields: [{ key: "ops", label: "operations", type: "ops", value: "addNum(5) addNum(15) addNum(1) findMedian() addNum(3) findMedian()", hint: "addNum(5) addNum(15) findMedian()" }],
      run(input, rec) {
        const ops = input.ops;
        const esc = (x) => String(x).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
        let added = 0;
        for (const op of ops) {
          if (op.name === "MedianFinder") continue;
          if (op.name === "addNum") {
            if (op.args.length !== 1 || !Number.isInteger(op.args[0])) { rec.error("addNum takes one whole number, like addNum(5)."); return null; }
            added++;
          } else if (op.name === "findMedian") {
            if (op.args.length) { rec.error("findMedian() takes no arguments."); return null; }
            if (!added) { rec.error("findMedian() was called before any addNum()."); return null; }
          } else { rec.error(`Unknown operation "${op.name}". Use addNum(x) and findMedian().`); return null; }
        }
        // Binary heap; above(a, b) is true when a must sit above b.
        const mkHeap = (above) => {
          const a = [];
          return {
            a,
            push(x) {
              a.push(x);
              let i = a.length - 1;
              const path = [i];
              while (i > 0) {
                const p = (i - 1) >> 1;
                if (!above(a[i], a[p])) break;
                [a[i], a[p]] = [a[p], a[i]];
                i = p; path.push(i);
              }
              return path;
            },
            pop() {
              const top = a[0];
              const lastIdx = a.length - 1;
              const last = a.pop();
              let i = 0;
              if (a.length) {
                a[0] = last;
                for (;;) {
                  const l = 2 * i + 1, r = l + 1;
                  let b = i;
                  if (l < a.length && above(a[l], a[b])) b = l;
                  if (r < a.length && above(a[r], a[b])) b = r;
                  if (b === i) break;
                  [a[i], a[b]] = [a[b], a[i]];
                  i = b;
                }
              }
              return { top, lastIdx, final: a.length ? i : -1 };
            },
          };
        };
        const lo = mkHeap((x, y) => x > y);
        const hi = mkHeap((x, y) => x < y);
        const out = ops.map(() => "");
        const labels = ops.map((op) => `${op.name}(${op.args.join(",")})`);
        let shown = 0, hidden = 0, lastLine = [2, 3];
        const frame = (f) => { lastLine = f.line; if (shown < 40) { rec.frame(f); shown++; } else hidden++; };
        const fmt = (x) => String(x);

        const views = (k, o) => {
          o = o || {};
          const om = {};
          for (let j = 0; j < ops.length; j++) if (j < k) om[j] = "done";
          if (k !== null && k < ops.length) om[k] = "hot";
          return [
            { id: "ops", type: "array", label: "operations", values: labels.slice(),
              pointers: k === null ? {} : { op: k }, marks: Object.assign(om, o.opsMarks || {}) },
            { id: "lo", type: "heap", kind: "max", label: "lo: lower half", values: lo.a.slice(), marks: o.loMarks || {} },
            { id: "hi", type: "heap", kind: "min", label: "hi: upper half", values: hi.a.slice(), marks: o.hiMarks || {} },
            { id: "out", type: "array", label: "returned", values: out.slice(), marks: o.outMarks || {} },
          ];
        };
        const sizes = () => ({ "lo.size()": lo.a.length, "hi.size()": hi.a.length });
        const sift = (view, heap, path) => {   // parents pushed down one level by a sift-up
          const moves = [];
          for (let s = 0; s + 1 < path.length && moves.length < 2; s++) moves.push({ from: [view, path[s + 1]], to: [view, path[s]], label: String(heap.a[path[s]]) });
          return moves;
        };

        frame({
          line: [2, 3], title: "Two empty heaps",
          t: "Split the numbers into two halves. <code>lo</code> is a max-heap holding the smaller half, so its top is the largest small number. <code>hi</code> is a min-heap holding the bigger half, so its top is the smallest big number.",
          tip: "The median always sits at the tops: <code>lo.top()</code> when the count is odd, the average of both tops when it is even. Nothing below the tops matters.",
          vars: { op: "-", "lo.size()": 0, "hi.size()": 0 },
          views: views(null),
        });

        let rebalTip = false, oddTip = false, evenTip = false;
        for (let k = 0; k < ops.length; k++) {
          const op = ops[k];
          if (op.name === "MedianFinder") {
            out[k] = null;
            frame({
              line: 1, title: "Constructor",
              t: "The constructor starts with both heaps empty. It returns nothing, so its result is <code>null</code>.",
              vars: Object.assign({ op: labels[k] }, sizes()),
              views: views(k, { outMarks: { [k]: "new" } }),
            });
            continue;
          }
          if (op.name === "addNum") {
            const num = op.args[0];
            const wasEmpty = lo.a.length === 0;
            const loTop = lo.a[0];
            if (wasEmpty || num <= loTop) {
              const path = lo.push(num);
              const fin = path[path.length - 1];
              frame({
                line: 6, title: `${num} goes into lo`,
                t: (wasEmpty ? `<code>lo</code> is empty, so <b>${num}</b> starts the lower half.`
                  : `<b>${num}</b> ≤ <code>lo.top()</code> = ${loTop}, so it belongs to the lower half.`)
                  + (path.length > 1 ? ` It is bigger than its parent, so it sifts up ${path.length - 1} level${path.length > 2 ? "s" : ""}.` : ""),
                vars: Object.assign({ op: labels[k], num: num }, sizes()),
                views: views(k, { loMarks: { [fin]: "new" } }),
                moves: [{ from: ["ops", k], to: ["lo", fin], label: String(num), mark: "new" }].concat(sift("lo", lo, path)),
              });
            } else {
              const path = hi.push(num);
              const fin = path[path.length - 1];
              frame({
                line: 7, title: `${num} goes into hi`,
                t: `<b>${num}</b> &gt; <code>lo.top()</code> = ${loTop}, so it belongs to the upper half.`
                  + (path.length > 1 ? ` It is smaller than its parent, so it sifts up ${path.length - 1} level${path.length > 2 ? "s" : ""}.` : ""),
                vars: Object.assign({ op: labels[k], num: num }, sizes()),
                views: views(k, { hiMarks: { [fin]: "new" } }),
                moves: [{ from: ["ops", k], to: ["hi", fin], label: String(num), mark: "new" }].concat(sift("hi", hi, path)),
              });
            }
            if (lo.a.length > hi.a.length + 1) {
              const { top, lastIdx, final } = lo.pop();
              const path = hi.push(top);
              const fin = path[path.length - 1];
              const mv = [{ from: ["lo", 0], to: ["hi", fin], label: String(top), mark: "new" }];
              if (final >= 0 && lastIdx > 0) mv.push({ from: ["lo", lastIdx], to: ["lo", final], label: String(lo.a[final]) });
              frame({
                line: 9, title: "lo too big: move its top",
                t: `<code>lo</code> now holds ${lo.a.length + 1} and <code>hi</code> ${hi.a.length - 1}. <code>lo</code> may be ahead by one, not two. Move <code>lo.top()</code> = <b>${top}</b>, the largest small number, over to <code>hi</code>.`,
                tip: rebalTip ? undefined : "Moving the top keeps both rules: every number in <code>lo</code> is still ≤ every number in <code>hi</code>, and the sizes differ by at most one.",
                vars: Object.assign({ op: labels[k], moved: top }, sizes()),
                views: views(k, { hiMarks: { [fin]: "new" }, loMarks: lo.a.length ? { 0: "hot" } : {} }),
                moves: mv,
              });
              rebalTip = true;
            } else if (hi.a.length > lo.a.length) {
              const { top, lastIdx, final } = hi.pop();
              const path = lo.push(top);
              const fin = path[path.length - 1];
              const mv = [{ from: ["hi", 0], to: ["lo", fin], label: String(top), mark: "new" }];
              if (final >= 0 && lastIdx > 0) mv.push({ from: ["hi", lastIdx], to: ["hi", final], label: String(hi.a[final]) });
              frame({
                line: 10, title: "hi too big: move its top",
                t: `<code>hi</code> now has more numbers than <code>lo</code>. Move <code>hi.top()</code> = <b>${top}</b>, the smallest big number, over to <code>lo</code>.`,
                tip: rebalTip ? undefined : "Moving the top keeps both rules: every number in <code>lo</code> is still ≤ every number in <code>hi</code>, and the sizes differ by at most one.",
                vars: Object.assign({ op: labels[k], moved: top }, sizes()),
                views: views(k, { loMarks: { [fin]: "new" }, hiMarks: hi.a.length ? { 0: "hot" } : {} }),
                moves: mv,
              });
              rebalTip = true;
            } else {
              frame({
                line: [9, 10], title: "Sizes already balanced",
                t: `<code>lo</code> has ${lo.a.length} and <code>hi</code> has ${hi.a.length}. That is equal or one more in <code>lo</code>, so nothing moves.`,
                vars: Object.assign({ op: labels[k] }, sizes()),
                views: views(k),
              });
            }
            out[k] = null;
            continue;
          }
          // findMedian
          if (lo.a.length > hi.a.length) {
            out[k] = lo.a[0];
            frame({
              line: 13, title: `Odd count: ${fmt(out[k])}`,
              t: `There are ${lo.a.length + hi.a.length} numbers, an odd count, and <code>lo</code> has the extra one. Its top, <b>${lo.a[0]}</b>, is the middle number.`,
              tip: oddTip ? undefined : "This is O(1): reading a heap's top never searches. Only <code>addNum</code> pays O(log n).",
              vars: Object.assign({ op: labels[k], median: out[k] }, sizes()),
              views: views(k, { loMarks: { 0: "good" }, outMarks: { [k]: "new" } }),
              moves: [{ from: ["lo", 0], to: ["out", k], label: fmt(out[k]), mark: "good" }],
            });
            oddTip = true;
          } else {
            out[k] = (lo.a[0] + hi.a[0]) / 2;
            frame({
              line: 14, title: `Even count: ${fmt(out[k])}`,
              t: `There are ${lo.a.length + hi.a.length} numbers, an even count. The two middle numbers are the tops, ${lo.a[0]} and ${hi.a[0]}, so the median is <code>(${lo.a[0]} + ${hi.a[0]}) / 2 = ${fmt(out[k])}</code>.`,
              tip: evenTip ? undefined : "Cast to <code>double</code> before adding. Two large ints can overflow, and integer division would drop the .5.",
              vars: Object.assign({ op: labels[k], median: out[k] }, sizes()),
              views: views(k, { loMarks: { 0: "in" }, hiMarks: { 0: "in" }, outMarks: { [k]: "new" } }),
              moves: [{ from: ["lo", 0], to: ["out", k], label: String(lo.a[0]), mark: "in" }, { from: ["hi", 0], to: ["out", k], label: String(hi.a[0]), mark: "in" }],
            });
            evenTip = true;
          }
        }

        frame({
          line: lastLine, title: "All operations done",
          t: `Results: <b>[${out.map((x) => (x === null ? "null" : esc(fmt(x)))).join(", ")}]</b>. Each <code>addNum</code> did at most two heap pushes and one pop, so it cost O(log n); each <code>findMedian</code> cost O(1).`,
          tip: "Space is O(n): every number stays in one of the two heaps.",
          vars: sizes(),
          views: views(ops.length, { outMarks: Object.fromEntries(out.map((x, j) => [j, x === null ? "dim" : "good"])) }),
        });
        if (hidden) rec.truncated(hidden);
        return out;
      },
      expect: [
        [{ ops: "addNum(5) addNum(15) addNum(1) findMedian() addNum(3) findMedian()" }, [null, null, null, 5, null, 4]],
        [{ ops: "addNum(1) addNum(2) findMedian() addNum(3) findMedian()" }, [null, null, 1.5, null, 2]],
        [{ ops: "MedianFinder() addNum(7) findMedian()" }, [null, null, 7]],
        [{ ops: "addNum(-1) addNum(-2) findMedian() addNum(-3) findMedian()" }, [null, null, -1.5, null, -2]],
        [{ ops: "addNum(4) addNum(4) addNum(4) findMedian()" }, [null, null, null, 4]],
        [{ ops: "addNum(6) addNum(10) addNum(2) addNum(6) addNum(5) findMedian() addNum(0) findMedian()" }, [null, null, null, null, null, 6, null, 5.5]],
      ],
    },
    {
      id: "kth-largest",
      title: "Kth Largest Element in an Array",
      lc: 215,
      problem: "Return the <code>k</code>-th largest number in <code>nums</code> (counting duplicates). <code>nums = [3,2,1,5,6,4]</code>, <code>k = 2</code> gives <code>5</code>.",
      code: [
        "int findKthLargest(vector<int>& nums, int k) {",
        "    priority_queue<int, vector<int>, greater<int>> pq;   // min-heap",
        "    for (int x : nums) {",
        "        pq.push(x);",
        "        if ((int)pq.size() > k) pq.pop();   // drop the smallest; keep the top k",
        "    }",
        "    return pq.top();   // smallest of the top k = k-th largest",
        "}",
      ],
      fields: [
        { key: "nums", label: "nums", type: "ints", value: "3,2,1,5,6,4" },
        { key: "k", label: "k", type: "int", value: "2" },
      ],
      run(input, rec) {
        const nums = input.nums, k = input.k;
        if (!nums.length) { rec.error("nums must have at least one number."); return null; }
        if (k < 1 || k > nums.length) { rec.error(`k must be between 1 and ${nums.length}.`); return null; }
        const a = [];
        const above = (x, y) => x < y;
        const push = (x) => {
          a.push(x);
          let i = a.length - 1;
          const path = [i];
          while (i > 0) {
            const p = (i - 1) >> 1;
            if (!above(a[i], a[p])) break;
            [a[i], a[p]] = [a[p], a[i]];
            i = p; path.push(i);
          }
          return path;
        };
        const pop = () => {
          const top = a[0];
          const lastIdx = a.length - 1;
          const last = a.pop();
          let i = 0;
          if (a.length) {
            a[0] = last;
            for (;;) {
              const l = 2 * i + 1, r = l + 1;
              let b = i;
              if (l < a.length && above(a[l], a[b])) b = l;
              if (r < a.length && above(a[r], a[b])) b = r;
              if (b === i) break;
              [a[i], a[b]] = [a[b], a[i]];
              i = b;
            }
          }
          return { top, lastIdx, final: a.length ? i : -1 };
        };
        const gone = new Set();
        const kth = ((n) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"))(k);
        let shown = 0, hidden = 0;
        const frame = (f) => { if (shown < 40) { rec.frame(f); shown++; } else hidden++; };
        const views = (i, o) => {
          o = o || {};
          const nm = {};
          for (const g of gone) nm[g] = "dim";
          if (i !== null) nm[i] = "hot";
          Object.assign(nm, o.nm || {});
          return [
            { id: "nums", type: "array", label: "nums", values: nums.slice(), pointers: i === null ? {} : { x: i }, marks: nm },
            { id: "pq", type: "heap", kind: "min", label: `pq: at most k = ${k}`, values: a.slice(), marks: o.hm || {} },
            { id: "ans", type: "calc", label: "pq.top()", value: a.length ? a[0] : "-" },
          ];
        };

        frame({
          line: 2, title: "Empty min-heap",
          t: `Keep the ${k} largest numbers seen so far in a min-heap. Its top is the smallest of them, which is exactly the ${kth} largest so far.`,
          tip: "A <em>min</em>-heap for the k <em>largest</em> sounds backwards. The top is the weakest member of the top k, so it is the one to throw out when a better number arrives.",
          vars: { k: k, "pq.size()": 0 },
          views: views(null),
        });

        let evictTip = false, skipTip = false;
        for (let i = 0; i < nums.length; i++) {
          const x = nums[i];
          const path = push(x);
          const fin = path[path.length - 1];
          frame({
            line: 4, title: `Push ${x}`,
            t: `Push <b>${x}</b>.` + (path.length > 1 ? ` It is smaller than its parent, so it sifts up ${path.length - 1} level${path.length > 2 ? "s" : ""}.` : "") + ` The heap holds ${a.length} number${a.length > 1 ? "s" : ""}.`,
            vars: { x: x, k: k, "pq.size()": a.length },
            views: views(i, { hm: { [fin]: "new" } }),
            moves: [{ from: ["nums", i], to: ["pq", fin], label: String(x), mark: "new" }],
          });
          if (a.length > k) {
            const { top, lastIdx, final } = pop();
            // Dim the earliest not-yet-dimmed index holding the popped value; the popped tile flies back to it.
            let j = i;
            for (let q = 0; q <= i; q++) if (nums[q] === top && !gone.has(q)) { j = q; break; }
            gone.add(j);
            const mv = [{ from: ["pq", 0], to: ["nums", j], label: String(top), mark: "bad" }];
            if (final >= 0 && lastIdx > 0) mv.push({ from: ["pq", lastIdx], to: ["pq", final], label: String(a[final]) });
            const self = top === x;
            frame({
              line: 5, title: `Size ${k + 1} > ${k}: pop ${top}`,
              t: self
                ? `The heap has ${k + 1} numbers, one too many. The smallest is <b>${top}</b>, the number just pushed, so it is not in the top ${k} and leaves at once.`
                : `The heap has ${k + 1} numbers, one too many. Pop the smallest, <b>${top}</b>: the ${k} numbers left are all at least as big, so it cannot be the ${kth} largest.`,
              tip: !evictTip ? "Every pop removes a number that at least k others beat. That is why the heap never needs more than k + 1 slots." : (self && !skipTip ? "A number smaller than the current top goes in and straight back out. A common speed-up is to skip the push when <code>x &lt;= pq.top()</code> and the heap is full." : undefined),
              vars: { x: x, popped: top, "pq.size()": a.length },
              views: views(i, { nm: { [j]: "bad" }, hm: a.length ? { 0: "hot" } : {} }),
              moves: mv,
            });
            if (self && evictTip) skipTip = true;
            evictTip = true;
          }
        }

        frame({
          line: 7, title: `Return ${a[0]}`,
          t: `The heap holds the ${k} largest numbers: [${a.slice().sort((p, q) => q - p).join(", ")}]. The smallest of them, <b>${a[0]}</b>, is the ${kth} largest.`,
          tip: "O(n log k) time and O(k) space. When k is close to n, quickselect gives O(n) on average.",
          vars: { k: k, "pq.top()": a[0] },
          views: views(null, { hm: { 0: "good" } }),
        });
        if (hidden) rec.truncated(hidden);
        return a[0];
      },
      expect: [
        [{ nums: "3,2,1,5,6,4", k: "2" }, 5],
        [{ nums: "3,2,3,1,2,4,5,5,6", k: "4" }, 4],
        [{ nums: "1", k: "1" }, 1],
        [{ nums: "7,7,7", k: "2" }, 7],
        [{ nums: "-1,-5,2", k: "3" }, -5],
      ],
    },
  ],

  explain: {
    plain: "A heap is a binary tree stored in an array where every parent beats its children, so the best item is always at index 0. Push and pop cost O(log n) and reading the top costs O(1). In C++ it is <code>priority_queue</code>, a max-heap unless you pass <code>greater&lt;&gt;</code>.",
    spot: [
      "\"Top k\", \"k-th largest\", \"k closest\", \"k most frequent\": you need the best few, not a full sort.",
      "Items arrive over time and you keep asking for the current smallest, largest or median (a data stream).",
      "Merge k sorted lists or arrays: always take the smallest head among k candidates.",
      "Schedule the next event by time, or always expand the cheapest option first (Dijkstra, task scheduler).",
      "The brute force sorts the whole input or rescans for the minimum each time, O(n log n) or O(n²), when you only need the extreme item.",
    ],
    notWhen: [
      "You need the next greater or smaller element next to each position: a monotonic stack does that in O(n).",
      "You need to look up or delete arbitrary values, or walk items in order: use a <code>set</code>/<code>multiset</code> or a hash map.",
      "The maximum is over a sliding window: a monotonic deque gives O(n) total, better than a heap with lazy deletes.",
    ],
    template: [
      "// Keep the k largest values seen so far: a min-heap of size k.",
      "vector<int> topK(const vector<int>& a, int k) {",
      "    priority_queue<int, vector<int>, greater<int>> pq;  // smallest on top",
      "    for (int x : a) {",
      "        pq.push(x);",
      "        if ((int)pq.size() > k) pq.pop();               // evict the smallest",
      "    }",
      "    vector<int> out;",
      "    while (!pq.empty()) { out.push_back(pq.top()); pq.pop(); }",
      "    return out;                                         // ascending order",
      "}",
      "",
      "// Custom order: pairs (dist, node), smallest dist on top.",
      "using P = pair<int, int>;",
      "int closestNode(const vector<P>& items) {",
      "    priority_queue<P, vector<P>, greater<P>> pq(items.begin(), items.end());",
      "    return pq.empty() ? -1 : pq.top().second;",
      "}",
    ],
    templateNotes: [
      "<code>priority_queue&lt;int&gt;</code> is a max-heap. Add <code>vector&lt;int&gt;, greater&lt;int&gt;</code> to get a min-heap.",
      "For the k largest, keep a min-heap of size k: the top is the weakest of the k and is the one to evict. For the k smallest, flip it to a max-heap.",
      "Popping everything gives the items in heap order, so a min-heap returns them smallest first.",
      "Pairs compare by <code>first</code>, then <code>second</code>, so putting the priority first gives a custom order with no comparator code.",
      "Building a heap from a whole range at once (the range constructor) is O(n), cheaper than n pushes.",
    ],
    variants: [
      ["Top k with a size-k heap", "Min-heap for the k largest, max-heap for the k smallest", "215, 347, 973"],
      ["Two heaps", "Max-heap for the lower half, min-heap for the upper half; median at the tops", "295, 480"],
      ["K-way merge", "Heap of the current head of each list; pop the smallest, push its successor", "23, 378"],
      ["Best-first search", "Heap of (cost, node); always expand the cheapest", "743, 1631"],
    ],
    mistakes: [
      "Using the default <code>priority_queue</code> and forgetting it is a max-heap, so the top is the largest when you wanted the smallest.",
      "Keeping a max-heap of all n items for the k-th largest: it works, but costs O(n) space and O(n + k log n) instead of O(n log k) and O(k).",
      "Writing a comparator backwards. In a <code>priority_queue</code> the comparator says which item sits <em>lower</em>, so <code>greater</code> gives a min-heap.",
      "In the two-heap median, adding without rebalancing, so the sizes drift apart and the tops are no longer the middle numbers.",
      "Averaging two ints with <code>(a + b) / 2</code>: it overflows on large values and drops the .5. Cast to <code>double</code> first.",
      "Calling <code>top()</code> or <code>pop()</code> on an empty heap. Check <code>empty()</code> first.",
    ],
    complexity: [
      ["Push or pop", "O(log n)", "O(n)", "The item sifts along one root-to-leaf path of a tree with height log n."],
      ["Top k with a size-k heap", "O(n log k)", "O(k)", "n pushes and up to n pops on a heap that never grows past k + 1."],
      ["Two-heap median", "O(log n) add, O(1) median", "O(n)", "Each add does a constant number of pushes and pops; the median is read from the tops."],
      ["Build a heap from n items", "O(n)", "O(n)", "Bottom-up heapify; most nodes are near the leaves and sift only a short way."],
    ],
    sayIt: "When a problem asks for the top k, the k-th largest, a running median, or the smallest of several candidates again and again, I think heap. A heap keeps the best item on top, so I can read it in constant time and push or pop in log n, without sorting everything. For the k-th largest I keep a min-heap of size k. Each new number goes in, and if the heap grows past k I pop the smallest, so the top is always the k-th largest so far. That is O(n log k) time and O(k) space. For a running median I keep two heaps: a max-heap for the lower half and a min-heap for the upper half, with sizes equal or the lower one ahead by one. After every insert I move one top across if the sizes drift. The median is then the lower top, or the average of both tops. In C++, priority_queue is a max-heap unless I pass greater.",
    followups: [
      ["Can you find the k-th largest faster than O(n log k)?", "Quickselect partitions around a random pivot and recurses into one side, O(n) on average and O(n²) worst case. A heap is safer when the data streams in."],
      ["How would the median finder handle numbers that leave a sliding window (LC 480)?", "Use lazy deletion with a hash map of pending removals, or two multisets where you can erase by value in O(log n)."],
      ["If 99% of numbers are between 0 and 100, how would you speed up the median?", "Keep a count array for 0..100 plus counts or small heaps for the outliers. Finding the median walks at most 101 buckets."],
      ["Why is building a heap from an array O(n) and not O(n log n)?", "Bottom-up heapify sifts each node down only as far as its height. Half the nodes are leaves, a quarter have height 1, and the sum of heights is O(n)."],
    ],
    rubric: {
      strong: [
        "Picked the right heap direction and size and said why (a min-heap of size k for the k largest, two heaps for the median).",
        "Wrote correct priority_queue declarations and comparators, and handled empty heaps and ties.",
        "Stated O(log n) per operation, O(n log k) overall where it applies, and the space, and tested a small example by hand.",
      ],
      weak: [
        "Sorted the whole input or rescanned for the minimum each time without seeing that only the extreme item is needed.",
        "Mixed up min-heap and max-heap, wrote the comparator backwards, or forgot to rebalance.",
        "Could not explain the complexity or why the heap never needs more than k + 1 items.",
      ],
    },
  },

  quiz: [
    ["To find the k-th largest number in a stream, which heap do you keep?",
      ["A max-heap of every number", "A max-heap of size k", "A min-heap of size k", "A min-heap of every number"],
      2, "The top of a size-k min-heap is the smallest of the k largest, which is the k-th largest. A bigger new number replaces it in O(log k)."],
    ["In the two-heap median finder, what do the heaps hold?",
      ["A max-heap with the lower half and a min-heap with the upper half", "A min-heap with the lower half and a max-heap with the upper half", "Both are min-heaps, split by insertion order", "One heap holds even numbers and the other odd ones"],
      0, "The lower half needs its largest number on top and the upper half needs its smallest on top. Those two tops are the middle numbers."],
    ["What does <code>priority_queue&lt;int&gt; pq;</code> give you in C++?",
      ["A min-heap", "A sorted vector", "A heap that keeps insertion order", "A max-heap"],
      3, "The default comparator is <code>less&lt;int&gt;</code>, which puts the largest on top. Pass <code>greater&lt;int&gt;</code> for a min-heap."],
  ],

  drills: [
    { prompt: "Given an array and k, return the k numbers that appear most often, in any order.",
      answer: "heaps", distractors: ["prefix-sum-hashing", "sliding-window", "greedy"],
      why: "Count with a hash map, then keep a min-heap of size k keyed by count. The best few, not a full sort, is the heap signal." },
    { prompt: "Given k linked lists, each sorted, merge them into one sorted list.",
      answer: "heaps", distractors: ["linked-lists", "two-pointers", "binary-search"],
      why: "At every step you need the smallest head among k candidates. A heap of the k heads gives it in O(log k)." },
    { prompt: "Numbers arrive one by one. After each one, report the middle value of everything received so far.",
      answer: "heaps", distractors: ["binary-search", "sliding-window", "math-design"],
      why: "A running median: a max-heap for the lower half and a min-heap for the upper half keep the middle numbers at the tops." },
    { prompt: "Given points on a plane and k, return the k points nearest to the origin.",
      answer: "heaps", distractors: ["two-pointers", "binary-search", "greedy"],
      why: "Keep a max-heap of size k by distance; evict the farthest when a closer point arrives. O(n log k)." },
    { prompt: "Given stones with weights, repeatedly smash the two heaviest together; return the weight of the last stone left (or 0).",
      answer: "heaps", distractors: ["greedy", "stacks-monotonic", "dp-knapsack"],
      why: "You need the two largest items again and again while new items are added. A max-heap gives both in O(log n)." },
    { prompt: "Given an unsorted array and k, return the value that would be at position k from the end if the array were sorted.",
      answer: "heaps", distractors: ["binary-search", "two-pointers", "dp-1d"],
      why: "That is the k-th largest. A min-heap of size k gives it in O(n log k) without sorting the whole array." },
  ],

  flashcards: [
    { id: "hp-ops", front: "Heap push, pop and top: time?", back: "Push O(log n), pop O(log n), top O(1)." },
    { id: "hp-topk", front: "k-th largest with a min-heap of size k (LC 215): time and space?", back: "O(n log k) time and O(k) space. Quickselect is O(n) on average, O(n²) worst case." },
    { id: "hp-median", front: "Find Median from Data Stream (LC 295) with two heaps: time and space?", back: "addNum O(log n), findMedian O(1), O(n) space for both heaps." },
    { id: "hp-mergek", front: "Merge k Sorted Lists (LC 23) with a heap: time and space?", back: "O(N log k) for N total nodes, O(k) space for the heap of current heads." },
    { id: "hp-heapify", front: "Build a heap from n items at once: time?", back: "O(n) with bottom-up heapify, not O(n log n), because most nodes sift only a short way." },
  ],

  problems: [215, 347, 295, 23],
});
