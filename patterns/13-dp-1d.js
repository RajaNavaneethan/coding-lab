// Pattern 13: Dynamic Programming: 1D. Writer C.
// Demo 1 "house-robber" (LC 198), demo 2 "coin-change" (LC 322).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "dp-1d",
  num: 13,
  title: "Dynamic Programming: 1D",
  summary: "Write the answer for position i in terms of a few earlier answers, store them in one array, and fill it left to right so each subproblem is solved once.",
  tags: ["dp", "recurrence", "memoization", "fibonacci", "min coins", "count ways", "subsequence"],

  demos: [
    {
      id: "house-robber",
      title: "House Robber",
      lc: 198,
      problem: "Houses in a row hold <code>nums[i]</code> money. You cannot rob two houses next to each other. Return the most money you can rob. <code>[2,7,9,3,1]</code> gives <code>12</code> (houses 0, 2 and 4).",
      code: [
        "int rob(vector<int>& nums) {",
        "    int n = (int)nums.size();",
        "    if (n == 0) return 0;",
        "    if (n == 1) return nums[0];",
        "    vector<int> dp(n);                               // dp[i]: most money from houses 0..i",
        "    dp[0] = nums[0];",
        "    dp[1] = max(nums[0], nums[1]);",
        "    for (int i = 2; i < n; i++)",
        "        dp[i] = max(dp[i - 1], dp[i - 2] + nums[i]); // skip house i, or rob it",
        "    return dp[n - 1];",
        "}",
      ],
      fields: [{ key: "nums", label: "nums", type: "ints", value: "2,7,9,3,1" }],
      run(input, rec) {
        const nums = input.nums, n = nums.length;
        if (n > 30) { rec.error("Give at most 30 houses here."); return null; }
        if (nums.some((x) => x < 0)) { rec.error("Money in a house cannot be negative."); return null; }
        let shown = 0, hidden = 0;
        const frame = (f) => { if (shown < 40) { rec.frame(f); shown++; } else hidden++; };
        const dp = new Array(n).fill("");
        const views = (o) => {
          o = o || {};
          const dm = {};
          dp.forEach((v, i) => { if (v !== "") dm[i] = "done"; });
          Object.assign(dm, o.dm || {});
          return [
            { id: "nums", type: "array", label: "nums (money in each house)", values: nums.slice(), pointers: o.np || {}, marks: o.nm || {} },
            { id: "dp", type: "array", label: "dp[i]: most money from houses 0..i", values: dp.slice(), pointers: o.dp || {}, marks: dm, dir: "ltr" },
          ];
        };
        if (n === 0) {
          frame({ line: 3, title: "No houses: return 0", t: "There are no houses, so the most you can rob is <b>0</b>.",
            tip: "Handle the tiny cases first: the recurrence reads two earlier cells, so it needs at least two to start from.",
            vars: { n: 0 }, views: views() });
          return 0;
        }
        if (n === 1) {
          frame({ line: 4, title: `One house: return ${nums[0]}`, t: `There is only one house, so rob it: <b>${nums[0]}</b>.`,
            tip: "Handle the tiny cases first: the recurrence reads two earlier cells, so it needs at least two to start from.",
            vars: { n: 1 }, views: views({ nm: { 0: "good" } }) });
          return nums[0];
        }
        dp[0] = nums[0];
        frame({
          line: [5, 6], title: `dp[0] = ${nums[0]}`,
          t: `With only house 0 available, the best plan is to rob it: <code>dp[0] = ${nums[0]}</code>.`,
          tip: "Say what one cell means before any code: <code>dp[i]</code> is the most money from the first i + 1 houses, whether or not house i is robbed.",
          vars: { n: n, "dp[0]": dp[0] },
          views: views({ np: { i: 0 }, nm: { 0: "in" }, dp: { i: 0 }, dm: { 0: "new" } }),
          moves: [{ from: ["nums", 0], to: ["dp", 0], label: String(nums[0]), mark: "new" }],
        });
        dp[1] = Math.max(nums[0], nums[1]);
        const pick1 = nums[1] > nums[0] ? 1 : 0;
        frame({
          line: 7, title: `dp[1] = ${dp[1]}`,
          t: `Houses 0 and 1 are neighbours, so you can rob only one of them. Take the richer: <code>max(${nums[0]}, ${nums[1]}) = ${dp[1]}</code>.`,
          vars: { "nums[0]": nums[0], "nums[1]": nums[1], "dp[1]": dp[1] },
          views: views({ np: { i: 1 }, nm: { 0: "in", 1: "in" }, dp: { i: 1 }, dm: { 1: "new" } }),
          moves: [{ from: ["nums", pick1], to: ["dp", 1], label: String(dp[1]), mark: "new" }],
        });
        let tipShown = false;
        for (let i = 2; i < n; i++) {
          const skip = dp[i - 1], take = dp[i - 2] + nums[i];
          dp[i] = Math.max(skip, take);
          const robbed = take >= skip;
          frame({
            line: [8, 9], title: robbed ? `Rob house ${i}: dp = ${dp[i]}` : `Skip house ${i}: dp = ${dp[i]}`,
            t: `Two choices for house ${i}. Skip it and keep <code>dp[${i - 1}] = ${skip}</code>, or rob it: <code>dp[${i - 2}] + nums[${i}] = ${dp[i - 2]} + ${nums[i]} = ${take}</code>, since house ${i - 1} must then be left alone. ${robbed ? (take === skip ? "They tie" : "Robbing wins") : "Skipping wins"}: <code>dp[${i}] = ${dp[i]}</code>.`,
            tip: tipShown ? undefined : "Only <code>dp[i - 1]</code> and <code>dp[i - 2]</code> are read, so two variables could replace the array for O(1) space.",
            vars: { i: i, "dp[i-1]": skip, "dp[i-2] + nums[i]": take, "dp[i]": dp[i] },
            views: views({ np: { i: i }, nm: { [i]: robbed ? "in" : "dim" }, dp: { i: i }, dm: { [i - 1]: robbed ? "dim" : "in", [i - 2]: robbed ? "in" : "dim", [i]: "new" } }),
            moves: robbed
              ? [{ from: ["dp", i - 2], to: ["dp", i], label: String(dp[i - 2]), mark: "in" }, { from: ["nums", i], to: ["dp", i], label: `+${nums[i]}`, mark: "new" }]
              : [{ from: ["dp", i - 1], to: ["dp", i], label: String(skip), mark: "new" }],
          });
          tipShown = true;
        }
        // Walk back to show which houses were robbed (display only).
        const robbedSet = {};
        for (let i = n - 1; i >= 0;) {
          const prev = i >= 1 ? dp[i - 1] : 0;
          if (dp[i] !== prev) { robbedSet[i] = "good"; i -= 2; } else i -= 1;
        }
        const houses = Object.keys(robbedSet).map(Number).sort((a, b) => a - b);
        frame({
          line: 10, title: `Return dp[${n - 1}] = ${dp[n - 1]}`,
          t: `The last cell covers every house: <b>${dp[n - 1]}</b>. Tracing the choices back, one best plan robs house${houses.length > 1 ? "s" : ""} ${houses.join(", ")}.`,
          tip: "O(n) time, one step per house. O(n) space for dp, or O(1) with two rolling variables.",
          vars: { n: n, answer: dp[n - 1] },
          views: views({ nm: robbedSet, dm: { [n - 1]: "good" } }),
        });
        if (hidden) rec.truncated(hidden);
        return dp[n - 1];
      },
      expect: [
        [{ nums: "2,7,9,3,1" }, 12],
        [{ nums: "1,2,3,1" }, 4],
        [{ nums: "5" }, 5],
        [{ nums: "" }, 0],
        [{ nums: "2,1,1,2" }, 4],
        [{ nums: "1,9" }, 9],
      ],
    },
    {
      id: "coin-change",
      title: "Coin Change",
      lc: 322,
      problem: "Given coin values <code>coins</code> (each usable any number of times) and an <code>amount</code>, return the fewest coins that add up to the amount, or <code>-1</code> if it cannot be made. <code>coins = [1,2,5]</code>, <code>amount = 11</code> gives <code>3</code> (5 + 5 + 1).",
      code: [
        "int coinChange(vector<int>& coins, int amount) {",
        "    vector<int> dp(amount + 1, amount + 1);   // amount + 1 means \"cannot make it\"",
        "    dp[0] = 0;                                // zero coins make 0",
        "    for (int i = 1; i <= amount; i++)",
        "        for (int c : coins)",
        "            if (c <= i) dp[i] = min(dp[i], dp[i - c] + 1);   // last coin is c",
        "    return dp[amount] > amount ? -1 : dp[amount];",
        "}",
      ],
      fields: [
        { key: "coins", label: "coins", type: "ints", value: "1,2,5" },
        { key: "amount", label: "amount", type: "int", value: "11" },
      ],
      run(input, rec) {
        const coins = input.coins, amount = input.amount;
        if (coins.length < 1 || coins.length > 5) { rec.error("Give between 1 and 5 coin values here."); return null; }
        if (coins.some((c) => c < 1)) { rec.error("Coin values must be 1 or more."); return null; }
        if (amount < 0 || amount > 30) { rec.error("amount must be between 0 and 30 here, so the dp row fits."); return null; }
        let shown = 0, hidden = 0;
        const frame = (f) => { if (shown < 40) { rec.frame(f); shown++; } else hidden++; };
        const BIG = amount + 1;
        const dp = new Array(amount + 1).fill(BIG);
        const S = (x) => (x > amount ? "∞" : x);
        const views = (o) => {
          o = o || {};
          const dm = {};
          for (let i = 0; i < (o.upto === undefined ? 0 : o.upto); i++) dm[i] = dp[i] > amount ? "bad" : "done";
          Object.assign(dm, o.dm || {});
          return [
            { id: "coins", type: "array", label: "coins", values: coins.slice(), marks: o.cm || {} },
            { id: "dp", type: "array", label: "dp[i]: fewest coins that make i (∞ = cannot yet)", values: dp.map(S), pointers: o.dp || {}, marks: dm, dir: "ltr" },
          ];
        };
        dp[0] = 0;
        frame({
          line: [2, 3], title: "dp[0] = 0, rest ∞",
          t: `Make a row for every amount from 0 to ${amount}. The code fills it with <code>amount + 1 = ${BIG}</code>, shown as ∞: more coins than any real answer could need. Zero coins make amount 0.`,
          tip: "Using <code>amount + 1</code> instead of <code>INT_MAX</code> keeps <code>dp[i - c] + 1</code> from overflowing.",
          vars: { amount: amount, "dp[0]": 0 },
          views: views({ dm: { 0: "new" } }),
        });
        let lastTip = false, noneTip = false;
        for (let i = 1; i <= amount; i++) {
          const cands = [];
          for (const c of coins) if (c <= i) { cands.push([c, dp[i - c] + 1]); dp[i] = Math.min(dp[i], dp[i - c] + 1); }
          const cm = {}, dm = {};
          coins.forEach((c, k) => { cm[k] = c <= i ? "in" : "dim"; });
          cands.forEach(([c]) => { dm[i - c] = dp[i - c] > amount ? "bad" : "in"; });
          dm[i] = dp[i] > amount ? "bad" : "new";
          const best = cands.find(([, v]) => v === dp[i]);
          const parts = cands.map(([c, v]) => `last coin ${c}: <code>dp[${i - c}] + 1 = ${S(v)}</code>`);
          const can = dp[i] <= amount;
          frame({
            line: [5, 6], title: can ? `dp[${i}] = ${dp[i]}` : `dp[${i}] = ∞`,
            t: cands.length === 0
              ? `Every coin is bigger than ${i}, so no coin can be the last one. <code>dp[${i}]</code> stays ∞.`
              : `Try each coin as the last one: ${parts.join("; ")}. ${can ? `The smallest is ${dp[i]}${best ? `, ending with a ${best[0]}` : ""}` : "None of them is reachable, so it stays ∞"}.`,
            tip: !lastTip && cands.length > 1 ? "Fix the last coin, and what is left is a smaller amount you have already solved. That is the whole recurrence." : (!can && !noneTip ? "An ∞ cell is not an error: it just means no mix of these coins makes that amount, and anything built on it stays ∞." : undefined),
            vars: { i: i, [`dp[${i}]`]: S(dp[i]) },
            views: views({ upto: i, cm: cm, dp: { i: i }, dm: dm }),
            moves: cands.filter(([c]) => dp[i - c] <= amount).slice(0, 3).map(([c]) => ({ from: ["dp", i - c], to: ["dp", i], label: `+${c}`, mark: best && best[0] === c ? "new" : "in" })),
          });
          if (cands.length > 1) lastTip = true;
          if (!can) noneTip = true;
        }
        const ans = dp[amount] > amount ? -1 : dp[amount];
        frame({
          line: 7, title: ans < 0 ? "Cannot make it: -1" : `Return ${ans}`,
          t: ans < 0
            ? `<code>dp[${amount}]</code> is still ∞ (${BIG} in the code), so no combination of the coins makes ${amount}. Return <b>-1</b>.`
            : `<code>dp[${amount}] = ${ans}</code>: the fewest coins that make ${amount} is <b>${ans}</b>.`,
          tip: "O(amount · coins) time and O(amount) space. A greedy pick of the biggest coin fails on coins [1,3,4] with amount 6.",
          vars: { amount: amount, answer: ans },
          views: views({ upto: amount + 1, dm: { [amount]: ans < 0 ? "bad" : "good" } }),
        });
        if (hidden) rec.truncated(hidden);
        return ans;
      },
      expect: [
        [{ coins: "1,2,5", amount: "11" }, 3],
        [{ coins: "2", amount: "3" }, -1],
        [{ coins: "1", amount: "0" }, 0],
        [{ coins: "1,3,4", amount: "6" }, 2],
        [{ coins: "2,5,10,1", amount: "27" }, 4],
        [{ coins: "3,7", amount: "5" }, -1],
      ],
    },
  ],

  explain: {
    plain: "Dynamic programming solves a problem by building answers for smaller inputs first and reusing them. In 1D DP the state is one number, such as a position or an amount, so the answers fit in one array <code>dp</code> that is filled in order.",
    spot: [
      "\"Fewest\", \"most\", \"how many ways\" over a sequence or up to an amount, where choices made early affect what is allowed later.",
      "The brute force is a recursion that solves the same smaller input many times (Fibonacci-like branching).",
      "The answer at position i depends only on a few earlier positions: i - 1, i - 2, or i - c for each coin c.",
      "Choices like take or skip, or pick the last piece, with a rule such as \"no two adjacent\" or \"split into dictionary words\".",
      "A single index or amount describes the situation fully: nothing else from the past matters.",
    ],
    notWhen: [
      "The state needs two numbers (two strings, a grid): use a 2D table.",
      "A greedy choice is provably right (Jump Game): DP works but is slower than needed.",
      "You must list every solution, not count or optimise them: backtracking.",
    ],
    template: [
      "// 1D DP, bottom-up. dp[i] is the answer for the first i items (or amount i).",
      "int solve(const vector<int>& a) {",
      "    int n = (int)a.size();",
      "    if (n == 0) return 0;",
      "    vector<int> dp(n + 1, 0);",
      "    dp[0] = 0;                            // base case: empty input",
      "    dp[1] = a[0];",
      "    for (int i = 2; i <= n; i++)",
      "        dp[i] = max(dp[i - 1], dp[i - 2] + a[i - 1]);   // the recurrence",
      "    return dp[n];",
      "}",
      "",
      "// Same idea with memoised recursion (top-down).",
      "int go(int i, const vector<int>& a, vector<int>& memo) {",
      "    if (i < 0) return 0;",
      "    if (memo[i] != -1) return memo[i];",
      "    return memo[i] = max(go(i - 1, a, memo), go(i - 2, a, memo) + a[i]);",
      "}",
    ],
    templateNotes: [
      "First write what <code>dp[i]</code> means in one sentence. The recurrence and base cases follow from that sentence.",
      "Base cases cover the inputs the recurrence cannot reach, such as the empty prefix or amount 0.",
      "Fill in an order where every cell you read is already done: left to right when you read smaller indexes.",
      "Top-down with a memo gives the same answers and is often easier to write first; bottom-up avoids deep recursion.",
      "When only the last one or two cells are read, keep them in variables for O(1) space.",
    ],
    variants: [
      ["Take or skip, with a neighbour rule", "dp[i] from dp[i-1] and dp[i-2]", "198, 213, 70"],
      ["Fewest pieces to make an amount", "dp[i] = min over the last piece", "322, 279"],
      ["Can the prefix be split into valid parts", "dp[i] true if some valid last part ends at i", "139, 91"],
      ["Best subsequence ending at i", "dp[i] from all j < i, or patience sorting", "300, 673"],
    ],
    mistakes: [
      "Not defining what a cell means, so the recurrence mixes \"best ending at i\" with \"best up to i\".",
      "Missing base cases, such as an empty input or a single element, and reading <code>dp[-1]</code>.",
      "Using <code>INT_MAX</code> as \"impossible\" and then adding 1, which overflows. Use <code>amount + 1</code> or check first.",
      "Greedy instead of DP for coin change: biggest coin first fails on coins [1,3,4] and amount 6.",
      "Plain recursion without a memo, which is exponential because the same subproblems repeat.",
    ],
    complexity: [
      ["House Robber", "O(n)", "O(1) with two variables", "One step per house; only two earlier answers are needed."],
      ["Coin Change", "O(amount · k)", "O(amount)", "Each amount tries each of the k coins once."],
      ["Longest Increasing Subsequence", "O(n²) or O(n log n)", "O(n)", "Each i looks at every j < i, or binary search on tails."],
      ["Recursion without memo", "O(2^n)", "O(n)", "The same subproblems are solved again and again."],
    ],
    sayIt: "When a question asks for the most, the fewest, or the number of ways over a sequence or an amount, and a brute force recursion would solve the same smaller case many times, I think 1D dynamic programming. I first say what one cell means, for example dp of i is the most money from the first i plus one houses. Then I write the recurrence from the last choice. For House Robber the last house is either skipped, which gives dp of i minus one, or robbed, which gives dp of i minus two plus its money. For Coin Change I try every coin as the last coin and take one plus the answer for what is left. I set the base cases, fill left to right so every cell I read is ready, and return the last cell. That is usually O of n times the number of choices. If I only read the last one or two cells, I keep them in variables for constant space.",
    followups: [
      ["How would you make House Robber O(1) space?", "Keep prev2 and prev1 for dp[i-2] and dp[i-1]. Each step computes cur = max(prev1, prev2 + x), then shifts them."],
      ["What if the houses are in a circle (LC 213)?", "Run the same DP twice: once without the last house and once without the first, and take the larger answer."],
      ["How would you return the coins used, not just the count?", "Store which coin gave the minimum for each amount, then walk back from the amount subtracting that coin."],
      ["Why does greedy fail for Coin Change?", "Taking the biggest coin can leave a remainder that needs many small coins. Coins [1,3,4] and amount 6: greedy gives 4+1+1, DP finds 3+3."],
    ],
    rubric: {
      strong: [
        "Stated what dp[i] means in words and derived the recurrence from the last choice.",
        "Got the base cases right, filled in a valid order, and avoided overflow or out-of-range reads.",
        "Gave the time as states times choices and the space, mentioned the rolling-variable version, and tested an empty or impossible case.",
      ],
      weak: [
        "Wrote a recursion without a memo, or a greedy rule, without checking it.",
        "Left the meaning of a cell vague, or missed a base case such as n = 1 or amount 0.",
        "Could not state the complexity or explain why each subproblem is solved once.",
      ],
    },
  },

  quiz: [
    ["In House Robber, what does <code>dp[i - 2] + nums[i]</code> stand for?",
      ["Skipping house i", "Robbing house i, so house i - 1 must be left alone", "Robbing houses i - 1 and i", "The money in house i - 2"],
      1, "If you rob house i, its neighbour i - 1 is off limits. The best you can add to it is the best plan for houses 0..i-2."],
    ["Coin Change fills <code>dp</code> with <code>amount + 1</code> at the start. Why not <code>INT_MAX</code>?",
      ["amount + 1 is faster to compare", "INT_MAX is not allowed in a vector", "So dp[0] can be 0", "dp[i - c] + 1 on INT_MAX would overflow"],
      3, "No real answer uses more than amount coins, so amount + 1 already means impossible, and adding 1 to it is safe."],
    ["Which problem is a poor fit for 1D DP?",
      ["Find the length of the longest common subsequence of two strings", "Number of ways to climb n stairs with steps of 1 or 2", "Whether a string can be split into dictionary words", "Fewest perfect squares that sum to n"],
      0, "Two strings need a state with two positions, so the table is 2D. The others have one index or amount as the state."],
  ],

  drills: [
    { prompt: "You can climb 1 or 2 steps at a time. How many different ways are there to reach step n?",
      answer: "dp-1d", distractors: ["binary-search", "backtracking", "greedy"],
      why: "The last move was 1 or 2 steps, so ways(n) = ways(n-1) + ways(n-2). One index, two earlier answers." },
    { prompt: "Given a string and a dictionary, can the string be cut into pieces that are all dictionary words?",
      answer: "dp-1d", distractors: ["tries", "backtracking", "sliding-window"],
      why: "dp[i] is true if some word ends at i and dp at its start is true. One index over the string." },
    { prompt: "Return the length of the longest strictly increasing subsequence of an array.",
      answer: "dp-1d", distractors: ["two-pointers", "dp-2d", "stacks-monotonic"],
      why: "dp[i] is the longest increasing run ending at i, built from every earlier j with a smaller value (or binary search on tails for O(n log n))." },
    { prompt: "Given coin values and an amount, return the fewest coins that make the amount, or -1.",
      answer: "dp-1d", distractors: ["greedy", "two-pointers", "backtracking"],
      why: "dp[a] = 1 + min over coins of dp[a - c]. One amount is the whole state; greedy fails on some coin sets." },
    { prompt: "Houses in a row hold money and you cannot take from two neighbours. What is the most you can take?",
      answer: "dp-1d", distractors: ["greedy", "two-pointers", "heaps"],
      why: "Skip house i (best up to i - 1) or take it (best up to i - 2 plus its money): a two-term recurrence." },
    { prompt: "A digit string encodes letters with 1 = A to 26 = Z. How many ways can it be decoded?",
      answer: "dp-1d", distractors: ["backtracking", "math-design", "tries"],
      why: "The last letter used one or two digits, so ways(i) adds ways(i-1) and ways(i-2) when those digits are valid." },
  ],

  flashcards: [
    { id: "d1-robber", front: "House Robber (LC 198): time and space?", back: "O(n) time. O(n) space with an array, O(1) with two rolling variables." },
    { id: "d1-coins", front: "Coin Change (LC 322): time and space?", back: "O(amount · k) time for k coins, O(amount) space." },
    { id: "d1-lis", front: "Longest Increasing Subsequence (LC 300): time and space?", back: "O(n²) with plain DP, O(n log n) with a tails array and binary search. O(n) space." },
    { id: "d1-wordbreak", front: "Word Break (LC 139): time and space?", back: "O(n³) time when every split point j is tried and each substring is hashed for the set lookup. Limiting j to the last L positions (L = longest word) gives O(n · L²). O(n) space for dp." },
    { id: "d1-stairs", front: "Climbing Stairs (LC 70): time and space?", back: "O(n) time and O(1) space with two variables: it is the Fibonacci recurrence." },
  ],

  problems: [198, 322, 70, 139, 300],
});
