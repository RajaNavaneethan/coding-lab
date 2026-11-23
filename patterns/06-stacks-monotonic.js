// Pattern 06: Stacks & Monotonic Stacks. Writer B.
// Demo 1 "daily-temperatures" (LC 739), demo 2 "largest-rectangle" (LC 84).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "stacks-monotonic",
  num: 6,
  title: "Stacks & Monotonic Stacks",
  summary: "Keep the elements that still wait for an answer on a stack, in sorted order, and pop each one the moment its answer arrives.",
  tags: ["stack", "monotonic", "next greater", "histogram", "parentheses", "span"],

  demos: [
    {
      id: "daily-temperatures",
      title: "Daily Temperatures",
      lc: 739,
      problem: "For each day, return how many days you wait for a warmer temperature, or 0 if none comes. <code>[73,74,75,71,69,72,76,73]</code> gives <code>[1,1,4,2,1,1,0,0]</code>.",
      code: [
        "vector<int> dailyTemperatures(vector<int>& t) {",
        "    int n = (int)t.size();",
        "    vector<int> ans(n, 0);",
        "    stack<int> st;                // indices; temps never rise bottom to top",
        "    for (int i = 0; i < n; i++) {",
        "        while (!st.empty() && t[i] > t[st.top()]) {",
        "            int j = st.top(); st.pop();",
        "            ans[j] = i - j;       // first warmer day for j is i",
        "        }",
        "        st.push(i);",
        "    }",
        "    return ans;",
        "}",
      ],
      fields: [{ key: "t", label: "temperatures", type: "ints", value: "73,74,75,71,69,72,76,73" }],
      run(input, rec) {
        const t = input.t;
        const n = t.length;
        const ans = new Array(n).fill(0);
        const st = [];
        const done = new Set();
        let shown = 0, hidden = 0;
        const frame = (f) => { if (shown < 40) { rec.frame(f); shown++; } else hidden++; };
        const deg = (i) => `<b>${t[i]}°</b>`;

        const views = (i, o) => {
          o = o || {};
          const bm = {}, am = {}, sm = {};
          for (const d of done) { bm[d] = "done"; am[d] = "done"; }
          for (const d of st) bm[d] = "path";
          if (i !== null) bm[i] = "hot";
          Object.assign(bm, o.bm || {});
          Object.assign(am, o.am || {});
          Object.assign(sm, o.sm || {});
          return [
            { id: "t", type: "bars", label: "t (temperature per day)", values: t.slice(),
              pointers: i === null ? {} : { i: i }, marks: bm },
            { id: "st", type: "stack", label: "st (day: temp), waiting for a warmer day",
              items: st.map((d) => `${d}: ${t[d]}`), marks: sm },
            { id: "ans", type: "array", label: "ans (days to wait)", values: ans.slice(), marks: am },
          ];
        };

        frame({
          line: 4, title: "All zeros, empty stack",
          t: `<code>ans</code> starts as ${n} zeros, which is the right answer for any day that never sees a warmer one. The stack will hold the days that are still waiting.`,
          tip: "The stack is monotonic: from bottom to top the temperatures never rise. So the top is always the coolest, most recent day that still waits.",
          vars: { n: n, i: "-" },
          views: views(null),
        });

        let popTip = false, stopTip = false, multiTip = false;
        for (let i = 0; i < n; i++) {
          let pops = 0;
          while (st.length && t[i] > t[st[st.length - 1]]) {
            const top = st[st.length - 1];
            const k = st.length - 1;
            frame({
              line: 6, title: "Warmer than the top",
              t: `Day ${i} is ${deg(i)}, warmer than day ${top} at the top of the stack (${deg(top)}). Day ${top} has been waiting for exactly this.`,
              vars: { i: i, "t[i]": t[i], "st.top()": top, "t[top]": t[top] },
              views: views(i, { bm: { [top]: "in" }, sm: { [k]: "hot" } }),
            });
            const j = st.pop();
            ans[j] = i - j;
            done.add(j);
            pops++;
            frame({
              line: [7, 8], title: `Pop ${j}, ans[${j}] = ${i - j}`,
              t: `Pop day ${j} and write <code>ans[${j}] = ${i} - ${j} = ${i - j}</code>. Day ${i} is the first warmer day after ${j}: a warmer day in between would have popped ${j} already.`,
              tip: !popTip ? "The popped index flies to its answer slot. A day gets its answer exactly once, at the moment it leaves the stack."
                : (pops === 2 && !multiTip ? `One warm day can settle several waiting days in a row. Day ${i} keeps popping until the top is at least as warm.` : undefined),
              vars: { i: i, j: j, "i - j": i - j },
              views: views(i, { bm: { [j]: "good" }, am: { [j]: "new" } }),
              moves: [{ from: ["st", k], to: ["ans", j], label: String(i - j), mark: "new" }],
            });
            if (pops === 2) multiTip = true;
            popTip = true;
          }
          if (st.length) {
            const top = st[st.length - 1];
            frame({
              line: 6, title: "Not warmer: stop",
              t: `Day ${i} (${deg(i)}) is not warmer than day ${top} (${deg(top)}), so the loop stops. Every day below ${top} is at least as warm as ${top}, so none of them can pop either.`,
              tip: stopTip ? undefined : "Ties do not pop because the test is strict (<code>&gt;</code>). The question asks for a <em>warmer</em> day, not an equal one.",
              vars: { i: i, "t[i]": t[i], "st.top()": top, "t[top]": t[top] },
              views: views(i, { bm: { [top]: "in" }, sm: { [st.length - 1]: "in" } }),
            });
            stopTip = true;
          }
          st.push(i);
          frame({
            line: 10, title: `Push day ${i}`,
            t: pops
              ? `Push day ${i}. It popped ${pops} day${pops > 1 ? "s" : ""}, and now waits on top for a day warmer than ${deg(i)}.`
              : (st.length === 1 ? `The stack is empty, so nothing is waiting. Push day ${i}; it waits for a day warmer than ${deg(i)}.`
                : `Push day ${i} on top. It is no warmer than any day below it, so the order holds, and it is the first day the next warm day will check.`),
            vars: { i: i, "t[i]": t[i], "st.size()": st.length },
            views: views(i, { bm: { [i]: "new" }, sm: { [st.length - 1]: "new" } }),
            moves: [{ from: ["t", i], to: ["st", st.length - 1], label: String(i), mark: "new" }],
          });
        }

        const left = st.slice();
        frame({
          line: 12, title: "Return ans",
          t: n === 0 ? "No days, so the answer is an empty array."
            : `${left.length ? `Day${left.length > 1 ? "s" : ""} ${left.join(", ")} never found a warmer day, so ${left.length > 1 ? "they keep" : "it keeps"} 0. ` : ""}Answer: <b>[${ans.join(", ")}]</b>.`,
          tip: "Each index is pushed once and popped at most once, so the nested loop is O(n) in total. Space is O(n): a falling input never pops.",
          vars: { n: n, "st.size()": st.length },
          views: views(null, { am: Object.fromEntries(ans.map((v, k) => [k, "good"])) }),
        });
        if (hidden) rec.truncated(hidden);
        return ans;
      },
      expect: [
        [{ t: "73,74,75,71,69,72,76,73" }, [1, 1, 4, 2, 1, 1, 0, 0]],
        [{ t: "30,40,50,60" }, [1, 1, 1, 0]],
        [{ t: "30,60,90" }, [1, 1, 0]],
        [{ t: "90,60,30" }, [0, 0, 0]],
        [{ t: "55,55,55" }, [0, 0, 0]],
        [{ t: "42" }, [0]],
        [{ t: "" }, []],
      ],
    },
    {
      id: "largest-rectangle",
      title: "Largest Rectangle in Histogram",
      lc: 84,
      problem: "Bars of width 1 have heights <code>h</code>. Return the area of the largest rectangle that fits under them. <code>[2,1,5,6,2,3]</code> gives <code>10</code> (heights 5 and 6, width 2).",
      code: [
        "int largestRectangleArea(vector<int>& h) {",
        "    int n = (int)h.size();",
        "    stack<int> st;                // indices; heights never drop bottom to top",
        "    int best = 0;",
        "    for (int i = 0; i <= n; i++) {",
        "        int cur = (i == n) ? 0 : h[i];   // sentinel 0 flushes the stack",
        "        while (!st.empty() && h[st.top()] > cur) {",
        "            int top = st.top(); st.pop();",
        "            int w = st.empty() ? i : i - st.top() - 1;",
        "            best = max(best, h[top] * w);",
        "        }",
        "        st.push(i);",
        "    }",
        "    return best;",
        "}",
      ],
      fields: [{ key: "h", label: "heights", type: "ints", value: "2,1,5,6,2,3" }],
      run(input, rec) {
        const h = input.h;
        const n = h.length;
        if (h.some((x) => x < 0)) { rec.error("Heights must be 0 or more."); return null; }
        const st = [];
        const done = new Set();
        let best = 0, bestL = 0, bestR = -1;
        let shown = 0, hidden = 0;
        const frame = (f) => { if (shown < 40) { rec.frame(f); shown++; } else hidden++; };
        const label = (d) => (d === n ? `${d}: end` : `${d}: h=${h[d]}`);

        const views = (i, o) => {
          o = o || {};
          const bm = {}, sm = {};
          for (const d of done) bm[d] = "dim";
          for (const d of st) if (d < n) bm[d] = "path";
          if (i !== null && i < n) bm[i] = "hot";
          Object.assign(bm, o.bm || {});
          Object.assign(sm, o.sm || {});
          return [
            { id: "h", type: "bars", label: "h (bar heights)", values: h.slice(),
              pointers: i === null ? {} : { i: i }, marks: bm, ranges: o.ranges || [] },
            { id: "st", type: "stack", label: "st (index: height)", items: st.map(label), marks: sm },
            { id: "best", type: "calc", label: "best area", value: best },
          ];
        };

        frame({
          line: 4, title: "Empty stack, best = 0",
          t: "Each bar can be the shortest bar of some rectangle. The stack holds bars whose rectangle can still grow to the right; a bar is measured when a shorter bar shows up.",
          tip: "Heights on the stack never drop from bottom to top. So the bar just below a popped bar is the nearest bar on its left that is not taller, and the popped bar\'s rectangle starts right after it.",
          vars: { n: n, i: "-", best: best },
          views: views(null),
        });

        let widthTip = false, flushTip = false;
        for (let i = 0; i <= n; i++) {
          const cur = i === n ? 0 : h[i];
          let pops = 0;
          while (st.length && h[st[st.length - 1]] > cur) {
            const top = st[st.length - 1];
            const k = st.length - 1;
            const curTxt = i === n ? "The sentinel <code>cur = 0</code>" : `Bar ${i} (<code>cur = ${cur}</code>)`;
            frame({
              line: 7, title: i === n ? "Sentinel: flush the stack" : "Shorter bar arrives",
              t: `${curTxt} is shorter than bar ${top} on top (<code>h = ${h[top]}</code>). Bar ${top}'s rectangle cannot reach past index ${i - 1}, so measure it now.`,
              tip: i === n && !flushTip ? "The sentinel height 0 is shorter than every bar, so it pops everything left on the stack. Without it, those bars would never be measured." : undefined,
              vars: { i: i, cur: cur, "st.top()": top, "h[top]": h[top], best: best },
              views: views(i, { bm: { [top]: "warn" }, sm: { [k]: "hot" } }),
            });
            if (i === n) flushTip = true;
            st.pop();
            const w = st.length ? i - st[st.length - 1] - 1 : i;
            const L = i - w;
            const nt = st.length ? st[st.length - 1] : -1;
            const leftTxt = nt < 0 ? "The stack is now empty: every bar on its left is taller, so the rectangle reaches index 0."
              : (h[nt] < h[top] ? `The new top, bar ${nt} (<code>h = ${h[nt]}</code>), is the nearest bar to the left that is not taller.`
                : `The new top, bar ${nt}, has the same height. This width is too small, but bar ${nt} is measured later with the full width.`);
            frame({
              line: [8, 9], title: `Pop ${top}, width ${w}`,
              t: `Pop bar ${top}. ${leftTxt} The rectangle spans indices ${L}..${i - 1}, so <code>w = ${w}</code>.`,
              tip: widthTip ? undefined : "Width is <code>i - st.top() - 1</code>: the rectangle sits strictly between the new top and <code>i</code>. If the stack is empty, it reaches index 0 and <code>w = i</code>.",
              vars: { i: i, top: top, "h[top]": h[top], w: w, best: best },
              views: views(i, { bm: { [top]: "in" }, ranges: [{ from: L, to: i - 1, mark: "in", label: `w = ${w}` }] }),
            });
            widthTip = true;
            const area = h[top] * w;
            const improved = area > best;
            best = Math.max(best, area);
            if (improved) { bestL = L; bestR = i - 1; }
            done.add(top);
            pops++;
            frame({
              line: 10, title: improved ? `New best: ${area}` : `Area ${area}, keep ${best}`,
              t: `Area <code>${h[top]} × ${w} = ${area}</code>${improved ? ", the best so far." : `, not more than ${best}.`}`,
              vars: { i: i, top: top, "h[top] * w": area, best: best },
              views: views(i, { bm: { [top]: improved ? "good" : "dim" }, ranges: [{ from: L, to: i - 1, mark: improved ? "good" : "dim", label: String(area) }] }),
              moves: improved ? [{ from: ["h", top], to: ["best", 0], label: String(area), mark: "good" }] : undefined,
            });
          }
          if (st.length) {
            const top = st[st.length - 1];
            frame({
              line: 7, title: "Not shorter: stop",
              t: i === n
                ? `Bar ${top} on top has <code>h = 0</code>, not taller than the sentinel, so it stays. A bar of height 0 has area 0, so skipping it loses nothing.`
                : `Bar ${top} on top has <code>h = ${h[top]}</code>, not taller than <code>cur = ${cur}</code>, so it can still grow to the right. The loop stops.`,
              vars: { i: i, cur: cur, "st.top()": top, "h[top]": h[top], best: best },
              views: views(i, { bm: { [top]: "in" }, sm: { [st.length - 1]: "in" } }),
            });
          }
          st.push(i);
          frame({
            line: 12, title: i === n ? "Push the end index" : `Push bar ${i}`,
            t: i === n
              ? `The loop still pushes index ${n}, which is not a real bar. It does no harm: the loop ends right after and <code>h[${n}]</code> is never read.`
              : `Push bar ${i} (<code>h = ${h[i]}</code>). It waits on the stack until a shorter bar shows up on its right.`,
            vars: { i: i, cur: cur, "st.size()": st.length, best: best },
            views: views(i, { bm: i < n ? { [i]: "new" } : {}, sm: { [st.length - 1]: "new" } }),
            moves: i < n ? [{ from: ["h", i], to: ["st", st.length - 1], label: String(i), mark: "new" }] : undefined,
          });
        }

        frame({
          line: 14, title: "Return best",
          t: n === 0 ? "No bars, so the answer is <b>0</b>."
            : `Each bar was pushed once and popped at most once. The largest rectangle covers indices ${bestL}..${bestR}, area <b>${best}</b>.`,
          tip: "O(n) time: each index enters and leaves the stack once. O(n) space for the stack.",
          vars: { n: n, best: best },
          views: views(null, { ranges: bestR >= 0 ? [{ from: bestL, to: bestR, mark: "good", label: `best ${best}` }] : [] }),
        });
        if (hidden) rec.truncated(hidden);
        return best;
      },
      expect: [
        [{ h: "2,1,5,6,2,3" }, 10],
        [{ h: "2,4" }, 4],
        [{ h: "1,1,1,1" }, 4],
        [{ h: "5" }, 5],
        [{ h: "" }, 0],
        [{ h: "0,0" }, 0],
        [{ h: "6,2,5,4,5,1,6" }, 12],
      ],
    },
  ],

  explain: {
    plain: "A stack only lets you touch the newest item. A <b>monotonic</b> stack also keeps its items sorted by popping older items whenever a new one would break the order. Each pop is the moment a waiting item gets its answer: the thing it was waiting for has just arrived.",
    spot: [
      "For each element, find the <b>next</b> (or previous) element that is greater or smaller: next greater element, days until warmer, next smaller to the left.",
      "A span question: how many consecutive earlier elements are smaller than or equal to this one (stock span).",
      "A histogram or rectangle question where each bar's answer depends on how far it stays the shortest (LC 84, LC 85).",
      "Brackets or nesting: the most recent open thing must be closed first (LC 20, LC 32, expression evaluation).",
      "The brute force checks every pair, O(n²), and the pair you want for each element is the first match on one side.",
    ],
    notWhen: [
      "You need the k-th largest or a running median across all items: that is a global rank, so use a heap.",
      "The answer depends on every item in a window, such as a sum or a count: use a sliding window or prefix sums.",
      "You need lookup by value, not by position: use a hash map or a sorted set.",
    ],
    template: [
      "// Next greater element to the right. -1 if none.",
      "vector<int> nextGreater(const vector<int>& a) {",
      "    int n = (int)a.size();",
      "    vector<int> ans(n, -1);",
      "    stack<int> st;                    // indices still waiting",
      "    for (int i = 0; i < n; i++) {",
      "        while (!st.empty() && a[i] > a[st.top()]) {",
      "            ans[st.top()] = a[i];     // or i - st.top() for a distance",
      "            st.pop();",
      "        }",
      "        st.push(i);",
      "    }",
      "    return ans;",
      "}",
      "",
      "// Previous smaller element to the left. -1 if none.",
      "vector<int> prevSmaller(const vector<int>& a) {",
      "    int n = (int)a.size();",
      "    vector<int> ans(n, -1);",
      "    stack<int> st;",
      "    for (int i = 0; i < n; i++) {",
      "        while (!st.empty() && a[st.top()] >= a[i]) st.pop();",
      "        if (!st.empty()) ans[i] = a[st.top()];",
      "        st.push(i);",
      "    }",
      "    return ans;",
      "}",
    ],
    templateNotes: [
      "Store indices, not values. You can still read the value as <code>a[st.top()]</code>, and the index gives you a distance or a width.",
      "Next-greater answers the <em>popped</em> item: the current element is what it waited for. Previous-smaller answers the <em>current</em> item: after popping, the top is its answer.",
      "The comparison decides ties. <code>&gt;</code> keeps equal values waiting; <code>&gt;=</code> pops them. Pick by whether the problem says strictly greater.",
      "Anything left on the stack after the loop never found an answer, so it keeps the default (0 or -1). For LC 84, a sentinel height 0 at the end flushes it.",
    ],
    variants: [
      ["Next greater or smaller", "Pop while the new value beats the top; answer the popped index", "739, 496, 503"],
      ["Previous greater or smaller", "Pop while the top does not qualify; the top left over is the answer for i", "84, 901, 907"],
      ["Area between walls", "A pop measures the popped bar against the new top and the current index", "84, 85, 42"],
      ["Matching stack", "Push openers, pop on the matching closer, use positions for lengths", "20, 32, 150, 155"],
    ],
    mistakes: [
      "Storing values instead of indices, then needing a distance or width and not knowing where the popped item sat.",
      "Using <code>if</code> instead of <code>while</code>, so a step that should settle several waiting items settles only one.",
      "Getting ties wrong: <code>&gt;=</code> instead of <code>&gt;</code> pops equal values and changes the answer on inputs like <code>[55,55,56]</code>.",
      "In LC 84, forgetting the sentinel at the end, so bars still on the stack are never measured and <code>[1,2,3]</code> returns 0.",
      "In LC 84, computing width as <code>i - top</code> instead of <code>i - st.top() - 1</code> after the pop, which ignores taller bars to the left.",
      "Calling <code>st.top()</code> on an empty stack. Always check <code>!st.empty()</code> first in the loop condition.",
    ],
    complexity: [
      ["Monotonic stack, one pass", "O(n)", "O(n)", "Each index is pushed once and popped at most once, so the inner while loop runs at most n times in total."],
      ["Two passes (previous and next smaller)", "O(n)", "O(n)", "Two separate one-pass scans plus two arrays of answers."],
      ["Brute force over pairs", "O(n²)", "O(1)", "For each i, scan forward until a match. Shown only to explain what the stack saves."],
    ],
    sayIt: "When a problem asks, for each element, for the next or previous element that is bigger or smaller, I use a monotonic stack. I push indices, not values, and keep the values on the stack sorted, so the top is always the nearest item that still waits for an answer. For each new element I pop while it beats the top. Every popped index has just found its answer, which is the current index or value, or a distance between them. Then I push the new index. Items left on the stack at the end never found an answer and keep the default. The while loop inside the for loop looks quadratic, but each index is pushed once and popped at most once, so the total is O(n) time and O(n) space. For the histogram problem I add a sentinel height of zero at the end so every bar gets measured. Before coding, I check whether ties should pop, because that decides between greater and greater-or-equal.",
    followups: [
      ["Why is the nested loop still O(n)?", "Each index is pushed once and popped at most once. The inner loop's work across the whole run is at most n pops, not n per step."],
      ["How do you handle a circular array (LC 503)?", "Loop i from 0 to 2n - 1 and read <code>a[i % n]</code>. Only push indices during the first pass; the second pass just resolves what is still waiting."],
      ["How would you get the largest rectangle in a 0/1 matrix (LC 85)?", "Build a height array row by row (height + 1 on a 1, reset to 0 on a 0) and run LC 84 on each row. O(rows × cols)."],
      ["Could you use a queue instead?", "No. The item to settle first is the most recent one waiting, and only a stack gives you the newest item first."],
    ],
    rubric: {
      strong: [
        "Named the signal (first match on one side for every element) and stated the stack invariant: sorted, top is the nearest waiting item.",
        "Wrote clean code with indices, a while loop, the right strict or non-strict comparison, and handled items left on the stack.",
        "Explained the amortised O(n) (one push and one pop per index) and tested ties, an empty input and a strictly falling input.",
      ],
      weak: [
        "Said \"use a stack\" without saying what the stack holds or why the top is the right item to check.",
        "Used an if instead of a while, stored values when a distance was needed, or got the width formula wrong.",
        "Called it O(n²) because of the nested loop, or reached for a heap when only the nearest match mattered.",
      ],
    },
  },

  quiz: [
    ["In LC 739 the stack holds <b>indices</b>, not temperatures. Why?",
      ["So the stack can use a plain int type", "So a popped day knows where it sat, and <code>i - j</code> gives the wait", "Because temperatures can repeat", "Because indices take less memory than values"],
      1, "The answer is a distance, so each waiting item must remember its position. The temperature is still one lookup away: <code>t[st.top()]</code>."],
    ["A monotonic stack pass over <code>n</code> elements has a while loop inside a for loop. What is the total time?",
      ["O(n log n), because the stack stays sorted", "O(n²), because the while loop can run n times per step", "O(n), because each index is pushed once and popped at most once", "O(n·k), where k is the largest stack size"],
      2, "Pushes and pops are O(1) and each index does each at most once, so all the inner loops together do at most n pops."],
    ["Which problem is the <b>wrong</b> fit for a monotonic stack?",
      ["Return the k-th largest number in the array", "Largest rectangle in a histogram", "Next greater element to the right of each index", "Days until a warmer temperature"],
      0, "The k-th largest is a global rank. A heap or quickselect fits; a monotonic stack only knows about the nearest waiting items."],
  ],

  drills: [
    { prompt: "Each day you get today's stock price. Return how many consecutive days, ending today, had a price less than or equal to today's.",
      answer: "stacks-monotonic", distractors: ["sliding-window", "prefix-sum-hashing", "dp-1d"],
      why: "For each day you need the previous strictly greater price. Pop smaller prices off a stack of (price, span) pairs and add their spans." },
    { prompt: "Bars of width 1 have given heights. Return the area of the largest rectangle that fits under the bars.",
      answer: "stacks-monotonic", distractors: ["two-pointers", "sliding-window", "dp-1d"],
      why: "Each bar's rectangle ends at the first shorter bar on each side. A stack with heights that never drop finds both ends in one pass." },
    { prompt: "Given an array, return for each index the next element to its right that is larger, or -1 if there is none.",
      answer: "stacks-monotonic", distractors: ["two-pointers", "binary-search", "heaps"],
      why: "First match on one side for every element. Keep waiting indices on a stack and settle them when a larger value arrives." },
    { prompt: "Given a string of '(' and ')', return the length of the longest substring where the brackets are balanced.",
      answer: "stacks-monotonic", distractors: ["sliding-window", "two-pointers", "backtracking"],
      why: "Push indices of unmatched brackets. When a ')' matches, the valid length is the distance to the index now on top." },
    { prompt: "Design a stack that supports push, pop, top and returning the current minimum, all in O(1).",
      answer: "stacks-monotonic", distractors: ["heaps", "linked-lists", "math-design"],
      why: "Keep a second stack (or a pair per entry) holding the minimum so far. Popping restores the previous minimum for free." },
    { prompt: "Given an array, return for each element the closest element to its left that is smaller, or -1 if none.",
      answer: "stacks-monotonic", distractors: ["two-pointers", "binary-search", "sliding-window"],
      why: "Previous smaller element. Pop while the top is not smaller; whatever is left on top is the answer, then push i." },
  ],

  flashcards: [
    { id: "ms-amortised", front: "Monotonic stack, one pass over n elements: time?", back: "O(n). Each index is pushed once and popped at most once, so the inner while loop runs at most n times in total." },
    { id: "ms-space", front: "Monotonic stack: worst-case space, and which input causes it?", back: "O(n). For next-greater, a strictly falling input never pops, so every index stays on the stack." },
    { id: "ms-lc739", front: "Daily Temperatures (LC 739): time and space?", back: "O(n) time and O(n) space for the stack of waiting days." },
    { id: "ms-lc84", front: "Largest Rectangle in Histogram (LC 84): time, space and the end trick?", back: "O(n) time, O(n) space. Add a sentinel height 0 after the last bar so every bar is popped and measured; width is <code>i - st.top() - 1</code>." },
    { id: "ms-minstack", front: "Min Stack (LC 155): time per operation and space?", back: "O(1) for push, pop, top and getMin. O(n) space for the extra minimum per entry." },
  ],

  problems: [20, 155, 739, 84, 42],
});
