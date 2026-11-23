// Pattern 04: Binary Search. Writer A.
// Demo 1 "rotated-search" (LC 33), demo 2 "koko-bananas" (LC 875).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "binary-search",
  num: 4,
  title: "Binary Search",
  summary: "Halve the search range at every step by asking one yes/no question about the middle, so n candidates take about log2(n) checks.",
  tags: ["binary search", "sorted array", "rotated array", "lower bound", "search on answer", "minimum feasible", "log n"],

  demos: [
    {
      id: "rotated-search",
      title: "Search in Rotated Sorted Array",
      lc: 33,
      problem: "A sorted array of distinct values was rotated at an unknown point. Return the index of <code>target</code>, or <code>-1</code>, in O(log n). <code>nums = [4,5,6,7,0,1,2]</code>, <code>target = 0</code> gives <code>4</code>.",
      code: [
        "int search(vector<int>& nums, int target) {",
        "    int lo = 0, hi = (int)nums.size() - 1;",
        "    while (lo <= hi) {",
        "        int mid = lo + (hi - lo) / 2;",
        "        if (nums[mid] == target) return mid;",
        "        if (nums[lo] <= nums[mid]) {",
        "            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;",
        "            else lo = mid + 1;",
        "        } else {",
        "            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;",
        "            else hi = mid - 1;",
        "        }",
        "    }",
        "    return -1;",
        "}",
      ],
      fields: [
        { key: "nums", label: "nums (rotated, distinct)", type: "ints", value: "4,5,6,7,0,1,2" },
        { key: "target", label: "target", type: "int", value: "0" },
      ],
      run(input, rec) {
        const nums = input.nums, target = input.target;
        const n = nums.length;
        if (new Set(nums).size !== n) { rec.error("Values must be distinct."); return null; }
        let drops = 0;
        for (let k = 0; k + 1 < n; k++) if (nums[k] > nums[k + 1]) drops++;
        if (drops > 1 || (drops === 1 && nums[n - 1] > nums[0])) { rec.error("nums must be a sorted array rotated at one point, like 4,5,6,7,0,1,2."); return null; }
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        let lo = 0, hi = n - 1, mid = null, test = "-";
        const out = new Set();                      // indexes ruled out

        const views = (o) => {
          o = o || {};
          const marks = {};
          out.forEach((k) => { marks[k] = "dim"; });
          if (mid !== null) marks[mid] = o.midMark || "hot";
          Object.assign(marks, o.marks || {});
          const ptr = { lo: lo, hi: hi };
          if (mid !== null) ptr.mid = mid;
          return [
            { id: "nums", type: "array", label: "nums", values: nums, pointers: ptr,
              ranges: o.ranges || (lo <= hi ? [{ from: lo, to: hi, mark: "in", label: "lo..hi" }] : []), marks: marks },
            { id: "test", type: "calc", label: "check (target = " + target + ")", value: test },
          ];
        };
        const rule = (a, b) => { for (let k = a; k <= b; k++) out.add(k); };

        frame({
          line: 2, title: "Search the whole array",
          t: `Start with <code>lo = 0</code> and <code>hi = ${hi}</code>. The array is not sorted as a whole, but cut anywhere and at least one side is sorted.`,
          tip: "That one fact is the whole trick: a sorted half has a known min and max, so we can tell in O(1) whether the target can be in it.",
          vars: { lo: lo, hi: hi, target: target },
          views: views(),
        });

        let halfTip = false, moveTip = false;
        while (lo <= hi) {
          mid = lo + Math.floor((hi - lo) / 2);
          if (nums[mid] === target) {
            test = `nums[${mid}] = ${nums[mid]} = target`;
            frame({
              line: [4, 5], title: `Found at index ${mid}`,
              t: `<code>mid = ${lo} + (${hi} - ${lo}) / 2 = ${mid}</code>, and <code>nums[${mid}] = ${nums[mid]}</code> is the target. Return <b>${mid}</b>.`,
              tip: "Each step halved the range, so this took at most about log2(n) + 1 checks. O(log n) time, O(1) space.",
              vars: { lo: lo, mid: mid, hi: hi, "nums[mid]": nums[mid], target: target },
              views: views({ midMark: "good" }),
            });
            if (total > 40) rec.truncated(total - 40);
            return mid;
          }
          test = `nums[${mid}] = ${nums[mid]} ≠ ${target}`;
          frame({
            line: [4, 5], title: `Probe mid = ${mid}`,
            t: `<code>mid = ${lo} + (${hi} - ${lo}) / 2 = ${mid}</code>. <code>nums[${mid}] = ${nums[mid]}</code> is not the target, so decide which half to keep.`,
            vars: { lo: lo, mid: mid, hi: hi, "nums[mid]": nums[mid], target: target },
            views: views(),
          });
          const leftSorted = nums[lo] <= nums[mid];
          test = leftSorted ? `nums[lo] ${nums[lo]} ≤ nums[mid] ${nums[mid]}` : `nums[lo] ${nums[lo]} > nums[mid] ${nums[mid]}`;
          frame({
            line: leftSorted ? 6 : 9, title: leftSorted ? "Left half is sorted" : "Right half is sorted",
            t: leftSorted
              ? `<code>nums[${lo}] = ${nums[lo]} ≤ nums[${mid}] = ${nums[mid]}</code>, so <code>nums[${lo}..${mid}]</code> has no drop in it. Its values run from ${nums[lo]} to ${nums[mid]}.`
              : `<code>nums[${lo}] = ${nums[lo]} > nums[${mid}] = ${nums[mid]}</code>, so the drop is in the left half and <code>nums[${mid}..${hi}]</code> is sorted, from ${nums[mid]} to ${nums[hi]}.`,
            tip: halfTip ? undefined : "Use <code>&lt;=</code> in <code>nums[lo] &lt;= nums[mid]</code>. When <code>lo == mid</code> the left half is one element, which counts as sorted.",
            vars: { lo: lo, mid: mid, hi: hi, "nums[lo]": nums[lo], "nums[mid]": nums[mid], "nums[hi]": nums[hi] },
            views: views({ ranges: [leftSorted ? { from: lo, to: mid, mark: "good", label: "sorted" } : { from: mid, to: hi, mark: "good", label: "sorted" }] }),
          });
          halfTip = true;
          const oldLo = lo, oldHi = hi, m = mid;
          let line, inside;
          if (leftSorted) {
            inside = nums[lo] <= target && target < nums[mid];
            test = `${nums[lo]} ≤ ${target} < ${nums[mid]}? ${inside ? "yes" : "no"}`;
            if (inside) { hi = mid - 1; line = 7; } else { lo = mid + 1; line = 8; }
          } else {
            inside = nums[mid] < target && target <= nums[hi];
            test = `${nums[mid]} < ${target} ≤ ${nums[hi]}? ${inside ? "yes" : "no"}`;
            if (inside) { lo = mid + 1; line = 10; } else { hi = mid - 1; line = 11; }
          }
          const keepRight = lo > oldLo;
          if (keepRight) rule(oldLo, m); else rule(m, oldHi);
          mid = null;
          const sortedDesc = leftSorted ? `${nums[oldLo]}..${nums[m]}` : `${nums[m]}..${nums[oldHi]}`;
          frame({
            line: line, title: keepRight ? "Keep the right part" : "Keep the left part",
            t: `${inside ? `The target ${target} lies inside the sorted range ${sortedDesc}` : `The target ${target} is not inside the sorted range ${sortedDesc}`}, so ${inside ? "it can only be there" : "it can only be in the other part"}. ${keepRight ? `Set <code>lo = ${lo}</code>.` : `Set <code>hi = ${hi}</code>.`}`,
            tip: moveTip ? undefined : "We only test the target against the sorted half. The other half is not sorted, so its min and max are unknown.",
            vars: { lo: lo, hi: hi, target: target },
            views: views({ marks: { [m]: "bad" } }),
          });
          moveTip = true;
        }

        mid = null;
        test = "lo > hi";
        frame({
          line: 14, title: "Range is empty: -1",
          t: `<code>lo = ${lo}</code> passed <code>hi = ${hi}</code>, so no index is left to check. ${target} is not in the array. Return <b>-1</b>.`,
          tip: "Returning -1 after the loop is safe because every index was ruled out by a sorted-half test.",
          vars: { lo: lo, hi: hi, target: target },
          views: views(),
        });
        if (total > 40) rec.truncated(total - 40);
        return -1;
      },
      expect: [
        [{ nums: "4,5,6,7,0,1,2", target: "0" }, 4],
        [{ nums: "4,5,6,7,0,1,2", target: "3" }, -1],
        [{ nums: "1", target: "0" }, -1],
        [{ nums: "1", target: "1" }, 0],
        [{ nums: "3,1", target: "1" }, 1],
        [{ nums: "5,1,3", target: "5" }, 0],
        [{ nums: "1,2,3,4,5,6", target: "4" }, 3],
        [{ nums: "", target: "5" }, -1],
      ],
    },
    {
      id: "koko-bananas",
      title: "Koko Eating Bananas",
      lc: 875,
      problem: "Koko eats from one pile per hour, at most <code>k</code> bananas, so a pile <code>p</code> takes <code>ceil(p / k)</code> hours. Return the smallest speed <code>k</code> that finishes every pile within <code>h</code> hours. <code>piles = [3,6,7,11]</code>, <code>h = 8</code> gives <code>4</code>.",
      code: [
        "int minEatingSpeed(vector<int>& piles, int h) {",
        "    int lo = 1, hi = *max_element(piles.begin(), piles.end());",
        "    while (lo < hi) {",
        "        int mid = lo + (hi - lo) / 2;",
        "        long long hours = 0;",
        "        for (int p : piles) hours += (p + mid - 1) / mid;",
        "        if (hours <= h) hi = mid;",
        "        else lo = mid + 1;",
        "    }",
        "    return lo;",
        "}",
      ],
      fields: [
        { key: "piles", label: "piles", type: "ints", value: "3,6,7,11" },
        { key: "h", label: "h (hours)", type: "int", value: "8" },
      ],
      run(input, rec) {
        const piles = input.piles, h = input.h;
        if (!piles.length) { rec.error("Give at least one pile."); return null; }
        if (piles.some((p) => p < 1)) { rec.error("Each pile needs at least 1 banana."); return null; }
        if (h < piles.length) { rec.error(`h must be at least the number of piles (${piles.length}); Koko eats from one pile per hour.`); return null; }
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        const maxP = Math.max(...piles);
        let lo = 1, hi = maxP, mid = null, hours = "-";
        let per = piles.map(() => "-");
        const small = maxP <= 30;
        const speeds = small ? Array.from({ length: maxP }, (_, k) => k + 1) : null;

        const views = (o) => {
          o = o || {};
          let sv;
          if (small) {
            const marks = {};
            for (let s = 1; s <= maxP; s++) {
              if (s < lo) marks[s - 1] = "bad";
              else if (s > hi) marks[s - 1] = "dim";
            }
            if (mid !== null) marks[mid - 1] = o.midMark || "hot";
            const ptr = { lo: lo - 1, hi: hi - 1 };
            if (mid !== null) ptr.mid = mid - 1;
            sv = { id: "speeds", type: "array", label: "speed k (index shown = k - 1)", values: speeds, pointers: ptr,
              ranges: [{ from: lo - 1, to: hi - 1, mark: lo === hi ? "good" : "in", label: lo === hi ? "answer" : "lo..hi" }], marks: marks };
          } else {
            sv = { id: "speeds", type: "intervals", label: "speed k", axis: [1, maxP],
              items: [{ id: "range", start: lo, end: hi, label: `lo ${lo} .. hi ${hi}` }],
              marks: { range: lo === hi ? "good" : "in" } };
            if (mid !== null) sv.cursor = mid;
          }
          return [
            { id: "piles", type: "array", label: "piles", values: piles, marks: o.pileMarks || {} },
            sv,
            { id: "per", type: "array", label: mid === null ? "hours per pile" : `hours per pile at k = ${mid}`, values: per, marks: o.perMarks || {} },
            { id: "hours", type: "calc", label: `total hours (limit h = ${h})`, value: hours },
          ];
        };

        frame({
          line: 2, title: "Search speeds 1..max",
          t: `The answer is a speed between <code>1</code> and the biggest pile, <code>${maxP}</code>. At speed ${maxP} every pile takes one hour, which fits because <code>h = ${h}</code> is at least the number of piles, ${piles.length}.`,
          tip: "Faster never takes longer. So the speeds split into \"too slow\" then \"fast enough\", and we want the first fast-enough one. That one-way split is what binary search needs.",
          vars: { lo: lo, hi: hi, h: h },
          views: views(),
        });

        let sumTip = false, keepTip = false;
        while (lo < hi) {
          mid = lo + Math.floor((hi - lo) / 2);
          per = piles.map(() => "-"); hours = "-";
          frame({
            line: 4, title: `Try speed ${mid}`,
            t: `<code>mid = ${lo} + (${hi} - ${lo}) / 2 = ${mid}</code>. Check whether eating ${mid} bananas an hour finishes in time.`,
            vars: { lo: lo, mid: mid, hi: hi },
            views: views(),
          });
          let hrs = 0;
          per = piles.map((p) => Math.floor((p + mid - 1) / mid));
          for (const x of per) hrs += x;
          hours = `${per.join(" + ")} = ${hrs}`;
          const ok = hrs <= h;
          const pm = {}; per.forEach((_, j) => { pm[j] = ok ? "good" : "bad"; });
          frame({
            line: [5, 6], title: `${hrs} hours at speed ${mid}`,
            t: `Each pile takes <code>ceil(p / ${mid})</code> hours: ${piles.map((p, j) => `${p} → ${per[j]}`).join(", ")}. Total <b>${hrs}</b>, ${ok ? `within` : `more than`} <code>h = ${h}</code>.`,
            tip: sumTip ? undefined : "<code>(p + mid - 1) / mid</code> is ceiling division with integers only. The total is a <code>long long</code> because many big piles at speed 1 can pass the int range.",
            vars: { lo: lo, mid: mid, hi: hi, hours: hrs, h: h },
            views: views({ perMarks: pm }),
            moves: [{ from: ["piles", piles.length - 1], to: ["per", piles.length - 1], label: `÷${mid}` }],
          });
          sumTip = true;
          if (ok) {
            hi = mid;
            const m = mid; mid = null;
            frame({
              line: 7, title: "Fast enough: try slower",
              t: `Speed ${m} works, so the answer is ${m} or slower. Set <code>hi = ${m}</code>, keeping ${m} in the range because it may be the answer.`,
              tip: keepTip ? undefined : "This is why the loop is <code>lo &lt; hi</code> with <code>hi = mid</code>, not <code>mid - 1</code>: a working speed is never thrown away.",
              vars: { lo: lo, hi: hi, h: h },
              views: views({ perMarks: pm }),
            });
            keepTip = true;
          } else {
            lo = mid + 1;
            const m = mid; mid = null;
            frame({
              line: 8, title: "Too slow: go faster",
              t: `Speed ${m} needs ${hrs} hours, over the limit. Slower speeds need even more hours, so set <code>lo = ${m} + 1 = ${lo}</code>.`,
              vars: { lo: lo, hi: hi, h: h },
              views: views({ perMarks: pm }),
            });
          }
        }

        mid = null;
        frame({
          line: 10, title: `Answer: speed ${lo}`,
          t: `<code>lo</code> and <code>hi</code> met at <b>${lo}</b>: the slowest speed that still finishes within ${h} hours.`,
          tip: "O(n log M) time, where M is the biggest pile: log M guesses, each summing n piles. O(1) extra space.",
          vars: { lo: lo, hi: hi, h: h },
          views: views(),
        });
        if (total > 40) rec.truncated(total - 40);
        return lo;
      },
      expect: [
        [{ piles: "3,6,7,11", h: "8" }, 4],
        [{ piles: "30,11,23,4,20", h: "5" }, 30],
        [{ piles: "30,11,23,4,20", h: "6" }, 23],
        [{ piles: "1", h: "1" }, 1],
        [{ piles: "312884470", h: "312884469" }, 2],
        [{ piles: "5,5", h: "10" }, 1],
      ],
    },
  ],

  explain: {
    plain: "Binary search keeps a range that must contain the answer and halves it each step by asking a yes/no question about the middle. It works on any search space where the answers are \"no, no, …, yes, yes\" in order: a sorted array, a rotated array, or a range of possible answers.",
    spot: [
      "The input is sorted (or sorted and rotated), and you need a position, a first or last occurrence, or an insert point.",
      "The question says O(log n), or n is large enough (10^9) that a linear scan is too slow.",
      "\"Smallest speed / capacity / time such that …\" or \"largest value such that …\": the answer is a number you can test.",
      "Testing a candidate answer is easy, and if a candidate works, every bigger (or every smaller) one also works.",
      "Two sorted arrays and a median or k-th element: cut both and binary search on the cut position.",
    ],
    notWhen: [
      "The data is unsorted and you search once. A linear scan is O(n); sorting first costs O(n log n) and only pays off for many queries.",
      "The feasibility check is not one-way (a candidate can work, the next fail, the next work again). Binary search would skip answers.",
    ],
    template: [
      "// First value in [lo, hi] where ok is true; ok must be false...false, true...true.",
      "// Returns hi + 1 if ok is never true. Covers lower_bound and search on the answer.",
      "template <class F>",
      "long long firstTrue(long long lo, long long hi, F ok) {",
      "    hi++;                              // hi + 1 stands for \"not found\"",
      "    while (lo < hi) {",
      "        long long mid = lo + (hi - lo) / 2;",
      "        if (ok(mid)) hi = mid;         // mid works: answer is mid or left",
      "        else lo = mid + 1;             // mid fails: answer is right of mid",
      "    }",
      "    return lo;",
      "}",
      "",
      "// Exact search on a sorted array: closed range [lo, hi].",
      "int findIndex(const vector<int>& a, int target) {",
      "    int lo = 0, hi = (int)a.size() - 1;",
      "    while (lo <= hi) {",
      "        int mid = lo + (hi - lo) / 2;",
      "        if (a[mid] == target) return mid;",
      "        if (a[mid] < target) lo = mid + 1;",
      "        else hi = mid - 1;",
      "    }",
      "    return -1;",
      "}",
    ],
    templateNotes: [
      "<code>firstTrue</code> needs <code>ok</code> to be false then true across the range. Lower bound is <code>ok(i) = a[i] &gt;= x</code>; Koko is <code>ok(k) = hours(k) &lt;= h</code>.",
      "With <code>lo &lt; hi</code> and <code>hi = mid</code>, a working candidate is never dropped, and the loop ends with <code>lo == hi</code> on the answer.",
      "<code>lo + (hi - lo) / 2</code> avoids the overflow of <code>(lo + hi) / 2</code>, and rounds down, so <code>lo = mid + 1</code> always makes progress.",
      "The exact-search form uses a closed range and <code>lo &lt;= hi</code>, moving past <code>mid</code> on both sides because <code>mid</code> was already checked.",
      "Pick one form and keep its loop guard and updates together. Mixing <code>lo &lt;= hi</code> with <code>hi = mid</code> loops forever.",
    ],
    variants: [
      ["Exact match on sorted data", "Closed range, return on equal", "704"],
      ["Rotated sorted array", "One half is always sorted; test the target against it", "33, 153"],
      ["Search on the answer", "Binary search a speed, capacity or time with a feasibility check", "875, 1011, 410"],
      ["Partition two arrays", "Binary search the cut in the shorter array so the left halves balance", "4"],
    ],
    mistakes: [
      "Mixing loop forms: <code>while (lo &lt;= hi)</code> with <code>hi = mid</code> never ends when <code>lo == hi</code>.",
      "Computing <code>(lo + hi) / 2</code> with large ints, which can overflow. Use <code>lo + (hi - lo) / 2</code>.",
      "In LC 33, writing <code>nums[lo] &lt; nums[mid]</code> instead of <code>&lt;=</code>. When <code>lo == mid</code> the one-element left half is sorted, and the strict test sends you the wrong way.",
      "Testing the target against the unsorted half, whose min and max are unknown.",
      "In search-on-answer, setting the range too small (for example starting Koko at 0, which divides by zero) or too big without need.",
      "Summing hours in an <code>int</code> when n piles of 10^9 at speed 1 can pass 2^31.",
    ],
    complexity: [
      ["Binary search on an array", "O(log n)", "O(1)", "The range halves each step."],
      ["Rotated sorted array (LC 33)", "O(log n)", "O(1)", "One extra comparison per step to find the sorted half."],
      ["Search on the answer (LC 875)", "O(n log M)", "O(1)", "log M guesses over speeds up to M, each with an O(n) check."],
      ["Median of two sorted arrays (LC 4)", "O(log min(m, n))", "O(1)", "Binary search the cut in the shorter array."],
    ],
    sayIt: "I reach for binary search when the input is sorted or rotated, when the question asks for O(log n), or when it asks for the smallest or largest value that satisfies a condition. The key check is that the answers form a one-way split: every candidate below some point fails and every candidate from that point on works. Then I keep a range that must contain the answer and test the middle. If the middle works, I keep it and look left; if it fails, I move right past it. I write mid as lo plus half the gap to avoid overflow, and I pick one loop form and keep it consistent: lo less than or equal to hi for an exact match, lo less than hi with hi equals mid for a first-true search. For a rotated array, one half around mid is always sorted, so I test the target against that half. For search on the answer, the cost is log of the answer range times the check.",
    followups: [
      ["What if the rotated array can have duplicates (LC 81)?", "When nums[lo] == nums[mid] you cannot tell which half is sorted, so step lo forward by one. The worst case becomes O(n)."],
      ["How do you find the rotation point itself (LC 153)?", "Compare nums[mid] with nums[hi]: if it is bigger, the minimum is to the right of mid, else it is at mid or to its left. Loop while lo < hi."],
      ["Why is Koko's check allowed to be binary searched?", "A faster speed never needs more hours, so the feasibility answer is false then true across speeds. Binary search finds the first true."],
      ["Can you speed up the Koko check?", "Stop summing once hours exceed h. The worst case stays O(n) per check, but it often ends early."],
    ],
    rubric: {
      strong: [
        "Named the one-way property (sorted order, or feasibility that only flips once) that makes halving safe.",
        "Wrote a loop whose guard and updates match (closed range with mid ± 1, or lo < hi with hi = mid) and an overflow-safe mid.",
        "Stated O(log n) or O(n log M) with the reason, and tested edges: one element, target absent, answer at either end.",
      ],
      weak: [
        "Used binary search without explaining why the answers are ordered.",
        "Mixed loop forms, causing an infinite loop or an off-by-one at the ends.",
        "Gave the complexity without counting the cost of each check, or skipped the not-found case.",
      ],
    },
  },

  quiz: [
    ["In LC 33, <code>nums[lo] &lt;= nums[mid]</code> is true. What does that tell you?",
      ["The target is in the left half", "The whole array is sorted", "<code>nums[lo..mid]</code> has no drop in it, so its values run from nums[lo] to nums[mid]", "The rotation point is at mid"],
      2, "It only says the left half is sorted. You then check whether the target lies between nums[lo] and nums[mid] to decide which side to keep."],
    ["Why does Koko's search use <code>hi = mid</code> instead of <code>hi = mid - 1</code>?",
      ["Because mid is fast enough and may itself be the answer", "To avoid integer overflow", "Because the loop is <code>lo &lt;= hi</code>", "It makes the search faster"],
      0, "We want the first speed that works. If mid works, it is a candidate, so it must stay in the range. The loop is lo < hi, so it still ends."],
    ["Which question is NOT a good fit for binary search on the answer?",
      ["Smallest ship capacity that ships all packages in d days", "Smallest eating speed that finishes in h hours", "Largest minimum distance when placing k items on sorted positions", "Count of subarrays whose sum equals k"],
      3, "Counting subarrays has no candidate value to test and no one-way split. It is a prefix-sum and hash-map problem."],
  ],

  drills: [
    { prompt: "Given a sorted array that was rotated at an unknown index, return the index of a target value in O(log n).",
      answer: "binary-search", distractors: ["two-pointers", "prefix-sum-hashing", "greedy"],
      why: "Sorted plus O(log n). At every middle, one side is sorted, so you can rule out half." },
    { prompt: "Given packages with weights in a fixed order and a number of days, return the smallest ship capacity that ships them all in time.",
      answer: "binary-search", distractors: ["greedy", "dp-knapsack", "heaps"],
      why: "\"Smallest capacity such that it works\": a bigger ship never needs more days. Binary search the capacity and test with a greedy pass." },
    { prompt: "Given a sorted array and a value, return the first index where the value could be inserted to keep the array sorted.",
      answer: "binary-search", distractors: ["two-pointers", "sliding-window", "stacks-monotonic"],
      why: "The first index with a[i] >= x. The test is false then true across the array." },
    { prompt: "Given two sorted arrays, return the median of all their values in logarithmic time.",
      answer: "binary-search", distractors: ["heaps", "two-pointers", "intervals"],
      why: "Logarithmic time on sorted data. Binary search the cut in the shorter array so both left parts together hold half the values." },
    { prompt: "Given a sorted array that was rotated, return its smallest value.",
      answer: "binary-search", distractors: ["greedy", "stacks-monotonic", "two-pointers"],
      why: "Compare the middle with the right end: if it is bigger, the drop is to the right. Halve until one index remains." },
    { prompt: "Given a non-negative integer x, return the integer part of its square root without using a library square root.",
      answer: "binary-search", distractors: ["dp-1d", "bit-manipulation", "greedy"],
      why: "Find the largest k with k * k <= x. The test flips once across 0..x, so binary search it." },
  ],

  flashcards: [
    { id: "bs-basic", front: "Binary search on a sorted array: time and space?", back: "O(log n) time, since the range halves each step. O(1) space iteratively." },
    { id: "bs-lc33", front: "Search in Rotated Sorted Array (LC 33): time and space?", back: "O(log n) time with one sorted-half test per step. O(1) space. With duplicates (LC 81) the worst case is O(n)." },
    { id: "bs-lc875", front: "Koko Eating Bananas (LC 875): time and space?", back: "O(n log M) time, M = biggest pile: log M guesses, each summing n piles. O(1) space." },
    { id: "bs-lc4", front: "Median of Two Sorted Arrays (LC 4): time and space?", back: "O(log min(m, n)) time by binary searching the cut in the shorter array. O(1) space." },
    { id: "bs-mid", front: "Why write mid = lo + (hi - lo) / 2?", back: "(lo + hi) can overflow int when both are large. lo + (hi - lo) / 2 stays in range and still rounds down." },
  ],

  problems: [704, 33, 153, 4, 875],
});
