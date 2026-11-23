// Pattern 05: Linked Lists. Writer A.
// Demo 1 "reverse-list" (LC 206), demo 2 "lru-cache" (LC 146, ops).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "linked-lists",
  num: 5,
  title: "Linked Lists",
  summary: "Rewire next pointers in place with a few named pointers (prev, curr, next, slow, fast, a dummy head), saving a pointer before you overwrite it.",
  tags: ["linked list", "reverse", "dummy node", "fast and slow", "cycle", "merge", "LRU cache", "pointers"],

  demos: [
    {
      id: "reverse-list",
      title: "Reverse Linked List",
      lc: 206,
      problem: "Reverse a singly linked list and return the new head. <code>1 → 2 → 3 → 4 → 5</code> becomes <code>5 → 4 → 3 → 2 → 1</code>. Enter the list as values.",
      code: [
        "ListNode* reverseList(ListNode* head) {",
        "    ListNode* prev = nullptr;",
        "    ListNode* curr = head;",
        "    while (curr) {",
        "        ListNode* next = curr->next;",
        "        curr->next = prev;",
        "        prev = curr;",
        "        curr = next;",
        "    }",
        "    return prev;",
        "}",
      ],
      fields: [{ key: "head", label: "list values", type: "ints", value: "1,2,3,4,5" }],
      run(input, rec) {
        const vals = input.head;
        const n = vals.length;
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        const id = (k) => "n" + k;
        const nodes = vals.map((v, k) => ({ id: id(k), val: v }));
        const nxt = {};
        for (let k = 0; k < n; k++) nxt[id(k)] = k + 1 < n ? id(k + 1) : null;
        let prev = null, curr = n ? 0 : null, next = null;   // indexes into vals

        const chain = (start) => {               // values reachable from start via nxt
          const out = [];
          let c = start === null ? null : id(start);
          while (c !== null && out.length <= n) { out.push(vals[+c.slice(1)]); c = nxt[c]; }
          return out.length ? out.join(" → ") + " → null" : "null";
        };
        const views = (o) => {
          o = o || {};
          const marks = {};
          for (let k = 0; k < n; k++) {
            if (prev !== null && k <= prev) marks[id(k)] = "done";
          }
          if (curr !== null) marks[id(curr)] = "hot";
          Object.assign(marks, o.marks || {});
          return [
            { id: "list", type: "list", label: "nodes", nodes: o.nodes || nodes, next: Object.assign({}, nxt),
              pointers: { prev: prev === null ? null : id(prev), curr: curr === null ? null : id(curr), next: next === null ? null : id(next) },
              marks: marks },
            { id: "rev", type: "calc", label: "reversed so far (from prev)", value: chain(prev) },
            o.fromNext
              ? { id: "rest", type: "calc", label: "still to do (from next)", value: chain(next) }
              : { id: "rest", type: "calc", label: "still to do (from curr)", value: chain(curr) },
          ];
        };

        frame({
          line: 3, title: "prev = null, curr = head",
          t: n
            ? `<code>prev</code> starts at <code>null</code>: the reversed part is empty. <code>curr</code> starts at the head, value ${vals[0]}.`
            : "The list is empty, so <code>curr</code> is <code>null</code> and the loop will not run.",
          tip: "The loop keeps two lists: the reversed part starting at <code>prev</code> and the untouched part starting at <code>curr</code>. Each step moves one node from the second to the first.",
          vars: { prev: "null", curr: n ? vals[0] : "null" },
          views: views(),
        });

        let saveTip = false, flipTip = false;
        while (curr !== null) {
          next = curr + 1 < n ? curr + 1 : null;    // the node curr->next still points at
          frame({
            line: 5, title: "Save curr->next",
            t: `Save <code>next = ${next === null ? "null" : vals[next]}</code> before touching anything. The next line overwrites <code>curr->next</code>, and without this copy the rest of the list is lost.`,
            tip: saveTip ? undefined : "Save before you overwrite. Losing the only pointer to the rest of the list is the classic linked-list bug.",
            vars: { prev: prev === null ? "null" : vals[prev], curr: vals[curr], next: next === null ? "null" : vals[next] },
            views: views({ marks: next !== null ? { [id(next)]: "in" } : {} }),
          });
          saveTip = true;
          nxt[id(curr)] = prev === null ? null : id(prev);
          frame({
            line: 6, title: "Flip the arrow",
            t: `Point node ${vals[curr]} back at ${prev === null ? "<code>null</code>. It becomes the tail of the reversed list" : `node ${vals[prev]}`}. Its old arrow to ${next === null ? "null" : vals[next]} is gone, but <code>next</code> still holds it.`,
            tip: flipTip ? undefined : "This is the only line that changes the list. Every other line just moves a pointer variable.",
            vars: { prev: prev === null ? "null" : vals[prev], curr: vals[curr], next: next === null ? "null" : vals[next] },
            views: views({ fromNext: true, marks: Object.assign(next !== null ? { [id(next)]: "in" } : {}, { [id(curr)]: "new" }) }),
            moves: prev !== null ? [{ from: ["list", id(curr)], to: ["list", id(prev)], label: "next" }] : undefined,
          });
          flipTip = true;
          prev = curr;
          curr = next;
          const was = next;
          next = null;
          frame({
            line: [7, 8], title: "Slide prev and curr",
            t: `<code>prev</code> moves to node ${vals[prev]}, the new front of the reversed part. <code>curr</code> moves to ${was === null ? "<code>null</code>, so the loop ends" : `node ${vals[was]}`}.`,
            vars: { prev: vals[prev], curr: curr === null ? "null" : vals[curr] },
            views: views(),
          });
        }

        const order = [];
        for (let k = n - 1; k >= 0; k--) order.push(nodes[k]);
        frame({
          line: 10, title: "Return prev",
          t: n
            ? `<code>curr</code> is null, so every arrow is flipped. <code>prev</code> holds the old tail, ${vals[n - 1]}, which is the new head: <b>${chain(prev)}</b>.`
            : "Nothing to reverse. Return <code>null</code>.",
          tip: "O(n) time, O(1) extra space. The recursive version is also O(n) time but uses O(n) stack.",
          vars: { prev: prev === null ? "null" : vals[prev], curr: "null" },
          views: views({ nodes: order, marks: prev !== null ? { [id(prev)]: "good" } : {} }),
        });
        if (total > 40) rec.truncated(total - 40);
        return vals.slice().reverse();
      },
      expect: [
        [{ head: "1,2,3,4,5" }, [5, 4, 3, 2, 1]],
        [{ head: "1,2" }, [2, 1]],
        [{ head: "" }, []],
        [{ head: "7" }, [7]],
        [{ head: "3,3,1" }, [1, 3, 3]],
      ],
    },
    {
      id: "lru-cache",
      title: "LRU Cache",
      lc: 146,
      problem: "Build a cache of size <code>capacity</code> with O(1) <code>get(key)</code> (value or <code>-1</code>) and <code>put(key, value)</code>. When full, <code>put</code> evicts the least recently used key. Each op's result is shown, <code>null</code> for <code>put</code>.",
      code: [
        "class LRUCache {",
        "    int cap;",
        "    list<pair<int, int>> order;",
        "    unordered_map<int, list<pair<int, int>>::iterator> pos;",
        "public:",
        "    LRUCache(int capacity) : cap(capacity) {}",
        "    int get(int key) {",
        "        auto it = pos.find(key);",
        "        if (it == pos.end()) return -1;",
        "        order.splice(order.begin(), order, it->second);",
        "        return it->second->second;",
        "    }",
        "    void put(int key, int value) {",
        "        auto it = pos.find(key);",
        "        if (it != pos.end()) {",
        "            it->second->second = value;",
        "            order.splice(order.begin(), order, it->second);",
        "            return;",
        "        }",
        "        if ((int)order.size() == cap) {",
        "            pos.erase(order.back().first);",
        "            order.pop_back();",
        "        }",
        "        order.push_front({key, value});",
        "        pos[key] = order.begin();",
        "    }",
        "};",
      ],
      fields: [
        { key: "cap", label: "capacity", type: "int", value: "2" },
        { key: "ops", label: "ops", type: "ops", value: "put(1,1) put(2,2) get(1) put(3,3) get(2) put(4,4) get(1) get(3) get(4)" },
      ],
      run(input, rec) {
        const cap = input.cap, ops = input.ops;
        if (cap < 1) { rec.error("capacity must be at least 1."); return null; }
        for (const op of ops) {
          const ok = (op.name === "get" && op.args.length === 1) || (op.name === "put" && op.args.length === 2);
          if (!ok || !op.args.every((a) => Number.isInteger(a))) { rec.error(`"${op.name}(${op.args.join(",")})" is not get(key) or put(key, value) with whole numbers.`); return null; }
        }
        let total = 0, lastLine = 6;
        const frame = (f) => { total++; lastLine = f.line; rec.frame(f); };
        let order = [];                        // [key, value], index 0 = front = most recent
        const results = [], shown = [], everPut = new Set();
        let opText = "-";
        const nid = (k) => "k" + k;

        const views = (o) => {
          o = o || {};
          const next = {};
          order.forEach(([k], j) => { next[nid(k)] = j + 1 < order.length ? nid(order[j + 1][0]) : null; });
          const ptr = {};
          if (order.length) { ptr.front = nid(order[0][0]); ptr.back = nid(order[order.length - 1][0]); }
          return [
            { id: "order", type: "list", label: "order (front = most recent, back = least recent)",
              nodes: order.map(([k, v]) => ({ id: nid(k), val: `${k}:${v}` })), next: next, pointers: ptr, marks: o.listMarks || {} },
            { id: "pos", type: "map", kind: "map", label: "pos (key → its node)",
              entries: order.map(([k]) => [k, "node " + k]).sort((a, b) => a[0] - b[0]), marks: o.mapMarks || {} },
            { id: "op", type: "calc", label: "current op", value: opText },
            { id: "out", type: "array", label: "results", values: shown.slice(), marks: o.outMarks || {} },
          ];
        };
        const push = (r) => { results.push(r); shown.push(r === null ? "null" : r); };

        frame({
          line: 6, title: `Empty cache, capacity ${cap}`,
          t: `The cache starts empty. <code>order</code> is a doubly linked list with the most recent key at the front. <code>pos</code> maps each key to its node, so we can reach any node in O(1).`,
          tip: "The map gives O(1) lookup, the list gives O(1) reordering. Neither alone is enough: a map has no order, and a list needs O(n) to find a key.",
          vars: { cap: cap, size: 0 },
          views: views(),
        });

        let spliceTip = false, evictTip = false;
        ops.forEach((op, oi) => {
          const at = order.findIndex(([k]) => k === op.args[0]);
          if (op.name === "get") {
            const key = op.args[0];
            if (at < 0) {
              opText = `get(${key}) → -1`;
              push(-1);
              frame({
                line: 9, title: `get(${key}): miss`,
                t: `Key ${key} is not in <code>pos</code>: ${everPut.has(key) ? "it was evicted earlier" : "it was never added"}. Return <b>-1</b>.`,
                vars: { op: oi + 1, key: key, size: order.length },
                views: views({ outMarks: { [shown.length - 1]: "bad" } }),
              });
              return;
            }
            const [, v] = order[at];
            order.splice(at, 1);
            order.unshift([key, v]);
            opText = `get(${key})`;
            frame({
              line: 10, title: `get(${key}): move to front`,
              t: `Key ${key} is in <code>pos</code>, which points straight at its node. Unlink it and put it at the front: it is now the most recently used.${at === 0 ? " It was already at the front, so the order does not change." : ""}`,
              tip: spliceTip ? undefined : "<code>splice</code> moves one node to the front in O(1). It only rewires pointers, so the iterator in <code>pos</code> stays valid.",
              vars: { op: oi + 1, key: key, size: order.length },
              views: views({ listMarks: { [nid(key)]: "hot" }, mapMarks: { [key]: "in" } }),
              moves: [{ from: ["pos", key], to: ["order", nid(key)], label: "O(1)" }],
            });
            spliceTip = true;
            opText = `get(${key}) → ${v}`;
            push(v);
            frame({
              line: 11, title: `get(${key}) returns ${v}`,
              t: `Return the value stored in the node: <b>${v}</b>.`,
              vars: { op: oi + 1, key: key, value: v, size: order.length },
              views: views({ listMarks: { [nid(key)]: "good" }, outMarks: { [shown.length - 1]: "new" } }),
              moves: [{ from: ["order", nid(key)], to: ["out", shown.length - 1], label: String(v) }],
            });
            return;
          }
          const [key, value] = op.args;
          everPut.add(key);
          opText = `put(${key}, ${value})`;
          if (at >= 0) {
            order.splice(at, 1);
            order.unshift([key, value]);
            push(null);
            frame({
              line: [16, 17], title: `put(${key}): update value`,
              t: `Key ${key} is already cached. Overwrite its value with ${value} and move it to the front. Nothing is evicted, because the size did not change.`,
              vars: { op: oi + 1, key: key, value: value, size: order.length },
              views: views({ listMarks: { [nid(key)]: "new" }, mapMarks: { [key]: "in" }, outMarks: { [shown.length - 1]: "dim" } }),
            });
            return;
          }
          if (order.length === cap) {
            const [lk, lv] = order[order.length - 1];
            order.pop();
            frame({
              line: [20, 22], title: `Full: evict key ${lk}`,
              t: `The cache holds ${cap} key${cap > 1 ? "s" : ""}, its capacity. The back of the list is the least recently used, key ${lk} (value ${lv}). Erase it from <code>pos</code> and drop the node.`,
              tip: evictTip ? undefined : "Erase from the map before <code>pop_back</code>: the key lives in the node, and the node is gone after the pop.",
              vars: { op: oi + 1, key: key, evicted: lk, size: order.length },
              views: views(),
              moves: [{ from: ["order", nid(lk)], to: ["op", 0], label: `evict ${lk}` }],
            });
            evictTip = true;
          }
          order.unshift([key, value]);
          push(null);
          frame({
            line: [24, 25], title: `put(${key}, ${value}): insert`,
            t: `Add key ${key} with value ${value} at the front, and store its node in <code>pos[${key}]</code>. The cache now holds ${order.length} of ${cap}.`,
            vars: { op: oi + 1, key: key, value: value, size: order.length },
            views: views({ listMarks: { [nid(key)]: "new" }, mapMarks: { [key]: "new" }, outMarks: { [shown.length - 1]: "dim" } }),
          });
        });

        opText = "done";
        frame({
          line: lastLine, title: "All ops done",
          t: `Results: <b>[${shown.join(", ")}]</b>. Each get and put did one map lookup and a constant number of pointer changes.`,
          tip: "O(1) time per op, O(capacity) space for the list and the map.",
          vars: { cap: cap, size: order.length },
          views: views(),
        });
        if (total > 40) rec.truncated(total - 40);
        return results;
      },
      expect: [
        [{ cap: "2", ops: "put(1,1) put(2,2) get(1) put(3,3) get(2) put(4,4) get(1) get(3) get(4)" }, [null, null, 1, null, -1, null, -1, 3, 4]],
        [{ cap: "1", ops: "put(2,1) get(2) put(3,2) get(2) get(3)" }, [null, 1, null, -1, 2]],
        [{ cap: "2", ops: "put(2,1) put(2,2) get(2) put(1,1) put(4,1) get(2)" }, [null, null, 2, null, null, -1]],
        [{ cap: "2", ops: "get(5)" }, [-1]],
        [{ cap: "2", ops: "put(1,1) put(2,2) put(1,10) put(3,3) get(1) get(2)" }, [null, null, null, null, 10, -1]],
      ],
    },
  ],

  explain: {
    plain: "Linked-list problems are about rewiring <code>next</code> pointers in place with a few named pointers. A dummy head removes the special case for the first node, fast and slow pointers find the middle or a cycle, and a doubly linked list plus a hash map gives O(1) reordering by key.",
    spot: [
      "The input is a <code>ListNode*</code> and the task is to reverse, reorder, merge, split or remove nodes.",
      "You must do it in O(1) extra space, so copying values into a vector is not allowed.",
      "The question asks for the middle, the k-th from the end, or whether there is a cycle and where it starts.",
      "The head itself might be removed or replaced, which suggests a dummy node in front of it.",
      "A design question needs O(1) lookup plus O(1) move-to-front or remove (LRU, LFU): hash map plus doubly linked list.",
    ],
    notWhen: [
      "You need random access by index or binary search. Use an array or vector.",
      "The order only matters at the ends (push and pop at front or back). A deque or stack is simpler than a hand-built list.",
    ],
    template: [
      "ListNode* reverse(ListNode* head) {          // save next, flip, slide",
      "    ListNode *prev = nullptr, *curr = head;",
      "    while (curr) {",
      "        ListNode* next = curr->next;",
      "        curr->next = prev;",
      "        prev = curr; curr = next;",
      "    }",
      "    return prev;",
      "}",
      "",
      "bool hasCycle(ListNode* head) {               // fast moves 2, slow moves 1",
      "    ListNode *slow = head, *fast = head;",
      "    while (fast && fast->next) {",
      "        slow = slow->next; fast = fast->next->next;",
      "        if (slow == fast) return true;",
      "    }",
      "    return false;",
      "}",
      "",
      "ListNode* merge(ListNode* a, ListNode* b) {",
      "    ListNode dummy(0), *tail = &dummy;        // dummy head: no first-node case",
      "    for (; a && b; tail = tail->next) {",
      "        if (a->val <= b->val) { tail->next = a; a = a->next; }",
      "        else { tail->next = b; b = b->next; }",
      "    }",
      "    tail->next = a ? a : b;",
      "    return dummy.next;",
      "}",
    ],
    templateNotes: [
      "In <code>reverse</code>, the save line must come before the flip line, or the rest of the list is lost.",
      "In <code>hasCycle</code>, check <code>fast &amp;&amp; fast-&gt;next</code> before jumping two steps, or you dereference null on an even-length list.",
      "The dummy node lives on the stack; return <code>dummy.next</code>, never <code>&amp;dummy</code>. <code>ListNode</code> is LeetCode's usual struct with <code>val</code> and <code>next</code>.",
      "<code>tail</code> always points at the last node of the output, so appending is one assignment.",
      "To find where a cycle starts (LC 142), after the meeting reset one pointer to the head and move both one step at a time; they meet at the start.",
    ],
    variants: [
      ["Reverse all or part", "Save next, flip, slide; for groups of k, reverse each group and reconnect", "206, 25, 92"],
      ["Fast and slow pointers", "Middle, cycle detection, cycle start, k-th from end", "141, 142, 876, 19"],
      ["Dummy head", "Merge, partition, remove nodes, add two numbers", "21, 23, 2"],
      ["Hash map + doubly linked list", "O(1) get and move-to-front for cache designs", "146, 460"],
    ],
    mistakes: [
      "Overwriting <code>curr-&gt;next</code> before saving it, which cuts off the rest of the list.",
      "Returning <code>head</code> after reversing. The old head is now the tail; return <code>prev</code>.",
      "Jumping <code>fast-&gt;next-&gt;next</code> without checking <code>fast-&gt;next</code> first.",
      "Not using a dummy node when the head can change, then writing special cases that miss one input.",
      "In LRU, popping the back node before erasing its key from the map, so the key is no longer readable.",
      "In LRU, forgetting that <code>put</code> on an existing key must update and move it, not insert a second node.",
    ],
    complexity: [
      ["Reverse iteratively", "O(n)", "O(1)", "One pass, three pointer variables."],
      ["Reverse recursively", "O(n)", "O(n)", "One stack frame per node."],
      ["Fast and slow (cycle, middle)", "O(n)", "O(1)", "Fast moves two steps per slow step, so it meets slow within a loop length."],
      ["LRU cache (map + list)", "O(1) per op", "O(capacity)", "Map lookup plus constant pointer changes per op."],
    ],
    sayIt: "When the input is a linked list, I first ask whether I can use extra space. If not, I solve it by rewiring next pointers with a few named pointers. For reversal I keep prev and curr, and each step I save curr's next, point curr back at prev, then slide both forward. The rule I never break is to save a pointer before I overwrite it. If the head might change, I put a dummy node in front so the first node needs no special case, and I return dummy's next. For the middle or a cycle I use fast and slow pointers, where fast moves two steps for each step of slow. For design questions like an LRU cache I pair a hash map from key to node with a doubly linked list ordered by use, which gives O(1) for both get and put. I test an empty list, one node, two nodes, and the case where the head itself changes.",
    followups: [
      ["Can you reverse the list recursively?", "Yes: reverse the rest, then set head->next->next = head and head->next = null. It is O(n) time but uses O(n) stack, so the iterative version is better for long lists."],
      ["How would you reverse only positions left to right (LC 92)?", "Walk a pointer to the node before left using a dummy head, reverse the next right - left + 1 nodes with the same save-flip-slide loop, then reconnect both ends."],
      ["Why does LRU need a doubly linked list?", "Removing a node from the middle needs its previous node. With prev pointers that is O(1); with a singly linked list you would have to search for it."],
      ["How would you make the LRU cache thread-safe?", "Guard get and put with one mutex, since get also changes the order. For high contention, shard the cache by key hash, each shard with its own lock."],
    ],
    rubric: {
      strong: [
        "Named the pointers and what each one means at every step, and saved a pointer before overwriting it.",
        "Used a dummy head or fast/slow pointers where they remove special cases, and returned the right node.",
        "Stated time and extra space with a reason, and tested an empty list, one node, two nodes and a changing head.",
      ],
      weak: [
        "Lost part of the list by overwriting next too early, or returned the old head.",
        "Wrote special cases for the first node instead of a dummy, and missed one of them.",
        "Used O(n) extra space without being asked, or did not test short lists.",
      ],
    },
  },

  quiz: [
    ["In the iterative reversal, why is <code>next = curr->next</code> saved first?",
      ["To make the loop end sooner", "Because the next line overwrites <code>curr->next</code>, and without the copy the rest of the list is unreachable", "To keep the list sorted", "Because <code>prev</code> might be null"],
      1, "The flip line points curr back at prev. After that, curr no longer leads to the rest of the list, so the saved copy is the only way forward."],
    ["Why does an LRU cache pair a hash map with a doubly linked list?",
      ["The map finds a key's node in O(1), and the list moves or removes that node in O(1)", "The map keeps keys sorted by recent use", "The list makes lookups faster than the map", "So the cache can grow without limit"],
      0, "A map alone has no order to evict by, and a list alone needs O(n) to find a key. Together, every get and put is O(1)."],
    ["Which task is NOT a good fit for fast and slow pointers?",
      ["Find the middle node", "Detect a cycle", "Find where a cycle starts", "Merge two sorted lists"],
      3, "Merging walks both lists once with a dummy head and a tail pointer. Fast and slow pointers are for positions defined by length, like the middle, or for cycles."],
  ],

  drills: [
    { prompt: "Given the head of a singly linked list, reverse it in place and return the new head.",
      answer: "linked-lists", distractors: ["two-pointers", "stacks-monotonic", "backtracking"],
      why: "Pointer rewiring with prev, curr and a saved next. O(n) time, O(1) space." },
    { prompt: "Given the heads of two sorted linked lists, combine them into one sorted list by splicing the nodes together.",
      answer: "linked-lists", distractors: ["binary-search", "heaps", "dp-1d"],
      why: "A dummy head and a tail pointer: append the smaller front node each step, then attach the leftover list." },
    { prompt: "Given a linked list, return the node where a cycle begins, or null if there is none, using O(1) memory.",
      answer: "linked-lists", distractors: ["graphs-bfs-dfs", "prefix-sum-hashing", "binary-search"],
      why: "Fast and slow pointers meet inside the loop; then one pointer from the head and one from the meeting point meet at the start." },
    { prompt: "Design a key-value store with a fixed size where get and put both run in constant time and the least recently used key is dropped when it is full.",
      answer: "linked-lists", distractors: ["heaps", "math-design", "prefix-sum-hashing"],
      why: "Hash map from key to node, plus a doubly linked list ordered by use. Move to front on access, evict from the back." },
    { prompt: "Given a linked list and k, reverse the nodes k at a time and leave any leftover nodes at the end as they are.",
      answer: "linked-lists", distractors: ["backtracking", "stacks-monotonic", "two-pointers"],
      why: "Reverse each group of k with save-flip-slide, then reconnect the group's new head and tail, using a dummy before the first group." },
    { prompt: "Given a linked list, remove the n-th node from the end in one pass.",
      answer: "linked-lists", distractors: ["heaps", "binary-search", "stacks-monotonic"],
      why: "Move a lead pointer n steps ahead from a dummy head, then move both until the lead hits the end; the trailing pointer sits before the node to remove." },
  ],

  flashcards: [
    { id: "ll-reverse", front: "Reverse Linked List (LC 206), iterative: time and space?", back: "O(n) time, O(1) extra space: prev, curr and a saved next." },
    { id: "ll-reverse-rec", front: "Reverse Linked List, recursive: time and space?", back: "O(n) time and O(n) space for the call stack, one frame per node." },
    { id: "ll-cycle", front: "Floyd's cycle detection (fast and slow): time and space?", back: "O(n) time and O(1) space. After they meet, a pointer from the head and one from the meeting point meet at the cycle start." },
    { id: "ll-merge", front: "Merge Two Sorted Lists (LC 21) with a dummy head: time and space?", back: "O(m + n) time, O(1) extra space, since nodes are spliced, not copied." },
    { id: "ll-lru", front: "LRU Cache (LC 146): time and space?", back: "O(1) per get and put using a hash map plus a doubly linked list. O(capacity) space." },
  ],

  problems: [206, 21, 142, 146, 25],
});
