// Pattern 03: Prefix Sum / Hashing. Writer A.
// Demo 1 "subarray-sum-k" (LC 560), demo 2 "contiguous-array" (LC 525).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "prefix-sum-hashing",
  num: 3,
  title: "Prefix Sum / Hashing",
  summary: "Keep a running total and a hash map of totals already seen, so the sum of any stretch becomes one subtraction and one lookup.",
  tags: ["prefix sum", "running sum", "hash map", "subarray sum", "count subarrays", "negative numbers", "balance"],

  demos: [
    {
      id: "subarray-sum-k",
      title: "Subarray Sum Equals K",
      lc: 560,
      problem: "Given <code>nums</code> and <code>k</code>, count the contiguous subarrays whose sum is exactly <code>k</code>. Numbers may be negative. <code>nums = [1,2,3]</code>, <code>k = 3</code> gives <code>2</code> (<code>[1,2]</code> and <code>[3]</code>).",
      code: [
        "int subarraySum(vector<int>& nums, int k) {",
        "    unordered_map<int, int> count{{0, 1}};",
        "    int running = 0, ans = 0;",
        "    for (int x : nums) {",
        "        running += x;",
        "        auto it = count.find(running - k);",
        "        if (it != count.end()) ans += it->second;",
        "        count[running]++;",
        "    }",
        "    return ans;",
        "}",
      ],
      fields: [
        { key: "nums", label: "nums", type: "ints", value: "1,2,3" },
        { key: "k", label: "k", type: "int", value: "3" },
      ],
      run(input, rec) {
        const nums = input.nums, k = input.k;
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        const count = new Map([[0, 1]]);
        const ends = [{ end: -1, val: 0 }];     // prefix value after each index, -1 = empty prefix
        let running = 0, ans = 0, i = null, need = "-";
        let firstHit = true, negShown = false;

        const views = (o) => {
          o = o || {};
          const marks = {};
          if (i !== null) for (let j = 0; j < i; j++) marks[j] = "dim";
          if (i !== null && i < nums.length) marks[i] = o.iMark || "hot";
          return [
            { id: "nums", type: "array", label: "nums", values: nums,
              pointers: i === null ? {} : { i: Math.min(i, nums.length) }, ranges: o.ranges || [], marks: marks },
            { id: "count", type: "map", kind: "counter", label: "count (prefix sum → times seen)",
              entries: [...count.entries()], marks: o.mapMarks || {} },
            { id: "need", type: "calc", label: "need = running - k", value: need },
            { id: "ans", type: "calc", label: "ans", value: ans },
          ];
        };

        frame({
          line: 2, title: "Seed the empty prefix",
          t: "Put <code>0 → 1</code> in the map before reading anything. It stands for the empty prefix, so a subarray that starts at index 0 can be counted too.",
          tip: "A subarray <code>nums[j+1..i]</code> sums to <code>prefix[i] - prefix[j]</code>. So we want earlier prefixes equal to <code>running - k</code>.",
          vars: { running: running, ans: ans, k: k },
          views: views(),
        });

        for (i = 0; i < nums.length; i++) {
          const x = nums[i];
          running += x;
          need = "-";
          frame({
            line: 5, title: `Add nums[${i}] = ${x}`,
            t: `Add <code>${x}</code> to the running total: <code>running = ${running}</code>. This is the sum of <code>nums[0..${i}]</code>.`,
            tip: x < 0 && !negShown ? "A negative number makes the total go down. A sliding window cannot handle that, but prefix sums do not care about the sign." : undefined,
            vars: { i: i, x: x, running: running, ans: ans },
            views: views({ ranges: [{ from: 0, to: i, mark: "in", label: "prefix" }] }),
          });
          if (x < 0) negShown = true;

          const want = running - k;
          need = `${running} - ${k} = ${want}`;
          const hits = count.get(want);
          if (hits !== undefined) {
            ans += hits;
            const ranges = ends.filter((e) => e.val === want).map((e) => ({ from: e.end + 1, to: i, mark: "good", label: `sum ${k}` }));
            frame({
              line: [6, 7], title: `Found ${hits} earlier cut${hits > 1 ? "s" : ""}`,
              t: `Look up <code>${want}</code>: seen <b>${hits}</b> time${hits > 1 ? "s" : ""}. Each earlier prefix with total ${want} is a start point, and the stretch after it sums to ${running} - ${want} = ${k}. <code>ans</code> becomes ${ans}.`,
              tip: firstHit ? "We add the whole count, not 1. Two earlier prefixes with the same total give two different subarrays ending here." : undefined,
              vars: { i: i, running: running, "running - k": want, "count[need]": hits, ans: ans },
              views: views({ ranges: ranges, mapMarks: { [want]: "good" }, iMark: "good" }),
              moves: [{ from: ["count", want], to: ["ans", 0], label: "+" + hits }],
            });
            firstHit = false;
          } else {
            frame({
              line: [6, 7], title: "No earlier match",
              t: `Look up <code>${running} - ${k} = ${want}</code>. No earlier prefix has that total, so no subarray ending at index ${i} sums to ${k}.`,
              vars: { i: i, running: running, "running - k": want, ans: ans },
              views: views({ ranges: [{ from: 0, to: i, mark: "in", label: "prefix" }], iMark: "hot" }),
            });
          }

          count.set(running, (count.get(running) || 0) + 1);
          ends.push({ end: i, val: running });
          frame({
            line: 8, title: `Record prefix ${running}`,
            t: `Now add this prefix: <code>count[${running}] = ${count.get(running)}</code>. Later indexes can start a subarray right after index ${i}.`,
            tip: i === 0 ? "Look up first, then record. If we recorded first, <code>k = 0</code> would match the current prefix with itself and count an empty subarray." : undefined,
            vars: { i: i, running: running, ans: ans },
            views: views({ mapMarks: { [running]: "new" } }),
            moves: [{ from: ["nums", i], to: ["count", running], label: String(running) }],
          });
        }

        i = null; need = "-";
        frame({
          line: 10, title: "Return the count",
          t: nums.length
            ? `Every index was read once, with one O(1) lookup each. <b>${ans}</b> subarray${ans === 1 ? "" : "s"} sum to ${k}.`
            : "The array is empty, so there are no subarrays and the answer is <b>0</b>.",
          tip: "O(n) time and O(n) space for the map. The brute force checks every start and end, O(n²).",
          vars: { running: running, ans: ans },
          views: views(),
        });
        if (total > 40) rec.truncated(total - 40);
        return ans;
      },
      expect: [
        [{ nums: "1,2,3", k: "3" }, 2],
        [{ nums: "1,1,1", k: "2" }, 2],
        [{ nums: "1", k: "0" }, 0],
        [{ nums: "1,-1,0", k: "0" }, 3],
        [{ nums: "3,4,7,2,-3,1,4,2", k: "7" }, 4],
        [{ nums: "", k: "0" }, 0],
      ],
    },
    {
      id: "contiguous-array",
      title: "Contiguous Array",
      lc: 525,
      problem: "Given a binary array <code>nums</code>, return the length of the longest contiguous subarray with as many 0s as 1s. <code>[0,1,1,1,1,1,0,0,0]</code> gives <code>6</code> (<code>[1,1,1,0,0,0]</code>).",
      code: [
        "int findMaxLength(vector<int>& nums) {",
        "    unordered_map<int, int> first{{0, -1}};",
        "    int bal = 0, best = 0;",
        "    for (int i = 0; i < (int)nums.size(); i++) {",
        "        bal += nums[i] == 1 ? 1 : -1;",
        "        auto it = first.find(bal);",
        "        if (it != first.end()) best = max(best, i - it->second);",
        "        else first[bal] = i;",
        "    }",
        "    return best;",
        "}",
      ],
      fields: [{ key: "nums", label: "nums (0s and 1s)", type: "ints", value: "0,1,1,1,1,1,0,0,0" }],
      run(input, rec) {
        const nums = input.nums;
        if (nums.some((x) => x !== 0 && x !== 1)) { rec.error("nums may only hold 0 and 1."); return null; }
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        const first = new Map([[0, -1]]);
        let bal = 0, best = 0, i = null, bestL = 0, bestR = -1;
        let hitShown = false, keepShown = false;

        const views = (o) => {
          o = o || {};
          const marks = {};
          if (i !== null && i < nums.length) marks[i] = o.iMark || "hot";
          return [
            { id: "nums", type: "array", label: "nums", values: nums,
              pointers: i === null ? {} : { i: Math.min(i, nums.length) }, ranges: o.ranges || [], marks: marks },
            { id: "first", type: "map", kind: "map", label: "first (balance → earliest index)",
              entries: [...first.entries()], marks: o.mapMarks || {} },
            { id: "bal", type: "calc", label: "bal = #1s - #0s so far", value: bal },
            { id: "best", type: "calc", label: "best", value: best },
          ];
        };

        frame({
          line: 2, title: "Balance 0 before index 0",
          t: "Count a 1 as +1 and a 0 as -1. A stretch with equal 0s and 1s adds up to 0. Seed <code>first[0] = -1</code>: balance 0 is reached before reading anything.",
          tip: "Turning 0 into -1 changes the question to \"longest subarray with sum 0\", which is a prefix-sum question.",
          vars: { bal: bal, best: best },
          views: views(),
        });

        for (i = 0; i < nums.length; i++) {
          const step = nums[i] === 1 ? 1 : -1;
          bal += step;
          frame({
            line: 5, title: `Read nums[${i}] = ${nums[i]}`,
            t: `<code>nums[${i}] = ${nums[i]}</code>, so the balance goes ${step > 0 ? "up" : "down"} by 1 to <b>${bal}</b>.`,
            vars: { i: i, "nums[i]": nums[i], bal: bal, best: best },
            views: views(),
          });
          if (first.has(bal)) {
            const j = first.get(bal);
            const len = i - j;
            const improved = len > best;
            best = Math.max(best, len);
            if (improved) { bestL = j + 1; bestR = i; }
            frame({
              line: [6, 7], title: improved ? "Balance seen: new best" : "Balance seen before",
              t: `Balance ${bal} was first seen at index ${j}. The balance is the same at both ends, so <code>nums[${j + 1}..${i}]</code> adds up to 0: equal 0s and 1s. Its length is <code>${i} - ${j < 0 ? "(" + j + ")" : j} = ${len}</code>${improved ? ", a new best." : `, not longer than ${best}.`}`,
              tip: hitShown ? undefined : "Same balance at two indexes means the part between them sums to 0.",
              vars: { i: i, bal: bal, "first[bal]": j, "i - first[bal]": len, best: best },
              views: views({ ranges: [{ from: j + 1, to: i, mark: improved ? "good" : "in", label: "len " + len }], mapMarks: { [bal]: "in" }, iMark: "good" }),
              moves: improved ? [{ from: ["first", bal], to: ["best", 0], label: String(len) }] : undefined,
            });
            hitShown = true;
          } else {
            first.set(bal, i);
            frame({
              line: [6, 8], title: `First time at balance ${bal}`,
              t: `Balance ${bal} is new. Store <code>first[${bal}] = ${i}</code>. If it comes back, the longest stretch will start right after this index.`,
              tip: keepShown || i === 0 ? undefined : "Only the earliest index is stored. We never overwrite it, because an earlier start gives a longer stretch.",
              vars: { i: i, bal: bal, best: best },
              views: views({ mapMarks: { [bal]: "new" } }),
              moves: [{ from: ["nums", i], to: ["first", bal], label: String(i) }],
            });
            if (i > 0) keepShown = true;
          }
        }

        i = null;
        frame({
          line: 10, title: "Return best",
          t: best
            ? `One pass, one lookup per index. The longest balanced stretch is <code>nums[${bestL}..${bestR}]</code>, length <b>${best}</b>.`
            : "No stretch has as many 0s as 1s, so the answer is <b>0</b>.",
          tip: "O(n) time, O(n) space. The balance lies in -n..n, so a vector of size 2n+1 can replace the map.",
          vars: { bal: bal, best: best },
          views: views({ ranges: bestR >= 0 ? [{ from: bestL, to: bestR, mark: "good", label: "best" }] : [] }),
        });
        if (total > 40) rec.truncated(total - 40);
        return best;
      },
      expect: [
        [{ nums: "0,1,1,1,1,1,0,0,0" }, 6],
        [{ nums: "0,1" }, 2],
        [{ nums: "0,1,0" }, 2],
        [{ nums: "1,1,1" }, 0],
        [{ nums: "" }, 0],
        [{ nums: "0,0,1,0,0,0,1,1" }, 6],
      ],
    },
  ],

  explain: {
    plain: "A prefix sum is the running total up to each index. The sum of any stretch <code>i..j</code> is <code>prefix[j] - prefix[i-1]</code>, so a question about stretches becomes a question about pairs of prefixes. A hash map of prefixes seen so far answers \"has the right earlier prefix appeared?\" in O(1).",
    spot: [
      "The question counts or finds contiguous subarrays with an exact sum, and numbers can be negative.",
      "Many range-sum queries arrive on an array that does not change.",
      "Two kinds of items must balance (0s and 1s, opens and closes, vowels and consonants). Map one to +1 and the other to -1.",
      "The rule is about a sum modulo k (\"sum divisible by k\"). Store prefix mod k in the map.",
      "You need a matching partner seen earlier (Two Sum style): store what you have seen, look up the complement.",
    ],
    notWhen: [
      "All numbers are positive and you want the shortest or longest stretch with sum at least or at most k. A sliding window does it in O(1) space.",
      "The array changes between queries. Use a Fenwick tree or segment tree; a plain prefix array would need rebuilding.",
    ],
    template: [
      "// Count subarrays whose sum is exactly k (any signs).",
      "int countSumK(const vector<int>& a, int k) {",
      "    unordered_map<long long, int> seen{{0, 1}};  // empty prefix",
      "    long long run = 0;",
      "    int count = 0;",
      "    for (int x : a) {",
      "        run += x;",
      "        auto it = seen.find(run - k);   // 1. look up the partner",
      "        if (it != seen.end()) count += it->second;",
      "        seen[run]++;                     // 2. then record yourself",
      "    }",
      "    return count;",
      "}",
      "",
      "// Static range sums: build once, answer each query in O(1).",
      "struct RangeSum {",
      "    vector<long long> pre;            // pre[i] = a[0] + ... + a[i-1]",
      "    RangeSum(const vector<int>& a) : pre(a.size() + 1, 0) {",
      "        for (size_t i = 0; i < a.size(); i++) pre[i + 1] = pre[i] + a[i];",
      "    }",
      "    long long sum(int l, int r) const { return pre[r + 1] - pre[l]; }",
      "};",
    ],
    templateNotes: [
      "Seed the map with the empty prefix (<code>{0, 1}</code> for counting, <code>{0, -1}</code> for longest length), so stretches that start at index 0 are found.",
      "Look up before you record. Recording first would pair the current prefix with itself when k is 0.",
      "For counting, store how many times each prefix appeared. For longest length, store only the first index and never overwrite it.",
      "The <code>pre</code> array has one extra slot so <code>pre[0] = 0</code>, and a range <code>l..r</code> is <code>pre[r + 1] - pre[l]</code> with no special case for <code>l = 0</code>.",
      "Use <code>long long</code> for running totals when values or lengths are large.",
    ],
    variants: [
      ["Count subarrays with sum k", "Map prefix → count, add the count of run - k", "560"],
      ["Longest subarray with sum 0 or balance 0", "Map prefix → first index, length i - first", "525"],
      ["Static range sum queries", "Prefix array in 1D, or a 2D table with inclusion-exclusion", "303, 304"],
      ["Complement lookup", "Store values seen so far, look up target - x", "1"],
    ],
    mistakes: [
      "Forgetting to seed the empty prefix, which misses every subarray that starts at index 0.",
      "Recording the current prefix before looking it up, which counts an empty subarray when k is 0.",
      "Adding 1 instead of the stored count when a prefix appeared several times.",
      "In the longest-length variant, overwriting the first index with a later one, which shortens the answer.",
      "Using a sliding window when numbers can be negative. The sum is not one-way, so shrinking can skip answers.",
      "Off-by-one in the prefix array: the range <code>l..r</code> is <code>pre[r + 1] - pre[l]</code>, not <code>pre[r] - pre[l]</code>.",
    ],
    complexity: [
      ["Running sum + hash map", "O(n)", "O(n)", "One pass, one O(1) average lookup and insert per index."],
      ["Prefix array for range queries", "O(n) build, O(1) per query", "O(n)", "Each query is one subtraction."],
      ["2D prefix table (LC 304)", "O(m·n) build, O(1) per query", "O(m·n)", "Each query uses four table cells."],
      ["Brute force over every start and end", "O(n²)", "O(1)", "Shown only to explain what the map saves."],
    ],
    sayIt: "When a question asks about contiguous subarrays with an exact sum, especially when numbers can be negative, I think prefix sums with a hash map. The sum of a stretch from j plus one to i is the prefix at i minus the prefix at j. So as I walk the array with a running total, I ask whether an earlier prefix equals the running total minus k. A hash map from prefix value to its count answers that in O(1). I seed the map with zero seen once, for the empty prefix, so subarrays starting at index zero count. I look up before I record, so k equal to zero does not match the current prefix with itself. That gives O(n) time and O(n) space. For balance questions like equal zeros and ones, I map zero to minus one and look for a repeated running total, storing the first index. If many range queries come on a fixed array, I build a prefix array once instead.",
    followups: [
      ["Why not a sliding window for LC 560?", "Negative numbers make the sum go down as the window grows, so the rule is not one-way. Moving l could skip valid subarrays."],
      ["What changes for \"sum divisible by k\"?", "Store prefix mod k, fixing negative remainders with ((run % k) + k) % k. Two prefixes with the same remainder bound a stretch divisible by k."],
      ["Could you use an array instead of a hash map in LC 525?", "Yes. The balance stays within -n..n, so a vector of size 2n+1 offset by n works and avoids hashing."],
      ["How would you return the subarrays, not just the count?", "Store a list of end indexes per prefix value instead of a count. Output size can then be O(n²), so say that up front."],
    ],
    rubric: {
      strong: [
        "Explained why a stretch sum is a difference of two prefixes and what the map stores (count or first index).",
        "Seeded the empty prefix, looked up before recording, and used the stored count or first index correctly.",
        "Stated O(n) time and O(n) space with the reason, and tested edges: k = 0, negatives, an empty array.",
      ],
      weak: [
        "Reached for a sliding window on input with negative numbers.",
        "Forgot the empty prefix, recorded before looking up, or added 1 instead of the count.",
        "Gave the complexity without saying where the extra space goes, or did not test any edge case.",
      ],
    },
  },

  quiz: [
    ["In LC 560, why does the map start with <code>{0: 1}</code>?",
      ["So the map is never empty", "To stand for the empty prefix, so a subarray starting at index 0 can be counted", "Because k is always at least 1", "To make negative numbers work"],
      1, "The subarray nums[0..i] has sum prefix[i] - 0. Without a 0 already in the map, those subarrays are missed."],
    ["In LC 525 (equal 0s and 1s), what does the map store and why?",
      ["Each balance and how many times it appeared, to count subarrays", "Each balance and its last index, so the newest stretch wins", "Each index and its value, to look back quickly", "Each balance and the first index where it appeared, because an earlier start gives a longer stretch"],
      3, "The question asks for the longest stretch, so you want the earliest index for each balance. Overwriting it with a later one would only shorten the answers."],
    ["Which problem does NOT need a hash map of prefix sums?",
      ["Shortest subarray with sum at least target, all numbers positive", "Count subarrays with sum exactly k, numbers may be negative", "Longest subarray with equal 0s and 1s", "Count subarrays whose sum is divisible by k"],
      0, "With only positive numbers the sum grows as the stretch grows, so a sliding window solves it in O(1) extra space."],
  ],

  drills: [
    { prompt: "Given an array of integers that may be negative and a number k, count the contiguous subarrays that add up to exactly k.",
      answer: "prefix-sum-hashing", distractors: ["sliding-window", "two-pointers", "dp-1d"],
      why: "Exact sum with possible negatives. A stretch sum is a difference of two running totals, so look up running - k in a map of counts." },
    { prompt: "Given an array of 0s and 1s, return the length of the longest stretch that has the same number of each.",
      answer: "prefix-sum-hashing", distractors: ["sliding-window", "greedy", "two-pointers"],
      why: "Treat 0 as -1. Equal counts means the stretch sums to 0, which means the running total repeats. Store the first index of each total." },
    { prompt: "Given a fixed matrix, answer many queries for the sum of the rectangle between two corners, each in constant time.",
      answer: "prefix-sum-hashing", distractors: ["dp-2d", "binary-search", "graphs-bfs-dfs"],
      why: "Build a 2D table of totals from the top-left corner once; each rectangle is four lookups." },
    { prompt: "Given an array, return the first index where the sum of everything to its left equals the sum of everything to its right.",
      answer: "prefix-sum-hashing", distractors: ["two-pointers", "binary-search", "greedy"],
      why: "Compute the total once, then walk with a running left sum. The right sum is total - left - nums[i], so each index is checked in O(1)." },
    { prompt: "Given an array of integers and k, count the contiguous subarrays whose sum is a multiple of k.",
      answer: "prefix-sum-hashing", distractors: ["sliding-window", "dp-1d", "math-design"],
      why: "Two running totals with the same remainder mod k bound a stretch divisible by k. Count remainders in a map." },
    { prompt: "Given an array, return for each index the product of all the other elements, without using division.",
      answer: "prefix-sum-hashing", distractors: ["dp-1d", "two-pointers", "greedy"],
      why: "Running products from the left and from the right. Each answer is the left product times the right product." },
  ],

  flashcards: [
    { id: "ps-lc560", front: "Subarray Sum Equals K (LC 560): time and space?", back: "O(n) time, one pass with an O(1) average map lookup per index. O(n) space for the map of prefix counts." },
    { id: "ps-lc525", front: "Contiguous Array (LC 525): time and space?", back: "O(n) time. O(n) space for the first index of each balance (or a vector of size 2n+1)." },
    { id: "ps-range", front: "1D prefix array for range sums: build and query cost?", back: "O(n) to build, O(1) per query (pre[r + 1] - pre[l]), O(n) space." },
    { id: "ps-2d", front: "2D prefix table (LC 304): build and query cost?", back: "O(m·n) to build and store, O(1) per rectangle query using four cells." },
    { id: "ps-twosum", front: "Two Sum with a hash map (LC 1): time and space?", back: "O(n) time, one pass looking up target - x. O(n) space for the value-to-index map." },
  ],

  problems: [560, 525, 304, 1],
});
