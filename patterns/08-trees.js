// Pattern 08: Trees (DFS/BFS). Writer B.
// Demo 1 "level-order" (LC 102), demo 2 "lowest-common-ancestor" (LC 236).
// Trees are typed in LeetCode's level-order form, e.g. 3,9,20,null,null,15,7.
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "trees",
  num: 8,
  title: "Trees (DFS/BFS)",
  summary: "Visit every node once, either depth-first with recursion (each call returns a fact about its subtree) or breadth-first with a queue (one level at a time).",
  tags: ["binary tree", "recursion", "dfs", "bfs", "level order", "ancestor", "subtree"],

  demos: [
    {
      id: "level-order",
      title: "Binary Tree Level Order Traversal",
      lc: 102,
      problem: "Return the node values level by level, left to right. The tree <code>3,9,20,null,null,15,7</code> gives <code>[[3],[9,20],[15,7]]</code>. Type the tree in LeetCode's level-order form.",
      code: [
        "vector<vector<int>> levelOrder(TreeNode* root) {",
        "    vector<vector<int>> out;",
        "    if (!root) return out;",
        "    queue<TreeNode*> q;",
        "    q.push(root);",
        "    while (!q.empty()) {",
        "        int sz = (int)q.size();         // nodes on this level",
        "        vector<int> level;",
        "        for (int i = 0; i < sz; i++) {",
        "            TreeNode* n = q.front(); q.pop();",
        "            level.push_back(n->val);",
        "            if (n->left) q.push(n->left);",
        "            if (n->right) q.push(n->right);",
        "        }",
        "        out.push_back(level);",
        "    }",
        "    return out;",
        "}",
      ],
      fields: [{ key: "root", label: "root (level order)", type: "strings", value: "3,9,20,null,null,15,7" }],
      run(input, rec) {
        // Build the tree from LeetCode's level-order tokens. Node ids are "n" + token index.
        const toks = input.root;
        const nodes = [], byId = {};
        let root = null;
        const isNull = (s) => s === "null" || s === "";
        for (const s of toks) if (!isNull(s) && !/^[-+]?\d+$/.test(s)) { rec.error(`"${s}" is not a number or null.`); return null; }
        if (toks.length && !isNull(toks[0])) {
          const mk = (i) => { const n = { id: "n" + i, val: parseInt(toks[i], 10), left: null, right: null }; nodes.push(n); byId[n.id] = n; return n; };
          root = mk(0).id;
          const bq = [root];
          let i = 1;
          while (bq.length && i < toks.length) {
            const p = byId[bq.shift()];
            if (i < toks.length && !isNull(toks[i])) { p.left = mk(i).id; bq.push(p.left); }
            i++;
            if (i < toks.length && !isNull(toks[i])) { p.right = mk(i).id; bq.push(p.right); }
            i++;
          }
          for (; i < toks.length; i++) if (!isNull(toks[i])) { rec.error(`Value ${toks[i]} has no parent to hang from.`); return null; }
        }

        const out = [];
        let level = [];
        const q = [];
        const seen = new Set();
        let shown = 0, hidden = 0;
        const frame = (f) => { if (shown < 40) { rec.frame(f); shown++; } else hidden++; };
        const views = (o) => {
          o = o || {};
          const tm = {};
          for (const id of seen) tm[id] = "done";
          for (const id of q) tm[id] = "path";
          Object.assign(tm, o.tm || {});
          return [
            { id: "tree", type: "tree", label: "tree", nodes: nodes.map((n) => Object.assign({}, n)), root: root, marks: tm },
            { id: "q", type: "queue", label: "q (front on the left)", items: q.map((id) => String(byId[id].val)), marks: o.qm || {} },
            { id: "level", type: "array", label: "level", values: level.slice(), marks: o.lm || {} },
            { id: "out", type: "array", label: "out", values: out.map((l) => `[${l.join(",")}]`), marks: o.om || {} },
          ];
        };

        if (!root) {
          frame({
            line: 2, title: "Empty answer list",
            t: "Start with an empty <code>out</code>. Each finished level will be appended to it.",
            vars: { "q.size()": 0 },
            views: views(),
          });
          frame({
            line: 3, title: "Empty tree: return []",
            t: "The root is null, so there are no levels. Return the empty list <b>[]</b>.",
            tip: "Check for an empty tree first. Pushing a null root would make the loop read <code>n-&gt;val</code> on a null pointer.",
            vars: { "q.size()": 0 },
            views: views(),
          });
          return out;
        }

        q.push(root);
        frame({
          line: 5, title: "Queue holds the root",
          t: `Push the root, <b>${byId[root].val}</b>. The queue always holds nodes in the order we must visit them: this level first, then the next.`,
          tip: "A queue is first-in first-out, so every node of one level leaves before any child it added. That is what makes the visit go level by level.",
          vars: { "q.size()": 1 },
          views: views({ tm: { [root]: "new" }, qm: { 0: "new" } }),
          moves: [{ from: ["tree", root], to: ["q", 0], label: String(byId[root].val), mark: "new" }],
        });

        let depth = 0, sizeTip = false, childTip = false;
        while (q.length) {
          const sz = q.length;
          level = [];
          frame({
            line: [7, 8], title: `Level ${depth}: sz = ${sz}`,
            t: `The queue holds exactly the ${sz} node${sz > 1 ? "s" : ""} of level ${depth}: [${q.map((id) => byId[id].val).join(", ")}]. Freeze <code>sz = ${sz}</code> so the loop takes only these, even as their children join the back.`,
            tip: sizeTip ? undefined : "Read <code>q.size()</code> once, before the inner loop. Reading it inside would also count the children pushed during this level.",
            vars: { level: depth, sz: sz, "q.size()": q.length },
            views: views({ qm: Object.fromEntries(q.map((_, k) => [k, "hot"])) }),
          });
          sizeTip = true;
          for (let i = 0; i < sz; i++) {
            const id = q.shift();
            const n = byId[id];
            seen.add(id);
            level.push(n.val);
            frame({
              line: [10, 11], title: `Pop ${n.val}`,
              t: `Take <b>${n.val}</b> from the front of the queue and add it to this level: <code>level = [${level.join(", ")}]</code>.`,
              vars: { level: depth, i: i, sz: sz, "n->val": n.val },
              views: views({ tm: { [id]: "hot" }, lm: { [level.length - 1]: "new" } }),
              moves: [{ from: ["q", 0], to: ["level", level.length - 1], label: String(n.val), mark: "new" }],
            });
            const kids = [n.left, n.right].filter((c) => c !== null);
            const before = q.length;
            for (const c of kids) q.push(c);
            const tm = { [id]: "hot" }, qm = {};
            kids.forEach((c, k) => { tm[c] = "new"; qm[before + k] = "new"; });
            frame({
              line: [12, 13], title: kids.length ? `Queue ${kids.length} child${kids.length > 1 ? "ren" : ""}` : `${n.val} is a leaf`,
              t: kids.length
                ? `Push ${kids.map((c) => `<b>${byId[c].val}</b>`).join(" and ")} to the back. ${kids.length > 1 ? "They are" : "It is"} on level ${depth + 1}, so ${kids.length > 1 ? "they wait" : "it waits"} behind the rest of level ${depth}.`
                : `<b>${n.val}</b> has no children, so nothing joins the queue.`,
              tip: kids.length && !childTip ? "Left child first, then right. That order is what makes each level come out left to right." : undefined,
              vars: { level: depth, i: i, sz: sz, "q.size()": q.length },
              views: views({ tm: tm, qm: qm }),
              moves: kids.map((c, k) => ({ from: ["tree", c], to: ["q", before + k], label: String(byId[c].val), mark: "new" })),
            });
            if (kids.length) childTip = true;
          }
          out.push(level.slice());
          frame({
            line: 15, title: `Level ${depth} done`,
            t: `${sz > 1 ? `All ${sz} nodes` : "The only node"} of level ${depth} ${sz > 1 ? "are" : "is"} out. Append <code>[${level.join(", ")}]</code> to <code>out</code>.`,
            vars: { level: depth, "out.size()": out.length, "q.size()": q.length },
            views: views({ om: { [out.length - 1]: "new" } }),
            moves: [{ from: ["level", 0], to: ["out", out.length - 1], label: `[${level.join(",")}]`, mark: "new" }],
          });
          depth++;
        }

        frame({
          line: 17, title: "Return out",
          t: `The queue is empty, so every node was visited once. Answer: <b>[${out.map((l) => `[${l.join(",")}]`).join(", ")}]</b>.`,
          tip: "O(n) time. The queue holds at most one level plus part of the next, so space is O(w), the widest level.",
          vars: { "out.size()": out.length, "q.size()": 0 },
          views: views({ om: Object.fromEntries(out.map((_, k) => [k, "good"])) }),
        });
        if (hidden) rec.truncated(hidden);
        return out;
      },
      expect: [
        [{ root: "3,9,20,null,null,15,7" }, [[3], [9, 20], [15, 7]]],
        [{ root: "1" }, [[1]]],
        [{ root: "" }, []],
        [{ root: "1,2,3,4,null,null,5" }, [[1], [2, 3], [4, 5]]],
        [{ root: "1,2,null,3,null,4" }, [[1], [2], [3], [4]]],
        [{ root: "[-1,0,null,7]" }, [[-1], [0], [7]]],
      ],
    },
    {
      id: "lowest-common-ancestor",
      title: "Lowest Common Ancestor of a Binary Tree",
      lc: 236,
      problem: "Given a tree and two values <code>p</code> and <code>q</code> that are both in it, return the lowest node that has both below it (a node counts as below itself). Tree <code>3,5,1,6,2,0,8,null,null,7,4</code>, <code>p = 5</code>, <code>q = 1</code> gives <code>3</code>.",
      code: [
        "TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {",
        "    if (!root || root == p || root == q) return root;",
        "    TreeNode* L = lowestCommonAncestor(root->left, p, q);",
        "    TreeNode* R = lowestCommonAncestor(root->right, p, q);",
        "    if (L && R) return root;      // p and q split here",
        "    return L ? L : R;             // both on one side, or neither",
        "}",
      ],
      fields: [
        { key: "root", label: "root (level order)", type: "strings", value: "3,5,1,6,2,0,8,null,null,7,4" },
        { key: "p", label: "p", type: "int", value: "5" },
        { key: "q", label: "q", type: "int", value: "1" },
      ],
      run(input, rec) {
        const toks = input.root;
        const nodes = [], byId = {};
        let root = null;
        const isNull = (s) => s === "null" || s === "";
        for (const s of toks) if (!isNull(s) && !/^[-+]?\d+$/.test(s)) { rec.error(`"${s}" is not a number or null.`); return null; }
        if (toks.length && !isNull(toks[0])) {
          const mk = (i) => { const n = { id: "n" + i, val: parseInt(toks[i], 10), left: null, right: null }; nodes.push(n); byId[n.id] = n; return n; };
          root = mk(0).id;
          const bq = [root];
          let i = 1;
          while (bq.length && i < toks.length) {
            const par = byId[bq.shift()];
            if (i < toks.length && !isNull(toks[i])) { par.left = mk(i).id; bq.push(par.left); }
            i++;
            if (i < toks.length && !isNull(toks[i])) { par.right = mk(i).id; bq.push(par.right); }
            i++;
          }
          for (; i < toks.length; i++) if (!isNull(toks[i])) { rec.error(`Value ${toks[i]} has no parent to hang from.`); return null; }
        }
        const vals = nodes.map((n) => n.val);
        if (new Set(vals).size !== vals.length) { rec.error("Node values must be unique, so p and q name one node each."); return null; }
        const find = (v) => { const n = nodes.find((x) => x.val === v); return n ? n.id : null; };
        const p = find(input.p), q = find(input.q);
        if (p === null || q === null) { rec.error("Both p and q must be values in the tree."); return null; }

        const stack = [];
        const ret = {};      // node id -> "hit" (returned a node) or "miss" (returned null)
        let last = "-";
        let shown = 0, hidden = 0;
        const frame = (f) => { if (shown < 40) { rec.frame(f); shown++; } else hidden++; };
        const v = (id) => (id === null ? "null" : String(byId[id].val));
        const views = (o) => {
          o = o || {};
          const tm = {};
          for (const [id, r] of Object.entries(ret)) tm[id] = r === "hit" ? "good" : "dim";
          for (const s of stack) tm[s.id] = "path";
          Object.assign(tm, o.tm || {});
          const cm = {};
          if (stack.length) cm[stack.length - 1] = "hot";
          Object.assign(cm, o.cm || {});
          return [
            { id: "tree", type: "tree", label: "tree", nodes: nodes.map((n) => Object.assign({}, n)), root: root,
              pointers: { p: p, q: q }, marks: tm },
            { id: "calls", type: "callstack", label: "call stack (newest on top)",
              frames: stack.map((s) => `lca(${v(s.id)})` + (s.L !== undefined ? ` L=${v(s.L)}` : "") + (s.R !== undefined ? ` R=${v(s.R)}` : "")), marks: cm },
            { id: "ret", type: "calc", label: "last returned", value: last },
          ];
        };

        let earlyTip = false, missTip = false, splitTip = false;
        const lca = (id) => {
          // Only called with a real node; null children are shown on the parent's line 3 or 4.
          stack.push({ id });
          if (id === p || id === q) {
            last = v(id);
            ret[id] = "hit";
            frame({
              line: 2, title: `lca(${v(id)}): found ${id === p ? "p" : "q"}`,
              t: `Node <b>${v(id)}</b> is ${id === p && id === q ? "both p and q" : id === p ? "p" : "q"}, so return it right away without looking below it.`,
              tip: earlyTip ? undefined : `If the other target is below ${v(id)}, then ${v(id)} is the answer anyway, so there is no need to search further down.`,
              vars: { root: v(id), returns: v(id) },
              views: views({ tm: { [id]: "good" }, cm: { [stack.length - 1]: "good" } }),
            });
            earlyTip = true;
            stack.pop();
            return id;
          }
          frame({
            line: 2, title: `Call lca(${v(id)})`,
            t: `Node <b>${v(id)}</b> is neither p nor q. Ask the left and right subtrees what they found.`,
            vars: { root: v(id) },
            views: views({ tm: { [id]: "hot" } }),
          });
          const top = stack[stack.length - 1];
          const n = byId[id];
          const side = (child, lineNo, key, name) => {
            let r = null;
            if (child === null) {
              top[key] = null;
              frame({
                line: lineNo, title: `${key} = null (no ${name} child)`,
                t: `${v(id)} has no ${name} child. The call <code>lca(nullptr)</code> returns null at once, so <code>${key} = null</code>.`,
                vars: { root: v(id), [key]: "null" },
                views: views({ tm: { [id]: "hot" } }),
              });
              return null;
            }
            r = lca(child);
            top[key] = r;
            const miss = r === null;
            frame({
              line: lineNo, title: `${key} = ${v(r)}`,
              t: miss ? `The ${name} subtree of ${v(id)} holds neither p nor q, so <code>${key} = null</code>.`
                : `The ${name} subtree of ${v(id)} sent back <b>${v(r)}</b>, so <code>${key} = ${v(r)}</code>.`,
              tip: miss && !missTip ? "A null return means \"nothing here\". A node return means \"I found p, q, or their meeting point\". That one value is all a parent needs." : undefined,
              vars: { root: v(id), [key]: v(r) },
              views: views({ tm: { [id]: "hot", [child]: miss ? "dim" : "good" } }),
              moves: miss ? undefined : [{ from: ["tree", r], to: ["calls", stack.length - 1], label: v(r), mark: "good" }],
            });
            if (miss) missTip = true;
            return r;
          };
          const L = side(n.left, 3, "L", "left");
          const R = side(n.right, 4, "R", "right");
          if (L !== null && R !== null) {
            last = v(id);
            ret[id] = "hit";
            frame({
              line: 5, title: `Split at ${v(id)}: return it`,
              t: `Both sides found something: <code>L = ${v(L)}</code> and <code>R = ${v(R)}</code>. p and q sit in different subtrees of <b>${v(id)}</b>, so ${v(id)} is their lowest common ancestor.`,
              tip: splitTip ? undefined : "This is the only place a new answer is made. Every node above just passes it up, because only one of its sides is non-null.",
              vars: { root: v(id), L: v(L), R: v(R), returns: v(id) },
              views: views({ tm: { [id]: "good" }, cm: { [stack.length - 1]: "good" } }),
            });
            splitTip = true;
            stack.pop();
            return id;
          }
          const res = L !== null ? L : R;
          last = v(res);
          ret[id] = res === null ? "miss" : "hit";
          frame({
            line: 6, title: `${v(id)} returns ${v(res)}`,
            t: res === null ? `Neither side found anything, so <b>${v(id)}</b> returns null.`
              : `Only the ${L !== null ? "left" : "right"} side found something, so pass <b>${v(res)}</b> up unchanged.`,
            vars: { root: v(id), L: v(L), R: v(R), returns: v(res) },
            views: views({ tm: { [id]: res === null ? "dim" : "in" }, cm: { [stack.length - 1]: res === null ? "dim" : "in" } }),
          });
          stack.pop();
          return res;
        };

        const ans = lca(root);
        frame({
          line: 7, title: `Answer: ${v(ans)}`,
          t: `The first call returned <b>${v(ans)}</b>: the lowest node with both ${v(p)} and ${v(q)} at or below it.`,
          tip: "O(n) time, since each node is visited at most once. O(h) space for the call stack, where h is the tree height.",
          vars: { p: v(p), q: v(q), answer: v(ans) },
          views: views({ tm: { [ans]: "good" } }),
        });
        if (hidden) rec.truncated(hidden);
        return byId[ans].val;
      },
      expect: [
        [{ root: "3,5,1,6,2,0,8,null,null,7,4", p: "5", q: "1" }, 3],
        [{ root: "3,5,1,6,2,0,8,null,null,7,4", p: "5", q: "4" }, 5],
        [{ root: "3,5,1,6,2,0,8,null,null,7,4", p: "7", q: "8" }, 3],
        [{ root: "3,5,1,6,2,0,8,null,null,7,4", p: "6", q: "4" }, 5],
        [{ root: "1,2", p: "1", q: "2" }, 1],
        [{ root: "1", p: "1", q: "1" }, 1],
      ],
    },
  ],

  explain: {
    plain: "A tree problem is usually solved by visiting every node once. Depth-first search (DFS) uses recursion: each call handles one node and returns a fact about its subtree, such as its height or whether it contains a target. Breadth-first search (BFS) uses a queue and visits the tree one level at a time.",
    spot: [
      "The input is a binary tree or an n-ary tree, and the answer depends on subtrees: height, balance, path sums, a value found below.",
      "\"Level by level\", \"each row\", \"right side view\", \"minimum depth\": that is BFS with a queue and a frozen level size.",
      "\"Ancestor\", \"path between two nodes\", \"diameter\": a post-order DFS where each node combines what its children returned.",
      "A rule that must hold for every node against everything above it (valid BST): pass bounds down as parameters.",
      "Turn a tree into a string and back: a pre-order or level-order walk with null markers.",
    ],
    notWhen: [
      "The structure has cycles or shared children: it is a graph, so you need a visited set (BFS/DFS on graphs).",
      "You need prefix lookups on strings: a trie is a tree, but the work is walking characters, not visiting all nodes.",
      "You need the k smallest values in a stream: a heap keeps them without building a tree yourself.",
    ],
    template: [
      "struct TreeNode { int val; TreeNode *left, *right; };",
      "",
      "// DFS: each call returns a fact about its subtree (here, the height).",
      "int height(TreeNode* n) {",
      "    if (!n) return 0;                        // base case: empty subtree",
      "    int L = height(n->left);                 // ask the children",
      "    int R = height(n->right);",
      "    return 1 + max(L, R);                    // combine at the parent",
      "}",
      "",
      "// BFS: one level at a time with a queue.",
      "int countLevels(TreeNode* root) {",
      "    if (!root) return 0;",
      "    queue<TreeNode*> q;",
      "    q.push(root);",
      "    int levels = 0;",
      "    while (!q.empty()) {",
      "        int sz = (int)q.size();              // freeze this level's width",
      "        for (int i = 0; i < sz; i++) {",
      "            TreeNode* n = q.front(); q.pop();",
      "            if (n->left) q.push(n->left);",
      "            if (n->right) q.push(n->right);",
      "        }",
      "        levels++;",
      "    }",
      "    return levels;",
      "}",
    ],
    templateNotes: [
      "Every DFS starts with the null base case. Get it right first: what does an empty subtree return?",
      "Post-order (children first, then combine) answers questions about subtrees: height, diameter, LCA, max path sum.",
      "Pre-order with parameters passes context down: bounds for a valid BST, the path sum so far, the current depth.",
      "In BFS, read <code>q.size()</code> once per level before the inner loop, so children pushed during the level are not counted in it.",
    ],
    variants: [
      ["Post-order: combine children", "Each call returns a value its parent combines", "104, 124, 236, 543"],
      ["Pre-order: pass bounds or state down", "Carry limits or a running total as parameters", "98, 112, 226"],
      ["BFS by level", "Queue plus a frozen level size", "102, 199, 111"],
      ["Serialize with null markers", "Pre-order or level order, write # for null", "297, 449"],
    ],
    mistakes: [
      "Forgetting the null base case, then reading <code>n-&gt;val</code> on a null child.",
      "Validating a BST by comparing each node only with its own children. A grandchild can still break the rule; pass min and max bounds down instead.",
      "In BFS, using <code>q.size()</code> in the inner loop condition, so the loop eats into the next level.",
      "In max path sum (LC 124), returning the best path through both children to the parent. A parent can only extend one side; record the two-sided path in a global best.",
      "Assuming the tree is balanced. Recursion depth is the height, which is n for a stick-shaped tree, and can overflow the stack for very deep trees.",
      "Recomputing a subtree fact inside a loop (calling <code>height</code> at every node from the top), which turns O(n) into O(n²).",
    ],
    complexity: [
      ["DFS (recursive)", "O(n)", "O(h)", "Each node is visited once; the call stack is as deep as the tree height h (log n balanced, n worst case)."],
      ["BFS (queue)", "O(n)", "O(w)", "Each node enters and leaves the queue once; the queue holds at most about one level, width w."],
      ["Recomputing heights from every node", "O(n²) worst case", "O(h)", "Each call rescans its whole subtree. Return the height with the answer instead."],
    ],
    sayIt: "With a tree, I first decide whether the answer is about subtrees or about levels. If it is about levels, like level order or the right side view, I use BFS: a queue, and at the start of each level I freeze its size so I process exactly those nodes and push their children for the next round. If it is about subtrees, I use recursive DFS and decide what each call returns. For lowest common ancestor, a call returns null if its subtree holds neither target, the target itself if it finds one, and the current node if the two targets come back from different sides. I always write the null base case first. Both approaches visit every node once, so time is O(n). DFS space is the height of the tree for the call stack, which is n for a skewed tree. BFS space is the width of the widest level. I test an empty tree, a single node and a stick-shaped tree.",
    followups: [
      ["How would you return the right side view (LC 199)?", "Run the same BFS and keep the last value of each level, or do a DFS that visits right first and records the first node seen at each new depth."],
      ["What if the tree is a BST?", "Use the ordering: if both values are smaller than the node go left, if both are larger go right, otherwise this node is the LCA. O(h) with no recursion needed."],
      ["What if p or q might not be in the tree?", "Count how many targets were actually found during the DFS and return null unless both were seen, instead of returning early at the first match."],
      ["How do you avoid stack overflow on a very deep tree?", "Use an explicit stack for DFS, or BFS. The work is the same; only the memory moves from the call stack to the heap."],
    ],
    rubric: {
      strong: [
        "Chose DFS or BFS for a stated reason and said what each recursive call returns or what the queue holds at the start of a level.",
        "Wrote the null base case first, kept the level size frozen in BFS, and combined child results correctly.",
        "Gave O(n) time and O(h) or O(w) space, and tested an empty tree, one node and a skewed tree.",
      ],
      weak: [
        "Started coding without saying what a call returns, then patched cases with extra flags.",
        "Missed the null check, let the BFS loop run into the next level, or checked a BST rule only against direct children.",
        "Claimed O(log n) space without noting a skewed tree, or recomputed subtree facts and made it O(n²).",
      ],
    },
  },

  quiz: [
    ["In the BFS level-order loop, why is <code>sz = q.size()</code> read before the inner loop?",
      ["Because <code>q.size()</code> is slow to call", "So children pushed during this level are not processed as part of it", "Because the queue is cleared after each level", "So the loop can run in reverse"],
      1, "Children are pushed to the back while the level is being processed. Freezing the size first means the inner loop takes exactly the nodes that were there when the level started."],
    ["In LC 236, a call on node X gets back non-null from both its left and right subtree. What does that mean?",
      ["X is p", "Both targets are in the left subtree", "The tree is not a valid BST", "p and q are in different subtrees of X, so X is the answer"],
      3, "Each side found one target, so X is the lowest node that has both below it. Every ancestor above X sees only one non-null side and passes X up."],
    ["What is the space cost of recursive DFS on a binary tree with n nodes?",
      ["O(h), the height: log n if balanced, n if it is a single chain", "Always O(1)", "Always O(log n)", "O(n²)"],
      0, "The call stack holds one frame per node on the current root-to-node path. For a chain-shaped tree that path has n nodes."],
  ],

  drills: [
    { prompt: "Given a binary tree, return the values you would see standing on its right side, top to bottom.",
      answer: "trees", distractors: ["graphs-bfs-dfs", "stacks-monotonic", "two-pointers"],
      why: "Level by level on a binary tree: BFS with a frozen level size, keeping the last value of each level." },
    { prompt: "Given a binary tree, decide whether every node's value is greater than all values in its left subtree and less than all in its right.",
      answer: "trees", distractors: ["binary-search", "dp-1d", "stacks-monotonic"],
      why: "Validate a BST: a DFS that passes the allowed (min, max) range down to each node." },
    { prompt: "Given a binary tree, return the largest sum of node values along any path, where a path can start and end at any node.",
      answer: "trees", distractors: ["dp-1d", "graphs-bfs-dfs", "greedy"],
      why: "Post-order DFS: each call returns the best one-sided path down, and the node records the best two-sided path in a global." },
    { prompt: "Write two functions: one turns a binary tree into a string, the other rebuilds the same tree from that string.",
      answer: "trees", distractors: ["tries", "math-design", "linked-lists"],
      why: "Serialize with a pre-order or level-order walk that writes a marker for each null child, then read it back in the same order." },
    { prompt: "Mirror a binary tree so every left child becomes a right child and the other way round.",
      answer: "trees", distractors: ["linked-lists", "two-pointers", "backtracking"],
      why: "Swap the two children at each node and recurse into both. One visit per node, O(n)." },
    { prompt: "Given a binary tree and two of its nodes, return the deepest node that has both of them in its subtree.",
      answer: "trees", distractors: ["graphs-bfs-dfs", "shortest-path-union-find", "binary-search"],
      why: "Lowest common ancestor: a post-order DFS where a node with a hit from both sides is the answer." },
  ],

  flashcards: [
    { id: "tr-dfs", front: "Recursive DFS on a binary tree: time and space?", back: "O(n) time. O(h) space for the call stack: O(log n) if balanced, O(n) if skewed." },
    { id: "tr-bfs", front: "BFS level order (LC 102): time and space?", back: "O(n) time. O(w) space, where w is the widest level (up to about n/2 for a full tree)." },
    { id: "tr-lca", front: "Lowest Common Ancestor (LC 236): time and space?", back: "O(n) time, each node visited at most once. O(h) space for the recursion." },
    { id: "tr-bst", front: "Validate BST with min/max bounds (LC 98): time and space?", back: "O(n) time and O(h) space. Each node is checked once against the bounds passed down." },
    { id: "tr-serialize", front: "Serialize and deserialize a binary tree (LC 297): time and space?", back: "O(n) time each way and O(n) space for the string, including one marker per null child." },
  ],

  problems: [102, 236, 226, 98, 297, 124],
});
