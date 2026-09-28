// ─────────────────────────────────────────────────────────────
// detectLanguage.ts — Heuristic-based programming language detector
//
// WHY: No external deps, runs instantly in the browser.
//      Works by scoring each candidate language based on how many
//      of its "signature" patterns appear in the code snippet.
//      The language with the highest score wins.
//
// COVERAGE: Python, TypeScript, JavaScript, Java, C/C++, Go,
//           Rust, SQL, HTML, CSS, Bash, PHP, Ruby, Swift, Kotlin, C#
// ─────────────────────────────────────────────────────────────

interface LangRule {
  name: string;
  patterns: RegExp[];
}

const RULES: LangRule[] = [
  {
    name: 'Python',
    patterns: [
      /\bdef\s+\w+\s*\(/,
      /\bimport\s+\w+/,
      /\bfrom\s+\w+\s+import\b/,
      /\bprint\s*\(/,
      /\belif\b/,
      /\b__init__\b/,
      /:\s*\n\s+/,           // colon + indented block
      /\bself\b/,
      /\bNone\b/,
      /\bTrue\b|\bFalse\b/,
    ],
  },
  {
    name: 'TypeScript',
    patterns: [
      /:\s*(string|number|boolean|void|any|never|unknown)\b/,
      /\binterface\s+\w+/,
      /\btype\s+\w+\s*=/,
      /\benum\s+\w+/,
      /<[A-Z]\w*>/,          // generics
      /\bas\s+(string|number|boolean|any)\b/,
      /\bReadonly</,
      /\bPartial</,
      /import\s+type\b/,
    ],
  },
  {
    name: 'JavaScript',
    patterns: [
      /\bconst\s+\w+\s*=/,
      /\blet\s+\w+\s*=/,
      /\bfunction\s+\w+\s*\(/,
      /=>/,
      /\bconsole\.(log|warn|error)\b/,
      /\bdocument\.\w+/,
      /\bwindow\.\w+/,
      /require\s*\(/,
      /module\.exports/,
      /\basync\s+function\b/,
    ],
  },
  {
    name: 'Java',
    patterns: [
      /\bpublic\s+class\b/,
      /\bSystem\.out\.print/,
      /\bpublic\s+static\s+void\s+main/,
      /\bimport\s+java\./,
      /\bnew\s+[A-Z]\w+\s*\(/,
      /@Override\b/,
      /\bArrayList\b|\bHashMap\b/,
      /\bthrows\s+\w+/,
    ],
  },
  {
    name: 'C++',
    patterns: [
      /#include\s*[<"]/,
      /\bstd::/,
      /\bcout\s*<</,
      /\bcin\s*>>/,
      /\bint\s+main\s*\(/,
      /\bvector\s*</,
      /\bnamespace\s+\w+/,
      /\bnullptr\b/,
    ],
  },
  {
    name: 'C',
    patterns: [
      /#include\s*<(stdio|stdlib|string|math)\.h>/,
      /\bprintf\s*\(/,
      /\bscanf\s*\(/,
      /\bint\s+main\s*\(\s*(void|int\s+argc)/,
      /\bmalloc\s*\(|\bfree\s*\(/,
      /\bstruct\s+\w+\s*{/,
    ],
  },
  {
    name: 'Go',
    patterns: [
      /\bpackage\s+\w+/,
      /\bfunc\s+\w+\s*\(/,
      /\bfmt\.(Println|Printf|Sprintf)\b/,
      /\bimport\s+\(/,
      /\bgo\s+func\b/,
      /:=\s*/,               // short variable declaration
      /\bchan\s+\w+/,
      /\bdefer\b/,
    ],
  },
  {
    name: 'Rust',
    patterns: [
      /\bfn\s+\w+\s*\(/,
      /\blet\s+mut\b/,
      /\bprintln!\s*\(/,
      /\buse\s+std::/,
      /\bimpl\s+\w+/,
      /\bmatch\s+\w+\s*{/,
      /\bSome\s*\(|\bNone\b/,
      /\bResult\s*</,
      /&str\b|&mut\b/,
    ],
  },
  {
    name: 'C#',
    patterns: [
      /\busing\s+System\b/,
      /\bConsole\.(Write|Read)/,
      /\bnamespace\s+\w+/,
      /\bpublic\s+(class|interface|enum|struct)\b/,
      /\bvar\s+\w+\s*=/,
      /\bforeach\s*\(/,
      /\bstring\s+\w+\s*=/,
      /\bList<\w+>/,
    ],
  },
  {
    name: 'SQL',
    patterns: [
      /\bSELECT\b/i,
      /\bFROM\b/i,
      /\bWHERE\b/i,
      /\bINSERT\s+INTO\b/i,
      /\bCREATE\s+TABLE\b/i,
      /\bDROP\s+TABLE\b/i,
      /\bJOIN\b/i,
      /\bGROUP\s+BY\b/i,
    ],
  },
  {
    name: 'HTML',
    patterns: [
      /<!DOCTYPE\s+html/i,
      /<html[\s>]/i,
      /<\/(div|span|p|a|h[1-6]|body|head)>/i,
      /\bclass=["']/,
      /\bhref=["']/,
    ],
  },
  {
    name: 'CSS',
    patterns: [
      /[.#][\w-]+\s*{/,
      /:\s*(flex|grid|block|inline|none|absolute|relative)\b/,
      /\bmargin\s*:/,
      /\bpadding\s*:/,
      /\bbackground\s*:/,
      /@media\s*\(/,
      /\bpx\b|\brem\b|\bem\b/,
    ],
  },
  {
    name: 'Bash',
    patterns: [
      /^#!\s*\/bin\/(ba)?sh/m,
      /\becho\s+/,
      /\bgrep\s+/,
      /\$\w+/,               // shell variable
      /\bif\s+\[/,
      /\bfor\s+\w+\s+in\b/,
      /\|\s*\w+/,            // pipe
      /\bsudo\s+/,
    ],
  },
  {
    name: 'PHP',
    patterns: [
      /<\?php\b/,
      /\$\w+\s*=/,
      /\becho\s+/,
      /\barray\s*\(/,
      /->/,                  // object access
      /\bforeach\s*\(\s*\$\w+/,
    ],
  },
  {
    name: 'Ruby',
    patterns: [
      /\bdef\s+\w+/,
      /\bend\b/,
      /\bputs\s+/,
      /\brequire\s+['"]/,
      /\bdo\s*\|/,
      /@\w+\s*=/,            // instance variable
      /\bnil\b/,
    ],
  },
  {
    name: 'Swift',
    patterns: [
      /\bfunc\s+\w+\s*\(/,
      /\bvar\s+\w+\s*:/,
      /\blet\s+\w+\s*:/,
      /\bimport\s+(Foundation|UIKit|SwiftUI)\b/,
      /\bguard\s+let\b/,
      /\boptional\b|\?\./,
      /\bprint\s*\(/,
    ],
  },
  {
    name: 'Kotlin',
    patterns: [
      /\bfun\s+\w+\s*\(/,
      /\bval\s+\w+\s*:/,
      /\bvar\s+\w+\s*:/,
      /\bobject\s+\w+/,
      /\bdata\s+class\b/,
      /\bprintln\s*\(/,
      /\bwhen\s*\(/,
    ],
  },
];

/**
 * Detect the most likely programming language of a code snippet.
 * Returns a language name string, or empty string if confidence is too low.
 */
export function detectLanguage(code: string): string {
  if (!code || code.trim().length < 10) return '';

  let best = { name: '', score: 0 };

  for (const rule of RULES) {
    const score = rule.patterns.reduce(
      (acc, pattern) => acc + (pattern.test(code) ? 1 : 0),
      0,
    );
    // Require at least 2 matching patterns to avoid false positives
    if (score > best.score && score >= 2) {
      best = { name: rule.name, score };
    }
  }

  return best.name;
}
