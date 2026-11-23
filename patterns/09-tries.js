// Pattern 09: Tries. Writer B.
// Demo 1 "implement-trie" (LC 208, ops).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "tries",
  num: 9,
  title: "Tries",
  summary: "Store words as paths of characters in a tree, so words that share a prefix share nodes and any prefix check costs only its own length.",
  tags: ["trie", "prefix tree", "prefix", "autocomplete", "dictionary", "word search"],

  demos: [
    {
      id: "implement-trie",
      title: "Implement Trie (Prefix Tree)",
      lc: 208,
      problem: "Build a trie with <code>insert(word)</code>, <code>search(word)</code> (is the whole word stored?) and <code>startsWith(prefix)</code> (does any stored word start with it?). Words use <code>a</code> to <code>z</code>. <code>insert(\"apple\") search(\"apple\") search(\"app\") startsWith(\"app\") insert(\"app\") search(\"app\")</code> gives <code>[null,true,false,true,null,true]</code>.",
      code: [
        "class Trie {",
        "    struct Node {",
        "        Node* ch[26] = {};",
        "        bool end = false;          // a word ends here",
        "    };",
        "    Node* root;",
        "    Node* walk(const string& s) const {",
        "        Node* cur = root;",
        "        for (char c : s) {",
        "            int i = c - 'a';",
        "            if (!cur->ch[i]) return nullptr;",
        "            cur = cur->ch[i];",
        "        }",
        "        return cur;",
        "    }",
        "public:",
        "    Trie() { root = new Node(); }",
        "    void insert(string word) {",
        "        Node* cur = root;",
        "        for (char c : word) {",
        "            int i = c - 'a';",
        "            if (!cur->ch[i]) cur->ch[i] = new Node();",
        "            cur = cur->ch[i];",
        "        }",
        "        cur->end = true;",
        "    }",
        "    bool search(string word) {",
        "        Node* n = walk(word);",
        "        return n && n->end;",
        "    }",
        "    bool startsWith(string prefix) {",
        "        return walk(prefix) != nullptr;",
        "    }",
        "};",
      ],
      fields: [{ key: "ops", label: "operations", type: "ops", value: "insert(\"apple\") search(\"apple\") search(\"app\") startsWith(\"app\") insert(\"app\") search(\"app\")" }],
      run(input, rec) {
        const ops = input.ops;
        const esc = (x) => String(x).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
        for (const op of ops) {
          if (op.name === "Trie") continue;
          if (!["insert", "search", "startsWith"].includes(op.name)) { rec.error(`Unknown operation "${op.name}". Use insert, search and startsWith.`); return null; }
          if (op.args.length !== 1 || !/^[a-z]*$/.test(String(op.args[0]))) { rec.error(`${op.name} takes one word of lowercase letters a-z, like ${op.name}("app").`); return null; }
        }
        // Node id = "^" + the prefix that leads to it, so the root is "^" and no word can collide with it.
        const idOf = (prefix) => "^" + prefix;
        const nodes = { "^": { id: "^", ch: "", end: false, children: [] } };
        const order = ["^"];
        const out = ops.map(() => "");
        const labels = ops.map((op) => `${op.name}(${op.args.map((a) => `"${a}"`).join(",")})`);
        let shown = 0, hidden = 0;
        const frame = (f) => { if (shown < 40) { rec.frame(f); shown++; } else hidden++; };
        let word = "";

        const views = (k, o) => {
          o = o || {};
          const om = {};
          for (let j = 0; j < ops.length; j++) if (k !== null && j < k) om[j] = "done";
          if (k !== null && k < ops.length) om[k] = "hot";
          return [
            { id: "ops", type: "array", label: "operations", values: labels.slice(),
              pointers: k === null || k >= ops.length ? {} : { op: k }, marks: Object.assign(om, o.opsMarks || {}) },
            { id: "word", type: "string", label: "word being walked", value: word,
              pointers: o.c === undefined ? {} : { c: o.c }, marks: o.wm || {} },
            { id: "trie", type: "trie", label: "trie (ringed = a word ends here)", root: "^",
              nodes: order.map((id) => Object.assign({}, nodes[id], { children: nodes[id].children.slice() })),
              pointers: o.cur === undefined ? {} : { cur: o.cur }, marks: o.tm || {} },
            { id: "out", type: "array", label: "returned", values: out.slice(), marks: o.outMarks || {} },
          ];
        };
        const pathMarks = (prefix, last) => {
          const m = {};
          for (let j = 0; j <= prefix.length; j++) m[idOf(prefix.slice(0, j))] = "path";
          m[idOf(prefix)] = last || "hot";
          return m;
        };
        const show = (x) => (x === null ? "null" : String(x));

        frame({
          line: 17, title: "Trie(): one empty root",
          t: "The trie starts as a single root node with 26 empty child slots, one per letter. The root stands for the empty prefix.",
          tip: "A node does not store its own letter. The letter is which of the 26 slots of the parent points to it, so the path from the root spells the word.",
          vars: { op: "-", nodes: 1 },
          views: views(null),
        });

        let newTip = false, shareTip = false, endTip = false;
        for (let k = 0; k < ops.length; k++) {
          const op = ops[k];
          if (op.name === "Trie") {
            out[k] = null; word = "";
            frame({
              line: 17, title: "Constructor",
              t: "The constructor makes the root. It returns nothing, so its result is <code>null</code>.",
              vars: { op: labels[k], nodes: order.length },
              views: views(k, { outMarks: { [k]: "new" } }),
            });
            continue;
          }
          word = String(op.args[0]);
          const W = esc(word);
          if (op.name === "insert") {
            let prefix = "";
            for (let c = 0; c < word.length; c++) {
              const ch = word[c];
              const next = prefix + ch;
              const exists = Object.prototype.hasOwnProperty.call(nodes, idOf(next));
              if (!exists) {
                nodes[idOf(next)] = { id: idOf(next), ch: ch, end: false, children: [] };
                nodes[idOf(prefix)].children.push(idOf(next));
                order.push(idOf(next));
              }
              prefix = next;
              frame({
                line: exists ? 23 : [22, 23], title: exists ? `'${ch}' exists: step down` : `Create '${ch}', step down`,
                t: exists
                  ? `The slot for <b>'${ch}'</b> under ${prefix.length > 1 ? `<b>"${esc(prefix.slice(0, -1))}"</b>` : "the root"} already exists, because a stored word shares the prefix <b>"${esc(prefix)}"</b>. Just move down.`
                  : `No child for <b>'${ch}'</b> yet, so create one, then move <code>cur</code> down to it. The path from the root now spells <b>"${esc(prefix)}"</b>.`,
                tip: !exists && !newTip ? "Each new node costs one allocation of 26 pointers. Inserting a word of length L is O(L), no matter how many words are stored."
                  : (exists && !shareTip ? "Shared prefixes share nodes. That is where a trie saves space and why a prefix check is cheap." : undefined),
                vars: { op: labels[k], c: ch, i: ch.charCodeAt(0) - 97, nodes: order.length },
                views: views(k, { c: c, cur: idOf(prefix), wm: { [c]: exists ? "in" : "new" }, tm: Object.assign(pathMarks(prefix), { [idOf(prefix)]: exists ? "in" : "new" }) }),
                moves: exists ? undefined : [{ from: ["word", c], to: ["trie", idOf(prefix)], label: ch, mark: "new" }],
              });
              if (exists) shareTip = true; else newTip = true;
            }
            const was = nodes[idOf(prefix)].end;
            nodes[idOf(prefix)].end = true;
            out[k] = null;
            frame({
              line: 25, title: `Mark end of "${word.length > 14 ? word.slice(0, 14) + "…" : word}"`,
              t: was ? `<b>"${W}"</b> was already stored, so <code>end</code> was already true. Nothing changes; insert returns nothing.`
                : `Set <code>end = true</code> on the last node, so the trie knows a whole word <b>"${W}"</b> stops here, not just a prefix.`,
              tip: endTip ? undefined : "Without the end flag, \"app\" and \"apple\" would look the same to <code>search(\"app\")</code>: both paths exist.",
              vars: { op: labels[k], nodes: order.length },
              views: views(k, { cur: idOf(prefix), tm: pathMarks(prefix, "good"), outMarks: { [k]: "new" } }),
            });
            endTip = true;
            continue;
          }
          // search / startsWith both walk.
          let prefix = "", ok = true;
          for (let c = 0; c < word.length; c++) {
            const ch = word[c];
            const next = prefix + ch;
            if (!Object.prototype.hasOwnProperty.call(nodes, idOf(next))) {
              ok = false;
              frame({
                line: 11, title: `No '${ch}': return nullptr`,
                t: `${prefix ? `The node for <b>"${esc(prefix)}"</b>` : "The root"} has no child for <b>'${ch}'</b>, so no stored word starts with <b>"${esc(next)}"</b>. <code>walk</code> returns <code>nullptr</code>.`,
                vars: { op: labels[k], c: ch, i: ch.charCodeAt(0) - 97 },
                views: views(k, { c: c, cur: idOf(prefix), wm: { [c]: "bad" }, tm: pathMarks(prefix, "bad") }),
              });
              break;
            }
            prefix = next;
            frame({
              line: [11, 12], title: `Follow '${ch}'`,
              t: `The child for <b>'${ch}'</b> exists. Move <code>cur</code> down; the path so far spells <b>"${esc(prefix)}"</b>.`,
              vars: { op: labels[k], c: ch, i: ch.charCodeAt(0) - 97 },
              views: views(k, { c: c, cur: idOf(prefix), wm: { [c]: "good" }, tm: pathMarks(prefix) }),
            });
          }
          const endNode = ok ? nodes[idOf(prefix)] : null;
          let res;
          if (op.name === "search") {
            res = !!(endNode && endNode.end);
            out[k] = res;
            frame({
              line: 29, title: `search: ${res}`,
              t: !ok ? `The walk fell off the trie, so <b>"${W}"</b> is not stored: <b>false</b>.`
                : (res ? `The walk reached the last letter and that node has <code>end = true</code>, so <b>"${W}"</b> is a stored word: <b>true</b>.`
                  : `The path <b>"${W}"</b> exists, but its last node has <code>end = false</code>. It is only a prefix of a longer word: <b>false</b>.`),
              vars: { op: labels[k], found: ok, end: !!(endNode && endNode.end), result: res },
              views: views(k, { cur: ok ? idOf(prefix) : undefined, tm: ok ? pathMarks(prefix, res ? "good" : "warn") : {}, outMarks: { [k]: res ? "good" : "bad" } }),
              moves: ok ? [{ from: ["trie", idOf(prefix)], to: ["out", k], label: String(res), mark: res ? "good" : "bad" }] : undefined,
            });
          } else {
            res = ok;
            out[k] = res;
            frame({
              line: 32, title: `startsWith: ${res}`,
              t: ok ? `Every letter of <b>"${W}"</b> was found, so some stored word starts with it: <b>true</b>. The <code>end</code> flag does not matter here.`
                : `The walk fell off the trie, so no stored word starts with <b>"${W}"</b>: <b>false</b>.`,
              vars: { op: labels[k], found: ok, result: res },
              views: views(k, { cur: ok ? idOf(prefix) : undefined, tm: ok ? pathMarks(prefix, "good") : {}, outMarks: { [k]: res ? "good" : "bad" } }),
              moves: ok ? [{ from: ["trie", idOf(prefix)], to: ["out", k], label: String(res), mark: "good" }] : undefined,
            });
          }
        }

        word = "";
        frame({
          line: 34, title: "All operations done",
          t: `Results: <b>[${out.map(show).join(", ")}]</b>. The trie has ${order.length} nodes. Every operation cost O(L) for a word of length L.`,
          tip: "Space is O(total letters × 26) for the child arrays. A hash map per node saves space when the alphabet is large.",
          vars: { nodes: order.length },
          views: views(ops.length, { outMarks: Object.fromEntries(out.map((x, j) => [j, x === null ? "dim" : x ? "good" : "bad"])) }),
        });
        if (hidden) rec.truncated(hidden);
        return out;
      },
      expect: [
        [{ ops: "insert(\"apple\") search(\"apple\") search(\"app\") startsWith(\"app\") insert(\"app\") search(\"app\")" }, [null, true, false, true, null, true]],
        [{ ops: "Trie() insert(\"cat\") startsWith(\"ca\") search(\"ca\") search(\"dog\")" }, [null, null, true, false, false]],
        [{ ops: "search(\"a\") startsWith(\"a\")" }, [false, false]],
        [{ ops: "insert(\"ab\") insert(\"ab\") search(\"ab\") startsWith(\"abc\")" }, [null, null, true, false]],
        [{ ops: "insert(\"to\") insert(\"tea\") insert(\"ten\") startsWith(\"te\") search(\"te\") search(\"ten\")" }, [null, null, null, true, false, true]],
        [{ ops: "insert(\"root\") search(\"roo\") startsWith(\"\") search(\"\")" }, [null, false, true, false]],
      ],
    },
    {
      id: "word-search-ii",
      title: "Word Search II",
      lc: 212,
      problem: "Return every word from <code>words</code> that can be traced on the board through cells joined up, down, left or right, using each cell at most once per word. Board <code>oaan;etae;ihkr;iflv</code> (rows split by <code>;</code>) with <code>oath,pea,eat,rain</code> gives <code>[\"oath\",\"eat\"]</code>.",
      code: [
        "struct Node { Node* ch[26] = {}; string word; };   // word is set at a word's end",
        "void dfs(vector<vector<char>>& b, int r, int c, Node* node, vector<string>& out) {",
        "    if (r < 0 || r >= (int)b.size() || c < 0 || c >= (int)b[0].size()) return;",
        "    char ch = b[r][c];",
        "    if (ch == '#' || !node->ch[ch - 'a']) return;   // used, or prefix not in trie",
        "    node = node->ch[ch - 'a'];",
        "    if (!node->word.empty()) { out.push_back(node->word); node->word.clear(); }",
        "    b[r][c] = '#';                                   // mark the cell as used",
        "    dfs(b, r + 1, c, node, out); dfs(b, r - 1, c, node, out);",
        "    dfs(b, r, c + 1, node, out); dfs(b, r, c - 1, node, out);",
        "    b[r][c] = ch;                                    // undo the mark",
        "}",
        "vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {",
        "    Node* root = new Node();",
        "    for (auto& w : words) {",
        "        Node* cur = root;",
        "        for (char x : w) {",
        "            if (!cur->ch[x - 'a']) cur->ch[x - 'a'] = new Node();",
        "            cur = cur->ch[x - 'a'];",
        "        }",
        "        cur->word = w;",
        "    }",
        "    vector<string> out;",
        "    for (int r = 0; r < (int)board.size(); r++)",
        "        for (int c = 0; c < (int)board[0].size(); c++) dfs(board, r, c, root, out);",
        "    return out;",
        "}",
      ],
      fields: [
        { key: "board", label: "board (rows split by ;)", type: "charGrid", value: "oaan;etae;ihkr;iflv" },
        { key: "words", label: "words", type: "strings", value: "oath,pea,eat,rain" },
      ],
      run(input, rec) {
        const b = input.board.map((row) => row.slice());
        const words = input.words;
        const R = b.length, C = R ? b[0].length : 0;
        const esc = (x) => String(x).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
        if (b.some((row) => row.length !== C)) { rec.error("Every board row must have the same length."); return null; }
        if (b.some((row) => row.some((x) => !/^[a-z]$/.test(x)))) { rec.error("Board cells must be lowercase letters a-z."); return null; }
        if (words.some((w) => !/^[a-z]+$/.test(w))) { rec.error("Words must be non-empty and use lowercase letters a-z."); return null; }
        const idOf = (prefix) => "^" + prefix;
        const nodes = { "^": { id: "^", ch: "", end: false, children: [], word: "" } };
        const order = ["^"];
        const out = [];
        const calls = [];          // active successful dfs calls: {r, c, prefix}
        let shown = 0, hidden = 0;
        const frame = (f) => { if (shown < 40) { rec.frame(f); shown++; } else hidden++; };
        const views = (o) => {
          o = o || {};
          const gm = {};
          calls.forEach((k) => { gm[`${k.r},${k.c}`] = "path"; });
          Object.assign(gm, o.gm || {});
          const arrows = [];
          for (let k = 1; k < calls.length; k++) arrows.push([`${calls[k - 1].r},${calls[k - 1].c}`, `${calls[k].r},${calls[k].c}`]);
          const tm = {};
          if (calls.length) for (let k = 0; k <= calls.length; k++) tm[idOf(calls[calls.length - 1].prefix.slice(0, k))] = "path";
          Object.assign(tm, o.tm || {});
          return [
            { id: "board", type: "grid", label: "board (# = in use on the current path)", cells: b.map((row) => row.slice()),
              rowLabels: Array.from({ length: R }, (_, k) => String(k)), colLabels: Array.from({ length: C }, (_, k) => String(k)),
              marks: gm, arrows: arrows },
            { id: "trie", type: "trie", label: "trie of words (ringed = a word still to find)", root: "^",
              nodes: order.map((id) => ({ id: id, ch: nodes[id].ch, end: nodes[id].word !== "", children: nodes[id].children.slice() })),
              pointers: calls.length ? { node: idOf(calls[calls.length - 1].prefix) } : {}, marks: tm },
            { id: "calls", type: "callstack", label: "dfs calls that matched", frames: calls.map((k) => `dfs(${k.r},${k.c}) "${k.prefix}"`) },
            { id: "out", type: "array", label: "out", values: out.slice(), marks: o.om || {} },
          ];
        };

        // Build the trie, one frame per word.
        let buildTip = false;
        for (const w of words) {
          let cur = "";
          const fresh = [];
          for (const x of w) {
            const next = cur + x;
            if (!nodes[idOf(next)]) {
              nodes[idOf(next)] = { id: idOf(next), ch: x, end: false, children: [], word: "" };
              nodes[idOf(cur)].children.push(idOf(next));
              order.push(idOf(next));
              fresh.push(idOf(next));
            }
            cur = next;
          }
          nodes[idOf(cur)].word = w;
          frame({
            line: 21, title: `Insert "${w.length > 16 ? w.slice(0, 16) + "…" : w}"`,
            t: `Insert <b>"${esc(w)}"</b> into the trie${fresh.length < w.length ? `, reusing ${w.length - fresh.length} node${w.length - fresh.length > 1 ? "s" : ""} it shares with earlier words` : ""}, and store the word at its last node.`,
            tip: buildTip ? undefined : "Every word goes into one trie first. Then a single walk over the board checks all words that share the current prefix at once.",
            vars: { word: w, nodes: order.length },
            views: views({ tm: Object.fromEntries(fresh.map((id) => [id, "new"])) }),
          });
          buildTip = true;
        }

        frame({
          line: [24, 25], title: "Start a DFS from every cell",
          t: `Try every one of the ${R * C} cells as a starting point. A start whose letter is not a first letter in the trie returns at once.`,
          tip: "Pruning is the whole speed-up: the DFS goes only as deep as some word's prefix, not to every path on the board.",
          vars: { R: R, C: C, "out.size()": 0 },
          views: views(),
        });

        let foundTip = false;
        const dfs = (r, c, prefix) => {
          if (r < 0 || r >= R || c < 0 || c >= C) return;
          const ch = b[r][c];
          if (ch === "#" || !nodes[idOf(prefix + ch)]) return;
          prefix += ch;
          const node = nodes[idOf(prefix)];
          const hit = node.word !== "";
          if (hit) { out.push(node.word); node.word = ""; }
          b[r][c] = "#";
          calls.push({ r, c, prefix });
          frame({
            line: [6, 8], title: hit ? `Found "${prefix.length > 18 ? prefix.slice(0, 18) + "…" : prefix}"` : `Step to '${ch}' at ${r},${c}`,
            t: hit
              ? `<b>'${ch}'</b> at <code>(${r},${c})</code> completes <b>"${esc(prefix)}"</b>, a stored word. Add it to <code>out</code> and clear it in the trie so it is not found twice. Mark the cell used.`
              : `<b>'${ch}'</b> at <code>(${r},${c})</code> extends the path to <b>"${esc(prefix)}"</b>, which is a prefix in the trie. Step into that node and mark the cell <code>'#'</code> so this path cannot reuse it.`,
            tip: hit && !foundTip ? "Clearing the word after the first find stops duplicates when another path spells the same word. The search still goes on below, since a longer word may share this prefix." : undefined,
            vars: { r: r, c: c, ch: ch, prefix: prefix, "out.size()": out.length },
            views: views({ gm: { [`${r},${c}`]: hit ? "good" : "hot" }, tm: { [idOf(prefix)]: hit ? "good" : "hot" }, om: hit ? { [out.length - 1]: "new" } : {} }),
            moves: hit ? [{ from: ["board", `${r},${c}`], to: ["out", out.length - 1], label: prefix, mark: "good" }] : [{ from: ["board", `${r},${c}`], to: ["trie", idOf(prefix)], label: ch, mark: "path" }],
          });
          if (hit) foundTip = true;
          dfs(r + 1, c, prefix); dfs(r - 1, c, prefix);
          dfs(r, c + 1, prefix); dfs(r, c - 1, prefix);
          b[r][c] = ch;
          calls.pop();
          frame({
            line: 11, title: `Back out of ${r},${c}`,
            t: `All four neighbours of <code>(${r},${c})</code> have been tried after <b>"${esc(prefix)}"</b>. Put <b>'${ch}'</b> back so other paths can use this cell, and return.`,
            vars: { r: r, c: c, ch: ch, prefix: prefix, "out.size()": out.length },
            views: views({ gm: { [`${r},${c}`]: "dim" } }),
          });
        };
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) dfs(r, c, "");

        frame({
          line: 26, title: "Return out",
          t: out.length ? `Every start was tried. Found <b>[${out.map((w) => `"${esc(w)}"`).join(", ")}]</b>.` : "Every start was tried and no word could be traced, so the answer is <b>[]</b>.",
          tip: "Worst case O(R·C·4·3^(L-1)) for words up to length L: after the first step each cell has at most 3 unused neighbours. The trie usually cuts this down a lot.",
          vars: { "out.size()": out.length },
          views: views({ om: Object.fromEntries(out.map((_, k) => [k, "good"])) }),
        });
        if (hidden) rec.truncated(hidden);
        return out;
      },
      expect: [
        [{ board: "oaan;etae;ihkr;iflv", words: "oath,pea,eat,rain" }, ["oath", "eat"], "set"],
        [{ board: "ab;cd", words: "abcb" }, []],
        [{ board: "a", words: "a" }, ["a"]],
        [{ board: "ab;cd", words: "ab,abd,ca,x" }, ["ab", "abd", "ca"], "set"],
        [{ board: "aa", words: "aa,aaa" }, ["aa"]],
      ],
    },
  ],

  explain: {
    plain: "A trie is a tree where each edge is a letter and each root-to-node path spells a prefix. Words that start the same way share the same first nodes, and a flag on a node marks where a whole word ends.",
    spot: [
      "Many queries of the form \"does any word start with this prefix?\" or autocomplete suggestions.",
      "Search a grid or a long text for many dictionary words at once (LC 212): one walk can check every word sharing the current prefix.",
      "Wildcard lookups like <code>\"b.d\"</code> where a dot matches any letter (LC 211).",
      "Replace or match by the shortest or longest stored prefix (LC 648 Replace Words, longest common prefix).",
      "Maximum XOR of two numbers: a trie over the bits of each number (LC 421).",
    ],
    notWhen: [
      "You only need exact word lookups: an <code>unordered_set&lt;string&gt;</code> is simpler and uses less memory.",
      "You need sorted order, ranges or rank queries over the words: a sorted array with binary search or a <code>set</code> fits better.",
      "There is a single pattern to find in one text: use a direct scan or KMP instead of building a trie.",
    ],
    template: [
      "struct TrieNode {",
      "    TrieNode* ch[26] = {};",
      "    bool end = false;",
      "};",
      "",
      "void insertWord(TrieNode* root, const string& w) {",
      "    TrieNode* cur = root;",
      "    for (char c : w) {",
      "        int i = c - 'a';",
      "        if (!cur->ch[i]) cur->ch[i] = new TrieNode();",
      "        cur = cur->ch[i];",
      "    }",
      "    cur->end = true;",
      "}",
      "",
      "// Returns the node at the end of s, or nullptr if s is not a prefix of any word.",
      "TrieNode* walkTo(TrieNode* root, const string& s) {",
      "    TrieNode* cur = root;",
      "    for (char c : s) {",
      "        cur = cur->ch[c - 'a'];",
      "        if (!cur) return nullptr;",
      "    }",
      "    return cur;",
      "}",
    ],
    templateNotes: [
      "A node holds 26 child pointers and an end flag. Its letter is implied by which slot of the parent points to it.",
      "Insert creates a node only when the slot is empty, so shared prefixes reuse nodes.",
      "One walk answers both questions: a non-null result means the prefix exists; its <code>end</code> flag says whether the whole word does.",
      "For a large or unknown alphabet, use <code>unordered_map&lt;char, TrieNode*&gt;</code> instead of the fixed array.",
    ],
    variants: [
      ["Prefix tree with end flags", "Insert, search, startsWith in O(L)", "208, 14"],
      ["Trie plus grid DFS", "Walk the board and the trie together; prune when the prefix is not in the trie", "212, 79"],
      ["Wildcard search", "On a dot, try every child with DFS", "211"],
      ["Bitwise trie", "Insert numbers bit by bit from the top; greedily take the opposite bit", "421"],
    ],
    mistakes: [
      "Forgetting the end flag, so <code>search(\"app\")</code> returns true after only <code>insert(\"apple\")</code>.",
      "Making <code>startsWith</code> check the end flag. A prefix exists whenever the walk does not fall off.",
      "Creating a new node even when the child already exists, which overwrites another word's subtree.",
      "Indexing with <code>c - 'a'</code> on input that is not lowercase a-z. Validate, or use a map for other characters.",
      "In LC 212, not removing a word once found, so the same word is added once per path that spells it.",
      "Rebuilding or rescanning the word list per query. Build the trie once; each query then costs only its own length.",
    ],
    complexity: [
      ["Insert / search / startsWith", "O(L)", "O(L × 26) per insert, worst case", "One step per letter. New nodes are made only for letters not already shared."],
      ["Build from N words, total length S", "O(S)", "O(S × 26)", "Each letter creates at most one node with 26 slots."],
      ["Word Search II (board R×C, word length up to L)", "O(R·C·4·3^(L-1))", "O(S)", "DFS from every cell, at most 3 new directions per step; the trie prunes most paths early."],
    ],
    sayIt: "With many words and repeated prefix questions, I use a trie. Each node has 26 child slots and a flag that says a word ends there. To insert, I walk the letters from the root, create a child only if its slot is empty, and set the end flag on the last node. To search, I do the same walk without creating anything. If I fall off, the prefix is not there. If I reach the end, startsWith is true, and search is true only if the end flag is set. That flag is the detail people forget: without it, app looks stored as soon as apple is. Every operation is O(L) for a word of length L, however many words are stored. Space is at most the total letters times the alphabet size, so for big alphabets I use a hash map per node. For grid word search I walk the trie and the board together and stop as soon as the prefix is not in the trie.",
    followups: [
      ["How would you support search with '.' matching any letter (LC 211)?", "Use DFS on the trie: at a normal letter follow one child, at a dot try all non-null children. Worst case grows with the number of dots."],
      ["How do you return the top 3 suggestions for a prefix (LC 1268)?", "Walk to the prefix node, then DFS its subtree in letter order and stop after 3 words. Or store the best 3 at each node during insert."],
      ["How would you delete a word?", "Clear its end flag. Then, on the way back up, free nodes that have no children and no end flag, so other words' paths stay intact."],
      ["Why not just use a hash set of all prefixes?", "It works for prefix checks but stores every prefix of every word separately, O(S × L) characters. A trie shares them."],
    ],
    rubric: {
      strong: [
        "Explained why a trie fits (many words, prefix queries) and described the node: child slots plus an end flag.",
        "Wrote insert, search and startsWith with one shared walk, creating nodes only when missing.",
        "Gave O(L) per operation and the space cost, and tested a word that is only a prefix of a stored word.",
      ],
      weak: [
        "Used a list or set and rescanned words per query without noticing the shared-prefix structure.",
        "Forgot the end flag, or checked it in startsWith, or overwrote existing children.",
        "Could not state the time per operation or why it does not depend on the number of stored words.",
      ],
    },
  },

  quiz: [
    ["After <code>insert(\"apple\")</code> only, what does <code>search(\"app\")</code> return, and why?",
      ["true, because the path a-p-p exists", "false, because the node for the last 'p' does not have end = true", "true, because startsWith(\"app\") is true", "It crashes, because \"app\" was never inserted"],
      1, "The path exists, but no word was marked as ending at it. search needs both the path and the end flag; startsWith needs only the path."],
    ["What is the time to insert a word of length L into a trie that already holds N words?",
      ["O(N)", "O(N × L)", "O(L)", "O(log N)"],
      2, "The walk takes one step per letter of the word. The other N words never get looked at."],
    ["Which problem is the <b>weakest</b> fit for a trie?",
      ["Check whether a single word is in a fixed dictionary, once", "Autocomplete for every prefix a user types", "Find all dictionary words that appear in a letter grid", "Count stored words that start with a given prefix"],
      0, "One exact lookup needs only a hash set. A trie pays off when many queries share prefixes."],
  ],

  drills: [
    { prompt: "Design a structure that adds words and answers queries like \"b.d\", where each dot can match any one letter.",
      answer: "tries", distractors: ["backtracking", "prefix-sum-hashing", "dp-2d"],
      why: "Stored words plus letter-by-letter matching: a trie, with a DFS over all children when the query has a dot." },
    { prompt: "Given a board of letters and a list of words, return every word that can be traced through adjacent cells without reusing a cell.",
      answer: "tries", distractors: ["backtracking", "graphs-bfs-dfs", "dp-2d"],
      why: "Many words searched at once. Walking a trie alongside the grid DFS checks every word that shares the current prefix and prunes dead paths." },
    { prompt: "As a user types each character of a search box, return up to three product names that start with what they have typed so far.",
      answer: "tries", distractors: ["binary-search", "heaps", "sliding-window"],
      why: "Repeated prefix queries over a fixed word list: walk one more trie node per typed letter and list words below it." },
    { prompt: "Given a list of root words and a sentence, replace each word in the sentence with the shortest root that starts it.",
      answer: "tries", distractors: ["prefix-sum-hashing", "two-pointers", "greedy"],
      why: "Shortest stored prefix of each word: walk the trie along the word and stop at the first node with the end flag." },
    { prompt: "Given an array of non-negative integers, return the largest value of a XOR b over all pairs.",
      answer: "tries", distractors: ["bit-manipulation", "greedy", "two-pointers"],
      why: "Insert each number's bits from the top into a binary trie, then for each number greedily follow the opposite bit." },
    { prompt: "Build a dictionary that supports adding a word, checking whether a word was added, and checking whether any added word begins with a given string.",
      answer: "tries", distractors: ["prefix-sum-hashing", "binary-search", "math-design"],
      why: "Exact-word and prefix lookups together are the textbook trie: one walk answers both, with an end flag for whole words." },
  ],

  flashcards: [
    { id: "tri-ops", front: "Trie insert, search and startsWith for a word of length L: time?", back: "O(L) each, independent of how many words are stored." },
    { id: "tri-space", front: "Trie space for N words with total length S over a 26-letter alphabet?", back: "O(S × 26) worst case: at most one node per letter, each with 26 child pointers. Shared prefixes reduce it." },
    { id: "tri-end", front: "Why does a trie node need an end flag?", back: "To tell a stored word from a prefix of a longer one. Without it, inserting \"apple\" makes search(\"app\") true." },
    { id: "tri-lc212", front: "Word Search II (LC 212) with a trie: time and space?", back: "O(R·C·4·3^(L-1)) time in the worst case, usually far less with pruning. O(S) space for the trie, plus O(L) recursion depth." },
    { id: "tri-map", front: "When should trie children be a hash map instead of a 26-slot array?", back: "When the alphabet is large or unknown (Unicode, mixed case). It saves space at the cost of slower child lookups." },
  ],

  problems: [208, 212],
});
