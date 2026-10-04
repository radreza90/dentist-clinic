import sanitizeHtml from "sanitize-html";

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "p","h1","h2","h3","h4","h5","h6","ul","ol","li","strong","em","s","blockquote",
    "pre","code","hr","br","a","img","video"
  ],
  allowedAttributes: {
    a: ["href","target","rel","title"],
    img: ["src","alt","title","width","height","data-align"],
    video: ["src","poster","width","height","controls","playsinline","preload","data-align"],
    "*": ["dir"]
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