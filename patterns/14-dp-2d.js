// Pattern 14: DP: 2D / Grids. Writer C.
// Demo 1 "lcs" (LC 1143), demo 2 "edit-distance" (LC 72).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "dp-2d",
  num: 14,
  title: "DP: 2D / Grids",
  summary: "When the state needs two indexes, such as a position in each of two strings or a cell in a grid, dp[i][j] is filled row by row from its neighbours above, to the left and on the diagonal.",
  tags: ["dynamic programming", "two strings", "grid paths", "dp table", "subsequence", "edit distance", "palindrome"],

  demos: [
    {
      id: "lcs",
      title: "Longest Common Subsequence",
      lc: 1143,
      problem: "Return the length of the longest sequence of characters that appears, in order but not necessarily together, in both <code>text1</code> and <code>text2</code>. <code>\"abcde\"</code> and <code>\"ace\"</code> give <code>3</code> (<code>\"ace\"</code>). Keep the strings to about 5 characters so the table fills within the steps.",
      code: [
        "int longestCommonSubsequence(string text1, string text2) {",
        "    int m = text1.size(), n = text2.size();",
        "    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));",
        "    for (int i = 1; i <= m; i++)",
        "        for (int j = 1; j <= n; j++)",
        "            if (text1[i - 1] == text2[j - 1])",
        "                dp[i][j] = dp[i - 1][j - 1] + 1;",
        "            else",
        "                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);",
        "    return dp[m][n];",
        "}",
      ],
      fields: [
        { key: "text1", label: "text1", type: "string", value: "abcde" },
        { key: "text2", label: "text2", type: "string", value: "ace" },
      ],
      run(input, rec) {
        const a = input.text1, b = input.text2;
        if (a.length > 10 || b.length > 10) { rec.error("Use strings of at most 10 characters so the table fits."); return null; }
        const esc = (x) => String(x).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
        const q = (ch) => `<b>'${esc(ch)}'</b>`;
        const m = a.length, n = b.length;
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        const filled = Array.from({ length: m + 1 }, (_, i) => new Array(n + 1).fill(i === 0));
        for (let i = 0; i <= m; i++) filled[i][0] = true;
        const K = (i, j) => `${i},${j}`;
        const views = (o) => {
          o = o || {};
          const gm = {};
          for (let i = 0; i <= m; i++) for (let j = 0; j <= n; j++) if (i === 0 || j === 0) gm[K(i, j)] = "dim";
          Object.assign(gm, o.gm || {});
          return [
            { id: "t1", type: "string", label: "text1 (rows)", value: a, marks: o.am || {} },
            { id: "t2", type: "string", label: "text2 (columns)", value: b, marks: o.bm || {} },
            { id: "dp", type: "grid", label: "dp[i][j] = LCS of text1[0..i) and text2[0..j)",
              cells: dp.map((row, i) => row.map((v, j) => (filled[i][j] ? v : ""))),
              rowLabels: ["∅"].concat(a.split("")), colLabels: ["∅"].concat(b.split("")),
              marks: gm, arrows: o.arrows || [] },
          ];
        };

        frame({
          line: 3, title: "Table of zeros",
          t: `Make a <code>${m + 1} × ${n + 1}</code> table. Row <code>i</code> stands for the first <code>i</code> letters of <b>"${esc(a)}"</b>, column <code>j</code> for the first <code>j</code> letters of <b>"${esc(b)}"</b>. Row 0 and column 0 mean an empty string, so their LCS is 0.`,
          tip: "The extra row and column of zeros are the base cases. They let every cell read <code>i - 1</code> and <code>j - 1</code> without a bounds check.",
          vars: { m: m, n: n },
          views: views(),
        });

        let matchTip = false, missTip = false;
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            const ca = a[i - 1], cb = b[j - 1];
            const cur = K(i, j);
            if (ca === cb) {
              dp[i][j] = dp[i - 1][j - 1] + 1;
              filled[i][j] = true;
              frame({
                line: 7, title: `dp[${i}][${j}] = ${dp[i][j]}: match ${esc(ca)}`,
                t: `${q(ca)} = ${q(cb)}. Both prefixes end in the same letter, so it can close a common subsequence: take the diagonal <code>dp[${i - 1}][${j - 1}] = ${dp[i - 1][j - 1]}</code> and add 1. <code>dp[${i}][${j}] = ${dp[i][j]}</code>.`,
                tip: matchTip ? undefined : "On a match, using the letter is always safe: the best answer without both letters is the diagonal, and this letter extends it by one.",
                vars: { i: i, j: j, "text1[i-1]": ca, "text2[j-1]": cb, "dp[i][j]": dp[i][j] },
                views: views({ am: { [i - 1]: "good" }, bm: { [j - 1]: "good" }, gm: { [K(i - 1, j - 1)]: "in", [cur]: "new" }, arrows: [[K(i - 1, j - 1), cur]] }),
                moves: [{ from: ["dp", K(i - 1, j - 1)], to: ["dp", cur], label: "+1" }],
              });
              matchTip = true;
            } else {
              const up = dp[i - 1][j], left = dp[i][j - 1];
              dp[i][j] = Math.max(up, left);
              filled[i][j] = true;
              const src = up >= left ? K(i - 1, j) : K(i, j - 1);
              frame({
                line: 9, title: `dp[${i}][${j}] = ${dp[i][j]}: ${esc(ca)} ≠ ${esc(cb)}`,
                t: `${q(ca)} ≠ ${q(cb)}, so at least one of them is not used. Drop ${q(ca)}: up, <code>dp[${i - 1}][${j}] = ${up}</code>. Drop ${q(cb)}: left, <code>dp[${i}][${j - 1}] = ${left}</code>. Keep the larger: <code>dp[${i}][${j}] = ${dp[i][j]}</code>.`,
                tip: missTip ? undefined : "No match means the two last letters cannot both be in the subsequence. Try dropping each one and keep the better of the two answers.",
                vars: { i: i, j: j, "text1[i-1]": ca, "text2[j-1]": cb, "dp[i][j]": dp[i][j] },
                views: views({ am: { [i - 1]: "hot" }, bm: { [j - 1]: "hot" }, gm: { [K(i - 1, j)]: "in", [K(i, j - 1)]: "in", [cur]: "new" }, arrows: [[K(i - 1, j), cur], [K(i, j - 1), cur]] }),
                moves: [{ from: ["dp", src], to: ["dp", cur], label: String(dp[i][j]) }],
              });
              missTip = true;
            }
          }
        }

        // Walk back to show one LCS.
        const gm = {}, am = {}, bm = {};
        let i = m, j = n, s = "";
        while (i > 0 && j > 0) {
          gm[K(i, j)] = "path";
          if (a[i - 1] === b[j - 1]) { s = a[i - 1] + s; am[i - 1] = "good"; bm[j - 1] = "good"; gm[K(i, j)] = "good"; i--; j--; }
          else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--;
        }
        frame({
          line: 10, title: `Return dp[${m}][${n}] = ${dp[m][n]}`,
          t: dp[m][n]
            ? `The bottom-right cell compares the full strings: <b>${dp[m][n]}</b>. Walking back from it (diagonal on a match, otherwise toward the larger neighbour) spells one LCS: <b>"${esc(s)}"</b>.`
            : "No letter appears in both strings, so the answer is <b>0</b>.",
          tip: "O(m · n) time and space. Each row only reads the row above, so two rows (or one row plus a saved diagonal) bring space down to O(n).",
          vars: { m: m, n: n, "dp[m][n]": dp[m][n] },
          views: views({ gm: gm, am: am, bm: bm }),
        });
        if (total > 40) rec.truncated(total - 40);
        return dp[m][n];
      },
      expect: [
        [{ text1: "abcde", text2: "ace" }, 3],
        [{ text1: "abc", text2: "abc" }, 3],
        [{ text1: "abc", text2: "def" }, 0],
        [{ text1: "", text2: "abc" }, 0],
        [{ text1: "bsbininm", text2: "jmjkbkjkv" }, 1],
        [{ text1: "abcba", text2: "abcbcba" }, 5],
      ],
    },
    {
      id: "edit-distance",
      title: "Edit Distance",
      lc: 72,
      problem: "Return the fewest single-character inserts, deletes and replaces that turn <code>word1</code> into <code>word2</code>. <code>\"horse\"</code> to <code>\"ros\"</code> gives <code>3</code>: replace h with r, delete r, delete e.",
      code: [
        "int minDistance(string word1, string word2) {",
        "    int m = word1.size(), n = word2.size();",
        "    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));",
        "    for (int i = 0; i <= m; i++) dp[i][0] = i;  // delete all i letters",
        "    for (int j = 0; j <= n; j++) dp[0][j] = j;  // insert all j letters",
        "    for (int i = 1; i <= m; i++)",
        "        for (int j = 1; j <= n; j++)",
        "            if (word1[i - 1] == word2[j - 1])",
        "                dp[i][j] = dp[i - 1][j - 1];",
        "            else",
        "                dp[i][j] = 1 + min({dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]});",
        "    return dp[m][n];",
        "}",
      ],
      fields: [
        { key: "word1", label: "word1", type: "string", value: "horse" },
        { key: "word2", label: "word2", type: "string", value: "ros" },
      ],
      run(input, rec) {
        const a = input.word1, b = input.word2;
        if (a.length > 10 || b.length > 10) { rec.error("Use words of at most 10 characters so the table fits."); return null; }
        const esc = (x) => String(x).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
        const q = (ch) => `<b>'${esc(ch)}'</b>`;
        const m = a.length, n = b.length;
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        const filled = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
        const K = (i, j) => `${i},${j}`;
        const views = (o) => {
          o = o || {};
          const gm = {};
          for (let i = 0; i <= m; i++) for (let j = 0; j <= n; j++) if ((i === 0 || j === 0) && filled[i][j]) gm[K(i, j)] = "done";
          Object.assign(gm, o.gm || {});
          return [
            { id: "w1", type: "string", label: "word1 (rows)", value: a, marks: o.am || {} },
            { id: "w2", type: "string", label: "word2 (columns)", value: b, marks: o.bm || {} },
            { id: "dp", type: "grid", label: "dp[i][j] = edits, word1[0..i) → word2[0..j)",
              cells: dp.map((row, i) => row.map((v, j) => (filled[i][j] ? v : ""))),
              rowLabels: ["∅"].concat(a.split("")), colLabels: ["∅"].concat(b.split("")),
              marks: gm, arrows: o.arrows || [] },
          ];
        };

        frame({
          line: 3, title: "Empty table",
          t: `Make a <code>${m + 1} × ${n + 1}</code> table. <code>dp[i][j]</code> will be the fewest edits that turn the first <code>i</code> letters of <b>"${esc(a)}"</b> into the first <code>j</code> letters of <b>"${esc(b)}"</b>.`,
          vars: { m: m, n: n },
          views: views(),
        });
        const bm0 = {};
        for (let i = 0; i <= m; i++) { dp[i][0] = i; filled[i][0] = true; bm0[K(i, 0)] = "new"; }
        for (let j = 0; j <= n; j++) { dp[0][j] = j; filled[0][j] = true; bm0[K(0, j)] = "new"; }
        frame({
          line: [4, 5], title: "Base row and column",
          t: `Turning <code>i</code> letters into the empty string takes <code>i</code> deletes, so column 0 is 0, 1, 2, ... Turning the empty string into <code>j</code> letters takes <code>j</code> inserts, so row 0 is 0, 1, 2, ...`,
          tip: "Every cell reads up, left and the diagonal. The base row and column give those reads something to stand on.",
          vars: { m: m, n: n },
          views: views({ gm: bm0 }),
        });

        let matchTip = false, missTip = false;
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            const ca = a[i - 1], cb = b[j - 1], cur = K(i, j);
            if (ca === cb) {
              dp[i][j] = dp[i - 1][j - 1];
              filled[i][j] = true;
              frame({
                line: 9, title: `dp[${i}][${j}] = ${dp[i][j]}: match ${esc(ca)}`,
                t: `${q(ca)} = ${q(cb)}: the last letters already agree, so no edit is needed for them. Copy the diagonal: <code>dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]}</code>.`,
                tip: matchTip ? undefined : "A match costs nothing, so the answer is whatever it took to line up the shorter prefixes.",
                vars: { i: i, j: j, "word1[i-1]": ca, "word2[j-1]": cb, "dp[i][j]": dp[i][j] },
                views: views({ am: { [i - 1]: "good" }, bm: { [j - 1]: "good" }, gm: { [K(i - 1, j - 1)]: "in", [cur]: "new" }, arrows: [[K(i - 1, j - 1), cur]] }),
                moves: [{ from: ["dp", K(i - 1, j - 1)], to: ["dp", cur], label: String(dp[i][j]) }],
              });
              matchTip = true;
            } else {
              const rep = dp[i - 1][j - 1], del = dp[i - 1][j], ins = dp[i][j - 1];
              const best = Math.min(rep, del, ins);
              dp[i][j] = 1 + best;
              filled[i][j] = true;
              const name = best === rep ? "replace" : best === del ? "delete" : "insert";
              const src = best === rep ? K(i - 1, j - 1) : best === del ? K(i - 1, j) : K(i, j - 1);
              frame({
                line: 11, title: `dp[${i}][${j}] = ${dp[i][j]} (${name})`,
                t: `${q(ca)} ≠ ${q(cb)}, so one edit is needed. Replace ${q(ca)} with ${q(cb)}: diagonal ${rep}. Delete ${q(ca)}: up ${del}. Insert ${q(cb)}: left ${ins}. Cheapest is ${best}, plus 1: <code>dp[${i}][${j}] = ${dp[i][j]}</code>.`,
                tip: missTip ? undefined : "Each neighbour is one kind of last edit. The diagonal is a replace, the cell above is a delete from word1, and the cell to the left is an insert into it.",
                vars: { i: i, j: j, "word1[i-1]": ca, "word2[j-1]": cb, "dp[i][j]": dp[i][j] },
                views: views({ am: { [i - 1]: "hot" }, bm: { [j - 1]: "hot" }, gm: { [K(i - 1, j - 1)]: "in", [K(i - 1, j)]: "in", [K(i, j - 1)]: "in", [cur]: "new" },
                  arrows: [[K(i - 1, j - 1), cur], [K(i - 1, j), cur], [K(i, j - 1), cur]] }),
                moves: [{ from: ["dp", src], to: ["dp", cur], label: "+1" }],
              });
              missTip = true;
            }
          }
        }

        const gm = {};
        let i = m, j = n;
        const ops = [];
        while (i > 0 || j > 0) {
          gm[K(i, j)] = "path";
          if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && dp[i][j] === dp[i - 1][j - 1]) { i--; j--; }
          else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) { ops.unshift(`replace ${a[i - 1]} with ${b[j - 1]}`); i--; j--; }
          else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) { ops.unshift(`delete ${a[i - 1]}`); i--; }
          else { ops.unshift(`insert ${b[j - 1]}`); j--; }
        }
        gm[K(0, 0)] = "path";
        gm[K(m, n)] = "good";
        frame({
          line: 12, title: `Return dp[${m}][${n}] = ${dp[m][n]}`,
          t: dp[m][n]
            ? `The bottom-right cell compares the full words: <b>${dp[m][n]}</b> edit${dp[m][n] === 1 ? "" : "s"}. Walking back gives one plan: ${esc(ops.join(", "))}.`
            : "The words are equal, so no edits are needed: <b>0</b>.",
          tip: "O(m · n) time and space. Each row reads only the row above, so it can be done with O(n) space.",
          vars: { m: m, n: n, "dp[m][n]": dp[m][n] },
          views: views({ gm: gm }),
        });
        if (total > 40) rec.truncated(total - 40);
        return dp[m][n];
      },
      expect: [
        [{ word1: "horse", word2: "ros" }, 3],
        [{ word1: "intention", word2: "execution" }, 5],
        [{ word1: "", word2: "abc" }, 3],
        [{ word1: "abc", word2: "" }, 3],
        [{ word1: "same", word2: "same" }, 0],
        [{ word1: "ab", word2: "ba" }, 2],
      ],
    },
  ],

  explain: {
    plain: "2D DP is the same idea as 1D DP with a state that needs two numbers: how much of each string you have used, or which row and column of a grid you stand on. The answers go in a table, and each cell is built from a few neighbours that are already filled.",
    spot: [
      "<b>Two strings</b> are compared: longest common subsequence, edit distance, interleaving, distinct subsequences, wildcard or regex matching.",
      "A grid where you move only right and down, and you count paths or minimise a cost.",
      "One string where the state is a range <code>[i, j]</code>: is this substring a palindrome, what is the longest palindromic subsequence.",
      "A brute-force recursion takes two shrinking arguments, <code>f(i, j)</code>, and calls itself on <code>(i-1, j)</code>, <code>(i, j-1)</code> and <code>(i-1, j-1)</code>.",
      "The answer is a count, a length or a minimum, not the list of all ways.",
    ],
    notWhen: [
      "Only one index matters, such as a prefix of one array. Use 1D DP.",
      "You can move in all four directions in a grid. Paths can loop, so use BFS or Dijkstra instead of a table filled in one order.",
      "You must list every alignment or path. Use backtracking.",
    ],
    template: [
      "// Two-string DP: dp[i][j] answers the question for a[0..i) and b[0..j).",
      "// Fill in the four rules. LCS: base 0, match diag + 1, else max(up, left).",
      "// Edit distance: base i or j, match diag, else 1 + min(diag, up, left).",
      "int twoStringDP(const string& a, const string& b) {",
      "    int m = a.size(), n = b.size();",
      "    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));",
      "    for (int i = 0; i <= m; i++) dp[i][0] = baseCol(i);  // b is empty",
      "    for (int j = 0; j <= n; j++) dp[0][j] = baseRow(j);  // a is empty",
      "    for (int i = 1; i <= m; i++)",
      "        for (int j = 1; j <= n; j++) {",
      "            int diag = dp[i - 1][j - 1], up = dp[i - 1][j], left = dp[i][j - 1];",
      "            if (a[i - 1] == b[j - 1]) dp[i][j] = onMatch(diag, up, left);",
      "            else dp[i][j] = onMismatch(diag, up, left);",
      "        }",
      "    return dp[m][n];",
      "}",
      "",
      "// Grid DP: count right/down paths, reading the cell above and to the left.",
      "int gridPaths(int rows, int cols) {",
      "    vector<int> row(cols, 1);                    // first row: one way each",
      "    for (int r = 1; r < rows; r++)",
      "        for (int c = 1; c < cols; c++) row[c] += row[c - 1];",
      "    return row[cols - 1];",
      "}",
    ],
    templateNotes: [
      "Size the table <code>(m + 1) × (n + 1)</code>. Row 0 and column 0 stand for an empty prefix and hold the base cases.",
      "Index the strings with <code>i - 1</code> and <code>j - 1</code>, because <code>dp[i][j]</code> covers the first i and j characters.",
      "The match branch reads the diagonal. The mismatch branch combines up, left and sometimes the diagonal.",
      "Fill row by row, left to right, so up, left and the diagonal are always ready.",
      "In the grid version one row is enough: before the update <code>row[c]</code> still holds the cell above, and <code>row[c - 1]</code> is already the cell to the left.",
    ],
    variants: [
      ["Two strings, match or skip", "Diagonal + 1 on a match, else max of up and left", "1143, 1035"],
      ["Two strings, edit cost", "Diagonal on a match, else 1 + min of three neighbours", "72, 583"],
      ["Grid paths or costs", "dp[r][c] from the cell above and the cell to the left", "62, 64"],
      ["Range of one string", "dp[i][j] from dp[i+1][j-1]; fill by length or i from the end", "5, 516"],
    ],
    mistakes: [
      "Using <code>a[i]</code> instead of <code>a[i - 1]</code> with the (m + 1) × (n + 1) table, which is off by one and reads past the end.",
      "Forgetting the base row and column in edit distance; they are 0, 1, 2, ..., not all zeros.",
      "Filling in an order where a cell reads a neighbour that is not ready yet. For range DP that means looping i from the end.",
      "Confusing subsequence with substring. For the longest common substring a mismatch resets the cell to 0 instead of taking a max.",
      "Squeezing to one row and overwriting the diagonal before it is read. Save it in a variable first.",
    ],
    complexity: [
      ["Longest Common Subsequence", "O(m · n)", "O(m · n), or O(min(m, n)) with one row", "One cell per pair of prefixes, O(1) work each."],
      ["Edit Distance", "O(m · n)", "O(m · n), or O(n) with one row", "Same table; three reads per cell."],
      ["Unique Paths in an r × c grid", "O(r · c)", "O(c)", "Each cell adds the cell above and the cell to the left."],
      ["Longest Palindromic Substring, expand around centres", "O(n²)", "O(1)", "2n - 1 centres, each expands up to n. Beats the O(n²)-space table in memory."],
    ],
    sayIt: "When I compare two strings, or walk a grid moving only right and down, the state needs two indexes, so I use a 2D table. For two strings I let dp of i and j be the answer for the first i letters of one and the first j letters of the other, plus a row and column for the empty prefix. Then I look at the last letters. In longest common subsequence, if they match I take the diagonal plus one; if not, I drop a letter from one side and keep the larger of up and left. Edit distance is the same table: a match copies the diagonal, and a mismatch is one plus the cheapest of replace, delete and insert, which are the diagonal, up and left. I fill row by row so every neighbour is ready and return the bottom-right cell. That is O of m times n time, and since each row reads only the row above, I can cut space to one row.",
    followups: [
      ["How would you print the actual LCS, not just its length?", "Keep the full table and walk back from the bottom-right: on a match take the letter and go diagonally, otherwise move to the larger of up and left. Reverse the letters at the end."],
      ["How do you get edit distance down to O(n) space?", "Keep one row. Before overwriting dp[j], save it as the next diagonal; dp[j] still holds the value from the row above and dp[j-1] is the new left value."],
      ["What changes for the longest common substring?", "The letters must be contiguous, so a mismatch sets the cell to 0 and the answer is the largest cell anywhere, not the corner."],
      ["What if the grid has obstacles?", "Set a blocked cell to 0 ways (or infinite cost) and keep the same recurrence. The first row and column stop at the first obstacle."],
    ],
    rubric: {
      strong: [
        "Defined dp[i][j] on prefixes (or cells) in words, set the base row and column, and justified each branch from the last letters or last move.",
        "Filled the table in a safe order with correct i - 1 / j - 1 indexing and returned the right cell.",
        "Stated O(m · n) time, offered the one-row space version, and tested empty strings or equal strings.",
      ],
      weak: [
        "Tried greedy matching or two pointers on a problem that needs every pair of prefixes.",
        "Mixed up indexes, skipped base cases, or read a cell before it was filled.",
        "Gave no complexity or confused subsequence with substring.",
      ],
    },
  },

  quiz: [
    ["In LCS, the letters at <code>text1[i-1]</code> and <code>text2[j-1]</code> differ. What is <code>dp[i][j]</code>?",
      ["dp[i-1][j-1] + 1", "max(dp[i-1][j], dp[i][j-1])", "min(dp[i-1][j], dp[i][j-1]) + 1", "0"],
      1, "At least one of the two last letters is not in the subsequence. Dropping text1's letter gives the cell above, dropping text2's gives the cell to the left; keep the larger."],
    ["In Edit Distance, which neighbour stands for deleting <code>word1[i-1]</code>?",
      ["The diagonal dp[i-1][j-1]", "The cell to the left dp[i][j-1]", "The cell above dp[i-1][j]", "dp[0][0]"],
      2, "After deleting word1's last letter you still need word1[0..i-1) to become word2[0..j), which is dp[i-1][j]. The left cell is an insert and the diagonal a replace."],
    ["Why does the LCS table have <code>m + 1</code> rows instead of <code>m</code>?",
      ["Row 0 is the empty prefix, the base case, so every cell can read i - 1 safely", "To store the answer separately", "Because strings are 1-indexed in C++", "To leave room for the null terminator"],
      0, "dp[0][j] and dp[i][0] compare against an empty string, which is 0. That base row and column remove all bounds checks from the loop."],
  ],

  drills: [
    { prompt: "A robot starts at the top-left of an m by n grid and moves only right or down. How many different routes reach the bottom-right?",
      answer: "dp-2d", distractors: ["heaps", "backtracking", "graphs-bfs-dfs"],
      why: "Each cell's count is the count from above plus the count from the left, filled row by row." },
    { prompt: "Return the length of the longest sequence of letters that appears, in order, in both of two strings.",
      answer: "dp-2d", distractors: ["two-pointers", "sliding-window", "dp-1d"],
      why: "The state is a prefix of each string. A match extends the diagonal; a mismatch takes the best of dropping either letter." },
    { prompt: "Return the fewest inserts, deletes and replaces that turn one word into another.",
      answer: "dp-2d", distractors: ["greedy", "two-pointers", "backtracking"],
      why: "Each cell covers two prefixes. A mismatch costs one plus the cheapest of the three neighbouring cells." },
    { prompt: "Given a string, return its longest substring that reads the same forwards and backwards.",
      answer: "dp-2d", distractors: ["sliding-window", "heaps", "stacks-monotonic"],
      why: "pal[i][j] is true when the end letters match and pal[i+1][j-1] is true. Expanding around each centre does the same work with less space." },
    { prompt: "Match a string against a pattern where '.' matches any one letter and '*' means zero or more of the letter before it.",
      answer: "dp-2d", distractors: ["sliding-window", "tries", "greedy"],
      why: "dp[i][j] says whether the first i letters match the first j pattern characters. A star either skips its pair or eats one more letter." },
    { prompt: "Each cell of a grid has a cost. Moving only right or down, find the cheapest route from the top-left to the bottom-right.",
      answer: "dp-2d", distractors: ["binary-search", "greedy", "graphs-bfs-dfs"],
      why: "With only right and down moves there are no cycles, so each cell is its cost plus the cheaper of the cell above and the cell to the left." },
  ],

  flashcards: [
    { id: "dp2-lcs", front: "Longest Common Subsequence (LC 1143): time and space?", back: "O(m · n) time. O(m · n) space, or O(min(m, n)) with one row and a saved diagonal." },
    { id: "dp2-edit", front: "Edit Distance (LC 72): time and space?", back: "O(m · n) time. O(m · n) space, or O(n) with one row." },
    { id: "dp2-paths", front: "Unique Paths (LC 62): time and space?", back: "O(m · n) time, O(n) space with one row. Or O(min(m, n)) with the binomial C(m + n - 2, m - 1)." },
    { id: "dp2-palin", front: "Longest Palindromic Substring (LC 5): time and space?", back: "O(n²) time with expand-around-centre and O(1) space; the table version is O(n²) for both." },
    { id: "dp2-regex", front: "Regular Expression Matching (LC 10): time and space?", back: "O(m · n) time and space for the match table, where m and n are the string and pattern lengths." },
  ],

  problems: [62, 1143, 72, 5, 10],
});
