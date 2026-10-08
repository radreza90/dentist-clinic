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
      align: {
        default: "center",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes: { align?: string }) => ({ "data-align": attributes.align || "center" }),
      },
      controls: { default: true },
      poster: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "video" }];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = { ...HTMLAttributes };
    return [
      "video",
      mergeAttributes(attrs, {
        controls: true,
        playsinline: true,
        preload: "metadata",
      }),
    ];
  },
});