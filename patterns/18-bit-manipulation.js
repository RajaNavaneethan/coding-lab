// Pattern 18: Bit Manipulation. Writer D.
// Demo 1 "count-bits" (LC 191, n & (n - 1)), demo 2 "single-number" (LC 136, XOR).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "bit-manipulation",
  num: 18,
  title: "Bit Manipulation",
  summary: "Treat an integer as a row of 0/1 switches and use AND, OR, XOR and shifts to test, flip or cancel them in O(1) each.",
  tags: ["bits", "xor", "and", "mask", "shift", "popcount", "power of two"],

  demos: [
    {
      id: "count-bits",
      title: "Number of 1 Bits",
      lc: 191,
      problem: "Given an unsigned 32-bit integer <code>n</code>, return how many of its bits are 1. <code>n = 11</code> (binary <code>1011</code>) gives <code>3</code>. A negative value you type is read as its 32-bit pattern, so <code>-1</code> gives <code>32</code>.",
      code: [
        "int hammingWeight(uint32_t n) {",
        "    int count = 0;",
        "    while (n != 0) {",
        "        n &= n - 1;",
        "        count++;",
        "    }",
        "    return count;",
        "}",
      ],
      fields: [{ key: "n", label: "n", type: "int", value: "11" }],
      run(input, rec) {
        const v = input.n;
        if (v < -2147483648 || v > 4294967295) { rec.error("n must fit in 32 bits (between -2147483648 and 4294967295)."); return null; }
        let n = v >>> 0;
        const bitLen = n ? Math.floor(Math.log2(n)) + 1 : 1;
        const width = Math.min(32, Math.max(8, Math.ceil(bitLen / 4) * 4));
        let count = 0;
        const low = (x) => { let i = 0; while (x > 0 && Math.floor(x / 2 ** i) % 2 === 0) i++; return i; };
        const ones = (x) => { const m = {}; for (let i = 0; i < width; i++) if (Math.floor(x / 2 ** i) % 2) m[i] = "good"; return m; };
        let shown = 0, hidden = 0;
        const frame = (f) => { if (shown < 40) { rec.frame(f); shown++; } else hidden++; };

        const views = (old, o) => {
          o = o || {};
          return [
            { id: "old", type: "bits", label: "n before this line", value: old, width: width, marks: o.oldMarks || {} },
            { id: "nm1", type: "bits", label: "n - 1 (lowest 1 and the 0s below it flip)", value: old ? old - 1 : 0, width: width, marks: o.nm1Marks || {} },
            { id: "n", type: "bits", label: "n = n & (n - 1)", value: n, width: width, marks: o.nMarks || {} },
            { id: "count", type: "calc", label: "count", value: count },
          ];
        };

        const dimAll = () => { const m = {}; for (let i = 0; i < width; i++) m[i] = "dim"; return m; };
        frame({
          line: 2, title: "count = 0",
          t: `<code>n = ${n}</code>, binary <code>${n.toString(2)}</code>. Start with <code>count = 0</code>. Each pass of the loop will clear exactly one 1-bit.`,
          tip: "Subtracting 1 turns the lowest 1 into 0 and every 0 below it into 1. AND-ing with the original then wipes out just that lowest 1.",
          vars: { n: n, count: count },
          views: views(n, { oldMarks: ones(n), nm1Marks: dimAll(), nMarks: ones(n) }),
        });

        let andTip = false, prevOld = n;
        while (n !== 0) {
          const old = n;
          prevOld = old;
          const lb = low(old);
          n = (old & (old - 1)) >>> 0;
          const nm1 = {};
          for (let i = 0; i <= lb; i++) nm1[i] = "in";
          const nm = Object.assign(ones(n), { [lb]: "bad" });
          frame({
            line: 4, title: `Clear bit ${lb}`,
            t: `The lowest 1 in <code>${old.toString(2)}</code> is bit ${lb}. <code>n - 1 = ${(old - 1).toString(2) || "0"}</code> flips ${lb ? `bits 0 to ${lb}` : "bit 0"}. Their AND keeps every higher bit and drops bit ${lb}: <code>n = ${n}</code>.`,
            tip: andTip ? undefined : "The loop runs once per 1-bit, not once per bit position. For a sparse number like 2^31 that is 1 pass instead of 32.",
            vars: { n: n, "old n": old, "bit cleared": lb, count: count },
            views: views(old, { oldMarks: Object.assign(ones(old), { [lb]: "warn" }), nm1Marks: nm1, nMarks: nm }),
            moves: [{ from: ["old", lb], to: ["n", lb], label: "0" }],
          });
          andTip = true;
          count++;
          frame({
            line: 5, title: `count = ${count}`,
            t: `One 1-bit removed, so <code>count = ${count}</code>. ${n ? `<code>n = ${n}</code> still has 1-bits, so the loop goes again.` : "<code>n</code> is now 0, so the loop stops."}`,
            vars: { n: n, count: count },
            views: views(old, { oldMarks: ones(old), nm1Marks: nm1, nMarks: ones(n) }),
            moves: [{ from: ["n", lb], to: ["count", 0], label: "+1" }],
          });
        }

        frame({
          line: 7, title: `Return ${count}`,
          t: `<code>n</code> reached 0 after ${count} pass${count === 1 ? "" : "es"}, one per 1-bit. Return <b>${count}</b>.`,
          tip: "O(k) time where k is the number of 1-bits (at most 32), O(1) space. In real code <code>__builtin_popcount</code> or <code>std::popcount</code> does this in one instruction.",
          vars: { n: n, count: count },
          views: views(prevOld, { oldMarks: ones(prevOld), nMarks: dimAll() }),
        });
        if (hidden) rec.truncated(hidden);
        return count;
      },
      expect: [
        [{ n: "11" }, 3],
        [{ n: "128" }, 1],
        [{ n: "4294967293" }, 31],
        [{ n: "0" }, 0],
        [{ n: "-1" }, 32],
        [{ n: "2147483648" }, 1],
      ],
    },
    {
      id: "single-number",
      title: "Single Number",
      lc: 136,
      problem: "Every number in <code>nums</code> appears twice except one. Return the one that appears once, in O(n) time and O(1) extra space. <code>[4,1,2,1,2]</code> gives <code>4</code>.",
      code: [
        "int singleNumber(vector<int>& nums) {",
        "    int x = 0;",
        "    for (int v : nums)",
        "        x ^= v;",
        "    return x;",
        "}",
      ],
      fields: [{ key: "nums", label: "nums", type: "ints", value: "4,1,2,1,2" }],
      run(input, rec) {
        const nums = input.nums;
        if (!nums.length) { rec.error("Give at least one number."); return null; }
        if (nums.some((v) => v < -2147483648 || v > 2147483647)) { rec.error("Each number must fit in a 32-bit int."); return null; }
        const neg = nums.some((v) => v < 0);
        const u = (v) => v >>> 0;
        const maxU = Math.max(...nums.map(u));
        const bitLen = maxU ? Math.floor(Math.log2(maxU)) + 1 : 1;
        const width = neg ? 32 : Math.min(32, Math.max(4, Math.ceil(bitLen / 4) * 4));
        let x = 0;
        let shown = 0, hidden = 0;
        const frame = (f) => { if (shown < 40) { rec.frame(f); shown++; } else hidden++; };
        const ones = (val) => { const m = {}; for (let i = 0; i < width; i++) if (Math.floor(u(val) / 2 ** i) % 2) m[i] = "good"; return m; };
        const seen = new Map();

        const views = (k, v, o) => {
          o = o || {};
          const am = {};
          for (let j = 0; j < nums.length; j++) if (k !== null && j < k) am[j] = "done";
          Object.assign(am, o.arrMarks || {});
          return [
            { id: "nums", type: "array", label: "nums", values: nums.slice(), pointers: k === null ? {} : { v: k }, marks: am },
            { id: "v", type: "bits", label: "v", value: u(v), width: width, marks: o.vMarks || {} },
            { id: "x", type: "bits", label: "x (running XOR)", value: u(x), width: width, marks: o.xMarks || {} },
            { id: "xd", type: "calc", label: "x as int", value: x },
          ];
        };

        frame({
          line: 2, title: "x = 0",
          t: "Start with <code>x = 0</code>. XOR-ing with 0 changes nothing, so 0 is the right starting value.",
          tip: "XOR rules: <code>a ^ a = 0</code>, <code>a ^ 0 = a</code>, and order does not matter. So every pair cancels and only the single number is left.",
          vars: { v: "-", x: x },
          views: views(null, 0, {}),
        });

        let cancelTip = false;
        for (let k = 0; k < nums.length; k++) {
          const v = nums[k];
          const before = x;
          x = x ^ v;
          const flipped = {};
          for (let i = 0; i < width; i++) if (Math.floor(u(v) / 2 ** i) % 2) flipped[i] = Math.floor(u(x) / 2 ** i) % 2 ? "new" : "bad";
          seen.set(v, (seen.get(v) || 0) + 1);
          const second = seen.get(v) % 2 === 0;
          const firstIdx = second ? nums.indexOf(v) : -1;
          let tip;
          if (second && !cancelTip) { tip = `This ${v} meets the ${v} from index ${firstIdx}. Their bits flip back, so the pair adds nothing to <code>x</code>.`; cancelTip = true; }
          frame({
            line: 4, title: `x ^= ${v}`,
            t: `<code>x = ${before} ^ ${v} = ${x}</code>. Each 1-bit of ${v} flips the same bit of <code>x</code>. ${second ? `${v} has now been seen an even number of times, so its bits have flipped there and back.` : `${v} has been seen an odd number of times, so its bits are now in <code>x</code>.`}`,
            tip: tip,
            vars: { v: v, x: x },
            views: views(k, v, { arrMarks: Object.assign({ [k]: "hot" }, second ? { [firstIdx]: "dim" } : {}), vMarks: ones(v), xMarks: Object.assign(ones(x), flipped) }),
            moves: [{ from: ["nums", k], to: ["x", 0], label: "^" + v }],
          });
        }

        frame({
          line: 5, title: `Return ${x}`,
          t: `Every pair cancelled itself. What is left in <code>x</code> is the number that appears once: <b>${x}</b>.`,
          tip: "O(n) time, O(1) space, and no sorting or hash set. It only works because every other number appears an even number of times.",
          vars: { x: x },
          views: views(null, nums[nums.length - 1], { xMarks: ones(x), arrMarks: Object.fromEntries(nums.map((w, j) => [j, w === x ? "good" : "dim"])) }),
        });
        if (hidden) rec.truncated(hidden);
        return x;
      },
      expect: [
        [{ nums: "4,1,2,1,2" }, 4],
        [{ nums: "2,2,1" }, 1],
        [{ nums: "1" }, 1],
        [{ nums: "-1,3,3" }, -1],
        [{ nums: "7,0,7" }, 0],
        [{ nums: "5,9,9,6,5" }, 6],
      ],
    },
  ],

  explain: {
    plain: "Bit manipulation reads an integer as a row of bits and uses <code>&amp;</code>, <code>|</code>, <code>^</code>, <code>~</code> and shifts to test, set, clear or cancel them. A few identities do most of the work: <code>x ^ x = 0</code>, <code>x &amp; (x - 1)</code> clears the lowest 1, and <code>x &amp; -x</code> keeps only the lowest 1.",
    spot: [
      "The statement says \"without extra space\" and every value but one appears twice (or a fixed number of times).",
      "It talks about binary, set bits, powers of two, or flipping bits.",
      "It forbids <code>+</code>, <code>-</code>, <code>*</code> or <code>/</code> and asks you to do arithmetic anyway (LC 371).",
      "The input is small (n ≤ 20) and you need every subset: each subset is a bitmask from 0 to 2^n - 1.",
      "You need a compact set of up to 32 or 64 flags, like letters used in a word.",
    ],
    notWhen: [
      "The values repeat in no fixed pattern and you need counts. Use a hash map.",
      "n is larger than about 20 and the bitmask would enumerate 2^n subsets. Use DP or backtracking with pruning.",
    ],
    template: [
      "// Single-bit tools (i is a bit index, 0 = least significant).",
      "bool test(unsigned x, int i)   { return (x >> i) & 1u; }",
      "unsigned setBit(unsigned x, int i)   { return x | (1u << i); }",
      "unsigned clearBit(unsigned x, int i) { return x & ~(1u << i); }",
      "unsigned flipBit(unsigned x, int i)  { return x ^ (1u << i); }",
      "",
      "// Whole-number tricks.",
      "unsigned lowestOne(unsigned x)      { return x & (~x + 1); }    // x & -x",
      "unsigned dropLowestOne(unsigned x)  { return x & (x - 1); }",
      "bool isPowerOfTwo(unsigned x)       { return x && !(x & (x - 1)); }",
      "",
      "int countOnes(unsigned x) {",
      "    int c = 0;",
      "    for (; x; x &= x - 1) c++;",
      "    return c;",
      "}",
      "",
      "// Every subset of n items as a mask 0 .. 2^n - 1.",
      "int countSubsetsWithSum(const vector<int>& a, int target) {",
      "    int n = a.size(), hits = 0;",
      "    for (int mask = 0; mask < (1 << n); mask++) {",
      "        int sum = 0;",
      "        for (int i = 0; i < n; i++) if (mask >> i & 1) sum += a[i];",
      "        hits += (sum == target);",
      "    }",
      "    return hits;",
      "}",
    ],
    templateNotes: [
      "Use <code>unsigned</code> (or <code>uint32_t</code>) for bit work. Right-shifting a negative <code>int</code> copies the sign bit. <code>1 &lt;&lt; 31</code> on an <code>int</code> gives a negative number and <code>1 &lt;&lt; 32</code> is undefined; use <code>1u</code> or <code>1ULL</code>.",
      "<code>x &amp; (x - 1)</code> removes the lowest 1. Looping on it counts 1-bits in O(number of ones) and tests powers of two in O(1).",
      "<code>x &amp; -x</code> keeps only the lowest 1. With unsigned values write it as <code>x &amp; (~x + 1)</code> to avoid a sign warning.",
      "Subset masks: bit i of <code>mask</code> says whether item i is in. The outer loop runs 2^n times, so keep n small.",
    ],
    variants: [
      ["XOR cancel", "Pairs cancel, the odd one out is left", "136, 268, 389"],
      ["Clear lowest bit", "Count ones or test a power of two", "191, 231, 338"],
      ["Carry by hand", "Add with XOR (sum) and AND shifted left (carry)", "371"],
      ["Bitmask as a set", "Subsets, visited-state DP, letters used", "78, 1286, 847"],
    ],
    mistakes: [
      "Shifting signed ints: <code>x &gt;&gt; 1</code> on a negative <code>int</code> never reaches 0, so a <code>while (x)</code> loop spins forever. Use <code>uint32_t</code>.",
      "Writing <code>1 &lt;&lt; 31</code> or <code>1 &lt;&lt; 32</code> on an <code>int</code>. The first gives a negative number and the second is undefined; use <code>1u</code> or <code>1ULL</code>.",
      "Missing brackets: <code>x &amp; 1 == 0</code> parses as <code>x &amp; (1 == 0)</code>. Write <code>(x &amp; 1) == 0</code>.",
      "Using XOR cancel when the others appear three times (LC 137). XOR only cancels even counts; count each bit mod 3 instead.",
      "Forgetting the carry loop in LC 371 must stop when the carry is 0, and that the carry should be shifted as unsigned.",
    ],
    complexity: [
      ["Count ones with x & (x - 1)", "O(k), k = number of 1-bits", "O(1)", "Each pass clears one 1-bit; at most 32 passes."],
      ["XOR all values (LC 136)", "O(n)", "O(1)", "One XOR per value, no extra storage."],
      ["Counting Bits 0..n (LC 338)", "O(n)", "O(n) for the output", "dp[i] = dp[i & (i - 1)] + 1 reuses an earlier answer."],
      ["All subsets by mask", "O(2^n · n)", "O(1) per subset", "2^n masks, n bit tests each."],
    ],
    sayIt: "When a problem mentions binary, set bits, powers of two, or asks for O(1) space while every value but one repeats, I think about bit tricks. For Single Number I XOR everything into one variable. XOR of a number with itself is 0, XOR with 0 changes nothing, and order does not matter, so all the pairs cancel and the single value is left. That is O(n) time and O(1) space. For Number of 1 Bits I use n and n minus 1. Subtracting 1 flips the lowest 1-bit to 0 and the zeros below it to 1, so the AND clears exactly that one bit. I loop until n is 0 and count the passes, which is one pass per set bit. I always work with unsigned 32-bit values, because shifting a negative int keeps the sign bit and can loop forever, and I bracket my bit tests because the and operator binds weaker than equals.",
    followups: [
      ["What if every other number appears three times (LC 137)?", "XOR no longer cancels. Count how many numbers have each bit set, take each count mod 3, and rebuild the answer from the leftover bits. O(32n) time, O(1) space."],
      ["Two numbers appear once and the rest twice (LC 260)?", "XOR everything to get a ^ b. Take its lowest 1-bit; a and b differ there. Split the numbers by that bit and XOR each group to get a and b."],
      ["How do you count bits for every number from 0 to n?", "dp[i] = dp[i & (i - 1)] + 1, or dp[i] = dp[i >> 1] + (i & 1). One pass, O(n)."],
      ["How would you add two integers without + or -?", "Repeat: sum = a ^ b (add without carry), carry = (a & b) << 1, until carry is 0. Do the shift on unsigned to avoid overflow on negatives."],
    ],
    rubric: {
      strong: [
        "Named the identity that solves it (x ^ x = 0, x & (x - 1), x & -x) and explained why it works on a small binary example.",
        "Used unsigned types and brackets around bit tests, with a loop that is sure to end.",
        "Stated time in terms of bits or n and O(1) space, and tested 0, a power of two and a negative or all-ones value.",
      ],
      weak: [
        "Reached for a hash map or sort when the problem asked for O(1) space, without seeing the bit trick.",
        "Shifted a signed negative number, wrote 1 << 31 on an int, or got operator precedence wrong.",
        "Could not explain why the trick works, only that it does.",
      ],
    },
  },

  quiz: [
    ["What does <code>n &amp; (n - 1)</code> do to <code>n = 12</code> (binary <code>1100</code>)?",
      ["Gives 1000: it clears the lowest 1-bit", "Gives 0100: it keeps only the lowest 1-bit", "Gives 1011: it subtracts 1", "Gives 0011: it flips every bit"],
      0, "12 - 1 = 11 = 1011. 1100 & 1011 = 1000 = 8. The lowest 1 (bit 2) is gone and the higher bit stays."],
    ["Why does XOR-ing every value find the single number in <code>[4,1,2,1,2]</code>?",
      ["XOR sorts the values so pairs sit together", "XOR of a value with itself is 0 and order does not matter, so pairs cancel", "XOR adds the values and the single one is the odd sum", "XOR keeps the largest value"],
      1, "4 ^ 1 ^ 2 ^ 1 ^ 2 = 4 ^ (1 ^ 1) ^ (2 ^ 2) = 4 ^ 0 ^ 0 = 4."],
    ["A loop does <code>while (x) { c += x &amp; 1; x &gt;&gt;= 1; }</code> with <code>int x = -8</code>. What happens?",
      ["It returns 1", "It returns 29", "It returns 32", "It never ends, because shifting a negative int copies the sign bit"],
      3, "On common compilers, x >> 1 on a negative int is an arithmetic shift, so x reaches -1 and stays there. Use uint32_t for bit loops."],
  ],

  drills: [
    { prompt: "An array holds the numbers 0 to n with exactly one missing. Find the missing number using O(1) extra space.",
      answer: "bit-manipulation", distractors: ["sliding-window", "binary-search", "prefix-sum-hashing"],
      why: "XOR every index 0..n with every value; each present number cancels with its index and the missing one is left. (The sum formula also works.)" },
    { prompt: "Return true if a given integer is a power of two. Do it in constant time.",
      answer: "bit-manipulation", distractors: ["two-pointers", "binary-search", "greedy"],
      why: "A power of two has exactly one 1-bit, so n > 0 and n & (n - 1) == 0." },
    { prompt: "For every number from 0 to n, return how many 1s are in its binary form.",
      answer: "bit-manipulation", distractors: ["sliding-window", "math-design", "prefix-sum-hashing"],
      why: "i & (i - 1) drops one bit from i, so ans[i] = ans[i & (i - 1)] + 1. The binary form is the whole question." },
    { prompt: "Add two integers without using the + or - operators.",
      answer: "bit-manipulation", distractors: ["math-design", "two-pointers", "dp-1d"],
      why: "a ^ b is the sum without carries and (a & b) << 1 is the carry; repeat until the carry is 0." },
    { prompt: "Every number in an array appears three times except one, which appears once. Find it in linear time and constant space.",
      answer: "bit-manipulation", distractors: ["prefix-sum-hashing", "math-design", "heaps"],
      why: "Count how many numbers have each bit set; the counts that are not a multiple of 3 are the bits of the answer." },
    { prompt: "Two strings differ only by one extra letter added somewhere in the second one. Return that letter.",
      answer: "bit-manipulation", distractors: ["sliding-window", "binary-search", "two-pointers"],
      why: "XOR every character of both strings; matching letters cancel in pairs and the added one is left." },
  ],

  flashcards: [
    { id: "bit-lc191", front: "Number of 1 Bits (LC 191) with n & (n - 1): time and space?", back: "O(k) time for k set bits (at most 32), O(1) space." },
    { id: "bit-lc136", front: "Single Number (LC 136) with XOR: time and space?", back: "O(n) time, O(1) space: XOR every value; pairs cancel." },
    { id: "bit-lc338", front: "Counting Bits (LC 338) for 0..n: time and space?", back: "O(n) time with dp[i] = dp[i & (i - 1)] + 1. O(n) space for the output." },
    { id: "bit-lc371", front: "Sum of Two Integers (LC 371) without + or -: time and space?", back: "O(1) time: at most 32 carry rounds for 32-bit values. O(1) space." },
    { id: "bit-masks", front: "Enumerating all subsets of n items with bitmasks: time and space?", back: "O(2^n · n) time: 2^n masks, n bit tests each. O(1) extra space per mask." },
  ],

  problems: [136, 191, 338, 371],
});
