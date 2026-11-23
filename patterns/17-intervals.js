// Pattern 17: Intervals. Writer D.
// Demo 1 "merge-intervals" (LC 56, filed under Greedy in the problem list), demo 2 "meeting-rooms-ii" (LC 253).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "intervals",
  num: 17,
  title: "Intervals",
  summary: "Sort the ranges by start (or end), then sweep once, comparing each range with the last one you kept or with the earliest one still open.",
  tags: ["intervals", "merge", "overlap", "meeting rooms", "sweep line", "sort by start", "schedule"],

  demos: [
    {
      id: "merge-intervals",
      title: "Merge Intervals",
      lc: 56,
      problem: "Given a list of intervals <code>[start, end]</code>, merge every group that overlaps and return the result. <code>[[1,3],[2,6],[8,10],[15,18]]</code> gives <code>[[1,6],[8,10],[15,18]]</code>. Touching ends count as overlapping: <code>[1,4],[4,5]</code> gives <code>[1,5]</code>.",
      code: [
        "vector<vector<int>> merge(vector<vector<int>>& intervals) {",
        "    sort(intervals.begin(), intervals.end());",
        "    vector<vector<int>> out;",
        "    for (auto& iv : intervals) {",
        "        if (!out.empty() && iv[0] <= out.back()[1])",
        "            out.back()[1] = max(out.back()[1], iv[1]);",
        "        else",
        "            out.push_back(iv);",
        "    }",
        "    return out;",
        "}",
      ],
      fields: [{ key: "intervals", label: "intervals", type: "tuples", value: "1,3;2,6;8,10;15,18" }],
      run(input, rec) {
        const raw = input.intervals;
        if (raw.some((t) => t.length !== 2)) { rec.error("Each interval needs exactly two numbers: start,end."); return null; }
        if (raw.some((t) => t[0] > t[1])) { rec.error("Each interval needs start <= end."); return null; }
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        // Items keep the id of their original position so the sort animates as a reorder.
        let items = raw.map((t, k) => ({ id: "a" + k, start: t[0], end: t[1] }));
        const lo = raw.length ? Math.min(...raw.map((t) => t[0])) : 0;
        const hi = raw.length ? Math.max(...raw.map((t) => t[1])) : 10;
        const axis = [lo, hi > lo ? hi : lo + 1];
        const out = [];          // {id, start, end}
        const groupOf = {};      // input id -> merged id
        const fmt = (a, b) => `[${a},${b}]`;

        const views = (o) => {
          o = o || {};
          const im = {};
          for (const it of items) if (groupOf[it.id] !== undefined) im[it.id] = "done";
          Object.assign(im, o.inMarks || {});
          return [
            { id: "in", type: "intervals", label: o.sorted ? "intervals (sorted by start)" : "intervals", axis: axis,
              items: items.map((it, k) => ({ id: it.id, start: it.start, end: it.end, label: fmt(it.start, it.end), lane: k })),
              marks: im, cursor: o.cursor },
            { id: "out", type: "intervals", label: "out (merged)", axis: axis,
              items: out.map((m) => ({ id: m.id, start: m.start, end: m.end, label: fmt(m.start, m.end), lane: 0 })),
              marks: o.outMarks || {} },
            { id: "count", type: "calc", label: "out.size()", value: out.length },
          ];
        };

        frame({
          line: 1, title: "The input",
          t: raw.length
            ? `${raw.length} interval${raw.length > 1 ? "s" : ""} in the order given. Each bar is drawn on its own row so overlaps are easy to see.`
            : "The list is empty, so there is nothing to merge.",
          vars: { "intervals.size()": raw.length },
          views: views(),
        });

        const before = items.map((it) => it.id).join(",");
        items = items.slice().sort((x, y) => x.start - y.start || x.end - y.end);
        const moved = items.map((it) => it.id).join(",") !== before;
        frame({
          line: 2, title: moved ? "Sort by start" : "Sort (already sorted)",
          t: moved
            ? "Sort by start, then by end. Now any interval that overlaps the current group must come right after it, so one left-to-right pass is enough."
            : "Sort by start, then by end. This input was already in order, so nothing moves. After the sort, any interval that overlaps the current group comes right after it.",
          tip: "Sorting is the whole trick. Without it, an interval far down the list could still overlap the first one, and you would need to compare every pair.",
          vars: { "intervals.size()": raw.length },
          views: views({ sorted: true }),
        });

        let touchTip = false, extendTip = false, newTip = false;
        for (const iv of items) {
          const last = out.length ? out[out.length - 1] : null;
          if (last && iv.start <= last.end) {
            const oldEnd = last.end;
            last.end = Math.max(last.end, iv.end);
            groupOf[iv.id] = last.id;
            const grew = last.end > oldEnd;
            let tip;
            if (iv.start === oldEnd && !touchTip) { tip = "The test is <code>&lt;=</code>, so intervals that only touch (end 4, start 4) merge. Ask the interviewer whether touching counts."; touchTip = true; }
            else if (!grew && !extendTip) { tip = "Use <code>max</code> for the new end. A short interval can sit fully inside a long one, and plain assignment would shrink the group."; extendTip = true; }
            frame({
              line: [5, 6], title: grew ? `Overlap: end becomes ${last.end}` : "Overlap, fully inside",
              t: `${fmt(iv.start, iv.end)} starts at ${iv.start}, which is not after the last group's end ${oldEnd}, so it overlaps. ${grew ? `Stretch the end to <code>max(${oldEnd}, ${iv.end}) = ${last.end}</code>.` : `It ends at ${iv.end}, inside the group, so the end stays ${last.end}.`}`,
              tip: tip,
              vars: { "iv[0]": iv.start, "iv[1]": iv.end, "out.back()[1]": last.end },
              views: views({ sorted: true, cursor: iv.start, inMarks: { [iv.id]: "hot" }, outMarks: { [last.id]: grew ? "new" : "good" } }),
              moves: [{ from: ["in", iv.id], to: ["out", last.id], label: grew ? `end ${last.end}` : "inside" }],
            });
          } else {
            const m = { id: "m" + out.length, start: iv.start, end: iv.end };
            out.push(m);
            groupOf[iv.id] = m.id;
            frame({
              line: [7, 8], title: last ? "Gap: start a new group" : "First interval",
              t: last
                ? `${fmt(iv.start, iv.end)} starts at ${iv.start}, after the last group's end ${last.end}. Nothing later can reach back over that gap, so the old group is final. Push a new group.`
                : `<code>out</code> is empty, so ${fmt(iv.start, iv.end)} starts the first group.`,
              tip: last && !newTip ? "Once a gap appears, the previous group can never change again: every later interval starts at least this far right." : undefined,
              vars: { "iv[0]": iv.start, "iv[1]": iv.end, "out.back()[1]": m.end },
              views: views({ sorted: true, cursor: iv.start, inMarks: { [iv.id]: "hot" }, outMarks: Object.assign(last ? { [last.id]: "done" } : {}, { [m.id]: "new" }) }),
              moves: [{ from: ["in", iv.id], to: ["out", m.id], label: fmt(iv.start, iv.end) }],
            });
            if (last) newTip = true;
          }
        }

        const ans = out.map((m) => [m.start, m.end]);
        frame({
          line: 10, title: `Return ${ans.length} interval${ans.length === 1 ? "" : "s"}`,
          t: ans.length
            ? `Every input interval sits in exactly one group. Return <b>${ans.map((p) => fmt(p[0], p[1])).join(", ")}</b>.`
            : "Nothing to merge: return an empty list.",
          tip: "O(n log n) time for the sort, then O(n) for the pass. O(n) space for the output (O(log n) extra for the sort itself).",
          vars: { "out.size()": ans.length },
          views: views({ sorted: true, outMarks: Object.fromEntries(out.map((m) => [m.id, "good"])) }),
        });
        if (total > 40) rec.truncated(total - 40);
        return ans;
      },
      expect: [
        [{ intervals: "1,3;2,6;8,10;15,18" }, [[1, 6], [8, 10], [15, 18]]],
        [{ intervals: "1,4;4,5" }, [[1, 5]]],
        [{ intervals: "" }, []],
        [{ intervals: "8,10;1,3;2,6" }, [[1, 6], [8, 10]]],
        [{ intervals: "1,10;2,3;4,5" }, [[1, 10]]],
        [{ intervals: "5,5" }, [[5, 5]]],
      ],
    },
    {
      id: "meeting-rooms-ii",
      title: "Meeting Rooms II",
      lc: 253,
      problem: "Given meeting times <code>[start, end]</code>, return the fewest rooms so that no two meetings in the same room overlap. A meeting may start the moment another ends. <code>[[0,30],[5,10],[15,20]]</code> gives <code>2</code>.",
      code: [
        "int minMeetingRooms(vector<vector<int>>& intervals) {",
        "    sort(intervals.begin(), intervals.end());",
        "    priority_queue<int, vector<int>, greater<int>> ends;  // min-heap",
        "    for (auto& iv : intervals) {",
        "        if (!ends.empty() && ends.top() <= iv[0]) ends.pop();",
        "        ends.push(iv[1]);",
        "    }",
        "    return (int)ends.size();",
        "}",
      ],
      fields: [{ key: "intervals", label: "meetings", type: "tuples", value: "0,30;5,10;15,20" }],
      run(input, rec) {
        const raw = input.intervals;
        if (raw.some((t) => t.length !== 2)) { rec.error("Each meeting needs exactly two numbers: start,end."); return null; }
        if (raw.some((t) => t[0] > t[1])) { rec.error("Each meeting needs start <= end."); return null; }
        let total = 0;
        const frame = (f) => { total++; rec.frame(f); };
        let items = raw.map((t, k) => ({ id: "a" + k, start: t[0], end: t[1] }));
        const lo = raw.length ? Math.min(...raw.map((t) => t[0])) : 0;
        const hi = raw.length ? Math.max(...raw.map((t) => t[1])) : 10;
        const axis = [lo, hi > lo ? hi : lo + 1];
        const fmt = (a, b) => `[${a},${b}]`;

        // Binary min-heap of {end, room}; the view shows only the end times.
        const h = [];
        const less = (x, y) => x.end < y.end || (x.end === y.end && x.room < y.room);
        const push = (x) => {
          h.push(x);
          let i = h.length - 1;
          while (i > 0) { const p = (i - 1) >> 1; if (!less(h[i], h[p])) break; [h[i], h[p]] = [h[p], h[i]]; i = p; }
          return i;
        };
        const pop = () => {
          const top = h[0], last = h.pop();
          if (h.length) {
            h[0] = last;
            let i = 0;
            for (;;) {
              const l = 2 * i + 1, r = l + 1;
              let b = i;
              if (l < h.length && less(h[l], h[b])) b = l;
              if (r < h.length && less(h[r], h[b])) b = r;
              if (b === i) break;
              [h[i], h[b]] = [h[b], h[i]];
              i = b;
            }
          }
          return top;
        };
        const placed = [];        // {id, start, end, lane}
        let roomsUsed = 0;

        const views = (o) => {
          o = o || {};
          const im = {};
          for (const p of placed) im[p.id] = "done";
          Object.assign(im, o.inMarks || {});
          return [
            { id: "in", type: "intervals", label: o.sorted ? "meetings (sorted by start)" : "meetings", axis: axis,
              items: items.map((it, k) => ({ id: it.id, start: it.start, end: it.end, label: fmt(it.start, it.end), lane: k })),
              marks: im, cursor: o.cursor },
            { id: "rooms", type: "intervals", label: "rooms (one row per room)", axis: axis,
              items: placed.map((p) => ({ id: p.id, start: p.start, end: p.end, label: fmt(p.start, p.end), lane: p.lane })),
              marks: o.roomMarks || {}, cursor: o.cursor },
            { id: "ends", type: "heap", kind: "min", label: "ends: busy rooms' end times", values: h.map((x) => x.end), marks: o.heapMarks || {} },
            { id: "size", type: "calc", label: "ends.size() = rooms in use", value: h.length },
          ];
        };

        frame({
          line: 1, title: "The meetings",
          t: raw.length ? `${raw.length} meeting${raw.length > 1 ? "s" : ""} in the order given, one per row.` : "There are no meetings, so no rooms are needed.",
          vars: { "intervals.size()": raw.length },
          views: views(),
          layout: "rows",
        });
        items = items.slice().sort((x, y) => x.start - y.start || x.end - y.end);
        frame({
          line: [2, 3], title: "Sort by start, empty heap",
          t: "Sort by start time so we hand out rooms in the order meetings begin. The min-heap <code>ends</code> holds the end time of every room in use; its top is the room that frees up first.",
          tip: "Only the earliest-ending room matters. If even that one is still busy when a meeting starts, every other room is busy too.",
          vars: { "intervals.size()": raw.length, "ends.size()": 0 },
          views: views({ sorted: true }),
        });

        const lastOfRoom = {};    // room -> placed id
        let reuseTip = false, newTip = false;
        for (const iv of items) {
          if (h.length && h[0].end <= iv.start) {
            const topEnd = h[0].end;
            const freed = pop();
            const at = push({ end: iv.end, room: freed.room });
            placed.push({ id: iv.id, start: iv.start, end: iv.end, lane: freed.room });
            const prevId = lastOfRoom[freed.room];
            lastOfRoom[freed.room] = iv.id;
            frame({
              line: [5, 6], title: `Reuse room ${freed.room + 1}`,
              t: `${fmt(iv.start, iv.end)} starts at ${iv.start}. The earliest end in the heap is ${topEnd} ≤ ${iv.start}, so room ${freed.room + 1} is free. Pop ${topEnd} and push ${iv.end}: same room, new end time. Rooms in use stay at ${h.length}.`,
              tip: reuseTip ? undefined : "Pop then push keeps the heap size equal to the number of rooms in use. The size only grows when no room is free.",
              vars: { "iv[0]": iv.start, "iv[1]": iv.end, "ends.top()": h[0].end, "ends.size()": h.length },
              views: views({ sorted: true, cursor: iv.start, inMarks: { [iv.id]: "hot" }, roomMarks: Object.assign(prevId ? { [prevId]: "dim" } : {}, { [iv.id]: "new" }), heapMarks: { [at]: "new" } }),
              moves: [{ from: ["in", iv.id], to: ["rooms", iv.id], label: `room ${freed.room + 1}` }],
            });
            reuseTip = true;
          } else {
            const topEnd = h.length ? h[0].end : null;
            const room = roomsUsed++;
            const at = push({ end: iv.end, room: room });
            placed.push({ id: iv.id, start: iv.start, end: iv.end, lane: room });
            lastOfRoom[room] = iv.id;
            frame({
              line: [5, 6], title: topEnd === null ? "First meeting: room 1" : `All busy: open room ${room + 1}`,
              t: topEnd === null
                ? `The heap is empty, so ${fmt(iv.start, iv.end)} opens room 1. Push its end ${iv.end}.`
                : `${fmt(iv.start, iv.end)} starts at ${iv.start}, but the earliest a room frees up is ${topEnd}, which is later. Every room is busy, so open room ${room + 1} and push ${iv.end}. Rooms in use: ${h.length}.`,
              tip: topEnd !== null && !newTip ? "The heap size at its peak is the answer: the most meetings that were running at one moment." : undefined,
              vars: { "iv[0]": iv.start, "iv[1]": iv.end, "ends.top()": h[0].end, "ends.size()": h.length },
              views: views({ sorted: true, cursor: iv.start, inMarks: { [iv.id]: "hot" }, roomMarks: { [iv.id]: "new" }, heapMarks: Object.assign(topEnd === null ? {} : { 0: "warn" }, { [at]: "new" }) }),
              moves: [{ from: ["in", iv.id], to: ["rooms", iv.id], label: `room ${room + 1}` }],
            });
            if (topEnd !== null) newTip = true;
          }
        }

        frame({
          line: 8, title: `Return ${h.length}`,
          t: raw.length
            ? `Every meeting has a room. The heap holds one end time per room ever opened, so <b>${h.length}</b> room${h.length === 1 ? "" : "s"} are enough.`
            : "No meetings, so the heap is empty and the answer is <b>0</b>.",
          tip: "O(n log n) time: the sort, plus one push and at most one pop per meeting. O(n) space for the heap.",
          vars: { "ends.size()": h.length },
          views: views({ sorted: true }),
        });
        if (total > 40) rec.truncated(total - 40);
        return h.length;
      },
      expect: [
        [{ intervals: "0,30;5,10;15,20" }, 2],
        [{ intervals: "7,10;2,4" }, 1],
        [{ intervals: "" }, 0],
        [{ intervals: "1,5;5,10" }, 1],
        [{ intervals: "1,10;2,9;3,8;4,7" }, 4],
        [{ intervals: "1,3;2,4;3,5;4,6" }, 2],
      ],
    },
  ],

  explain: {
    plain: "Interval problems give you ranges <code>[start, end]</code> and ask about how they overlap. Almost every one starts by sorting, by start time to merge or count rooms, by end time to keep the most non-overlapping ranges, and then sweeps left to right once.",
    spot: [
      "The input is a list of pairs: meetings, bookings, ranges, balloons, time slots.",
      "The question asks to merge, insert, remove the fewest, count rooms, or find free time.",
      "\"Overlap\" or \"conflict\" appears, and you need a rule for touching ends (does <code>[1,4]</code> overlap <code>[4,5]</code>?).",
      "You need the number of ranges active at one moment: a heap of end times or a sweep over sorted starts and ends.",
      "Comparing every pair would be O(n²), and after sorting only neighbours matter.",
    ],
    notWhen: [
      "The ranges are queried many times with updates in between (\"how many intervals cover x\" after each insert). Use a segment tree, a Fenwick tree or an ordered map.",
      "The ranges are subarrays of one array and you want a sum or a count over them. Use prefix sums or a sliding window.",
    ],
    template: [
      "// Merge: sort by start, then extend the last group or open a new one.",
      "vector<vector<int>> mergeAll(vector<vector<int>> iv) {",
      "    sort(iv.begin(), iv.end());",
      "    vector<vector<int>> out;",
      "    for (auto& cur : iv) {",
      "        if (!out.empty() && cur[0] <= out.back()[1])",
      "            out.back()[1] = max(out.back()[1], cur[1]);",
      "        else",
      "            out.push_back(cur);",
      "    }",
      "    return out;",
      "}",
      "",
      "// Most overlapping at once: sweep +1 at each start, -1 at each end.",
      "int maxActive(const vector<vector<int>>& iv) {",
      "    vector<pair<int, int>> ev;",
      "    for (auto& p : iv) { ev.push_back({p[0], +1}); ev.push_back({p[1], -1}); }",
      "    sort(ev.begin(), ev.end());   // at equal times, -1 sorts before +1",
      "    int cur = 0, best = 0;",
      "    for (auto& e : ev) { cur += e.second; best = max(best, cur); }",
      "    return best;",
      "}",
    ],
    templateNotes: [
      "Sort by start for merging and room counting. Sort by end when you want to keep the most non-overlapping ranges (LC 435).",
      "The merge test <code>cur[0] &lt;= out.back()[1]</code> treats touching ends as overlapping. Use <code>&lt;</code> if touching should stay apart.",
      "Always take <code>max</code> of the two ends: a later interval can sit fully inside the current group.",
      "The event sweep sorts <code>-1</code> before <code>+1</code> at the same time, so a meeting that ends at 10 frees its room for one that starts at 10.",
    ],
    variants: [
      ["Merge or insert", "Sort by start, extend or push", "56, 57"],
      ["Remove fewest / keep most", "Sort by end, keep each range that starts after the last kept end", "435, 452"],
      ["Rooms / max overlap", "Min-heap of end times, or a +1/-1 event sweep", "253, 1094"],
      ["Rooms with rules", "Two heaps: free rooms by number and busy rooms by end time", "2402"],
    ],
    mistakes: [
      "Forgetting to sort, or sorting by end when the merge needs start order.",
      "Writing <code>out.back()[1] = cur[1]</code> instead of <code>max</code>, which shrinks a group when the new interval sits inside it.",
      "Getting touching ends wrong: <code>&lt;</code> versus <code>&lt;=</code> decides whether <code>[1,4]</code> and <code>[4,5]</code> merge or share a room.",
      "In Meeting Rooms II, popping every free room in a loop and then using the heap size at the end. The answer is the peak, so pop at most one per meeting.",
      "In the event sweep, letting a start sort before an end at the same time, which counts one room too many.",
    ],
    complexity: [
      ["Merge intervals", "O(n log n)", "O(n)", "Sort, then one pass; the output can hold n intervals."],
      ["Meeting rooms with a min-heap", "O(n log n)", "O(n)", "Sort, then one push and at most one pop per meeting."],
      ["Event sweep (+1/-1)", "O(n log n)", "O(n)", "2n events sorted once, then one pass."],
      ["Compare every pair", "O(n²)", "O(1)", "What sorting saves you."],
    ],
    sayIt: "When the input is a list of start and end pairs and the question is about overlap, I sort first. For merging I sort by start. Then I walk the list keeping the last merged group. If the next interval starts at or before that group's end, it overlaps, so I stretch the end to the max of the two ends. Otherwise there is a gap, the old group is final, and I push a new one. Sorting is what makes one pass enough, because anything that overlaps the current group must come right after it. For the number of rooms, I also sort by start and keep a min-heap of end times for rooms in use. If the earliest end is at or before the new start, that room is free, so I pop it before I push the new end. The heap size at the end is the answer. Both are O(n log n) time for the sort and O(n) space. I always ask whether touching ends count as overlapping, because that decides less-than versus less-or-equal.",
    followups: [
      ["Can you count rooms without a heap?", "Yes. Sort the starts and the ends separately and walk both with two pointers: a start before the next end needs a new room, otherwise one room frees up. Same O(n log n)."],
      ["How do you insert one new interval into a sorted, merged list (LC 57)?", "Copy every interval that ends before the new start, merge every one that overlaps it into one by taking min start and max end, then copy the rest. O(n), no sort needed."],
      ["What changes if you must keep the most intervals with no overlap?", "Sort by end, not start, and keep each interval that starts at or after the last kept end. The earliest finish leaves the most room (LC 435)."],
      ["What if intervals arrive one at a time and you must answer after each?", "Keep them in an ordered map keyed by start; on insert, merge with the neighbours around the new start. Each insert is O(log n) plus the intervals it absorbs."],
    ],
    rubric: {
      strong: [
        "Said which key to sort by and why one pass is enough after the sort.",
        "Wrote the extend-or-push (or heap pop-then-push) loop with max for the end and a deliberate choice of < or <= for touching ends.",
        "Gave O(n log n) time and O(n) space, and tested nested intervals, touching ends and an empty list.",
      ],
      weak: [
        "Compared every pair, or forgot to sort.",
        "Overwrote the end instead of taking the max, or got touching ends wrong without asking.",
        "Could not explain why the heap size (or the peak of the sweep) is the number of rooms.",
      ],
    },
  },

  quiz: [
    ["After sorting by start, the last merged group is <code>[1,10]</code> and the next interval is <code>[2,5]</code>. What should <code>out.back()</code> become?",
      ["[2,5]", "[1,5]", "[1,10]", "[1,10] and [2,5] as two groups"],
      2, "They overlap, and the new end is max(10, 5) = 10. Writing the new end directly would wrongly shrink the group to [1,5]."],
    ["In Meeting Rooms II, the heap of end times is <code>{10, 30}</code> and the next meeting is <code>[10, 20]</code>. What happens?",
      ["Pop 10, push 20: the room that ended at 10 is reused", "Push 20: a meeting at 10 cannot use a room that ends at 10", "Pop both 10 and 30, then push 20", "Nothing, because 20 is less than 30"],
      0, "A meeting may start when another ends, so ends.top() = 10 ≤ 10 frees that room. The heap stays at size 2."],
    ["You want to remove the fewest intervals so the rest do not overlap. Which sort order makes the greedy pass correct?",
      ["By start, ascending", "By length, shortest first", "By start, descending", "By end, ascending"],
      3, "Keeping the interval that finishes earliest leaves the most room for the rest. Sorting by start can keep one long interval that blocks many short ones."],
  ],

  drills: [
    { prompt: "Given a list of time ranges, combine every pair that overlaps and return the combined list.",
      answer: "intervals", distractors: ["greedy", "two-pointers", "prefix-sum-hashing"],
      why: "Pairs of start and end that overlap: sort by start, then extend the last range or start a new one." },
    { prompt: "Given meeting times, return the smallest number of conference rooms needed so no two meetings in one room clash.",
      answer: "intervals", distractors: ["heaps", "greedy", "graphs-bfs-dfs"],
      why: "The answer is the most meetings running at once: sort by start and keep a min-heap of end times, or sweep +1/-1 events." },
    { prompt: "You are given a sorted list of non-overlapping ranges and one new range. Add it and return the list, still sorted and with no overlaps.",
      answer: "intervals", distractors: ["binary-search", "linked-lists", "two-pointers"],
      why: "Copy the ranges that end before it, absorb the ones that overlap it by widening its start and end, then copy the rest." },
    { prompt: "Each person has a list of busy time ranges. Return the ranges of time when everyone is free.",
      answer: "intervals", distractors: ["heaps", "sliding-window", "dp-2d"],
      why: "Merge all the busy ranges after sorting by start; the gaps between merged ranges are the free times." },
    { prompt: "Given two lists of closed ranges, each sorted and non-overlapping, return the ranges where the two lists overlap.",
      answer: "intervals", distractors: ["two-pointers", "binary-search", "prefix-sum-hashing"],
      why: "The overlap of two ranges is [max of starts, min of ends] when that is not empty; walk both lists and advance the one that ends first." },
    { prompt: "A car has some seats. Each trip picks up a number of passengers at one point and drops them at a later point. Can the car do every trip without going over capacity?",
      answer: "intervals", distractors: ["greedy", "heaps", "dp-knapsack"],
      why: "Each trip is a range with a weight. Sweep the pick-up and drop-off events in order and check the running load never exceeds capacity." },
  ],

  flashcards: [
    { id: "iv-lc56", front: "Merge Intervals (LC 56): time and space?", back: "O(n log n) time for the sort, then O(n) for one pass. O(n) space for the output." },
    { id: "iv-lc253", front: "Meeting Rooms II (LC 253) with a min-heap of end times: time and space?", back: "O(n log n) time: sort plus one push and at most one pop per meeting. O(n) space for the heap." },
    { id: "iv-sweep", front: "Max overlap with a +1/-1 event sweep: time and space?", back: "O(n log n) time to sort 2n events, O(n) space for the events." },
    { id: "iv-lc57", front: "Insert Interval (LC 57) into a sorted, merged list: time and space?", back: "O(n) time, no sort needed: copy, absorb the overlapping ones, copy the rest. O(n) space for the output." },
    { id: "iv-lc435", front: "Non-overlapping Intervals (LC 435), fewest to remove: time and space?", back: "O(n log n) time: sort by end, then keep each interval that starts at or after the last kept end. O(1) extra space." },
  ],

  problems: [56, 57, 435, 253, 2402],
});
