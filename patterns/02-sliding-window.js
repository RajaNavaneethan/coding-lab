// Pattern 02: Sliding Window. Anchor record written by the plan owner; every writer imitates it.
// Demo 1 "longest-unique" (LC 3) is the anchor. Writer A adds demo 2 (LC 76) to `demos`.
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "sliding-window",
  num: 2,
  title: "Sliding Window",
  summary: "Keep a stretch of the input that satisfies a rule, grow it on the right and shrink it on the left, so every element enters and leaves once.",
  tags: ["substring", "subarray", "contiguous", "window", "longest", "shortest", "at most k"],

  demos: [
    {
      id: "longest-unique",
      title: "Longest Substring Without Repeating Characters",
      lc: 3,
      problem: "Given a string <code>s</code>, return the length of the longest substring with no repeated character. <code>\"abcabcbb\"</code> gives <code>3</code> (<code>\"abc\"</code>).",
      code: [
        "int lengthOfLongestSubstring(string s) {",
        "    unordered_map<char, int> last;",
        "    int best = 0, l = 0;",
        "    for (int r = 0; r < (int)s.size(); r++) {",
        "        char c = s[r];",
        "        if (last.count(c) && last[c] >= l)",
        "            l = last[c] + 1;",
        "        last[c] = r;",
        "        best = max(best, r - l + 1);",
        "    }",
        "    return best;",
        "}",
      ],
      fields: [{ key: "s", label: "s", type: "string", value: "abcabcbb" }],
      run(input, rec) {
        const s = input.s;
        const esc = (x) => String(x).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
        const q = (ch) => `<b>'${esc(ch)}'</b>`;
        const last = new Map();
        let best = 0, l = 0, bestL = 0, bestR = -1;

        // Snapshot of every view; marks are passed per frame.
        const views = (r, o) => {
          o = o || {};
          const win = r === null ? [] : [{ from: l, to: r, mark: o.windowMark || "good", label: "window" }];
          return [
            { id: "s", type: "string", label: "s", value: s,
              pointers: { l: l, r: r }, ranges: o.ranges || win, marks: o.sMarks || {} },
            { id: "last", type: "map", kind: "map", label: "last seen (char → index)",
              entries: [...last.entries()], marks: o.mapMarks || {} },
            { id: "best", type: "calc", label: "best", value: best },
          ];
        };
        const staleMarks = () => {          // map rows whose index is left of the window
          const m = {};
          for (const [ch, i] of last) if (i < l) m[ch] = "dim";
          return m;
        };
        const outside = () => {             // string tiles left of the window
          const m = {};
          for (let i = 0; i < l; i++) m[i] = "dim";
          return m;
        };

        rec.frame({
          line: 3, title: "Empty window",
          t: "Start with an empty window: <code>l = 0</code>, <code>best = 0</code>, and an empty map from each character to the last index where we saw it.",
          tip: "The window is always <code>s[l..r]</code>. The loop only moves <code>r</code> forward; the rule decides when <code>l</code> moves.",
          vars: { l: l, r: "-", best: best },
          views: views(null),
        });

        let jumped = false, staleShown = false;
        for (let r = 0; r < s.length; r++) {
          const c = s[r];
          const seen = last.has(c);
          if (seen && last.get(c) >= l) {
            const prev = last.get(c);
            rec.frame({
              line: 6, title: "Repeat inside window",
              t: `${q(c)} at index ${r} was last seen at index ${prev}, which is inside the window. The window would hold it twice.`,
              vars: { l: l, r: r, c: c, "last[c]": prev, best: best },
              views: views(r, { windowMark: "warn", sMarks: Object.assign(outside(), { [r]: "warn", [prev]: "warn" }), mapMarks: Object.assign(staleMarks(), { [c]: "warn" }) }),
            });
            l = prev + 1;
            rec.frame({
              line: 7, title: "Jump l past the repeat",
              t: `Move <code>l</code> straight to <code>${prev} + 1 = ${l}</code>. Every start before that would still contain both copies of ${q(c)}, so none of them can be longer.`,
              tip: jumped ? undefined : "Jumping <code>l</code> in one step is the trick. The plain version moves <code>l</code> one character at a time and removes from a set; both are O(n) overall.",
              vars: { l: l, r: r, c: c, "last[c]": prev, best: best },
              views: views(r, { sMarks: Object.assign(outside(), { [r]: "hot", [prev]: "bad" }), mapMarks: Object.assign(staleMarks(), { [c]: "in" }) }),
              moves: [{ from: ["last", c], to: ["s", Math.min(l, s.length - 1)], label: `l = ${l}` }],
            });
            jumped = true;
          } else if (seen) {
            const prev = last.get(c);
            rec.frame({
              line: 6, title: "Old copy, outside window",
              t: `${q(c)} was seen at index ${prev}, but that is left of <code>l = ${l}</code>, so it is not in the window. <code>l</code> stays where it is.`,
              tip: staleShown ? undefined : "This is why the check has <code>last[c] &gt;= l</code>. Without it, <code>\"abba\"</code> would move <code>l</code> backwards and return 3 instead of 2.",
              vars: { l: l, r: r, c: c, "last[c]": prev, best: best },
              views: views(r, { sMarks: Object.assign(outside(), { [r]: "hot" }), mapMarks: Object.assign(staleMarks(), { [c]: "dim" }) }),
            });
            staleShown = true;
          } else {
            rec.frame({
              line: 6, title: "New character",
              t: `${q(c)} at index ${r} has not been seen before, so the window can take it without breaking the rule.`,
              vars: { l: l, r: r, c: c, best: best },
              views: views(r, { sMarks: Object.assign(outside(), { [r]: "hot" }), mapMarks: staleMarks() }),
            });
          }
          last.set(c, r);
          const len = r - l + 1;
          const improved = len > best;
          best = Math.max(best, len);
          if (improved) { bestL = l; bestR = r; }
          rec.frame({
            line: [8, 9], title: improved ? "New best length" : "Record index, measure",
            t: `Save <code>last[${esc(c)}] = ${r}</code>. The window <code>s[${l}..${r}]</code> = <b>"${esc(s.slice(l, r + 1))}"</b> has length ${len}${improved ? `, a new best.` : `, not longer than ${best}.`}`,
            vars: { l: l, r: r, c: c, "r - l + 1": len, best: best },
            views: views(r, { sMarks: Object.assign(outside(), { [r]: "new" }), mapMarks: Object.assign(staleMarks(), { [c]: "new" }) }),
            moves: [{ from: ["s", r], to: ["last", c], label: String(r) }],
          });
        }

        rec.frame({
          line: 11, title: "Return best",
          t: s.length
            ? `Every index entered the window once and <code>l</code> never moved back, so this took one pass. The longest window was <b>"${esc(s.slice(bestL, bestR + 1))}"</b>, length <b>${best}</b>.`
            : "The string is empty, so the loop never ran and the answer is <b>0</b>.",
          tip: "Say the complexity out loud: O(n) time, O(min(n, alphabet)) space for the map.",
          vars: { l: l, r: "-", best: best },
          views: views(null, { ranges: bestR >= 0 ? [{ from: bestL, to: bestR, mark: "good", label: "best" }] : [] }),
        });
        return best;
      },
      expect: [
        [{ s: "abcabcbb" }, 3],
        [{ s: "bbbbb" }, 1],
        [{ s: "pwwkew" }, 3],
        [{ s: "" }, 0],
        [{ s: "abba" }, 2],
        [{ s: "dvdf" }, 3],
      ],
    },
    {
      id: "min-window",
      title: "Minimum Window Substring",
      lc: 76,
      problem: "Given strings <code>s</code> and <code>t</code>, return the shortest substring of <code>s</code> that contains every character of <code>t</code>, counting repeats, or <code>\"\"</code> if there is none. <code>s = \"ADOBECODEBANC\"</code>, <code>t = \"ABC\"</code> gives <code>\"BANC\"</code>.",
      code: [
        "string minWindow(string s, string t) {",
        "    if (t.empty() || s.size() < t.size()) return \"\";",
        "    int need[256] = {0}, have[256] = {0};",
        "    for (char c : t) need[(unsigned char)c]++;",
        "    int required = 0;",
        "    for (int i = 0; i < 256; i++) if (need[i]) required++;",
        "    int formed = 0, l = 0, bestLen = INT_MAX, bestL = 0;",
        "    for (int r = 0; r < (int)s.size(); r++) {",
        "        int c = (unsigned char)s[r];",
        "        have[c]++;",
        "        if (need[c] && have[c] == need[c]) formed++;",
        "        while (formed == required) {",
        "            if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }",
        "            int lc = (unsigned char)s[l];",
        "            have[lc]--;",
        "            if (need[lc] && have[lc] < need[lc]) formed--;",
        "            l++;",
        "        }",
        "    }",
        "    return bestLen == INT_MAX ? \"\" : s.substr(bestL, bestLen);",
        "}",
      ],
      fields: [
        { key: "s", label: "s", type: "string", value: "ADOBECODEBANC" },
        { key: "t", label: "t", type: "string", value: "ABC" },
      ],
      run(input, rec) {
        const s = input.s, t = input.t;
        if (/[^\x00-\x7f]/.test(s + t)) { rec.error("Use plain ASCII characters in s and t."); return null; }
        const esc = (x) => String(x).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
        const q = (ch) => `<b>'${esc(ch)}'</b>`;
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        const need = new Map(), have = new Map();
        for (const c of t) need.set(c, (need.get(c) || 0) + 1);
        const required = need.size;
        let formed = 0, l = 0, bestLen = Infinity, bestL = 0, r = null;
        const H = (c) => have.get(c) || 0;

        const views = (o) => {
          o = o || {};
          const sm = {};
          if (r !== null) for (let k = 0; k < l && k < s.length; k++) sm[k] = "dim";
          Object.assign(sm, o.sMarks || {});
          const hm = {};
          for (const [c, nn] of need) hm[c] = H(c) >= nn ? "good" : "warn";
          Object.assign(hm, o.haveMarks || {});
          const ptr = r === null ? {} : { l: Math.min(l, s.length), r: r };
          const win = r !== null && l <= r ? [{ from: l, to: r, mark: o.windowMark || (formed === required ? "good" : "in"), label: "window" }] : [];
          return [
            { id: "s", type: "string", label: "s", value: s, pointers: ptr, ranges: o.ranges || win, marks: sm },
            { id: "need", type: "map", kind: "counter", label: "need (from t)", entries: [...need.entries()], marks: o.needMarks || {} },
            { id: "have", type: "map", kind: "counter", label: "have (in window, letters of t)", entries: [...need.keys()].map((c) => [c, H(c)]), marks: hm },
            { id: "formed", type: "calc", label: "formed / required", value: `${formed} / ${required}` },
            { id: "best", type: "calc", label: "best", value: bestLen === Infinity ? "none yet" : `"${s.substr(bestL, bestLen)}"` },
          ];
        };

        if (t.length === 0 || s.length < t.length) {
          frame({
            line: 2, title: "No window possible",
            t: t.length === 0 ? "<code>t</code> is empty, so return <code>\"\"</code>." : `<code>s</code> has ${s.length} characters but <code>t</code> has ${t.length}, so no substring of <code>s</code> can hold all of <code>t</code>. Return <code>\"\"</code>.`,
            tip: "Check this first: it also protects the loop from an empty <code>t</code>, where every window would count as valid.",
            vars: { "s.size()": s.length, "t.size()": t.length },
            views: views(),
          });
          return "";
        }

        frame({
          line: [3, 6], title: "Count what t needs",
          t: `Count each character of <b>"${esc(t)}"</b> into <code>need</code>. There are <b>${required}</b> distinct characters, so <code>required = ${required}</code>.`,
          tip: "<code>formed</code> counts distinct characters whose count is fully met, not characters seen. The window is valid exactly when <code>formed == required</code>.",
          vars: { required: required, formed: formed, l: l },
          views: views({ needMarks: Object.fromEntries([...need.keys()].map((c) => [c, "new"])) }),
        });

        let validTip = false, extraTip = false, breakTip = false;
        for (r = 0; r < s.length; r++) {
          const c = s[r];
          have.set(c, H(c) + 1);
          const inT = need.has(c);
          const hit = inT && H(c) === need.get(c);
          if (hit) formed++;
          frame({
            line: [9, 11], title: hit ? `Take ${c}: count met` : `Take ${c}`,
            t: !inT
              ? `${q(c)} at index ${r} is not in <code>t</code>. The window grows, but <code>formed</code> stays ${formed}.`
              : hit
                ? `${q(c)} at index ${r}: <code>have = ${H(c)}</code> now equals <code>need = ${need.get(c)}</code>, so one more character is fully covered. <code>formed = ${formed}</code> of ${required}.`
                : `${q(c)} at index ${r}: <code>have = ${H(c)}</code>, need ${need.get(c)}. ${H(c) > need.get(c) ? "This is an extra copy, so <code>formed</code> does not change." : "Still short, so <code>formed</code> does not change."}`,
            vars: { l: l, r: r, c: c, formed: formed, required: required },
            views: views({ sMarks: { [r]: inT ? "new" : "hot" }, haveMarks: inT ? { [c]: hit ? "new" : (H(c) > need.get(c) ? "good" : "warn") } : {}, windowMark: formed === required ? "good" : "in" }),
            moves: inT ? [{ from: ["s", r], to: ["have", c], label: "+1" }] : undefined,
          });

          while (formed === required) {
            const len = r - l + 1;
            const pre = len < bestLen ? "" : `<code>s[${l}..${r}]</code> is valid, but its length ${len} is not shorter than ${bestLen}. `;
            if (len < bestLen) {
              bestLen = len; bestL = l;
              frame({
                line: 13, title: "Valid: new shortest",
                t: `Every character of <code>t</code> is covered. <code>s[${l}..${r}]</code> = <b>"${esc(s.slice(l, r + 1))}"</b> has length ${len}, the shortest so far. Now try to shrink it.`,
                tip: validTip ? undefined : "For a shortest-window question, record while the window is still valid, inside the <code>while</code>, before each shrink.",
                vars: { l: l, r: r, "r - l + 1": len, bestLen: bestLen, bestL: bestL },
                views: views({ windowMark: "good" }),
              });
              validTip = true;
            }
            const lch = s[l];
            have.set(lch, H(lch) - 1);
            const inT2 = need.has(lch);
            const broke = inT2 && H(lch) < need.get(lch);
            if (broke) formed--;
            const old = l;
            l++;
            let tip;
            if (broke && !breakTip) { tip = "Removing a needed character drops <code>formed</code> below <code>required</code>. The window is no longer valid, so the <code>while</code> stops and <code>r</code> moves on."; breakTip = true; }
            else if (inT2 && !broke && !extraTip) { tip = "The window had an extra copy of this character, so dropping one keeps it valid and the shrink continues."; extraTip = true; }
            frame({
              line: pre ? [13, 17] : [14, 17], title: broke ? `Drop ${lch}: now invalid` : `Drop ${lch}: still valid`,
              t: pre + (!inT2
                ? `${q(lch)} at index ${old} is not needed. Drop it: <code>l = ${l}</code>, and the window stays valid.`
                : broke
                  ? `Drop ${q(lch)} at index ${old}: <code>have = ${H(lch)}</code> falls below <code>need = ${need.get(lch)}</code>, so <code>formed = ${formed}</code>. <code>l = ${l}</code>.`
                  : `Drop ${q(lch)} at index ${old}: <code>have = ${H(lch)}</code> still meets <code>need = ${need.get(lch)}</code>. <code>l = ${l}</code>, and the window stays valid.`),
              tip: tip,
              vars: { l: l, r: r, lc: lch, formed: formed, required: required },
              views: views({ sMarks: { [old]: broke ? "bad" : "dim" }, haveMarks: inT2 ? { [lch]: broke ? "bad" : "good" } : {}, windowMark: broke ? "warn" : "good" }),
              moves: inT2 ? [{ from: ["s", old], to: ["have", lch], label: "-1" }] : undefined,
            });
          }
        }

        const ans = bestLen === Infinity ? "" : s.substr(bestL, bestLen);
        const rr = r; r = null;
        frame({
          line: 20, title: ans ? `Return "${ans.length > 16 ? ans.slice(0, 13) + "..." : ans}"` : "No window: return \"\"",
          t: ans
            ? `<code>r</code> reached the end. The shortest valid window was <code>s[${bestL}..${bestL + bestLen - 1}]</code> = <b>"${esc(ans)}"</b>, length ${bestLen}.`
            : `<code>r</code> reached the end of <code>s</code> (index ${rr - 1}) and the window never covered all of <code>t</code>. Return <code>""</code>.`,
          tip: "O(|s| + |t|) time: each index enters once at <code>r</code> and leaves once at <code>l</code>. O(1) extra space for two 256-entry tables.",
          vars: { bestL: bestL, bestLen: bestLen === Infinity ? "INT_MAX" : bestLen },
          views: views({ ranges: ans ? [{ from: bestL, to: bestL + bestLen - 1, mark: "good", label: "best" }] : [] }),
        });
        if (total > 40) rec.truncated(total - 40);
        return ans;
      },
      expect: [
        [{ s: "ADOBECODEBANC", t: "ABC" }, "BANC"],
        [{ s: "a", t: "a" }, "a"],
        [{ s: "a", t: "aa" }, ""],
        [{ s: "ab", t: "b" }, "b"],
        [{ s: "aa", t: "aa" }, "aa"],
        [{ s: "", t: "a" }, ""],
        [{ s: "abc", t: "d" }, ""],
      ],
    },
  ],

  explain: {
    plain: "A sliding window is a pair of indexes <code>l</code> and <code>r</code> marking a contiguous stretch of an array or string. You move <code>r</code> forward to take in new elements and move <code>l</code> forward to drop old ones, keeping a small summary of what is inside (a count, a sum, a map).",
    spot: [
      "The answer is a <b>contiguous</b> subarray or substring: \"longest\", \"shortest\", \"maximum sum of k consecutive\", \"number of subarrays where…\".",
      "There is a rule about the inside of the stretch: at most k distinct, no repeats, sum at least target, at most k zeros, contains every character of t.",
      "Once a window breaks the rule, every larger window that contains it also breaks it (or the reverse). That one-way behaviour is what lets <code>l</code> only move forward.",
      "A fixed length <code>k</code> is given: \"every block of k\", \"average of each k-length run\". That is the fixed-size window.",
      "The brute force is two nested loops over start and end, O(n²), and the inner loop redoes work the previous step already did.",
    ],
    notWhen: [
      "Numbers can be negative and you need an exact sum (LC 560). Growing the window can lower the sum, so the rule is not one-way. Use prefix sums with a hash map.",
      "The elements need not be contiguous (subsequence, any subset). Think DP or two pointers on sorted data instead.",
    ],
    template: [
      "// Variable-size window: grow on the right, shrink on the left while invalid.",
      "int longestWindow(const vector<int>& a) {",
      "    unordered_map<int, int> count;    // window state",
      "    int l = 0, best = 0;",
      "    for (int r = 0; r < (int)a.size(); r++) {",
      "        count[a[r]]++;                // 1. grow: take a[r] in",
      "        while (count[a[r]] > 1) {     // 2. shrink while invalid",
      "            count[a[l]]--;",
      "            l++;",
      "        }",
      "        best = max(best, r - l + 1);  // 3. window is valid: record it",
      "    }",
      "    return best;",
      "}",
      "",
      "// Fixed-size window of length k: add the new element, drop the one that left.",
      "long long maxSumOfK(const vector<int>& a, int k) {",
      "    long long sum = 0, best = LLONG_MIN;",
      "    for (int r = 0; r < (int)a.size(); r++) {",
      "        sum += a[r];",
      "        if (r >= k) sum -= a[r - k];",
      "        if (r >= k - 1) best = max(best, sum);",
      "    }",
      "    return best;",
      "}",
    ],
    templateNotes: [
      "<code>count</code> (or a sum, or a distinct counter) is the window state. Update it in O(1) when an element enters or leaves.",
      "Step 1 always runs once per <code>r</code>. Step 2 is a <code>while</code>, not an <code>if</code>: one new element may need several removals.",
      "Record the answer after the window is valid again. For \"shortest\" problems, record inside the <code>while</code> instead, just before shrinking.",
      "In the fixed-size version, the element leaving is <code>a[r - k]</code>, and the first full window ends at <code>r = k - 1</code>.",
    ],
    variants: [
      ["Longest valid window", "Shrink while invalid, record after the while loop", "3, 424, 1004, 340"],
      ["Shortest valid window", "Shrink while still valid, record inside the while loop", "76, 209"],
      ["Fixed size k", "Add a[r], drop a[r-k], record once r ≥ k-1", "643, 438, 567"],
      ["Window plus a helper structure", "A monotonic deque or a frequency count gives the window's max or best count in O(1)", "239, 424"],
    ],
    mistakes: [
      "Using <code>if</code> instead of <code>while</code> to shrink. One new element can need several removals before the window is valid.",
      "Recording the answer before the window is valid again, which counts a broken window as the best one.",
      "In the jump-<code>l</code> version of LC 3, forgetting <code>last[c] &gt;= l</code>, so <code>l</code> moves backwards on inputs like <code>\"abba\"</code>.",
      "Off-by-one window length: it is <code>r - l + 1</code>, not <code>r - l</code>.",
      "Applying a shrinking window to sums with negative numbers. The rule is no longer one-way, so moving <code>l</code> can skip the answer.",
      "Rebuilding the window state from scratch each step (for example recounting a map), which brings back the O(n²) cost.",
    ],
    complexity: [
      ["Variable window with a hash map", "O(n)", "O(k) for k distinct keys", "l and r each move forward at most n times, so the while loop runs n times in total, not per step."],
      ["Fixed window of size k", "O(n)", "O(1)", "One add and one remove per step."],
      ["Window with a monotonic deque (LC 239)", "O(n)", "O(k)", "Each index is pushed once and popped at most once."],
      ["Brute force over every start and end", "O(n²) or O(n³)", "O(k)", "Shown only to explain what the window saves."],
    ],
    sayIt: "When I see a question about the longest or shortest contiguous substring or subarray that satisfies some rule, I think sliding window. I keep two indexes, l and r, for the current stretch, plus a small summary of what is inside it, usually a hash map of counts or a running sum. I move r forward one step at a time and add the new element to the summary. If that breaks the rule, I move l forward and remove elements until the rule holds again. For a longest-window question I record the length after the window is valid again; for a shortest-window question I record it while it is still valid, just before shrinking. The reason this is fast is that l and r both only move forward, so each element is added once and removed once. That makes it O(n) time, and the space is whatever the summary needs, often bounded by the alphabet size. The one thing I check first is that the rule is one-way: with negative numbers it is not, and I would switch to prefix sums.",
    followups: [
      ["Why is the nested while loop still O(n)?", "Because l only ever increases and stops at r. Across the whole run it moves at most n times, so the inner loop's total work is n, shared across all steps."],
      ["What if the string can contain any Unicode character?", "Keep the hash map instead of a 128-size array. Space becomes O(distinct characters in the window)."],
      ["How would you return the substring instead of the length?", "Store the l and r of the best window when you update best, then return s.substr(bestL, bestLen)."],
      ["Would this work for the longest subarray with sum at most k if values can be negative?", "No. With negatives, extending can lower the sum, so a broken window can become valid again and moving l can skip the answer. Use prefix sums with a sorted structure or a monotonic deque instead."],
    ],
    rubric: {
      strong: [
        "Named the contiguous-plus-one-way-rule signal and said why two indexes that only move forward are enough.",
        "Wrote clean grow/shrink/record code with the right loop (while, not if) and a correct length formula.",
        "Stated O(n) time with the amortised reason and the space of the window state, and tested an edge case like an empty input or \"abba\".",
      ],
      weak: [
        "Jumped to code without saying what the window state is or when the window is valid.",
        "Shrank with an if, recorded the answer while the window was invalid, or got r - l + 1 wrong.",
        "Claimed O(n²) or O(n) without a reason, or used a window where negative numbers break the rule.",
      ],
    },
  },

  quiz: [
    ["In the jump version of LC 3, why does the code check <code>last[c] &gt;= l</code> before moving <code>l</code>?",
      ["So a copy of c that sits left of the window does not move l backwards", "Because the map can store negative indexes", "To make the loop run in O(log n)", "Because l must always equal r after a repeat"],
      0, "On \"abba\", the second 'a' was last seen at index 0, left of l = 2. Without the check, l would move back to 1 and the answer would wrongly be 3."],
    ["A variable-size window over n elements has a while loop inside the for loop. What is the total time?",
      ["O(n²), because the while loop can run n times on each step", "O(n), because l and r each only move forward, at most n times in total", "O(n log n), because of the hash map", "O(k·n), where k is the window size"],
      1, "The inner loop moves l, and l never goes back. Across the whole run it moves at most n times, so the total work is linear."],
    ["Which problem is NOT a good fit for a shrinking sliding window?",
      ["Longest substring with at most k distinct characters", "Shortest subarray with sum at least target, all numbers positive", "Count subarrays whose sum is exactly k, numbers may be negative", "Longest run of 1s if you may flip at most k zeros"],
      2, "With negative numbers, growing the window can lower the sum, so the rule is not one-way. Use prefix sums and a hash map of counts (LC 560)."],
  ],

  drills: [
    { prompt: "Given a string, return the length of the longest stretch of consecutive characters that uses at most two different letters.",
      answer: "sliding-window", distractors: ["two-pointers", "dp-1d", "prefix-sum-hashing"],
      why: "Longest contiguous stretch with a rule about its contents (at most 2 distinct). Adding a letter can only make it worse, so the window shrinks from the left." },
    { prompt: "Given an array of positive integers and a target, return the length of the shortest contiguous subarray whose sum is at least the target.",
      answer: "sliding-window", distractors: ["prefix-sum-hashing", "binary-search", "greedy"],
      why: "Positive numbers mean the sum only grows when the stretch grows, so you can shrink from the left while the sum is still big enough and record the shortest." },
    { prompt: "Given an array and a number k, return the maximum of every block of k consecutive numbers.",
      answer: "sliding-window", distractors: ["heaps", "stacks-monotonic", "two-pointers"],
      why: "Every block of k consecutive elements is a fixed-size window. A monotonic deque inside the window gives each maximum in O(1)." },
    { prompt: "Given strings s and p, return every index in s where some rearrangement of p starts.",
      answer: "sliding-window", distractors: ["prefix-sum-hashing", "backtracking", "tries"],
      why: "Each candidate is a block of s with length p.size(). Slide a fixed-size window and compare letter counts as one letter enters and one leaves." },
    { prompt: "Given an array of 0s and 1s and a number k, return the longest run of 1s you can get if you may change at most k zeros into ones.",
      answer: "sliding-window", distractors: ["greedy", "dp-1d", "bit-manipulation"],
      why: "Restate it as the longest contiguous stretch with at most k zeros. Count zeros in the window and shrink while there are more than k." },
    { prompt: "Given the price of a stock on each day, return the best profit from buying on one day and selling on a later day.",
      answer: "sliding-window", distractors: ["greedy", "dp-1d", "two-pointers"],
      why: "Keep l at the cheapest day so far and move r forward. When prices[r] is lower than prices[l], the window restarts at r." },
  ],

  flashcards: [
    { id: "sw-variable", front: "Variable-size window with a hash map over n elements: time and space?", back: "O(n) time, because l and r each move forward at most n times. O(k) space for the k distinct keys in the window." },
    { id: "sw-fixed", front: "Fixed-size window of length k: time and space?", back: "O(n) time and O(1) extra space: one add and one remove per step." },
    { id: "sw-deque", front: "Sliding Window Maximum (LC 239) with a monotonic deque: time and space?", back: "O(n) time, since each index is pushed once and popped at most once. O(k) space for the deque." },
    { id: "sw-lc3", front: "Longest Substring Without Repeating Characters (LC 3): time and space?", back: "O(n) time. O(min(n, alphabet)) space for the last-seen map." },
    { id: "sw-lc76", front: "Minimum Window Substring (LC 76): time and space?", back: "O(|s| + |t|) time: each index of s enters and leaves once, plus building t's counts. O(alphabet) space for the counts." },
  ],

  problems: [3, 76, 121, 239, 424],
});
