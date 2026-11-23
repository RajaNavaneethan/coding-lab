// Pattern 01: Arrays & Two Pointers. Writer A.
// Demo 1 "container-most-water" (LC 11), demo 2 "three-sum" (LC 15).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "two-pointers",
  num: 1,
  title: "Arrays & Two Pointers",
  summary: "Walk an array with two indexes that each move one way only, so every element is looked at a fixed number of times.",
  tags: ["two pointers", "opposite ends", "sorted array", "pair sum", "triplet", "in place"],

  demos: [
    {
      id: "container-most-water",
      title: "Container With Most Water",
      lc: 11,
      problem: "Given bar heights <code>height</code>, pick two bars that hold the most water. The water is <code>min(height[l], height[r]) × (r - l)</code>. <code>[1,8,6,2,5,4,8,3,7]</code> gives <code>49</code>.",
      code: [
        "int maxArea(vector<int>& height) {",
        "    int l = 0, r = (int)height.size() - 1, best = 0;",
        "    while (l < r) {",
        "        int h = min(height[l], height[r]);",
        "        best = max(best, h * (r - l));",
        "        if (height[l] < height[r]) l++;",
        "        else r--;",
        "    }",
        "    return best;",
        "}",
      ],
      fields: [{ key: "height", label: "height", type: "ints", value: "1,8,6,2,5,4,8,3,7" }],
      run(input, rec) {
        const height = input.height;
        const n = height.length;
        if (height.some((x) => x < 0)) { rec.error("Heights must be 0 or more."); return null; }
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        let l = 0, r = n - 1, best = 0, bestL = -1, bestR = -1;
        let area = "-";

        const views = (o) => {
          o = o || {};
          const ptr = n ? { l: Math.min(l, n - 1), r: Math.max(r, 0) } : {};
          return [
            { id: "h", type: "bars", label: "height", values: height, pointers: ptr,
              ranges: o.ranges || (l < r ? [{ from: l, to: r, mark: o.rangeMark || "in", label: "width " + (r - l) }] : []),
              marks: o.marks || {} },
            { id: "area", type: "calc", label: "area = min(h[l], h[r]) × (r - l)", value: area },
            { id: "best", type: "calc", label: "best", value: best },
          ];
        };

        frame({
          line: 2, title: "Pointers at both ends",
          t: n >= 2
            ? `Start with the widest pair: <code>l = 0</code> and <code>r = ${r}</code>. Every other pair is narrower, so it can only win by having a taller short side.`
            : `There ${n === 1 ? "is one bar" : "are no bars"}, so no pair exists and the loop will not run.`,
          tip: "Water level is set by the shorter bar. The taller bar does not matter until the shorter one changes.",
          vars: { l: l, r: r, best: best },
          views: views({ marks: n >= 2 ? { [l]: "hot", [r]: "hot" } : {} }),
        });

        let movedOnce = false, tieShown = false;
        while (l < r) {
          const h = Math.min(height[l], height[r]);
          const w = r - l;
          const a = h * w;
          const improved = a > best;
          best = Math.max(best, a);
          if (improved) { bestL = l; bestR = r; }
          area = `${h} × ${w} = ${a}`;
          frame({
            line: [4, 5], title: improved ? "New best area" : "Measure the water",
            t: `The short side is <b>${h}</b> (min of ${height[l]} and ${height[r]}) and the width is <b>${w}</b>, so this pair holds <code>${h} × ${w} = ${a}</code>${improved ? ", a new best." : `. That does not beat ${best}.`}`,
            vars: { l: l, r: r, "height[l]": height[l], "height[r]": height[r], h: h, "r - l": w, best: best },
            views: views({ rangeMark: improved ? "good" : "in", marks: { [l]: "hot", [r]: "hot" } }),
            moves: improved ? [{ from: ["area", 0], to: ["best", 0], label: String(a) }] : undefined,
          });

          if (height[l] < height[r]) {
            const old = l;
            l++;
            frame({
              line: 6, title: "Drop the shorter left bar",
              t: `<code>height[${old}] = ${height[old]}</code> is shorter than <code>height[${r}] = ${height[r]}</code>. Any pair that keeps bar ${old} is narrower and still capped at ${height[old]}, so bar ${old} is done. Move <code>l</code> to ${l}.`,
              tip: movedOnce ? undefined : "Moving the taller side can never help: the width shrinks and the short side stays the same or gets shorter. That is why one pass is enough.",
              vars: { l: l, r: r, best: best },
              views: views({ marks: { [old]: "bad", ...(l < r ? { [l]: "hot" } : {}) } }),
            });
          } else {
            const old = r;
            const tie = height[l] === height[r];
            r--;
            frame({
              line: 7, title: tie ? "Tie: drop the right bar" : "Drop the shorter right bar",
              t: tie
                ? `Both bars are ${height[old]}. Neither can do better with a narrower partner, so dropping either is safe. The code drops <code>r</code>, which moves to ${r}.`
                : `<code>height[${old}] = ${height[old]}</code> is shorter than <code>height[${l}] = ${height[l]}</code>. Every narrower pair with bar ${old} is capped at ${height[old]}, so bar ${old} is done. Move <code>r</code> to ${r}.`,
              tip: tie && !tieShown ? "On a tie, both bars are finished: any later partner is narrower and the level cannot rise above this height. Moving either one is correct." : (!movedOnce && !tie ? "Moving the taller side can never help: the width shrinks and the short side stays the same or gets shorter. That is why one pass is enough." : undefined),
              vars: { l: l, r: r, best: best },
              views: views({ marks: { [old]: "bad", ...(l < r ? { [r]: "hot" } : {}) } }),
            });
            if (tie) tieShown = true;
          }
          movedOnce = true;
        }

        frame({
          line: 9, title: "Pointers met: return best",
          t: n >= 2
            ? `The pointers met. Each step ruled out one bar that could not be part of a better pair, so no pair was missed. Best area <b>${best}</b>, between bars ${bestL} and ${bestR}.`
            : "With fewer than two bars there is no container, so the answer is <b>0</b>.",
          tip: "O(n) time, O(1) space. The brute force tries all n² pairs; here each step discards one bar for good.",
          vars: { l: l, r: r, best: best },
          views: views({ ranges: bestL >= 0 ? [{ from: bestL, to: bestR, mark: "good", label: "best" }] : [],
            marks: bestL >= 0 ? { [bestL]: "good", [bestR]: "good" } : {} }),
        });
        if (total > 40) rec.truncated(total - 40);
        return best;
      },
      expect: [
        [{ height: "1,8,6,2,5,4,8,3,7" }, 49],
        [{ height: "1,1" }, 1],
        [{ height: "4,3,2,1,4" }, 16],
        [{ height: "1,2,1" }, 2],
        [{ height: "2,3,4,5,18,17,6" }, 17],
        [{ height: "5" }, 0],
      ],
    },
    {
      id: "three-sum",
      title: "3Sum",
      lc: 15,
      problem: "Given <code>nums</code>, return every distinct triple that adds up to 0, each triple in ascending order. <code>[-1,0,1,2,-1,-4]</code> gives <code>[[-1,-1,2],[-1,0,1]]</code>.",
      code: [
        "vector<vector<int>> threeSum(vector<int>& nums) {",
        "    sort(nums.begin(), nums.end());",
        "    vector<vector<int>> ans;",
        "    int n = (int)nums.size();",
        "    for (int i = 0; i + 2 < n; i++) {",
        "        if (nums[i] > 0) break;",
        "        if (i > 0 && nums[i] == nums[i - 1]) continue;",
        "        int l = i + 1, r = n - 1;",
        "        while (l < r) {",
        "            long long s = (long long)nums[i] + nums[l] + nums[r];",
        "            if (s < 0) l++;",
        "            else if (s > 0) r--;",
        "            else {",
        "                ans.push_back({nums[i], nums[l], nums[r]});",
        "                while (l < r && nums[l] == nums[l + 1]) l++;",
        "                while (l < r && nums[r] == nums[r - 1]) r--;",
        "                l++; r--;",
        "            }",
        "        }",
        "    }",
        "    return ans;",
        "}",
      ],
      fields: [{ key: "nums", label: "nums", type: "ints", value: "-1,0,1,2,-1,-4" }],
      run(input, rec) {
        const original = input.nums;
        const nums = original.slice().sort((a, b) => a - b);
        const n = nums.length;
        const ans = [];
        let total = 0, tips = 0;
        const frame = (f) => { total++; rec.frame(f); };
        const tip = (text) => { if (tips >= 5) return undefined; tips++; return text; };
        const shown = {};
        const once = (key, text) => { if (shown[key]) return undefined; shown[key] = true; return tip(text); };
        let i = null, l = null, r = null, s = "-";

        const views = (o) => {
          o = o || {};
          const marks = {};
          if (i !== null) for (let k = 0; k < Math.min(i, n); k++) marks[k] = "dim";
          if (i !== null && i < n) marks[i] = "path";
          if (l !== null && l < n && l < r) { marks[l] = "hot"; marks[r] = "hot"; }
          Object.assign(marks, o.marks || {});
          const ptr = {};
          if (i !== null) ptr.i = Math.min(i, n);
          if (l !== null) { ptr.l = Math.min(l, n); ptr.r = r; }
          return [
            { id: "nums", type: "array", label: "nums (sorted)", values: nums, pointers: ptr,
              ranges: l !== null && l < r ? [{ from: l, to: r, mark: "in", label: "l..r" }] : [], marks: marks },
            { id: "sum", type: "calc", label: "s = nums[i] + nums[l] + nums[r]", value: s },
            { id: "ans", type: "map", kind: "map", label: "ans (triples found)",
              entries: ans.map((t, k) => ["#" + (k + 1), "[" + t.join(", ") + "]"]), marks: o.ansMarks || {} },
          ];
        };

        frame({
          line: 2, title: "Sort first",
          t: `Sort <code>[${original.join(", ")}]</code> into <code>[${nums.join(", ")}]</code>. Now a bigger index means a bigger or equal value, and equal values sit next to each other.`,
          tip: tip("Sorting is what makes two pointers work here: moving <code>l</code> right can only raise the sum, moving <code>r</code> left can only lower it."),
          vars: { n: n },
          views: views(),
        });

        for (i = 0; i + 2 < n; i++) {
          l = null; r = null; s = "-";
          if (nums[i] > 0) {
            frame({
              line: 6, title: "Anchor is positive: stop",
              t: `<code>nums[${i}] = ${nums[i]}</code> is above 0, and everything to its right is at least as big. Three positive numbers cannot add to 0, so stop.`,
              tip: once("break", "This early exit is safe only because the array is sorted."),
              vars: { i: i, "nums[i]": nums[i] },
              views: views(),
            });
            break;
          }
          if (i > 0 && nums[i] === nums[i - 1]) {
            frame({
              line: 7, title: "Skip a repeated anchor",
              t: `<code>nums[${i}] = ${nums[i]}</code> is the same as <code>nums[${i - 1}]</code>. Any triple it could start was already found from index ${i - 1}, so skip it.`,
              tip: once("dupi", "Skipping equal anchors is how 3Sum avoids duplicate triples without a set."),
              vars: { i: i, "nums[i]": nums[i], "nums[i - 1]": nums[i - 1] },
              views: views({ marks: { [i]: "dim", [i - 1]: "warn" } }),
            });
            continue;
          }
          l = i + 1; r = n - 1;
          frame({
            line: 8, title: `Fix anchor i = ${i}`,
            t: `Fix <code>nums[${i}] = ${nums[i]}</code>. Now find pairs in <code>nums[${l}..${r}]</code> that add up to <code>${-nums[i]}</code>, with <code>l = ${l}</code> and <code>r = ${r}</code>.`,
            vars: { i: i, l: l, r: r, "nums[i]": nums[i] },
            views: views(),
          });
          while (l < r) {
            const sum = nums[i] + nums[l] + nums[r];
            s = `${nums[i]} + ${nums[l]} + ${nums[r]} = ${sum}`;
            if (sum < 0) {
              const old = l;
              l++;
              frame({
                line: [10, 11], title: "Sum too small: l moves right",
                t: `<code>${s}</code> is below 0. Moving <code>r</code> left would only make it smaller, so the only useful move is <code>l</code> to ${l}.`,
                tip: once("move", "Each step throws away one index for good, so the inner walk is O(n) and the whole thing is O(n²)."),
                vars: { i: i, l: l, r: r, s: sum, found: ans.length },
                views: views({ marks: { [old]: "bad" } }),
              });
            } else if (sum > 0) {
              const old = r;
              r--;
              frame({
                line: [10, 12], title: "Sum too big: r moves left",
                t: `<code>${s}</code> is above 0. Moving <code>l</code> right would only make it bigger, so move <code>r</code> to ${r}.`,
                tip: once("move", "Each step throws away one index for good, so the inner walk is O(n) and the whole thing is O(n²)."),
                vars: { i: i, l: l, r: r, s: sum, found: ans.length },
                views: views({ marks: { [old]: "bad" } }),
              });
            } else {
              ans.push([nums[i], nums[l], nums[r]]);
              const key = "#" + ans.length;
              frame({
                line: 14, title: "Sum is 0: record triple",
                t: `<code>${s}</code>. Save <b>[${nums[i]}, ${nums[l]}, ${nums[r]}]</b>.`,
                vars: { i: i, l: l, r: r, s: sum, found: ans.length },
                views: views({ marks: { [i]: "good", [l]: "good", [r]: "good" }, ansMarks: { [key]: "new" } }),
                moves: [{ from: ["nums", l], to: ["ans", key], label: String(nums[l]) }],
              });
              const l0 = l, r0 = r;
              while (l < r && nums[l] === nums[l + 1]) l++;
              while (l < r && nums[r] === nums[r - 1]) r--;
              if (l !== l0 || r !== r0) {
                const m = {};
                for (let k = l0; k < l; k++) m[k] = "dim";
                for (let k = r; k < r0; k++) m[k + 1] = "dim";
                frame({
                  line: l !== l0 ? (r !== r0 ? [15, 16] : 15) : 16,
                  title: "Skip copies of l and r",
                  t: `${l !== l0 ? `<code>l</code> slides to index ${l}, the last copy of ${nums[l0]}. ` : ""}${r !== r0 ? `<code>r</code> slides to index ${r}, the last copy of ${nums[r0]}. ` : ""}Pairing a copy again would save the same triple twice.`,
                  tip: once("dup", "Duplicates are skipped at all three levels: the anchor, <code>l</code> and <code>r</code>."),
                  vars: { i: i, l: l, r: r, s: sum, found: ans.length },
                  views: views({ marks: m }),
                });
              }
              const ol = l, or = r;
              l++; r--;
              frame({
                line: 17, title: "Move both inward",
                t: `With <code>nums[${i}]</code> fixed, a new pair needs a different value on both sides, so move <code>l</code> to ${l} and <code>r</code> to ${r}.`,
                tip: once("both", l - 1 === l0 && r + 1 === r0
                  ? "Lines 15 and 16 ran first and found no copies next to <code>l</code> or <code>r</code>, so nothing was skipped. On an input like <code>[-2,0,0,2,2]</code> they slide past the repeats."
                  : "Once the copies are skipped, both ends still move one more step, onto the first new values."),
                vars: { i: i, l: l, r: r, s: sum, found: ans.length },
                views: views({ marks: { [ol]: "dim", [or]: "dim" } }),
              });
            }
          }
        }

        i = null; l = null; r = null; s = "-";
        frame({
          line: 21, title: "Return the triples",
          t: ans.length
            ? `Done. Found <b>${ans.length}</b> distinct triple${ans.length > 1 ? "s" : ""}: ${ans.map((t) => "[" + t.join(", ") + "]").join(", ")}.`
            : "No three numbers add up to 0, so the answer is empty.",
          tip: tip("Sorting costs O(n log n), the loops O(n²). Extra space is O(1) apart from the answer and the sort."),
          vars: { found: ans.length },
          views: views(),
        });
        if (total > 40) rec.truncated(total - 40);
        return ans;
      },
      expect: [
        [{ nums: "-1,0,1,2,-1,-4" }, [[-1, -1, 2], [-1, 0, 1]]],
        [{ nums: "0,1,1" }, []],
        [{ nums: "0,0,0" }, [[0, 0, 0]]],
        [{ nums: "0,0,0,0" }, [[0, 0, 0]]],
        [{ nums: "-2,0,0,2,2" }, [[-2, 0, 2]]],
        [{ nums: "1,2" }, []],
      ],
    },
  ],

  explain: {
    plain: "Two pointers means two indexes into an array, each allowed to move only one way. Opposite-end pointers start at both ends and close in; same-direction pointers (read and write) sweep forward together to rewrite an array in place. Each element is looked at a fixed number of times, so the walk is O(n).",
    spot: [
      "The array is sorted, or you may sort it, and the question asks for a pair or triple that meets a sum or comparison target.",
      "Only the two ends of a range matter for the answer: max water between two bars, a palindrome check.",
      "You must filter, dedupe or partition an array in place with O(1) extra space.",
      "The brute force is two nested loops over every pair, O(n²), and one comparison tells you which side can be thrown away.",
      "Moving one pointer has a one-way effect on the answer (the sum only grows, the width only shrinks).",
    ],
    notWhen: [
      "The answer is a contiguous stretch with a rule about its contents (longest without repeats, at most k distinct). Use a sliding window.",
      "You need original indexes and the array is unsorted, as in Two Sum. Sorting loses the indexes; use a hash map.",
    ],
    template: [
      "// Opposite ends on a sorted array: move the side that limits the pair.",
      "bool pairSum(const vector<int>& a, int target) {",
      "    int l = 0, r = (int)a.size() - 1;",
      "    while (l < r) {",
      "        int s = a[l] + a[r];",
      "        if (s == target) return true;",
      "        if (s < target) l++;          // need a bigger sum",
      "        else r--;                     // need a smaller sum",
      "    }",
      "    return false;",
      "}",
      "",
      "// Same direction: read scans everything, write keeps what passes.",
      "int removeDuplicates(vector<int>& a) {  // a is sorted",
      "    int write = 0;",
      "    for (int read = 0; read < (int)a.size(); read++) {",
      "        if (write == 0 || a[read] != a[write - 1])",
      "            a[write++] = a[read];",
      "    }",
      "    return write;                     // new length",
      "}",
    ],
    templateNotes: [
      "The loop guard is <code>l &lt; r</code>: a pair needs two different indexes.",
      "On a sorted array, <code>l++</code> can only raise the sum and <code>r--</code> can only lower it. That one-way effect is why each index moves at most once.",
      "When the pair is scored (water, area), move the pointer whose value limits the score. Moving the other one cannot help.",
      "In the read/write version, <code>write</code> never passes <code>read</code>, so overwriting <code>a[write]</code> never destroys a value you still need.",
      "For three numbers, fix the first index in a loop and run the pair walk on the rest.",
    ],
    variants: [
      ["Opposite ends", "Pair sum on sorted data, container, palindrome check", "11, 167, 125"],
      ["Fix one, walk two", "3Sum, 3Sum Closest, 4Sum (fix two)", "15, 16, 18"],
      ["Read/write in place", "Remove duplicates, move zeroes, remove element", "26, 27, 283"],
      ["Two pointers with running maxes", "Trapping rain water: move the side with the lower max", "42"],
    ],
    mistakes: [
      "Moving the taller bar in Container With Most Water. The width shrinks and the level cannot rise, so you can skip the answer.",
      "Skipping duplicates only at the anchor in 3Sum. After a hit, <code>l</code> and <code>r</code> also need to slide past copies, or the same triple is saved twice.",
      "Writing <code>while (l &lt;= r)</code> on a pair problem, which pairs an index with itself.",
      "Sorting when the answer needs original indexes (Two Sum). Keep a hash map instead, or sort index pairs.",
      "Adding three ints near 10^9 in an <code>int</code>. Cast to <code>long long</code> at the sum.",
      "In the skip loops, reading <code>nums[l + 1]</code> without the <code>l &lt; r</code> guard, which can run off the end.",
    ],
    complexity: [
      ["Opposite ends, one pass", "O(n)", "O(1)", "l only goes up and r only goes down, so together they move at most n times."],
      ["Sort, then pair walk", "O(n log n)", "O(1) extra, plus the sort's stack", "The sort dominates; the walk is linear."],
      ["3Sum: sort, fix i, walk l and r", "O(n²)", "O(1) extra, plus the answer", "n anchors, each with an O(n) walk."],
      ["Brute force over all pairs", "O(n²)", "O(1)", "Shown only to explain what the pointers save."],
    ],
    sayIt: "When the question asks for a pair or a triple in an array that meets a sum or comparison target, and the array is sorted or I am allowed to sort it, I think two pointers. I put one index at each end. I compute the pair's value and move the pointer that limits it: if the sum is too small I move the left one right, if it is too big I move the right one left. Each move throws away one index for good, which is why the walk is O(n). For Container With Most Water I move the shorter bar, because keeping it can only give narrower containers at the same height. For a triple I fix the first number in a loop and run the pair walk on the rest, which is O(n²). I test duplicates, too few elements, and int overflow on the sum. If the problem needs the original indexes, I use a hash map instead of sorting.",
    followups: [
      ["Why is it safe to move the shorter bar in LC 11?", "Every pair that keeps the shorter bar is narrower and still capped by that bar's height, so none of them can beat the current area. That bar is finished."],
      ["How do you avoid duplicate triples in 3Sum without a set?", "Sort, skip an anchor equal to the one before it, and after a hit slide l and r past copies of their values before moving them in."],
      ["How would you do 4Sum?", "Fix two indexes in nested loops, skipping duplicates at each, then run the pair walk on the rest. O(n³) time."],
      ["What if the array is unsorted and you must return indexes?", "Use a hash map from value to index in one pass (Two Sum). Sorting would scramble the indexes."],
    ],
    rubric: {
      strong: [
        "Named the signal (sorted or sortable input, pair or triple target, or only the ends matter) and explained why each pointer only moves one way.",
        "Wrote a clean loop with the right guard (l < r), the right move rule, and duplicate handling where needed.",
        "Stated the time with a reason (O(n) walk, O(n²) for 3Sum) and tested edges: too few elements, all equal values, duplicates.",
      ],
      weak: [
        "Started coding without saying which pointer moves and why.",
        "Moved the wrong pointer, used l <= r, or produced repeated triples.",
        "Gave the complexity without a reason, or sorted when the problem needed original indexes.",
      ],
    },
  },

  quiz: [
    ["In Container With Most Water, which pointer moves after measuring a pair?",
      ["The one at the taller bar, to look for a taller partner", "Both pointers, to save time", "The one at the shorter bar, because every narrower pair with it is capped at its height", "Always the left one"],
      2, "The water level is the shorter bar. Keeping that bar and moving the other side only makes the container narrower, so the shorter bar can be dropped for good."],
    ["Why does 3Sum sort the array first?",
      ["So that moving l right raises the sum and moving r left lowers it, and equal values sit together for skipping", "Because the answer must be returned in sorted order of indexes", "To make the hash map smaller", "Sorting makes the whole algorithm O(n log n)"],
      0, "Sorting gives the one-way effect that lets each pointer move only inward, and it puts duplicates next to each other so they can be skipped. The total is still O(n²)."],
    ["Which problem is NOT a natural fit for two pointers?",
      ["Check if a string is a palindrome", "Count subarrays whose sum is exactly k, numbers may be negative", "Remove duplicates from a sorted array in place", "Find two numbers in a sorted array that add to a target"],
      1, "With negative numbers there is no one-way rule for moving a pointer. Use prefix sums with a hash map of counts (LC 560)."],
  ],

  drills: [
    { prompt: "Given a sorted array and a target, return the positions of two numbers that add up to the target, using O(1) extra space.",
      answer: "two-pointers", distractors: ["binary-search", "prefix-sum-hashing", "sliding-window"],
      why: "Sorted input and a pair-sum target. Start at both ends; too small moves the left index right, too big moves the right index left." },
    { prompt: "Given an array of integers, return every distinct group of three numbers that adds up to zero.",
      answer: "two-pointers", distractors: ["backtracking", "prefix-sum-hashing", "dp-1d"],
      why: "Sort, fix the first number, then walk a pair from both ends of the rest, skipping repeats. O(n²)." },
    { prompt: "Given a sorted array, change it in place so each value appears once, and return how many values remain.",
      answer: "two-pointers", distractors: ["sliding-window", "stacks-monotonic", "greedy"],
      why: "A read index scans every element and a write index keeps the ones that differ from the last kept value. O(n) time, O(1) space." },
    { prompt: "Given a string, decide whether it reads the same forwards and backwards, ignoring case and anything that is not a letter or digit.",
      answer: "two-pointers", distractors: ["sliding-window", "stacks-monotonic", "bit-manipulation"],
      why: "Only the two ends matter at each step. Move inward from both sides, skip non-alphanumerics, compare." },
    { prompt: "Given the heights of vertical lines, choose two lines that, with the x-axis, hold the most water.",
      answer: "two-pointers", distractors: ["stacks-monotonic", "dp-1d", "greedy"],
      why: "Start with the widest pair and always drop the shorter line, since any narrower pair with it is capped at its height." },
    { prompt: "Given an array, move all zeros to the end while keeping the order of the other values, without making a copy.",
      answer: "two-pointers", distractors: ["sliding-window", "heaps", "greedy"],
      why: "Read/write in place: write each non-zero to the next write slot, then fill the rest with zeros." },
  ],

  flashcards: [
    { id: "tp-opposite", front: "Opposite-ends two pointers on a sorted array: time and space?", back: "O(n) time and O(1) space. l only moves right and r only moves left, so together they move at most n times." },
    { id: "tp-lc11", front: "Container With Most Water (LC 11): time and space?", back: "O(n) time, one pass, always dropping the shorter bar. O(1) space." },
    { id: "tp-lc15", front: "3Sum (LC 15): time and space?", back: "O(n²) time: O(n log n) sort plus n anchors with an O(n) walk each. O(1) extra space besides the answer and the sort." },
    { id: "tp-readwrite", front: "Read/write in-place rewrite (remove duplicates, move zeroes): time and space?", back: "O(n) time, one scan. O(1) extra space, since values are written over the same array." },
    { id: "tp-sortwalk", front: "Sort then pair walk on an unsorted array: time and space?", back: "O(n log n) time, set by the sort; the walk is O(n). O(1) extra space plus the sort's stack (O(log n))." },
  ],

  problems: [1, 11, 15, 42],
});
