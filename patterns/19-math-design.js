// Pattern 19: Math / Design. Writer D.
// Demo 1 "fast-power" (LC 50, binary exponentiation), demo 2 "reverse-integer" (LC 7, overflow guard).
window.CIL_PATTERNS = window.CIL_PATTERNS || [];
window.CIL_PATTERNS.push({
  id: "math-design",
  num: 19,
  title: "Math / Design",
  summary: "Use a number's own structure (its binary digits, its decimal digits, a formula) instead of brute force, and guard every step against overflow and edge values.",
  tags: ["math", "fast power", "overflow", "digits", "modulo", "design", "gcd"],

  demos: [
    {
      id: "fast-power",
      title: "Pow(x, n)",
      lc: 50,
      problem: "Compute <code>x</code> raised to the power <code>n</code>, where <code>n</code> is any 32-bit int, including negative values and <code>-2147483648</code>. <code>x = 2</code>, <code>n = 10</code> gives <code>1024</code>; <code>x = 2</code>, <code>n = -2</code> gives <code>0.25</code>.",
      code: [
        "double myPow(double x, int n) {",
        "    long long N = n;",
        "    if (N < 0) { x = 1 / x; N = -N; }",
        "    double ans = 1.0, cur = x;",
        "    while (N > 0) {",
        "        if (N & 1) ans *= cur;",
        "        cur *= cur;",
        "        N >>= 1;",
        "    }",
        "    return ans;",
        "}",
      ],
      fields: [
        { key: "x", label: "x", type: "num", value: "2" },
        { key: "n", label: "n", type: "int", value: "10" },
      ],
      run(input, rec) {
        let x = input.x;
        const n = input.n;
        if (n < -2147483648 || n > 2147483647) { rec.error("n must fit in a 32-bit int."); return null; }
        if (x === 0 && n < 0) { rec.error("0 to a negative power is undefined (division by zero)."); return null; }
        const f = (v) => {
          if (!isFinite(v)) return String(v);
          if (Number.isInteger(v) && Math.abs(v) < 1e15) return String(v);
          const a = Math.abs(v);
          return a !== 0 && (a < 1e-6 || a >= 1e15) ? v.toExponential(6) : String(+v.toPrecision(10));
        };
        let total = 0;
        const frame = (fr) => { total++; rec.frame(fr); };
        let N = n;
        const E = Math.abs(n);                 // the exponent whose bits we walk
        const bitLen = E ? Math.floor(Math.log2(E)) + 1 : 1;
        const width = Math.min(32, Math.max(4, Math.ceil(bitLen / 4) * 4));
        let ans = 1, cur = x, k = 0;
        const used = [];                       // bit indexes that went into ans

        const views = (o) => {
          o = o || {};
          const m = {};
          for (let i = 0; i < k && i < width; i++) m[i] = used.includes(i) ? "good" : "dim";
          Object.assign(m, o.bitMarks || {});
          return [
            { id: "e", type: "bits", label: "|n| in binary: bit k means 'multiply by x^(2^k)'", value: E, width: width, marks: m },
            { id: "cur", type: "calc", label: `cur = x^(2^${Math.min(k, 31)})`, value: f(cur) },
            { id: "ans", type: "calc", label: "ans", value: f(ans) },
          ];
        };

        frame({
          line: 2, title: "Copy n into a long long",
          t: `<code>N = ${n}</code>. We copy it into a <code>long long</code> first because <code>-(-2147483648)</code> does not fit in an <code>int</code>.`,
          tip: "Fast power walks the binary digits of n. x^10 = x^8 · x^2, and 10 is 1010 in binary: one multiply for each 1-bit.",
          vars: { x: f(x), N: N },
          views: views(),
        });
        if (N < 0) {
          x = 1 / x; N = -N; cur = x;
          frame({
            line: 3, title: "Negative n: flip x",
            t: `<code>n</code> is negative, and x^n = (1/x)^|n|. So <code>x = ${f(x)}</code> and <code>N = ${N}</code>.`,
            tip: n === -2147483648 ? "This is the case the long long exists for: N = 2147483648 is one more than INT_MAX." : undefined,
            vars: { x: f(x), N: N },
            views: views(),
          });
        }
        cur = x;
        frame({
          line: 4, title: "ans = 1, cur = x",
          t: `<code>ans</code> collects the product and starts at 1. <code>cur</code> starts at <code>x = ${f(x)}</code> = x^(2^0) and is squared each step, so at step k it is x^(2^k).`,
          vars: { N: N, cur: f(cur), ans: f(ans) },
          views: views(),
        });

        let skipTip = false, squareTip = false;
        while (N > 0) {
          const bit = N % 2;
          const before = ans;
          if (bit) { ans *= cur; used.push(k); }
          frame({
            line: 6, title: bit ? `Bit ${k} is 1: ans *= cur` : `Bit ${k} is 0: skip`,
            t: bit
              ? `Bit ${k} of the exponent is 1, so this power is part of the answer: <code>ans = ${f(before)} × ${f(cur)} = ${f(ans)}</code>.`
              : `Bit ${k} of the exponent is 0, so x^(2^${k}) = ${f(cur)} is not part of the answer. <code>ans</code> stays ${f(ans)}.`,
            tip: !bit && !skipTip ? "A 0-bit costs nothing but the squaring. The total work is about 2 · log2(n) multiplications, not n." : undefined,
            vars: { N: N, "N & 1": bit, cur: f(cur), ans: f(ans) },
            views: views({ bitMarks: { [k]: bit ? "new" : "hot" } }),
            moves: bit ? [{ from: ["cur", 0], to: ["ans", 0], label: "×" + f(cur) }] : undefined,
          });
          if (!bit) skipTip = true;
          const old = cur;
          cur *= cur;
          N = Math.floor(N / 2);
          k++;
          frame({
            line: [7, 8], title: N > 0 ? `Square: cur = x^(2^${k})` : "Square, N becomes 0",
            t: `<code>cur = ${f(old)}² = ${f(cur)}</code>, and <code>N &gt;&gt;= 1</code> drops the bit we just used, leaving <code>N = ${N}</code>.${N ? "" : " No bits remain, so the loop ends."}`,
            tip: !squareTip ? "Squaring doubles the exponent: x^(2^k) · x^(2^k) = x^(2^(k+1)). That is why one loop over the bits is enough." : undefined,
            vars: { N: N, cur: f(cur), ans: f(ans) },
            views: views(),
          });
          squareTip = true;
        }

        frame({
          line: 10, title: `Return ${f(ans)}`.slice(0, 32),
          t: E
            ? `Every 1-bit of ${E} (binary <code>${E.toString(2)}</code>) multiplied its power of x into <code>ans</code>. Return <b>${f(ans)}</b>.`
            : "<code>n = 0</code>, so the loop never ran. Anything to the power 0 is 1. Return <b>1</b>.",
          tip: "O(log |n|) time and O(1) space. The recursive version (half = pow(x, n/2)) is also O(log n) but uses O(log n) stack.",
          vars: { N: N, ans: f(ans) },
          views: views(),
        });
        if (total > 40) rec.truncated(total - 40);
        return ans;
      },
      expect: [
        [{ x: "2", n: "10" }, 1024, "approx"],
        [{ x: "2.1", n: "3" }, 9.261, "approx"],
        [{ x: "2", n: "-2" }, 0.25, "approx"],
        [{ x: "1", n: "-2147483648" }, 1, "approx"],
        [{ x: "5", n: "0" }, 1, "approx"],
        [{ x: "-2", n: "3" }, -8, "approx"],
        [{ x: "0.5", n: "-3" }, 8, "approx"],
      ],
    },
    {
      id: "reverse-integer",
      title: "Reverse Integer",
      lc: 7,
      problem: "Reverse the decimal digits of a 32-bit signed int <code>x</code>. If the result would not fit in 32 bits, return <code>0</code>. You may not use 64-bit integers. <code>123</code> gives <code>321</code>, <code>-123</code> gives <code>-321</code>, <code>1534236469</code> gives <code>0</code>.",
      code: [
        "int reverse(int x) {",
        "    int r = 0;",
        "    while (x != 0) {",
        "        int d = x % 10;",
        "        x /= 10;",
        "        if (r > INT_MAX / 10 || (r == INT_MAX / 10 && d > 7)) return 0;",
        "        if (r < INT_MIN / 10 || (r == INT_MIN / 10 && d < -8)) return 0;",
        "        r = r * 10 + d;",
        "    }",
        "    return r;",
        "}",
      ],
      fields: [{ key: "x", label: "x", type: "int", value: "123" }],
      run(input, rec) {
        let x = input.x;
        if (x < -2147483648 || x > 2147483647) { rec.error("x must fit in a 32-bit int."); return null; }
        const MAXD = 214748364, MIND = -214748364;
        let r = 0;
        let total = 0;
        const frame = (fr) => { total++; rec.frame(fr); };
        const digits = (v) => (v === 0 ? [] : String(Math.abs(v)).split("").map(Number));

        const views = (o) => {
          o = o || {};
          const xd = digits(x), rd = digits(r);
          return [
            { id: "x", type: "array", label: `x = ${x}${x < 0 ? " (digits of |x|)" : ""}`, values: xd, showIndex: false, marks: o.xMarks || {} },
            { id: "r", type: "array", label: `r = ${r}${r < 0 ? " (digits of |r|)" : ""}`, values: rd, showIndex: false, marks: o.rMarks || {} },
            { id: "guard", type: "calc", label: "guard: |r| must stay ≤ 214748364", value: o.guard || "-" },
          ];
        };

        frame({
          line: 2, title: "r = 0",
          t: `Start with <code>r = 0</code>. Each pass pops the last digit of <code>x</code> and pushes it onto the end of <code>r</code>.`,
          tip: "The rule says no 64-bit ints, so we cannot compute r * 10 + d and check it afterwards. We must check before the multiply.",
          vars: { x: x, r: r },
          views: views(),
        });

        let guardTip = false;
        while (x !== 0) {
          const d = x % 10;
          const xBefore = x;
          const lastIdx = digits(x).length - 1;
          x = Math.trunc(x / 10);
          frame({
            line: [4, 5], title: `Pop digit ${d}`,
            t: `<code>d = ${xBefore} % 10 = ${d}</code>${d < 0 ? " (C++ keeps the sign of x, so negative digits come out negative)" : ""}, and <code>x /= 10</code> leaves <code>x = ${x}</code>.`,
            vars: { x: x, d: d, r: r },
            views: views({ guard: `d = ${d}` }),
            moves: lastIdx >= 0 ? [{ from: ["x", lastIdx], to: ["guard", 0], label: String(d) }] : undefined,
          });
          const over = r > MAXD || (r === MAXD && d > 7);
          const under = r < MIND || (r === MIND && d < -8);
          if (over || under) {
            frame({
              line: over ? 6 : 7, title: "Would overflow: return 0",
              t: over
                ? `<code>r = ${r}</code> ${r > MAXD ? `is already above INT_MAX / 10 = 214748364` : `equals 214748364 and <code>d = ${d}</code> &gt; 7`}, so <code>r * 10 + d</code> would pass INT_MAX = 2147483647. Return <b>0</b>.`
                : `<code>r = ${r}</code> ${r < MIND ? `is already below INT_MIN / 10 = -214748364` : `equals -214748364 and <code>d = ${d}</code> &lt; -8`}, so <code>r * 10 + d</code> would pass INT_MIN = -2147483648. Return <b>0</b>.`,
              tip: "7 and -8 are the last digits of INT_MAX (2147483647) and INT_MIN (-2147483648). They decide the tie case.",
              vars: { x: x, d: d, r: r },
              views: views({ rMarks: Object.fromEntries(digits(r).map((_, i) => [i, "bad"])), guard: over ? `${r} × 10 + ${d} > INT_MAX` : `${r} × 10 + ${d} < INT_MIN` }),
            });
            if (total > 40) rec.truncated(total - 40);
            return 0;
          }
          const g = d >= 0 || r > 0 ? `${r} ≤ 214748364: safe` : `${r} ≥ -214748364: safe`;
          frame({
            line: [6, 7], title: "Guard: safe to push",
            t: `Before multiplying, check that <code>r * 10 + d</code> fits: <code>r = ${r}</code> is inside ±214748364${r === MAXD || r === MIND ? " and the digit is small enough" : ""}, so it cannot overflow.`,
            tip: guardTip ? undefined : "Check against INT_MAX / 10 before multiplying. If r is above it, r * 10 already overflows, which is undefined behaviour for a signed int in C++.",
            vars: { x: x, d: d, r: r },
            views: views({ guard: g }),
          });
          guardTip = true;
          const rOld = r;
          r = r * 10 + d;
          const rl = digits(r).length;
          frame({
            line: 8, title: `Push: r = ${r}`,
            t: `<code>r = ${rOld} × 10 + ${d} = ${r}</code>. The digit lands on the right end of <code>r</code>.`,
            vars: { x: x, d: d, r: r },
            views: views({ rMarks: rl ? { [rl - 1]: "new" } : {}, guard: g }),
            moves: rl ? [{ from: ["guard", 0], to: ["r", rl - 1], label: String(Math.abs(d)) }] : undefined,
          });
        }

        frame({
          line: 10, title: `Return ${r}`,
          t: `<code>x</code> is 0, so every digit has moved. Return <b>${r}</b>.`,
          tip: "O(log10 |x|) time, at most 10 passes for a 32-bit int, and O(1) space.",
          vars: { x: x, r: r },
          views: views({ rMarks: Object.fromEntries(digits(r).map((_, i) => [i, "good"])) }),
        });
        if (total > 40) rec.truncated(total - 40);
        return r;
      },
      expect: [
        [{ x: "123" }, 321],
        [{ x: "-123" }, -321],
        [{ x: "120" }, 21],
        [{ x: "0" }, 0],
        [{ x: "1534236469" }, 0],
        [{ x: "-2147483648" }, 0],
        [{ x: "1463847412" }, 2147483641],
        [{ x: "-1463847412" }, -2147483641],
      ],
    },
  ],

  explain: {
    plain: "Math problems are solved by using the structure of the numbers themselves: the binary digits of an exponent, the decimal digits of an int, a remainder, a formula. Design problems ask you to pick data structures so each operation hits a stated cost. Both reward careful edge cases: overflow, zero, negative values, INT_MIN.",
    spot: [
      "The input is one or two numbers, not a collection: power, square root, reverse, palindrome number, gcd.",
      "n is huge (up to 2^31 or 10^18), so anything linear in n is too slow; think logarithmic (halve or square each step).",
      "The statement mentions 32-bit limits, \"return 0 if it overflows\" or \"you may not use 64-bit integers\".",
      "\"Return the answer modulo 10^9 + 7\": keep every intermediate value reduced.",
      "\"Design a class with operations...\" plus required costs (O(1) get, top 10 recent items): pick and combine structures.",
    ],
    notWhen: [
      "The numbers sit in an array and you need ranges or counts over it. Use prefix sums, hashing or a window.",
      "A design problem is really one standard structure (LRU cache, median finder, trie). Use that pattern's template directly.",
    ],
    template: [
      "// Fast power mod m: walk the bits of e, squaring the base each step.",
      "long long powMod(long long b, long long e, long long m) {",
      "    long long r = 1 % m;",
      "    b %= m;",
      "    if (b < 0) b += m;",
      "    while (e > 0) {",
      "        if (e & 1) r = r * b % m;",
      "        b = b * b % m;",
      "        e >>= 1;",
      "    }",
      "    return r;",
      "}",
      "",
      "long long gcdLL(long long a, long long b) { return b == 0 ? a : gcdLL(b, a % b); }",
      "",
      "// Digit loop with an overflow guard checked before the multiply.",
      "bool appendDigit(int& r, int d) {      // r = r * 10 + d, or false on overflow",
      "    if (r > INT_MAX / 10 || (r == INT_MAX / 10 && d > INT_MAX % 10)) return false;",
      "    if (r < INT_MIN / 10 || (r == INT_MIN / 10 && d < INT_MIN % 10)) return false;",
      "    r = r * 10 + d;",
      "    return true;",
      "}",
    ],
    templateNotes: [
      "Fast power uses the binary digits of the exponent: a 1-bit multiplies the current square into the result. O(log e) multiplications.",
      "Reduce after every multiply when a modulus is given. With m up to about 3·10^9, <code>r * b</code> still fits in <code>long long</code>.",
      "Euclid's gcd runs in O(log min(a, b)); lcm is <code>a / gcd(a, b) * b</code>, dividing first so it does not overflow.",
      "The digit guard compares with <code>INT_MAX / 10</code> before multiplying. <code>INT_MAX % 10</code> is 7 and <code>INT_MIN % 10</code> is -8 in C++.",
    ],
    variants: [
      ["Fast power", "Huge exponent, square and multiply by bits", "50, 372, 1922"],
      ["Digit manipulation", "Pop with % 10, push with * 10, guard overflow", "7, 9, 8"],
      ["Number theory", "gcd, primes (sieve), modular arithmetic", "204, 1979, 2427"],
      ["Design", "Combine a map, a heap or a list to meet each operation's cost", "355, 146, 380"],
    ],
    mistakes: [
      "Negating <code>n = INT_MIN</code> in an <code>int</code>. It overflows; copy into <code>long long</code> first.",
      "Checking for overflow after computing <code>r * 10 + d</code>. Signed overflow is undefined in C++, so the check may be removed by the compiler. Check before.",
      "Computing x^n with a loop of n multiplications. With n near 2^31 it times out; use the bits of n.",
      "Assuming <code>%</code> on a negative number gives a positive result. In C++, <code>-7 % 10 == -7</code>.",
      "In design problems, picking structures before writing down each operation and its required cost.",
    ],
    complexity: [
      ["Fast power (LC 50)", "O(log n)", "O(1) iterative, O(log n) recursive", "One square per bit of n, one multiply per 1-bit."],
      ["Reverse integer (LC 7)", "O(log10 |x|)", "O(1)", "At most 10 digits for a 32-bit int."],
      ["Euclid's gcd", "O(log min(a, b))", "O(1) iterative", "The remainder at least halves every two steps."],
      ["Design Twitter feed (LC 355)", "O(f log f) per getNewsFeed", "O(users + tweets)", "Merge the latest tweets of f followees with a heap, take 10."],
    ],
    sayIt: "For number problems I first look at the size limits. If the exponent or the value can be near two to the thirty-one, a linear loop is too slow, so I look for a logarithmic method. For Pow(x, n) I use fast power. I copy n into a long long, because negating INT_MIN in an int overflows. If n is negative I replace x with one over x and make n positive. Then I walk the bits of n: whenever the low bit is 1, I multiply the answer by the current power, and every step I square the power and shift n right. That is O(log n) time and O(1) space. For digit problems like Reverse Integer I pop the last digit with mod 10 and push it with times 10 plus d. Because I may not use 64-bit values, I check against INT_MAX over 10 before the multiply, with the tie broken by the last digit, 7 or minus 8. I test zero, negatives, INT_MIN and INT_MAX before I say I am done.",
    followups: [
      ["Can you write Pow(x, n) recursively?", "half = pow(x, n / 2); return n even ? half * half : half * half * x. It is O(log n) time but uses O(log n) stack; the loop version is O(1) space."],
      ["How do you compute a^b mod m when b is a huge number given as digits (LC 372)?", "Process b's digits left to right: result = result^10 · a^digit, all mod m, using fast power for each piece."],
      ["Palindrome Number (LC 9) without converting to a string?", "Reverse only the second half: pop digits from x into r until r ≥ x, then compare x == r or x == r / 10. No overflow because r stays at half the digits."],
      ["How would you design getNewsFeed in Design Twitter?", "Store each user's tweets newest first with a global timestamp. For a feed, push each followee's newest tweet into a max-heap by time, pop 10, and push the next tweet from the same user each time."],
    ],
    rubric: {
      strong: [
        "Asked about limits and special values (INT_MIN, zero, negatives, modulus) before coding.",
        "Used the structure of the number (bits, digits, a formula) and guarded overflow before it could happen.",
        "Gave the logarithmic or per-operation cost with the reason, and tested the edge values out loud.",
      ],
      weak: [
        "Wrote a linear loop where the limits needed O(log n), or brute-forced a design operation.",
        "Negated INT_MIN in an int, checked overflow after the multiply, or assumed % is always positive.",
        "Skipped edge cases, or could not say why each design operation meets its cost.",
      ],
    },
  },

  quiz: [
    ["How many times does the fast-power loop multiply into <code>ans</code> for <code>n = 13</code> (binary <code>1101</code>)?",
      ["13", "4", "3", "2"],
      2, "13 has three 1-bits (8 + 4 + 1), so ans is multiplied three times. The base is squared four times, once per bit."],
    ["Why does the Pow code copy <code>n</code> into a <code>long long</code> before negating it?",
      ["Because doubles cannot hold negative exponents", "Because <code>-(-2147483648)</code> does not fit in a 32-bit int", "To make the loop run faster", "Because <code>N &gt;&gt;= 1</code> only works on 64-bit values"],
      1, "INT_MIN is -2147483648 and INT_MAX is 2147483647, so negating INT_MIN in an int overflows. 2147483648 fits in a long long."],
    ["In Reverse Integer, <code>r = 214748364</code> and the next digit is <code>d = 8</code>. What should the code do?",
      ["Push it: r becomes 2147483648", "Push it, then check whether r is negative", "Skip the digit and keep going", "Return 0, because 214748364 × 10 + 8 is above INT_MAX"],
      3, "INT_MAX is 2147483647. When r equals INT_MAX / 10, any digit above 7 would overflow, so the guard returns 0 before the multiply."],
  ],

  drills: [
    { prompt: "Compute a number raised to a power, where the power can be as large as two billion or negative.",
      answer: "math-design", distractors: ["bit-manipulation", "binary-search", "dp-1d"],
      why: "A linear loop is too slow; square the base and walk the exponent's binary digits for O(log n). Handle the negative and INT_MIN cases." },
    { prompt: "Return the digits of a 32-bit integer in reverse order, or 0 if the result does not fit, without using 64-bit types.",
      answer: "math-design", distractors: ["bit-manipulation", "stacks-monotonic", "two-pointers"],
      why: "Pop with % 10 and push with * 10 + d, checking against INT_MAX / 10 before each push." },
    { prompt: "Decide whether an integer reads the same forwards and backwards, without turning it into a string.",
      answer: "math-design", distractors: ["two-pointers", "stacks-monotonic", "bit-manipulation"],
      why: "Reverse the second half of the digits arithmetically and compare it with the first half." },
    { prompt: "Build a small social network class: post a message, follow and unfollow, and fetch the 10 newest messages from you and everyone you follow.",
      answer: "math-design", distractors: ["heaps", "linked-lists", "graphs-bfs-dfs"],
      why: "A design question: per-user tweet lists with timestamps plus follow sets, and a heap to merge the newest items on read." },
    { prompt: "Count the prime numbers smaller than n, for n up to five million.",
      answer: "math-design", distractors: ["dp-1d", "binary-search", "bit-manipulation"],
      why: "A sieve of Eratosthenes marks multiples of each prime from p², giving O(n log log n)." },
    { prompt: "Compute the integer square root of a non-negative number without using any built-in power or root function.",
      answer: "math-design", distractors: ["binary-search", "bit-manipulation", "greedy"],
      why: "A number question with overflow traps: Newton's method or a search on mid with mid ≤ x / mid to avoid squaring overflow." },
  ],

  flashcards: [
    { id: "md-lc50", front: "Pow(x, n) (LC 50) by fast power: time and space?", back: "O(log |n|) time, O(1) space iteratively (O(log n) stack if recursive)." },
    { id: "md-lc7", front: "Reverse Integer (LC 7): time and space?", back: "O(log10 |x|) time, at most 10 passes. O(1) space." },
    { id: "md-gcd", front: "Euclid's gcd(a, b): time and space?", back: "O(log min(a, b)) time, O(1) space iteratively." },
    { id: "md-sieve", front: "Sieve of Eratosthenes up to n: time and space?", back: "O(n log log n) time, O(n) space for the marks." },
    { id: "md-lc355", front: "Design Twitter (LC 355) getNewsFeed with a heap over f followees: time?", back: "O(f + 10 log f) per call (or O(f log f) if you build the heap by pushes). post, follow and unfollow are O(1)." },
  ],

  problems: [7, 50, 355],
});
