// Pattern 15: DP: Knapsack / Partition. Writer C.
// Demo 1 "partition-equal" (LC 416, 1D boolean knapsack), demo 2 "target-sum" (LC 494, counting knapsack).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "dp-knapsack",
  num: 15,
  title: "DP: Knapsack / Partition",
  summary: "Decide for each item whether to take it, with a table indexed by capacity or sum. A 1D table swept right to left uses each item at most once.",
  tags: ["knapsack", "subset sum", "partition", "0/1", "capacity", "count ways", "dp"],

  demos: [
    {
      id: "partition-equal",
      title: "Partition Equal Subset Sum",
      lc: 416,
      problem: "Given an array <code>nums</code> of positive integers, return whether it can be split into two groups with equal sums. <code>[1,5,11,5]</code> gives <code>true</code> (<code>[1,5,5]</code> and <code>[11]</code>).",
      code: [
        "bool canPartition(vector<int>& nums) {",
        "    int sum = 0;",
        "    for (int x : nums) sum += x;",
        "    if (sum % 2) return false;                   // an odd total cannot split evenly",
        "    int target = sum / 2;",
        "    vector<bool> dp(target + 1, false);          // dp[s]: some subset sums to s",
        "    dp[0] = true;                                // the empty subset sums to 0",
        "    for (int x : nums) {",
        "        for (int s = target; s >= x; s--)        // right to left: use x once",
        "            dp[s] = dp[s] || dp[s - x];",
        "        if (dp[target]) return true;             // early exit",
        "    }",
        "    return dp[target];",
        "}",
      ],
      fields: [{ key: "nums", label: "nums", type: "ints", value: "1,5,11,5" }],
      run(input, rec) {
        const nums = input.nums;
        if (nums.length < 1 || nums.length > 8) { rec.error("Give between 1 and 8 numbers here."); return null; }
        if (nums.some((x) => x < 1 || x > 30)) { rec.error("Each number must be between 1 and 30 here, so the dp row fits."); return null; }
        let shown = 0, hidden = 0;
        const frame = (f) => { if (shown < 40) { rec.frame(f); shown++; } else hidden++; };
        let sum = 0;
        for (const x of nums) sum += x;
        const target = Math.floor(sum / 2);
        const dp = new Array(sum % 2 ? 0 : target + 1).fill(false);
        const TF = (b) => (b ? "T" : "F");
        const views = (o) => {
          o = o || {};
          const dm = {};
          dp.forEach((b, s) => { if (b) dm[s] = "good"; });
          Object.assign(dm, o.dm || {});
          return [
            { id: "nums", type: "array", label: "nums", values: nums.slice(), pointers: o.np || {}, marks: o.nm || {} },
            { id: "dp", type: "array", label: "dp[s]: can some subset sum to s? (T / F)", values: dp.map(TF),
              pointers: o.dp || {}, ranges: o.dr || [], marks: dm, dir: "rtl" },
            { id: "target", type: "calc", label: "target = sum / 2", value: sum % 2 ? "odd sum" : target },
          ];
        };

        frame({
          line: [2, 3], title: `sum = ${sum}`,
          t: `Add up the numbers: <code>sum = ${nums.join(" + ")} = ${sum}</code>. Two equal groups would each need half of that.`,
          vars: { sum: sum },
          views: views(),
        });
        if (sum % 2) {
          frame({
            line: 4, title: "Odd sum: return false",
            t: `${sum} is odd, so it cannot be split into two equal whole-number halves. Return <b>false</b>.`,
            tip: "Always look for a cheap early exit like this before building the table.",
            vars: { sum: sum, "sum % 2": 1 },
            views: views(),
          });
          return false;
        }
        dp[0] = true;
        frame({
          line: [5, 7], title: `target = ${target}`,
          t: `Find one subset that sums to <code>target = ${target}</code>; the other numbers then make up the other half. <code>dp</code> has ${target + 1} slots, and only <code>dp[0]</code> starts true: picking nothing sums to 0.`,
          tip: "This is the 0/1 knapsack question \"can I hit exactly this sum?\". Each number is either in the subset or not.",
          vars: { sum: sum, target: target },
          views: views({ dm: { 0: "new" } }),
        });

        let rtlTip = false;
        for (let i = 0; i < nums.length; i++) {
          const x = nums[i];
          frame({
            line: 8, title: `Take x = ${x}`,
            t: x > target
              ? `Next number <code>x = ${x}</code> is bigger than ${target}, so the inner loop does not run: no sum up to ${target} can use it.`
              : `Next number <code>x = ${x}</code>. For every sum <code>s</code> from ${target} down to ${x}, <code>s</code> is reachable if it already was, or if <code>s - ${x}</code> was reachable before this number.`,
            vars: { x: x, target: target },
            views: views({ np: { i: i }, nm: { [i]: "hot" } }),
          });
          let runFrom = null;            // start (high s) of a run of cells that do not change
          const flushRun = (lo) => {
            if (runFrom === null) return;
            const hi = runFrom; runFrom = null;
            frame({
              line: [9, 10], title: hi === lo ? `s = ${hi}: no change` : `s = ${hi} down to ${lo}: no change`,
              t: hi === lo
                ? `<code>dp[${hi}]</code> stays ${dp[hi] ? "true" : "false"}: ${dp[hi] ? "it was already reachable." : `<code>dp[${hi - x}]</code> is false, so adding ${x} does not reach ${hi}.`}`
                : `For each <code>s</code> from ${hi} down to ${lo}, <code>dp[s]</code> keeps its value: no new sum is reached, because <code>dp[s - ${x}]</code> is false or <code>dp[s]</code> was already true.`,
              vars: { x: x, s: lo },
              views: views({ np: { i: i }, nm: { [i]: "hot" }, dp: { s: lo }, dr: [{ from: lo, to: hi, mark: "dim", label: "unchanged" }] }),
            });
          };
          for (let s = target; s >= x; s--) {
            const flips = !dp[s] && dp[s - x];
            if (!flips) { if (runFrom === null) runFrom = s; continue; }
            flushRun(s + 1);
            dp[s] = true;
            frame({
              line: [9, 10], title: `dp[${s}] = true`,
              t: `<code>dp[${s - x}]</code> is true, so some subset sums to ${s - x}. Add ${x} to it and you get ${s}: <code>dp[${s}] = true</code>.`,
              tip: rtlTip ? undefined : `Why right to left: <code>dp[${s - x}]</code> sits to the left and has not been touched for x = ${x} yet, so it still means "without ${x}". Left to right would read a cell already updated with ${x} and use ${x} twice.`,
              vars: { x: x, s: s, "s - x": s - x, [`dp[${s}]`]: true },
              views: views({ np: { i: i }, nm: { [i]: "hot" }, dp: { s: s, "s-x": s - x }, dm: { [s]: "new", [s - x]: "in" } }),
              moves: [{ from: ["dp", s - x], to: ["dp", s], label: `+${x}`, mark: "new" }],
            });
            rtlTip = true;
          }
          if (x <= target) flushRun(x);
          if (dp[target]) {
            frame({
              line: 11, title: "dp[target] true: return",
              t: `<code>dp[${target}]</code> is true: some subset sums to ${target}, so the rest sums to ${target} too. Return <b>true</b> without looking at the remaining numbers.`,
              tip: "O(n · target) time and O(target) space. The 2D table <code>dp[i][s]</code> gives the same answer; the 1D row keeps only the last line of it.",
              vars: { x: x, [`dp[${target}]`]: true },
              views: views({ np: { i: i }, dm: { [target]: "good" } }),
            });
            if (hidden) rec.truncated(hidden);
            return true;
          }
        }
        frame({
          line: 13, title: "Return false",
          t: `Every number has been tried and <code>dp[${target}]</code> is still false. No subset sums to ${target}, so the array cannot be split evenly: <b>false</b>.`,
          tip: "O(n · target) time and O(target) space. The 2D table <code>dp[i][s]</code> gives the same answer; the 1D row keeps only the last line of it.",
          vars: { [`dp[${target}]`]: false },
          views: views({ dm: { [target]: "bad" } }),
        });
        if (hidden) rec.truncated(hidden);
        return false;
      },
      expect: [
        [{ nums: "1,5,11,5" }, true],
        [{ nums: "1,2,3,5" }, false],
        [{ nums: "1" }, false],
        [{ nums: "2,2" }, true],
        [{ nums: "1,2,5" }, false],
        [{ nums: "3,3,3,4,5" }, true],
        [{ nums: "2,2,1,1" }, true],
      ],
    },
    {
      id: "target-sum",
      title: "Target Sum",
      lc: 494,
      problem: "Put a <code>+</code> or <code>-</code> in front of every number in <code>nums</code>. Return how many sign choices make the total equal <code>target</code>. <code>nums = [1,1,1,1,1]</code>, <code>target = 3</code> gives <code>5</code>.",
      code: [
        "int findTargetSumWays(vector<int>& nums, int target) {",
        "    int sum = 0;",
        "    for (int x : nums) sum += x;",
        "    if (abs(target) > sum || (sum + target) % 2) return 0;",
        "    int P = (sum + target) / 2;                  // sum of the numbers that get a + sign",
        "    vector<int> dp(P + 1, 0);                    // dp[s]: ways to pick a subset summing to s",
        "    dp[0] = 1;",
        "    for (int x : nums)",
        "        for (int s = P; s >= x; s--)             // right to left: use x once",
        "            dp[s] += dp[s - x];",
        "    return dp[P];",
        "}",
      ],
      fields: [
        { key: "nums", label: "nums", type: "ints", value: "1,1,1,1,1" },
        { key: "target", label: "target", type: "int", value: "3" },
      ],
      run(input, rec) {
        const nums = input.nums, target = input.target;
        if (nums.length < 1 || nums.length > 8) { rec.error("Give between 1 and 8 numbers here."); return null; }
        if (nums.some((x) => x < 0 || x > 20)) { rec.error("Each number must be between 0 and 20 here."); return null; }
        let shown = 0, hidden = 0;
        const frame = (f) => { if (shown < 40) { rec.frame(f); shown++; } else hidden++; };
        let sum = 0;
        for (const x of nums) sum += x;
        const bad = Math.abs(target) > sum || (sum + target) % 2 !== 0;
        const P = bad ? 0 : (sum + target) / 2;
        const dp = new Array(bad ? 0 : P + 1).fill(0);
        const views = (o) => {
          o = o || {};
          const dm = {};
          dp.forEach((c, s) => { if (c) dm[s] = "good"; });
          Object.assign(dm, o.dm || {});
          return [
            { id: "nums", type: "array", label: "nums", values: nums.slice(), pointers: o.np || {}, marks: o.nm || {} },
            { id: "dp", type: "array", label: "dp[s]: ways to pick numbers that sum to s", values: dp.slice(),
              pointers: o.dp || {}, ranges: o.dr || [], marks: dm, dir: "rtl" },
            { id: "P", type: "calc", label: "P = (sum + target) / 2", value: bad ? "none" : P },
          ];
        };

        frame({
          line: [2, 3], title: `sum = ${sum}`,
          t: `Add up the numbers: <code>sum = ${sum}</code>. Call the numbers with a <code>+</code> sign group P and the rest group N. Then <code>P + N = ${sum}</code> and <code>P - N = ${target}</code>.`,
          tip: "Adding the two equations gives <code>2P = sum + target</code>. So the question becomes: how many subsets sum to <code>(sum + target) / 2</code>? That is a counting knapsack.",
          vars: { sum: sum, target: target },
          views: views(),
        });
        if (bad) {
          frame({
            line: 4, title: "Unreachable: return 0",
            t: Math.abs(target) > sum
              ? `Even with every sign the same, the total is between ${-sum} and ${sum}. ${target} is outside that range, so there are <b>0</b> ways.`
              : `<code>sum + target = ${sum + target}</code> is odd, so P would not be a whole number. No sign choice works: <b>0</b> ways.`,
            vars: { sum: sum, target: target },
            views: views(),
          });
          return 0;
        }
        dp[0] = 1;
        frame({
          line: [5, 7], title: `Count subsets summing to ${P}`,
          t: `<code>P = (${sum} + ${target}) / 2 = ${P}</code>. Each subset with sum ${P} gets the <code>+</code> signs, the rest get <code>-</code>. Start with <code>dp[0] = 1</code>: one way to pick nothing.`,
          vars: { sum: sum, target: target, P: P },
          views: views({ dm: { 0: "new" } }),
        });

        let rtlTip = false, zeroTip = false;
        for (let i = 0; i < nums.length; i++) {
          const x = nums[i];
          frame({
            line: 8, title: `Take x = ${x}`,
            t: x > P
              ? `Next number <code>x = ${x}</code> is bigger than ${P}, so it can only ever get a minus sign. The inner loop does not run.`
              : `Next number <code>x = ${x}</code>. For each <code>s</code> from ${P} down to ${x}, every way to reach <code>s - ${x}</code> becomes one more way to reach <code>s</code> by adding ${x}.`,
            tip: x === 0 && !zeroTip ? "With <code>x = 0</code>, <code>dp[s] += dp[s]</code> doubles every count: +0 and -0 are two different sign choices." : undefined,
            vars: { x: x, P: P },
            views: views({ np: { i: i }, nm: { [i]: "hot" } }),
          });
          if (x === 0) zeroTip = true;
          let runFrom = null;
          const flushRun = (lo) => {
            if (runFrom === null) return;
            const hi = runFrom; runFrom = null;
            frame({
              line: [9, 10], title: hi === lo ? `s = ${hi}: adds 0` : `s = ${hi} down to ${lo}: add 0`,
              t: hi === lo
                ? `<code>dp[${hi - x}]</code> is 0, so <code>dp[${hi}]</code> stays ${dp[hi]}.`
                : `For each <code>s</code> from ${hi} down to ${lo}, <code>dp[s - ${x}]</code> is 0, so nothing is added yet.`,
              vars: { x: x, s: lo },
              views: views({ np: { i: i }, nm: { [i]: "hot" }, dp: { s: lo }, dr: [{ from: lo, to: hi, mark: "dim", label: "+0" }] }),
            });
          };
          for (let s = P; s >= x; s--) {
            const add = dp[s - x];
            if (!add) { if (runFrom === null) runFrom = s; continue; }
            flushRun(s + 1);
            const old = dp[s];
            dp[s] += add;
            frame({
              line: [9, 10], title: `dp[${s}] = ${old} + ${add} = ${dp[s]}`,
              t: `There ${add > 1 ? "are" : "is"} ${add} way${add > 1 ? "s" : ""} to reach ${s - x}. Adding ${x} to each gives ${add} new way${add > 1 ? "s" : ""} to reach ${s}, on top of the ${old} that skip ${x}: <code>dp[${s}] = ${dp[s]}</code>.`,
              tip: rtlTip ? undefined : `Right to left again: <code>dp[${s - x}]</code> still holds the count without ${x}. Going left to right would count ${x} more than once in the same subset.`,
              vars: { x: x, s: s, [`dp[${s - x}]`]: add, [`dp[${s}]`]: dp[s] },
              views: views({ np: { i: i }, nm: { [i]: "hot" }, dp: { s: s, "s-x": s - x }, dm: { [s]: "new", [s - x]: "in" } }),
              moves: [{ from: ["dp", s - x], to: ["dp", s], label: `+${add}`, mark: "new" }],
            });
            rtlTip = true;
          }
          if (x <= P) flushRun(x);
        }
        frame({
          line: 11, title: `Return dp[${P}] = ${dp[P]}`,
          t: `All numbers are done. <code>dp[${P}] = ${dp[P]}</code> subsets sum to ${P}, and each one is one way to place the signs: <b>${dp[P]}</b>.`,
          tip: "O(n · P) time and O(P) space. The plain recursion tries 2^n sign choices; the table counts them by sum instead.",
          vars: { P: P, [`dp[${P}]`]: dp[P] },
          views: views({ dm: { [P]: dp[P] ? "good" : "bad" } }),
        });
        if (hidden) rec.truncated(hidden);
        return dp[P];
      },
      expect: [
        [{ nums: "1,1,1,1,1", target: "3" }, 5],
        [{ nums: "1", target: "1" }, 1],
        [{ nums: "1", target: "2" }, 0],
        [{ nums: "1,2", target: "2" }, 0],
        [{ nums: "0,0,1", target: "1" }, 4],
        [{ nums: "1,2,3", target: "0" }, 2],
        [{ nums: "2,3,5", target: "-10" }, 1],
      ],
    },
  ],

  explain: {
    plain: "Knapsack problems ask which items to take when each item can be taken or left, under a limit on total size or an exact target sum. The table is indexed by that size or sum: <code>dp[s]</code> answers the question for exactly <code>s</code>, and each item updates the table once.",
    spot: [
      "\"Choose a subset\" of numbers to hit an exact sum, or to split an array into two groups with a given difference.",
      "Each item has a size (weight, cost, length) and the total has a cap; you want the best value, a yes/no, or a count of ways.",
      "Each item is used at most once (0/1 knapsack), or as many times as you like (unbounded: coins, cuts).",
      "Signs or groups can be rewritten as one subset: <code>P - N = target</code> with <code>P + N = sum</code> gives a subset sum.",
      "The sum or capacity is small (a few thousand), even though trying all 2^n subsets is too slow.",
    ],
    notWhen: [
      "The values are huge (sums up to 10^9) but n is small: meet in the middle or backtracking, since a table by sum would not fit.",
      "Items must be contiguous (subarray sums): use prefix sums or a sliding window.",
      "A greedy choice is provably right (fractional knapsack, sorting by ratio): no table needed.",
    ],
    template: [
      "// 0/1 knapsack: best value with total weight <= W. Each item once.",
      "int knapsack01(const vector<int>& wt, const vector<int>& val, int W) {",
      "    vector<int> dp(W + 1, 0);                 // dp[c]: best value with capacity c",
      "    for (int i = 0; i < (int)wt.size(); i++)",
      "        for (int c = W; c >= wt[i]; c--)      // right to left: item i used once",
      "            dp[c] = max(dp[c], dp[c - wt[i]] + val[i]);",
      "    return dp[W];",
      "}",
      "",
      "// Unbounded knapsack / count ways (coin change II). Each item any number of times.",
      "int countWays(const vector<int>& coins, int amount) {",
      "    vector<long long> dp(amount + 1, 0);",
      "    dp[0] = 1;",
      "    for (int c : coins)",
      "        for (int s = c; s <= amount; s++)     // left to right: reuse c",
      "            dp[s] += dp[s - c];",
      "    return (int)dp[amount];",
      "}",
    ],
    templateNotes: [
      "The index is the capacity or sum, not the item. Items are the outer loop, so each one is decided once.",
      "Right to left reads cells from before this item, so the item is used at most once. Left to right reads cells that may already include it, so it can repeat.",
      "<code>dp[0]</code> is the base case: 0 for best value, <code>true</code> for reachability, <code>1</code> for counting ways (the empty choice).",
      "Pick the combine step for the question: <code>max</code> for best value, <code>||</code> for yes/no, <code>+=</code> for counting.",
      "With items outer and sums inner, counting gives combinations. Sums outer and items inner would count orderings instead.",
    ],
    variants: [
      ["Subset sum / equal partition", "Boolean dp by sum, right to left", "416, 1049"],
      ["Count sign choices or subsets", "Rewrite to a subset sum, counting dp", "494, 879"],
      ["Unbounded: coins or pieces reused", "Left to right sweep, min or count", "322, 518, 279"],
      ["Two capacities", "2D dp over both limits, both swept right to left", "474"],
    ],
    mistakes: [
      "Sweeping left to right in a 0/1 problem, which lets one item be used many times. Go right to left, or keep two rows.",
      "Forgetting the base case <code>dp[0]</code>, so nothing is ever reachable and the answer is always false or 0.",
      "Putting the sum loop outside the item loop when counting combinations, which counts each order as a different way.",
      "In Target Sum, not checking that <code>sum + target</code> is even and that <code>|target| &lt;= sum</code>, which gives a wrong or negative P.",
      "Ignoring zeros in Target Sum: each zero doubles the count, and a loop that starts at <code>s &gt;= 1</code> instead of <code>s &gt;= x</code> misses that.",
      "Sizing the table by n instead of by the sum or capacity.",
    ],
    complexity: [
      ["0/1 knapsack, 1D row", "O(n · W)", "O(W)", "n items, each sweeps the W + 1 cells once."],
      ["0/1 knapsack, 2D table", "O(n · W)", "O(n · W)", "Same work, but keeps every row; needed only to rebuild the chosen items."],
      ["Target Sum as subset count", "O(n · P)", "O(P)", "P = (sum + target) / 2 cells, one sweep per number."],
      ["Brute force over subsets", "O(2^n)", "O(n)", "Each item in or out; shown only to explain what the table saves."],
    ],
    sayIt: "When a problem asks me to pick a subset of items to hit an exact sum, stay under a capacity, or count the ways to do that, I think knapsack. The table is indexed by the sum or capacity, not by the item. dp of s says whether s is reachable, or the best value, or how many ways, using the items seen so far. The base case is dp of zero, since picking nothing gives zero. Then for each item I sweep the sums, and the update reads dp of s minus the item's size. In the zero-one version each item can be used once, so I sweep from right to left: the cell I read on the left still means without this item. If items can be reused, like coins, I sweep left to right instead. For equal partition I first check the total is even and aim for half. For Target Sum I turn signs into a subset sum of sum plus target over two. Time is n times the capacity, and the space is one row.",
    followups: [
      ["Why does the inner loop go right to left?", "dp[s - x] must still describe the state before item x. Going right to left, the left cell has not been updated for x yet, so x is counted at most once."],
      ["How would you return the actual subset, not just true?", "Keep the full 2D table dp[i][s], then walk back from dp[n][target]: if dp[i-1][s] is true, item i was skipped; otherwise it was taken and s drops by its size."],
      ["What if the numbers can be negative in a subset sum?", "Shift every sum by the total of the negatives so indexes start at 0, or use a hash map of reachable sums."],
      ["Can bitsets speed up Partition Equal Subset Sum?", "Yes: keep reachable sums in a bitset and do bits |= bits << x for each number. Same O(n · target) work, divided by the word size."],
    ],
    rubric: {
      strong: [
        "Named the subset or capacity signal and said what dp[s] means and what dp[0] is.",
        "Chose the sweep direction on purpose (right to left for once, left to right for reuse) and the right combine step.",
        "Gave O(n · capacity) time and O(capacity) space, handled an odd sum or unreachable target, and tested a small case by hand.",
      ],
      weak: [
        "Tried a greedy or 2^n recursion without noticing the sum is small enough for a table.",
        "Swept in the wrong direction, so items were reused, or forgot the base case.",
        "Could not say what a dp cell means, or gave the complexity in terms of n only.",
      ],
    },
  },

  quiz: [
    ["In 0/1 knapsack with a 1D <code>dp</code> row, why does the inner loop go from high sums to low?",
      ["It is faster on modern CPUs", "So <code>dp[s - x]</code> still means \"without item x\" and the item is used at most once", "Because the answer is stored in dp[0]", "To skip sums that are already true"],
      1, "The left cell has not been updated for this item yet. Left to right would read a cell that already includes x and use x again."],
    ["Target Sum: <code>nums = [1,2,3]</code>, <code>target = 0</code>. What subset sum P do we count?",
      ["P = 0", "P = 6", "P = 2", "P = 3"],
      3, "P = (sum + target) / 2 = (6 + 0) / 2 = 3. The subsets {3} and {1,2} both work, so the answer is 2."],
    ["Which change turns the 0/1 template into one where each coin can be used any number of times?",
      ["Sweep the sums from left to right", "Start with dp[0] = 0", "Put the item loop inside the sum loop and sweep right to left", "Use max instead of +"],
      0, "Left to right lets dp[s - c] already include coin c, so the same coin can be added again. That is the unbounded knapsack."],
  ],

  drills: [
    { prompt: "Given rock weights, smash two rocks at a time; equal ones vanish, otherwise the difference stays. Return the smallest possible weight of the last rock.",
      answer: "dp-knapsack", distractors: ["heaps", "greedy", "dp-1d"],
      why: "The result is the difference between two groups. Find the reachable subset sum closest to half the total: a boolean knapsack." },
    { prompt: "Given binary strings and limits m and n, return the largest number of strings you can pick using at most m zeros and n ones in total.",
      answer: "dp-knapsack", distractors: ["greedy", "backtracking", "dp-2d"],
      why: "Each string is taken once and has two costs. A 0/1 knapsack with a 2D capacity table, both swept right to left." },
    { prompt: "Given an array, can it be split into two groups whose sums are equal?",
      answer: "dp-knapsack", distractors: ["two-pointers", "greedy", "prefix-sum-hashing"],
      why: "Find one subset summing to half the total. A boolean table by sum, each number used once." },
    { prompt: "Given coin values and an amount, return how many different combinations of coins make the amount. Each coin may be used any number of times.",
      answer: "dp-knapsack", distractors: ["backtracking", "greedy", "math-design"],
      why: "Counting combinations with reuse: an unbounded knapsack with coins in the outer loop and sums swept left to right." },
    { prompt: "Put a plus or minus before each number so the total equals a target. How many ways are there?",
      answer: "dp-knapsack", distractors: ["backtracking", "dp-2d", "bit-manipulation"],
      why: "Plus numbers minus minus numbers equals target, so the plus group sums to (total + target) / 2. Count subsets with that sum." },
    { prompt: "Each item has a weight and a value. With a bag that holds at most W, return the best total value if each item can be taken once.",
      answer: "dp-knapsack", distractors: ["greedy", "heaps", "dp-1d"],
      why: "Take-or-leave each item under a capacity: the classic 0/1 knapsack, best value per capacity." },
  ],

  flashcards: [
    { id: "ks-01", front: "0/1 knapsack with a 1D row: time, space and sweep direction?", back: "O(n · W) time, O(W) space, sums swept right to left so each item is used once." },
    { id: "ks-unbounded", front: "Unbounded knapsack (items reusable): what changes?", back: "Sweep the sums left to right. Same O(n · W) time and O(W) space." },
    { id: "ks-lc416", front: "Partition Equal Subset Sum (LC 416): time and space?", back: "O(n · sum/2) time and O(sum/2) space with a boolean row." },
    { id: "ks-lc494", front: "Target Sum (LC 494): time, space and the key rewrite?", back: "Count subsets with sum P = (sum + target) / 2. O(n · P) time and O(P) space." },
    { id: "ks-combos", front: "Counting coin combinations: which loop goes outside?", back: "Coins outside, sums inside. Sums outside would count each order of the same coins as a new way." },
  ],

  problems: [416, 494, 322],
});
