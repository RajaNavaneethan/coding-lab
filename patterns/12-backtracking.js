// Pattern 12: Backtracking. Writer C.
// Demo 1 "subsets" (LC 78), demo 2 "n-queens" (LC 51).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "backtracking",
  num: 12,
  title: "Backtracking",
  summary: "Build a candidate one choice at a time, recurse, then undo the choice, so one shared path walks every branch of the decision tree.",
  tags: ["recursion", "dfs", "subsets", "permutations", "combinations", "all solutions", "choose explore unchoose", "pruning"],

  demos: [
    {
      id: "subsets",
      title: "Subsets",
      lc: 78,
      problem: "Given an array <code>nums</code> of distinct integers, return every subset (the power set), in any order. <code>[1,2,3]</code> gives <code>[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]</code>.",
      code: [
        "void dfs(int start, vector<int>& nums, vector<int>& cur,",
        "         vector<vector<int>>& ans) {",
        "    ans.push_back(cur);              // every node is a subset",
        "    for (int i = start; i < (int)nums.size(); i++) {",
        "        cur.push_back(nums[i]);      // choose",
        "        dfs(i + 1, nums, cur, ans);  // explore",
        "        cur.pop_back();              // un-choose",
        "    }",
        "}",
        "",
        "vector<vector<int>> subsets(vector<int>& nums) {",
        "    vector<vector<int>> ans;",
        "    vector<int> cur;",
        "    dfs(0, nums, cur, ans);",
        "    return ans;",
        "}",
      ],
      fields: [{ key: "nums", label: "nums", type: "ints", value: "1,2,3" }],
      run(input, rec) {
        const nums = input.nums;
        if (nums.length > 10) { rec.error("Use at most 10 numbers: the answer has 2^n subsets."); return null; }
        if (new Set(nums).size !== nums.length) { rec.error("The numbers must be distinct."); return null; }
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        const ans = [], cur = [];
        const tree = [];               // decision-tree nodes revealed so far
        const stack = [];              // {start, id}
        const done = new Set();
        const show = (a) => `[${a.join(",")}]`;
        const nodeId = (idx) => "n" + idx.join("_");
        let idxPath = [];              // indexes chosen so far, gives the node id

        const views = (o) => {
          o = o || {};
          const fm = {}, fem = {};
          for (const id of done) fm[id] = "done";
          const path = stack.map((s) => s.id);
          path.forEach((id) => { fm[id] = "path"; });
          for (let i = 1; i < path.length; i++) fem[`${path[i - 1]}-${path[i]}`] = "path";
          if (path.length) fm[path[path.length - 1]] = "hot";
          Object.assign(fm, o.fm || {});
          const cm = {};
          if (stack.length) cm[stack.length - 1] = "hot";
          return [
            { id: "tree", type: "forest", label: "decision tree (each node = one subset)", nodes: tree.slice(), marks: fm, edgeMarks: fem },
            { id: "calls", type: "callstack", label: "call stack", frames: stack.map((s) => `dfs(start=${s.start}) cur=${s.cur}`), marks: cm },
            { id: "cur", type: "array", label: "cur", values: cur.slice(), marks: o.curMarks || {} },
            { id: "found", type: "calc", label: "subsets in ans", value: ans.length },
          ];
        };

        let recordTip = false, popTip = false, leafTip = false, chooseTxt = false;
        const dfs = (start, parentId) => {
          const id = nodeId(idxPath);
          tree.push({ id, val: show(cur), parent: parentId });
          stack.push({ start, id, cur: show(cur) });
          ans.push(cur.slice());
          const leaf = start >= nums.length;
          let tip;
          if (!recordTip) { tip = "Record the subset first, before any choice. Every node of the tree is an answer here, not only the leaves."; recordTip = true; }
          else if (leaf && !leafTip) { tip = `<code>start = ${start}</code> is past the end, so the loop does not run. This branch is finished and returns.`; leafTip = true; }
          frame({
            line: 3, title: `Record ${show(cur)}`,
            t: `<code>dfs(start = ${start})</code> with <code>cur = ${show(cur)}</code>. Push a copy into <code>ans</code>: subset number ${ans.length}.${leaf ? " No numbers are left to add, so this call ends here." : ` Next it tries adding each of <code>nums[${start}..${nums.length - 1}]</code>.`}`,
            tip: tip,
            vars: { start: start, "cur.size()": cur.length, "ans.size()": ans.length },
            views: views({ fm: { [id]: "new" } }),
            moves: [{ from: ["cur", Math.max(0, cur.length - 1)], to: ["found", "*"], label: show(cur) }].filter(() => cur.length > 0),
          });
          for (let i = start; i < nums.length; i++) {
            cur.push(nums[i]);
            idxPath.push(i);
            frame({
              line: [5, 6], title: `Choose ${nums[i]}`,
              t: `Choose <code>nums[${i}] = ${nums[i]}</code>: <code>cur</code> becomes <code>${show(cur)}</code>. Recurse with <code>start = ${i + 1}</code>${chooseTxt ? "." : ", so only numbers to the right of index " + i + " can join. Each set is then built in one order only."}`,
              vars: { i: i, "nums[i]": nums[i], "cur.size()": cur.length, "ans.size()": ans.length },
              views: views({ curMarks: { [cur.length - 1]: "new" } }),
              moves: [{ from: ["cur", cur.length - 1], to: ["calls", stack.length - 1], label: String(nums[i]) }],
            });
            chooseTxt = true;
            dfs(i + 1, id);
            const popped = cur.pop();
            idxPath.pop();
            frame({
              line: 7, title: `Un-choose ${popped}`,
              t: `Back in <code>dfs(start = ${start})</code>. Pop ${popped}, so <code>cur</code> is <code>${show(cur)}</code> again, exactly as it was before choosing it.${i + 1 < nums.length ? ` Next try <code>nums[${i + 1}] = ${nums[i + 1]}</code>.` : " That was the last number for this call."}`,
              tip: popTip ? undefined : "Un-choose is what makes this backtracking: one shared <code>cur</code> is reused for every branch, so each choice must be undone before the next one.",
              vars: { i: i, "cur.size()": cur.length, "ans.size()": ans.length },
              views: views({ curMarks: {} }),
              moves: [{ from: ["cur", cur.length], to: ["tree", id], label: String(popped), mark: "dim" }],
            });
            popTip = true;
          }
          done.add(id);
          stack.pop();
        };

        frame({
          line: 14, title: "Call dfs(0)",
          t: `Start with an empty <code>cur</code> and an empty <code>ans</code>. Each call of <code>dfs</code> is one node of the decision tree.`,
          vars: { "nums.size()": nums.length, "ans.size()": 0 },
          views: views(),
        });
        dfs(0, null);
        frame({
          line: 15, title: `Return ${ans.length} subsets`,
          t: `The whole tree is walked. Each of the ${nums.length} numbers was either in or out, so there are <code>2^${nums.length} = ${ans.length}</code> subsets.`,
          tip: "O(n · 2^n) time: 2^n subsets, and copying each one costs up to n. Recursion depth is n.",
          vars: { "ans.size()": ans.length },
          views: views(),
        });
        if (total > 40) rec.truncated(total - 40);
        return ans;
      },
      expect: [
        [{ nums: "1,2,3" }, [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]], "setDeep"],
        [{ nums: "0" }, [[], [0]], "setDeep"],
        [{ nums: "" }, [[]], "setDeep"],
        [{ nums: "5,-1" }, [[], [5], [-1], [5, -1]], "setDeep"],
        [{ nums: "1,2,3,4" }, [[], [1], [2], [3], [4], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4], [1, 2, 3], [1, 2, 4], [1, 3, 4], [2, 3, 4], [1, 2, 3, 4]], "setDeep"],
      ],
    },
    {
      id: "n-queens",
      title: "N-Queens",
      lc: 51,
      problem: "Place <code>n</code> queens on an <code>n × n</code> board so no two share a row, column or diagonal. Return every board. <code>n = 4</code> gives two boards: <code>[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"]</code> and <code>[\"..Q.\",\"Q...\",\"...Q\",\".Q..\"]</code>.",
      code: [
        "vector<vector<string>> solveNQueens(int n) {",
        "    vector<vector<string>> ans;",
        "    vector<string> board(n, string(n, '.'));",
        "    vector<bool> usedCol(n), usedDiag(2 * n), usedAnti(2 * n);",
        "    function<void(int)> dfs = [&](int r) {",
        "        if (r == n) { ans.push_back(board); return; }",
        "        for (int c = 0; c < n; c++) {",
        "            if (usedCol[c] || usedDiag[r - c + n] || usedAnti[r + c]) continue;",
        "            board[r][c] = 'Q';",
        "            usedCol[c] = usedDiag[r - c + n] = usedAnti[r + c] = true;",
        "            dfs(r + 1);",
        "            board[r][c] = '.';",
        "            usedCol[c] = usedDiag[r - c + n] = usedAnti[r + c] = false;",
        "        }",
        "    };",
        "    dfs(0);",
        "    return ans;",
        "}",
      ],
      fields: [{ key: "n", label: "n", type: "int", value: "4" }],
      run(input, rec) {
        const n = input.n;
        if (n < 1 || n > 7) { rec.error("Use n from 1 to 7 so the board stays readable."); return null; }
        let total = 0;
        const frame = (f) => { total++; f.layout = "cols"; rec.frame(f); };
        const ans = [];
        const board = Array.from({ length: n }, () => new Array(n).fill("."));
        const usedCol = new Array(n).fill(false), usedDiag = new Array(2 * n).fill(false), usedAnti = new Array(2 * n).fill(false);
        const stack = [];
        const k = (r, c) => `${r},${c}`;
        // Which queens attack cell (r, c), and why.
        const attackers = (r, c) => {
          const out = [];
          for (let i = 0; i < r; i++) {
            const qc = board[i].indexOf("Q");
            if (qc < 0) continue;
            if (qc === c) out.push([i, qc, "column"]);
            else if (i - qc === r - c) out.push([i, qc, "diagonal"]);
            else if (i + qc === r + c) out.push([i, qc, "anti-diagonal"]);
          }
          return out;
        };

        const views = (o) => {
          o = o || {};
          const gm = {};
          for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (board[r][c] === "Q") gm[k(r, c)] = "good";
          Object.assign(gm, o.gm || {});
          const cm = {};
          if (stack.length) cm[stack.length - 1] = o.callMark || "hot";
          return [
            { id: "board", type: "grid", label: "board", cells: board.map((row) => row.map((x) => (x === "Q" ? "Q" : ""))),
              rowLabels: board.map((_, r) => `r${r}`), colLabels: board.map((_, c) => `c${c}`), marks: gm },
            { id: "calls", type: "callstack", label: "call stack", frames: stack.map((s) => s.c === null ? `dfs(r=${s.r})` : `dfs(r=${s.r}) c=${s.c}`), marks: cm },
            { id: "found", type: "calc", label: "boards in ans", value: ans.length },
          ];
        };

        let placeTip = false, deadTip = false, backTip = false, solTip = false;
        const dfs = (r) => {
          stack.push({ r, c: null });
          if (r === n) {
            ans.push(board.map((row) => row.join("")));
            frame({
              line: 6, title: `Solution ${ans.length}`,
              t: `<code>r = ${n}</code>: every row has a queen and none attack each other. Copy the board into <code>ans</code> as <code>[${ans[ans.length - 1].map((s) => `"${s}"`).join(",")}]</code> and return.`,
              tip: solTip ? undefined : "Reaching row n proves the board is valid, because every queen was checked against all earlier ones when it was placed. There is no final check.",
              vars: { r: r, "ans.size()": ans.length },
              views: views({ callMark: "good" }),
            });
            solTip = true;
            stack.pop();
            return;
          }
          let skipped = [], placedAny = false;
          for (let c = 0; c < n; c++) {
            if (usedCol[c] || usedDiag[r - c + n] || usedAnti[r + c]) { skipped.push(c); continue; }
            const gm = {}, why = [];
            skipped.forEach((sc) => {
              gm[k(r, sc)] = "warn";
              const a = attackers(r, sc)[0];
              if (a) { gm[k(a[0], a[1])] = "warn"; why.push(`c${sc} (${a[2]} of the queen at r${a[0]} c${a[1]})`); }
            });
            board[r][c] = "Q";
            usedCol[c] = usedDiag[r - c + n] = usedAnti[r + c] = true;
            stack[stack.length - 1].c = c;
            placedAny = true;
            gm[k(r, c)] = "new";
            let tip;
            if (!placeTip) { tip = "Three boolean arrays make the safety check O(1): one per column, one per diagonal (<code>r - c</code> is the same along it) and one per anti-diagonal (<code>r + c</code>)."; placeTip = true; }
            frame({
              line: [9, 11], title: `Row ${r}: queen at c${c}`,
              t: `${why.length ? `Row ${r}: skip ${why.join(", ")}. Column` : `Row ${r}: column`} ${c} is safe, so place a queen at <code>(${r}, ${c})</code>, mark its column and both diagonals, and go to row ${r + 1}.`,
              tip: tip,
              vars: { r: r, c: c, "r - c + n": r - c + n, "r + c": r + c, "ans.size()": ans.length },
              views: views({ gm: gm }),
              moves: [{ from: ["calls", stack.length - 1], to: ["board", k(r, c)], label: "Q" }],
            });
            dfs(r + 1);
            board[r][c] = ".";
            usedCol[c] = usedDiag[r - c + n] = usedAnti[r + c] = false;
            stack[stack.length - 1].c = null;
            skipped = [];
            frame({
              line: [12, 13], title: `Row ${r}: lift queen at c${c}`,
              t: `Back in row ${r}. Remove the queen at <code>(${r}, ${c})</code> and clear its column and diagonals, so the next column of row ${r} is judged on the board as it was.${c + 1 < n ? "" : ` That was the last column of row ${r}.`}`,
              tip: backTip ? undefined : "This undo is the backtrack. Without it, the flags from a failed branch would block squares in the next branch.",
              vars: { r: r, c: c, "ans.size()": ans.length },
              views: views({ gm: { [k(r, c)]: "dim" } }),
            });
            backTip = true;
          }
          if (skipped.length) {
            const gm = {}, why = [];
            skipped.forEach((sc) => {
              gm[k(r, sc)] = "warn";
              const a = attackers(r, sc)[0];
              if (a) { gm[k(a[0], a[1])] = "warn"; if (why.length < 4) why.push(`c${sc} by r${a[0]} (${a[2]})`); }
            });
            frame({
              line: 8, title: placedAny ? `Row ${r}: no more safe columns` : `Row ${r}: dead end`,
              t: `${placedAny ? "Every remaining" : "Every"} column of row ${r} is attacked: ${why.join(", ")}. The loop ends${placedAny ? "" : " without placing a queen"}, so this call returns and the row above tries its next column.`,
              tip: deadTip ? undefined : "This is pruning. The branch dies as soon as one row has no safe square, long before the board is full.",
              vars: { r: r, "ans.size()": ans.length },
              views: views({ gm: gm, callMark: "warn" }),
            });
            deadTip = true;
          }
          stack.pop();
        };

        frame({
          line: [3, 4], title: "Empty board",
          t: `An empty ${n} × ${n} board. Each call of <code>dfs(r)</code> places one queen in row <code>r</code>, so two queens can never share a row.`,
          vars: { n: n, "ans.size()": 0 },
          views: views(),
        });
        dfs(0);
        frame({
          line: 17, title: `Return ${ans.length} board${ans.length === 1 ? "" : "s"}`,
          t: ans.length ? `Every branch is explored. There ${ans.length === 1 ? "is" : "are"} <b>${ans.length}</b> way${ans.length === 1 ? "" : "s"} to place ${n} queens.` : `Every branch hit a dead end, so no board works for <code>n = ${n}</code>. Return an empty list.`,
          vars: { "ans.size()": ans.length },
          views: views(),
        });
        if (total > 40) rec.truncated(total - 40);
        return ans;
      },
      expect: [
        [{ n: "4" }, [[".Q..", "...Q", "Q...", "..Q."], ["..Q.", "Q...", "...Q", ".Q.."]]],
        [{ n: "1" }, [["Q"]]],
        [{ n: "2" }, []],
        [{ n: "3" }, []],
      ],
    },
  ],

  explain: {
    plain: "Backtracking builds an answer one choice at a time. At each step it makes a choice, recurses to make the rest, then undoes the choice and tries the next one. The calls form a decision tree, and one shared path (an array, a board, a set of flags) walks every branch of it.",
    spot: [
      "The question asks for <b>all</b> of something: all subsets, all permutations, all combinations that sum to a target, all valid boards.",
      "The input is small (n up to about 10-20), because the output itself can be exponential.",
      "Each answer is a sequence of choices from a small menu: include or skip, which number next, which column for this row.",
      "There are constraints that can be checked part-way, so a bad partial answer can be dropped early (pruning).",
      "A grid word search or path puzzle where you mark a cell as used, explore, and unmark it on the way back.",
    ],
    notWhen: [
      "Only a count or the best value is asked and subproblems repeat. Use DP; backtracking would redo the same work exponentially.",
      "You need the shortest path in a grid or graph. BFS finds it directly; backtracking would try every path.",
    ],
    template: [
      "// Generic backtracking: choose, explore, un-choose.",
      "// Shown for permutations; subsets and combinations loop from a start index.",
      "void backtrack(vector<int>& nums, vector<int>& path,",
      "               vector<bool>& used, vector<vector<int>>& out) {",
      "    if ((int)path.size() == (int)nums.size()) {   // a full answer",
      "        out.push_back(path);",
      "        return;",
      "    }",
      "    for (int i = 0; i < (int)nums.size(); i++) {",
      "        if (used[i]) continue;                    // prune invalid choices",
      "        used[i] = true;                           // choose",
      "        path.push_back(nums[i]);",
      "        backtrack(nums, path, used, out);         // explore",
      "        path.pop_back();                          // un-choose",
      "        used[i] = false;",
      "    }",
      "}",
    ],
    templateNotes: [
      "The base case decides when the path is a full answer. For subsets every call is an answer, so record before the loop.",
      "The loop lists the choices. Permutations try every unused index; combinations and subsets start at <code>start</code> so each set appears once.",
      "Prune with <code>continue</code> before choosing: a used index, a sum already too big, a square under attack.",
      "Every change made to choose must be undone after the recursive call, in reverse order.",
      "Push a copy of the path into the output; the path itself keeps changing.",
    ],
    variants: [
      ["Subsets / combinations", "Loop from start, recurse with i + 1, so order inside a set does not matter", "78, 39"],
      ["Permutations", "Loop over every index with a used array; each order is a different answer", "46"],
      ["Constraint placement", "One decision per row or cell; O(1) checks with flag arrays", "51"],
      ["Grid search", "Mark the cell, try four neighbours, unmark on the way back", "79"],
    ],
    mistakes: [
      "Forgetting to undo the choice, so the shared path or flags leak into the next branch.",
      "Pushing <code>path</code> itself instead of a copy in languages with references, so every answer ends up the same.",
      "In subsets or combinations, looping from 0 instead of <code>start</code>, which produces duplicates such as [1,2] and [2,1].",
      "Recursing with <code>start + 1</code> instead of <code>i + 1</code> in combinations, which revisits earlier numbers.",
      "In Combination Sum, recursing with <code>i + 1</code> when a number may be reused; it must be <code>i</code>.",
      "Checking validity only at the end instead of when choosing, which explores far more branches than needed.",
    ],
    complexity: [
      ["Subsets", "O(n · 2^n)", "O(n) recursion + output", "2^n subsets, each copied in up to n steps."],
      ["Permutations", "O(n · n!)", "O(n) recursion + output", "n! orders, each copied in n steps."],
      ["N-Queens with flag arrays", "O(n!) roughly", "O(n)", "Row r has at most n - r safe columns; each check is O(1)."],
      ["Word Search on an m × n grid", "O(m · n · 3^L)", "O(L)", "From each cell, each of L letters has at most 3 new directions."],
    ],
    sayIt: "When a question asks for all subsets, all permutations, all combinations or all valid boards, and the input is small, I use backtracking. I picture a decision tree: each level makes one choice, like include this number or which column the queen goes in. I keep one shared path. In the recursive function I first check whether the path is a full answer and, if so, save a copy. Then I loop over the choices, skip the ones that already break a rule, apply a choice, recurse, and undo it right after the call returns. The undo is what lets one path serve every branch. For subsets and combinations I pass a start index so each set appears once in one order. Pruning early, like checking a queen against flag arrays when I place it, keeps the tree small. The cost follows the output: about n times 2 to the n for subsets and n times n factorial for permutations, with recursion depth n.",
    followups: [
      ["How do you handle duplicates in the input, as in Subsets II?", "Sort first, then in the loop skip nums[i] when i > start and nums[i] == nums[i - 1]. Equal values at the same level would build the same subset."],
      ["Can you write Subsets without recursion?", "Yes: start with [[]] and, for each number, add it to a copy of every subset so far. Or count a mask from 0 to 2^n - 1 and take the set bits."],
      ["How would you speed up N-Queens further?", "Use three bitmasks instead of boolean arrays. The free columns for a row are ~(cols | d1 | d2), and you take the lowest set bit each time."],
      ["What is the recursion depth, and can it overflow?", "The depth equals the number of choices in one answer, n. With n around 20 that is tiny; the output size is the real limit."],
    ],
    rubric: {
      strong: [
        "Named the all-answers signal and the small input, and described the decision tree: what one level chooses and when a path is complete.",
        "Wrote choose, explore, un-choose with the right loop start and pruning before the call, and pushed copies of the path.",
        "Gave the output-driven complexity (2^n, n!) with the copy cost, and tested an empty input or a case with no answer.",
      ],
      weak: [
        "Tried DP or greedy for a list-every-answer question, or could not say what the tree's levels were.",
        "Forgot to undo the choice, produced duplicate orders, or checked validity only at the end.",
        "Claimed polynomial time or gave no complexity at all.",
      ],
    },
  },

  quiz: [
    ["In the Subsets code, why does the recursive call pass <code>i + 1</code> and the loop start at <code>start</code>?",
      ["So the recursion depth stays below n", "So every subset is built in one order only and [2,1] never repeats [1,2]", "Because nums must be sorted first", "So the empty subset is skipped"],
      1, "Only numbers to the right of the last choice may join. Each set is then built in increasing index order exactly once."],
    ["What goes wrong if you delete <code>cur.pop_back()</code> from Subsets?",
      ["Nothing, the answer is the same", "The code no longer compiles", "Numbers from finished branches stay in cur, so later subsets come out wrong", "It runs in O(n) instead of O(2^n)"],
      2, "cur is shared by every branch. Without the undo, a choice made in one branch is still there when the next branch starts."],
    ["Why does N-Queens keep <code>usedDiag[r - c + n]</code> and <code>usedAnti[r + c]</code>?",
      ["Along a diagonal r - c is constant and along an anti-diagonal r + c is constant, so one flag covers the whole line", "To count how many queens are on the board", "To store the final boards", "Because the board is stored row by row"],
      0, "Every square on one diagonal shares r - c, and every square on one anti-diagonal shares r + c. A single flag per line makes the safety check O(1). The + n keeps the index non-negative."],
  ],

  drills: [
    { prompt: "Given distinct integers, return every possible ordering of them.",
      answer: "backtracking", distractors: ["dp-1d", "greedy", "two-pointers"],
      why: "Every ordering is wanted, so the output is n!. Choose an unused number for each position, recurse, and undo." },
    { prompt: "Given candidate numbers and a target, list every combination that sums to the target. A number may be used more than once.",
      answer: "backtracking", distractors: ["dp-knapsack", "prefix-sum-hashing", "greedy"],
      why: "It asks to list the combinations, not count them. Recurse with the same index to allow reuse and stop once the sum passes the target." },
    { prompt: "Given a grid of letters and a word, say whether the word can be traced through adjacent cells without using a cell twice.",
      answer: "backtracking", distractors: ["graphs-bfs-dfs", "tries", "dp-2d"],
      why: "Try each start cell, mark it used, explore the four neighbours for the next letter, and unmark it when the branch fails." },
    { prompt: "Given a string, split it into pieces so that every piece reads the same forwards and backwards. Return every such split.",
      answer: "backtracking", distractors: ["dp-2d", "sliding-window", "two-pointers"],
      why: "Every split is wanted. Choose the next palindromic prefix, recurse on the rest, then remove it and try a longer prefix." },
    { prompt: "Given n pairs of brackets, list every string of them that is properly balanced.",
      answer: "backtracking", distractors: ["stacks-monotonic", "dp-1d", "math-design"],
      why: "Build the string one bracket at a time. Prune when closes would outnumber opens or opens exceed n." },
    { prompt: "Fill a partly filled 9 × 9 grid so every row, column and 3 × 3 box holds 1 to 9 once.",
      answer: "backtracking", distractors: ["greedy", "graphs-bfs-dfs", "bit-manipulation"],
      why: "Try a digit in the next empty cell, check row, column and box flags, recurse, and erase it on failure." },
  ],

  flashcards: [
    { id: "bt-subsets", front: "Subsets (LC 78): time and space?", back: "O(n · 2^n) time: 2^n subsets, each copied in up to n steps. O(n) recursion depth plus the output." },
    { id: "bt-perms", front: "Permutations (LC 46): time and space?", back: "O(n · n!) time: n! orders, each copied in n. O(n) for the path and the used array." },
    { id: "bt-combsum", front: "Combination Sum (LC 39): what bounds the work?", back: "Exponential in target / smallest candidate, the tree depth. Sorting lets you break the loop once a candidate is too big." },
    { id: "bt-queens", front: "N-Queens (LC 51) with flag arrays: time and space?", back: "About O(n!) time, since row r has at most n - r safe columns, with O(1) checks. O(n) space for the flags and recursion." },
    { id: "bt-wordsearch", front: "Word Search (LC 79): time and space?", back: "O(m · n · 3^L) time for an m × n grid and a word of length L. O(L) recursion depth." },
  ],

  problems: [78, 46, 39, 79, 51],
});
