// Pattern 16: Greedy. Writer D.
// Demo 1 "jump-game" (LC 55), demo 2 "gas-station" (LC 134).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "greedy",
  num: 16,
  title: "Greedy",
  summary: "Make the choice that looks best right now, never undo it, and prove that no other choice could have done better.",
  tags: ["greedy", "local choice", "farthest reach", "earliest finish", "exchange argument", "one pass"],

  demos: [
    {
      id: "jump-game",
      title: "Jump Game",
      lc: 55,
      problem: "You start at index 0 of <code>nums</code>; <code>nums[i]</code> is the longest jump you may take from index <code>i</code>. Return whether you can reach the last index. <code>[2,3,1,1,4]</code> gives <code>true</code>; <code>[3,2,1,0,4]</code> gives <code>false</code>.",
      code: [
        "bool canJump(vector<int>& nums) {",
        "    int reach = 0, n = nums.size();",
        "    for (int i = 0; i < n; i++) {",
        "        if (i > reach) return false;",
        "        reach = max(reach, i + nums[i]);",
        "        if (reach >= n - 1) return true;",
        "    }",
        "    return true;",
        "}",
      ],
      fields: [{ key: "nums", label: "nums", type: "ints", value: "2,3,1,1,4" }],
      run(input, rec) {
        const nums = input.nums;
        if (nums.some((x) => x < 0)) { rec.error("Jump lengths must be 0 or more."); return null; }
        const n = nums.length;
        let reach = 0;
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };

        const views = (i, o) => {
          o = o || {};
          const m = {};
          for (let k = 0; k < n; k++) if (k > reach) m[k] = "dim";
          Object.assign(m, o.marks || {});
          const top = Math.min(reach, n - 1);
          return [
            { id: "nums", type: "array", label: "nums (max jump from each index)", values: nums.slice(),
              pointers: i === null ? {} : { i: i }, marks: m,
              ranges: n ? [{ from: 0, to: top, mark: o.rangeMark || "good", label: "reachable" }] : [] },
            { id: "reach", type: "calc", label: "reach (farthest index)", value: reach },
            { id: "goal", type: "calc", label: "goal (n - 1)", value: n - 1 },
          ];
        };

        frame({
          line: 2, title: "Only index 0 so far",
          t: `We stand on index 0, so the farthest index we can reach is <code>reach = 0</code>. The goal is the last index, <code>n - 1 = ${n - 1}</code>.`,
          tip: "Greedy idea: we never need to know <em>which</em> jumps to take. We only track the farthest index any path can get to.",
          vars: { i: "-", reach: reach, n: n },
          views: views(null),
        });

        let extendTip = false;
        for (let i = 0; i < n; i++) {
          if (i > reach) {
            frame({
              line: 4, title: "Gap: cannot step on i",
              t: `Index ${i} is past <code>reach = ${reach}</code>. No index we can reach jumps this far, so every later index is cut off too. Return <b>false</b>.`,
              tip: `The trap is a 0 that nothing jumps over. Every index we could stand on stops at or before index ${reach}.`,
              vars: { i: i, reach: reach, n: n },
              views: views(i, { marks: { [i]: "bad" }, rangeMark: "warn" }),
            });
            if (total > 40) rec.truncated(total - 40);
            return false;
          }
          const old = reach;
          reach = Math.max(reach, i + nums[i]);
          const grew = reach > old;
          frame({
            line: 5, title: grew ? `Reach grows to ${reach}` : "Reach stays",
            t: `Index ${i} is inside the range, so we can stand on it. From here we can get to <code>${i} + ${nums[i]} = ${i + nums[i]}</code>. ${grew ? `That beats ${old}, so <code>reach = ${reach}</code>.` : `That is not past ${old}, so <code>reach</code> stays ${reach}.`}`,
            tip: grew && !extendTip ? "Taking the max is safe: a farther frontier contains every index a shorter one does, so it can never hurt." : undefined,
            vars: { i: i, "i + nums[i]": i + nums[i], reach: reach, n: n },
            views: views(i, { marks: { [i]: grew ? "new" : "hot" } }),
            moves: grew ? [{ from: ["nums", i], to: ["reach", 0], label: String(i + nums[i]) }] : undefined,
          });
          if (grew) extendTip = true;
          if (reach >= n - 1) {
            frame({
              line: 6, title: "Last index in range",
              t: `<code>reach = ${reach}</code> is at least the last index ${n - 1}, so we can get there. Return <b>true</b> without looking at the rest.`,
              tip: "The early exit is optional, but it shows the answer is decided as soon as the frontier covers the goal.",
              vars: { i: i, reach: reach, n: n },
              views: views(i, { marks: { [n - 1]: "good", [i]: "hot" } }),
            });
            if (total > 40) rec.truncated(total - 40);
            return true;
          }
        }
        frame({
          line: 8, title: "Return true",
          t: "The array is empty, so the loop never ran. There is nothing to reach; return <b>true</b>.",
          vars: { i: "-", reach: reach, n: n },
          views: views(null),
        });
        if (total > 40) rec.truncated(total - 40);
        return true;
      },
      expect: [
        [{ nums: "2,3,1,1,4" }, true],
        [{ nums: "3,2,1,0,4" }, false],
        [{ nums: "0" }, true],
        [{ nums: "0,1" }, false],
        [{ nums: "1,0,1,0" }, false],
        [{ nums: "2,0,0" }, true],
      ],
    },
    {
      id: "gas-station",
      title: "Gas Station",
      lc: 134,
      problem: "Stations sit on a circle. Station <code>i</code> gives <code>gas[i]</code> fuel and driving to the next one costs <code>cost[i]</code>. Return the start index that lets you drive one full lap with an empty tank at the start, or <code>-1</code>. <code>gas = [1,2,3,4,5]</code>, <code>cost = [3,4,5,1,2]</code> gives <code>3</code>.",
      code: [
        "int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {",
        "    int totalTank = 0, curTank = 0, start = 0;",
        "    for (int i = 0; i < (int)gas.size(); i++) {",
        "        int diff = gas[i] - cost[i];",
        "        totalTank += diff;",
        "        curTank += diff;",
        "        if (curTank < 0) {",
        "            start = i + 1;",
        "            curTank = 0;",
        "        }",
        "    }",
        "    return totalTank >= 0 ? start : -1;",
        "}",
      ],
      fields: [
        { key: "gas", label: "gas", type: "ints", value: "1,2,3,4,5" },
        { key: "cost", label: "cost", type: "ints", value: "3,4,5,1,2" },
      ],
      run(input, rec) {
        const gas = input.gas, cost = input.cost;
        if (gas.length !== cost.length) { rec.error("gas and cost need the same length."); return null; }
        if (!gas.length) { rec.error("Give at least one station."); return null; }
        const n = gas.length;
        let totalTank = 0, curTank = 0, start = 0;
        const diffs = gas.map(() => "");
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };

        const views = (i, o) => {
          o = o || {};
          const dm = {};
          for (let k = 0; k < n; k++) if (k < start && diffs[k] !== "") dm[k] = "dim";
          Object.assign(dm, o.diffMarks || {});
          const hi = i === null ? -1 : Math.min(i, n - 1);
          const run = start <= hi ? [{ from: start, to: hi, mark: o.runMark || "good", label: "current run" }] : [];
          return [
            { id: "gc", type: "grid", label: "stations", cells: [gas.slice(), cost.slice()], rowLabels: ["gas", "cost"],
              colLabels: gas.map((_, k) => String(k)), marks: o.gcMarks || {} },
            { id: "diff", type: "array", label: "diff = gas - cost", values: diffs.slice(), marks: dm, ranges: o.ranges || run,
              pointers: Object.assign({ start: Math.min(start, n) }, i === null ? {} : { i: i }) },
            { id: "cur", type: "calc", label: "curTank (from start)", value: curTank },
            { id: "tot", type: "calc", label: "totalTank (whole lap)", value: totalTank },
          ];
        };

        frame({
          line: 2, title: "Try start = 0",
          t: "Begin with both tanks at 0 and guess that station 0 is the start. <code>curTank</code> is the fuel since the current start; <code>totalTank</code> adds up every station.",
          tip: "Two facts carry the proof. If the total is negative, no start works. If it is not, the start after the last failure works.",
          vars: { i: "-", start: start, curTank: curTank, totalTank: totalTank },
          views: views(null),
        });

        let resetTip = false;
        for (let i = 0; i < n; i++) {
          const diff = gas[i] - cost[i];
          diffs[i] = diff;
          totalTank += diff;
          curTank += diff;
          frame({
            line: [4, 6], title: `Station ${i}: diff ${diff}`,
            t: `At station ${i} we gain ${gas[i]} and spend ${cost[i]} to reach the next one, so <code>diff = ${diff}</code>. <code>curTank = ${curTank}</code>, <code>totalTank = ${totalTank}</code>.`,
            vars: { i: i, diff: diff, start: start, curTank: curTank, totalTank: totalTank },
            views: views(i, { gcMarks: { [`0,${i}`]: "in", [`1,${i}`]: "in" }, diffMarks: { [i]: "new" }, runMark: curTank < 0 ? "warn" : "good" }),
            moves: [{ from: ["diff", i], to: ["cur", 0], label: (diff >= 0 ? "+" : "") + diff }],
          });
          if (curTank < 0) {
            const was = curTank;
            const old = start;
            start = i + 1;
            curTank = 0;
            frame({
              line: [7, 9], title: `Tank ${was}: restart at ${start}`,
              t: old === i
                ? `The tank went negative (${was}) on the way out of station ${i}, so starting at ${i} fails. Move <code>start</code> to ${start} and empty the tank.`
                : `The tank went negative (${was}) on the way out of station ${i}. Starting at ${old} fails, and so does ${old + 1 === i ? `station ${i}` : `every station from ${old + 1} to ${i}`}: we reached ${old + 1 === i ? "it" : "each of them"} with at least 0 fuel and still ran dry, so starting there with 0 is no better. Move <code>start</code> to ${start} and empty the tank.`,
              tip: resetTip ? undefined : "This skip is what makes it O(n). We never retry a start inside a failed run: we reached each of those stations with 0 or more fuel and still ran dry.",
              vars: { i: i, start: start, curTank: curTank, totalTank: totalTank },
              views: views(i, { diffMarks: { [i]: "bad" }, ranges: old <= i ? [{ from: old, to: i, mark: "bad", label: "all fail" }] : [] }),
            });
            resetTip = true;
          }
        }

        const ans = totalTank >= 0 ? start : -1;
        frame({
          line: 12, title: ans >= 0 ? `Return ${ans}` : "Total < 0: return -1",
          t: ans >= 0
            ? `The whole lap has <code>totalTank = ${totalTank}</code> ≥ 0, so there is enough fuel overall. The run from <code>start = ${start}</code> to the end never went negative, and the surplus covers the stretch before it. Return <b>${ans}</b>.`
            : `The whole lap has <code>totalTank = ${totalTank}</code>, less than 0. The stations do not hold enough fuel for one lap from anywhere. Return <b>-1</b>.`,
          tip: "O(n) time, O(1) space: one pass, two running sums and one index.",
          vars: { start: start, curTank: curTank, totalTank: totalTank },
          views: views(null, { ranges: ans >= 0 && start < n ? [{ from: start, to: n - 1, mark: "good", label: "start here" }] : [], gcMarks: ans >= 0 && start < n ? { [`0,${start}`]: "good" } : {} }),
        });
        if (total > 40) rec.truncated(total - 40);
        return ans;
      },
      expect: [
        [{ gas: "1,2,3,4,5", cost: "3,4,5,1,2" }, 3],
        [{ gas: "2,3,4", cost: "3,4,3" }, -1],
        [{ gas: "5", cost: "4" }, 0],
        [{ gas: "1", cost: "2" }, -1],
        [{ gas: "3,1,1", cost: "1,2,2" }, 0],
        [{ gas: "5,1,2,3,4", cost: "4,4,1,5,1" }, 4],
      ],
    },
  ],

  explain: {
    plain: "A greedy algorithm builds the answer one step at a time and, at each step, takes the option that looks best right now (the farthest reach, the earliest finish, the cheapest item). It never goes back. It is correct only when you can argue that the local choice never rules out an optimal answer.",
    spot: [
      "The question asks for a yes/no, a minimum count or a maximum count, and one pass with a running best looks enough: \"can you reach\", \"fewest jumps\", \"most meetings\".",
      "Sorting by one key (end time, deadline, ratio) makes the right next pick obvious.",
      "You can state an exchange argument: if an optimal answer did something else first, you could swap in the greedy pick and lose nothing.",
      "A failure tells you to skip a whole block of options at once (Gas Station: every start inside a failed run also fails).",
      "The DP version only ever uses the best previous state, so the table collapses to one variable.",
    ],
    notWhen: [
      "The best local pick can block a better total, like coin change with coins 1, 3, 4 and amount 6 (greedy takes 4+1+1, best is 3+3). Use DP.",
      "You need every solution or must try choices and undo them. Use backtracking.",
      "You cannot say why the greedy choice is safe. Try a small counterexample by hand before trusting it.",
    ],
    template: [
      "// Frontier greedy (LC 45 shape): jumps = layers of a BFS over indexes.",
      "int minJumps(const vector<int>& a) {",
      "    int jumps = 0, curEnd = 0, farthest = 0;",
      "    for (int i = 0; i + 1 < (int)a.size(); i++) {",
      "        farthest = max(farthest, i + a[i]);  // 1. best reach from this layer",
      "        if (i == curEnd) {                   // 2. layer used up: must jump",
      "            jumps++;",
      "            curEnd = farthest;",
      "        }",
      "    }",
      "    return jumps;",
      "}",
      "",
      "// Sort, then take the pick that leaves the most room (activity selection).",
      "int maxNonOverlapping(vector<pair<int, int>> iv) {",
      "    sort(iv.begin(), iv.end(), [](const pair<int, int>& x, const pair<int, int>& y) {",
      "        return x.second < y.second;           // earliest finish first",
      "    });",
      "    int count = 0;",
      "    long long lastEnd = LLONG_MIN;",
      "    for (auto& [s, e] : iv)",
      "        if (s >= lastEnd) { count++; lastEnd = e; }",
      "    return count;",
      "}",
    ],
    templateNotes: [
      "Frontier greedy keeps the farthest point reachable so far. Jump Game only needs that one number; Jump Game II also counts how many layers it took.",
      "The <code>i + 1 &lt; n</code> bound in <code>minJumps</code> stops before the last index, so arriving there does not count an extra jump.",
      "Sort-then-pick greedy needs the right sort key. Earliest finish leaves the most room for the rest; earliest start does not.",
      "<code>lastEnd</code> starts below every start time so the first interval is always taken. <code>long long</code> keeps that safe for any int start.",
    ],
    variants: [
      ["Farthest reach", "Track one frontier and extend it with max", "55, 45"],
      ["Skip a failed block", "A negative running sum rules out every start inside it", "134, 53"],
      ["Sort then pick", "Sort by end time or deadline, take each pick that still fits", "435, 452, 56"],
      ["Count-driven scheduling", "The most frequent item decides the shape of the answer", "621, 767"],
    ],
    mistakes: [
      "Trusting a greedy rule without a proof or a hand counterexample. Coin change and 0/1 knapsack look greedy and are not.",
      "In Jump Game, checking <code>nums[i] == 0</code> instead of <code>i &gt; reach</code>. A zero is only a problem when nothing jumps over it.",
      "Sorting by start time for \"most non-overlapping intervals\". Sort by end time.",
      "In Gas Station, restarting at <code>i</code> instead of <code>i + 1</code>, or forgetting the total check and returning a start when the lap is impossible.",
      "In Jump Game II, counting a jump when you reach the last index, which gives one too many.",
    ],
    complexity: [
      ["One-pass greedy (Jump Game, Gas Station)", "O(n)", "O(1)", "Each index is looked at once and the state is one or two numbers."],
      ["Sort then pick", "O(n log n)", "O(1) to O(n)", "The sort dominates; the pick loop is O(n). Space is whatever the sort uses."],
      ["DP that greedy replaces", "O(n²) for Jump Game", "O(n)", "dp[i] = can reach i looks back at every j < i. The frontier makes that look-back unnecessary."],
    ],
    sayIt: "When a problem asks whether something is possible or for a min or max count, I first ask if one pass with a running best can answer it. For Jump Game I keep reach, the farthest index any path can get to. I walk i left to right. If i is past reach, I can never stand on i, so I return false. Otherwise I update reach with i plus nums[i], and once reach covers the last index I return true. The local choice is safe because a farther frontier contains everything a shorter one does. For Gas Station, if the tank goes negative at i, no start between the current start and i can work, so I jump the start to i plus one. Before I code a greedy, I say why the choice is safe or try a small counterexample, because some problems that look greedy, like coin change, need DP. Most run in O(n) time and O(1) space, or O(n log n) when I sort first.",
    followups: [
      ["How would you return the fewest jumps instead of yes/no?", "Treat it as BFS over index ranges: keep curEnd and farthest, and when i reaches curEnd, count a jump and set curEnd = farthest (LC 45). Still O(n)."],
      ["Why is a single pass enough in Gas Station?", "If the total gas is at least the total cost, a valid start exists. Any start inside a run that went negative fails, so the only candidate left is the one after the last failure."],
      ["How do you convince yourself a greedy is correct?", "An exchange argument: take any optimal answer, swap its first choice for the greedy one, and show it is still valid and no worse. Then repeat."],
      ["What if Jump Game allowed negative jumps too?", "Then the frontier is not one-way, so the greedy breaks. Use BFS or DFS over the index graph with a visited set (like LC 1306)."],
    ],
    rubric: {
      strong: [
        "Stated the greedy choice and why it is safe (frontier, skip argument or exchange argument) before coding.",
        "Wrote one clean pass with the right state and the right boundary checks (i > reach, start = i + 1, total check).",
        "Gave O(n) or O(n log n) with the reason, and tested a failing case like a zero that blocks the path or an impossible lap.",
      ],
      weak: [
        "Picked a greedy rule by feel with no argument, or did not notice when it fails.",
        "Fell back to an O(n²) DP or retried every start without seeing the skip.",
        "Missed an edge case such as a single element, an empty input or a total that is negative.",
      ],
    },
  },

  quiz: [
    ["In Jump Game, when should the loop return <code>false</code>?",
      ["As soon as <code>nums[i] == 0</code>", "When <code>i</code> is greater than the farthest reachable index", "When <code>reach</code> stops growing for one step", "When the last element is 0"],
      1, "A zero only matters if nothing jumps past it. The real test is whether i itself can be reached, which is i ≤ reach."],
    ["In Gas Station, the running tank goes negative at station 4 after starting at station 1. Which start should you try next?",
      ["Station 2", "Station 0", "Station 4", "Station 5"],
      3, "Every station from 1 to 4 would arrive at station 4 with no more fuel than we had, so all of them fail. The next candidate is 4 + 1 = 5."],
    ["Which problem does a greedy pick get WRONG?",
      ["Coin change with coins 1, 3, 4 and amount 6, fewest coins", "Most non-overlapping meetings, picking the earliest finish", "Jump Game with a farthest-reach frontier", "Best time to buy and sell stock once"],
      0, "Greedy takes 4 first and ends with 4+1+1 (3 coins). The best is 3+3 (2 coins). Use DP for coin change."],
  ],

  drills: [
    { prompt: "Each array value is the longest step you may take from that index. Starting at index 0, return the fewest steps needed to reach the last index.",
      answer: "greedy", distractors: ["dp-1d", "stacks-monotonic", "sliding-window"],
      why: "Keep the farthest index reachable within the current number of steps; when you pass the end of that range, take one more step. One pass, no table." },
    { prompt: "Cities on a ring each give some fuel and cost some fuel to leave. Find the one city where you can start with an empty tank and drive all the way round.",
      answer: "greedy", distractors: ["prefix-sum-hashing", "two-pointers", "dp-1d"],
      why: "A negative running tank rules out every start inside that run, so one pass with a reset finds the only candidate." },
    { prompt: "Given a list of time ranges, remove the fewest so that no two of the remaining ones overlap.",
      answer: "greedy", distractors: ["two-pointers", "dp-1d", "heaps"],
      why: "Sort by end time and keep each range that starts after the last kept one ends. Earliest finish leaves the most room." },
    { prompt: "Each child has a rating. Give every child at least one candy, and more than a neighbour with a lower rating. Return the fewest candies in total.",
      answer: "greedy", distractors: ["dp-1d", "two-pointers", "stacks-monotonic"],
      why: "Two passes: left to right fixes the left neighbour rule, right to left fixes the right one, taking the max. Each local fix never needs undoing." },
    { prompt: "Given tasks labelled by letters and a cooldown n between equal tasks, return the least number of time slots needed to run them all.",
      answer: "greedy", distractors: ["two-pointers", "sliding-window", "binary-search"],
      why: "The most frequent task sets the frame: (maxCount - 1) gaps of size n + 1, plus the tasks tied for max. Count, then compute." },
    { prompt: "Balloons span ranges on a line. One arrow at position x pops every balloon whose range contains x. Return the fewest arrows to pop them all.",
      answer: "greedy", distractors: ["sliding-window", "binary-search", "dp-2d"],
      why: "Sort by end and shoot at the end of the first unpopped balloon; it pops every balloon that starts before that point." },
  ],

  flashcards: [
    { id: "gr-lc55", front: "Jump Game (LC 55) with a farthest-reach frontier: time and space?", back: "O(n) time, O(1) space: one pass, one number (reach)." },
    { id: "gr-lc45", front: "Jump Game II (LC 45), fewest jumps: time and space?", back: "O(n) time, O(1) space: treat index ranges as BFS layers with curEnd and farthest." },
    { id: "gr-lc134", front: "Gas Station (LC 134): time and space?", back: "O(n) time, O(1) space: totalTank, curTank and start, with a restart at i + 1 when curTank goes negative." },
    { id: "gr-sort-pick", front: "Sort-then-pick greedy (most non-overlapping intervals, LC 435): time and space?", back: "O(n log n) time for the sort, then an O(n) pick loop. O(1) extra space beyond the sort." },
    { id: "gr-lc621", front: "Task Scheduler (LC 621) with the counting formula: time and space?", back: "O(n) time to count, O(1) space for 26 counts. Answer = max(n_tasks, (maxCount - 1) * (gap + 1) + tiedForMax)." },
  ],

  problems: [55, 45, 134, 621, 56],
});
