import sanitizeHtml from "sanitize-html";

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "p","h1","h2","h3","h4","h5","h6","ul","ol","li","strong","em","s","blockquote",
    "pre","code","hr","br","a","img","video","span","table","colgroup","col","thead","tbody","tr","th","td"
  ],
  allowedAttributes: {
    a: ["href","target","rel","title"],
    img: ["src","alt","title","width","height","data-align"],
    video: ["src","poster","width","height","controls","playsinline","preload","data-align"],
    table: ["style"],
    th: ["colspan","rowspan","colwidth","data-colwidth","style"],
    td: ["colspan","rowspan","colwidth","data-colwidth","style"],
    col: ["width"],
    colgroup: ["span"],
    span: ["style"],
    mark: ["style","data-color"],
    p: ["style"],
    h1: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
    h5: ["style"],
    h6: ["style"],
    "*": ["dir"]
  },
  allowedStyles: {
    p: { "text-align": [/^(left|right|center|justify)$/] },
    h1: { "text-align": [/^(left|right|center|justify)$/] },
    h2: { "text-align": [/^(left|right|center|justify)$/] },
    h3: { "text-align": [/^(left|right|center|justify)$/] },
    h4: { "text-align": [/^(left|right|center|justify)$/] },
    h5: { "text-align": [/^(left|right|center|justify)$/] },
    h6: { "text-align": [/^(left|right|center|justify)$/] },
    table: { width: [/^\d+(?:\.\d+)?%?$/] },
    col: { width: [/^\d+(?:\.\d+)?(?:px|%)?$/] },
    th: { "text-align": [/^(left|right|center|justify)$/], width: [/^\d+(?:\.\d+)?(?:px|%)?$/] },
    td: { "text-align": [/^(left|right|center|justify)$/], width: [/^\d+(?:\.\d+)?(?:px|%)?$/] },
    span: {
      color: [/^#[\da-f]{3}(?:[\da-f]{3})?$/i],
      "background-color": [/^#[\da-f]{3}(?:[\da-f]{3})?$/i],
    },
    mark: { "background-color": [/^#[\da-f]{3}(?:[\da-f]{3})?$/i] },
  },
  allowedSchemes: ["http","https","mailto","tel"],
  allowProtocolRelative: false,
};

export function sanitizeRichHtml(value: string | null | undefined) {
  return sanitizeHtml(value || "", options);
}

export function sanitizeLocalizedHtml(value?: { fa?: string; en?: string } | null) {
  return {
    fa: sanitizeRichHtml(value?.fa),
    en: sanitizeRichHtml(value?.en),
  };
}