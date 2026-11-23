// Coding Interview Lab - input field parser shared by the engine (browser) and the checker (node).
// CIL_FIELDS.parse(type, text) returns the parsed value or throws an Error with a readable message.
// Grammar: see .work/PLAN.md, "Input fields".
(function (root) {
  "use strict";

  const TYPES = ["string", "int", "num", "ints", "strings", "intGrid", "charGrid", "tuples", "ops"];

  const stripBrackets = (t) => {
    t = t.trim();
    while (t.startsWith("[") && t.endsWith("]")) t = t.slice(1, -1).trim();
    return t;
  };
  const toInt = (tok, what) => {
    const s = String(tok).trim();
    if (!/^[-+]?\d+$/.test(s)) throw new Error(`"${s}" is not a whole number${what ? " in " + what : ""}`);
    return parseInt(s, 10);
  };
  const toNum = (tok) => {
    const s = String(tok).trim();
    if (s === "" || isNaN(Number(s))) throw new Error(`"${s}" is not a number`);
    return Number(s);
  };
  const unquote = (s) => {
    s = s.trim();
    if (s.length >= 2 && (s[0] === '"' || s[0] === "'") && s[s.length - 1] === s[0]) return s.slice(1, -1);
    return s;
  };
  const splitList = (t) => {
    t = stripBrackets(t);
    if (t === "") return [];
    return (t.includes(",") ? t.split(",") : t.split(/\s+/)).map((x) => x.trim());
  };
  // "1,2;3,4" or "[[1,2],[3,4]]" -> [["1","2"],["3","4"]]
  const splitRows = (t) => {
    t = t.trim();
    if (t === "" || t === "[]") return [];
    if (t.startsWith("[")) {
      const inner = t.replace(/^\[\s*/, "").replace(/\s*\]$/, "");
      const rows = inner.match(/\[[^\[\]]*\]/g);
      if (!rows) throw new Error("expected rows like [[1,2],[3,4]]");
      return rows.map((r) => splitList(r));
    }
    return t.split(";").map((r) => r.trim()).filter((r) => r !== "").map((r) => splitList(r));
  };

  function parseOps(t) {
    const out = [];
    const re = /([A-Za-z_]\w*)\s*\(([^)]*)\)/g;
    let m, last = 0;
    t = t.trim();
    while ((m = re.exec(t))) {
      const gap = t.slice(last, m.index).replace(/[\s;,]/g, "");
      if (gap) throw new Error(`could not read "${gap}" (write ops like put(1,1) get(1))`);
      const args = m[2].trim() === "" ? [] : m[2].split(",").map((a) => {
        const s = a.trim();
        return /^[-+]?\d+(\.\d+)?$/.test(s) ? Number(s) : unquote(s);
      });
      out.push({ name: m[1], args });
      last = re.lastIndex;
    }
    const tail = t.slice(last).replace(/[\s;,]/g, "");
    if (tail) throw new Error(`could not read "${tail}" (write ops like put(1,1) get(1))`);
    if (!out.length) throw new Error("no operations found (write ops like put(1,1) get(1))");
    return out;
  }

  function parse(type, text) {
    const t = text == null ? "" : String(text);
    switch (type) {
      case "string": return t;
      case "int": return toInt(t);
      case "num": return toNum(t);
      case "ints": return splitList(t).map((x) => toInt(x, "the list"));
      case "strings": return splitList(t).map(unquote);
      case "intGrid": return splitRows(t).map((r) => r.map((x) => toInt(x, "the grid")));
      case "charGrid": {
        const s = t.trim();
        if (s.startsWith("[")) return splitRows(s).map((r) => r.map(unquote));
        return s === "" ? [] : s.split(";").map((r) => r.trim()).filter((r) => r).map((r) => r.split(""));
      }
      case "tuples": return splitRows(t).map((r) => r.map((x) => toInt(x, "the list")));
      case "ops": return parseOps(t);
      default: throw new Error(`unknown field type "${type}"`);
    }
  }

  // Parses every field of a demo. texts: {key: rawText}; missing keys use field.value.
  // Returns { values, errors } where errors maps key -> message.
  function parseAll(fields, texts) {
    const values = {}, errors = {};
    for (const f of fields) {
      const raw = texts && Object.prototype.hasOwnProperty.call(texts, f.key) ? texts[f.key] : f.value;
      try { values[f.key] = parse(f.type, raw); } catch (e) { errors[f.key] = e.message; }
    }
    return { values, errors };
  }

  const api = { TYPES, parse, parseAll };
  root.CIL_FIELDS = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
