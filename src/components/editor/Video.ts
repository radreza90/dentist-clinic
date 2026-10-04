import { Node, mergeAttributes } from "@tiptap/core";

export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: 800 },
      height: { default: 450 },
      align: { default: "center" },
      controls: { default: true },
      poster: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "video" }];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = { ...HTMLAttributes };
    const align = attrs.align || "center";
    delete attrs.align;
    return [
      "video",
      mergeAttributes(attrs, {
        controls: true,
        playsinline: true,
        preload: "metadata",
        "data-align": align,
        style: `width: ${attrs.width || 800}px; max-width: 100%; height: auto; display: block; margin-left: ${align === "right" ? "auto" : "0"}; margin-right: ${align === "left" ? "auto" : "0"};`,
      }),
    ];
  },
});