"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-text-style/color";
import { BackgroundColor } from "@tiptap/extension-text-style/background-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { TableKit } from "@tiptap/extension-table";
import { MediaPicker } from "./MediaPicker";
import { Video } from "./Video";

type PickerMode = "image" | "video" | "file";
type Media = {
  url: string;
  width?: number;
  height?: number;
  alt?: { fa?: string; en?: string };
  title?: { fa?: string; en?: string };
};
type ToolbarIconName =
  | "undo" | "redo" | "source" | "clear" | "bold" | "italic" | "underline"
  | "align-left" | "align-center" | "align-right" | "align-justify"
  | "bulleted-list" | "numbered-list" | "outdent" | "indent"
  | "link" | "image" | "print" | "video" | "text-color" | "highlight" | "table";

function ToolbarIcon({ name }: { name: ToolbarIconName }) {
  const icons: Record<ToolbarIconName, React.ReactNode> = {
    undo: <><path d="M9 14 4 9l5-5"/><path d="M4 9h9a7 7 0 0 1 7 7v2"/></>,
    redo: <><path d="m15 14 5-5-5-5"/><path d="M20 9h-9a7 7 0 0 0-7 7v2"/></>,
    source: <><path d="m8 5-7 7 7 7M16 5l7 7-7 7"/></>,
    clear: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/><path d="m3 3 18 18"/></>,
    bold: <path d="M7 5h6a4 4 0 0 1 0 8H7zm0 8h7a4 4 0 0 1 0 8H7z"/>,
    italic: <><path d="M14 4h7M3 20h7M15 4 9 20"/></>,
    underline: <><path d="M6 4v7a6 6 0 0 0 12 0V4M4 21h16"/></>,
    "align-left": <><path d="M4 6h16M4 10h10M4 14h16M4 18h10"/></>,
    "align-center": <><path d="M4 6h16M7 10h10M4 14h16M7 18h10"/></>,
    "align-right": <><path d="M4 6h16M10 10h10M4 14h16M10 18h10"/></>,
    "align-justify": <><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></>,
    "bulleted-list": <><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></>,
    "numbered-list": <><path d="M10 6h10M10 12h10M10 18h10"/><path d="M4 5h2v3M4 11h2l-2 2h2M4 17h2v2H4"/></>,
    outdent: <><path d="M9 6h11M9 12h11M9 18h11M4 9l3 3-3 3"/></>,
    indent: <><path d="M9 6h11M9 12h11M9 18h11M7 9l-3 3 3 3"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
    print: <><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/></>,
    video: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/></>,
    "text-color": <><path d="m5 19 6-14h2l6 14M7 15h10"/><path d="M4 22h16"/></>,
    highlight: <><path d="m14 4 6 6-9 9H5v-6zM4 22h16"/><path d="m12 6 6 6"/></>,
    table: <><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 10h18M9 4v16M15 4v16"/></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

const AlignedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "center",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes: { align?: string }) => ({ "data-align": attributes.align || "center" }),
      },
    };
  },
});

function ToolbarButton({
  children,
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`rich-editor-button${active ? " is-active" : ""}`}
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function RichEditor({
  value,
  onChange,
  placeholder = "محتوا را وارد کنید…",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const [picker, setPicker] = useState<PickerMode | null>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceHtml, setSourceHtml] = useState(value || "");
  const [linkEditorOpen, setLinkEditorOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [, refreshSelection] = useState(0);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Color,
      BackgroundColor,
      TextStyle,
      TableKit.configure({ table: { resizable: true } }),
      AlignedImage.configure({
        resize: {
          enabled: true,
          directions: ["bottom-right", "bottom-left"],
          minWidth: 80,
          minHeight: 50,
          alwaysPreserveAspectRatio: true,
        },
        HTMLAttributes: { class: "editor-image" },
      }),
      Video,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "rich-editor-content",
        dir: "rtl",
        "data-placeholder": placeholder,
        "aria-label": placeholder,
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
    onSelectionUpdate: () => refreshSelection((revision) => revision + 1),
  });

  useEffect(() => {
    if (editor && !sourceMode && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, sourceMode, value]);

  if (!editor) {
    return <div className="rich-editor-loading" aria-label="در حال آماده‌سازی ویرایشگر" />;
  }
  const activeEditor: NonNullable<typeof editor> = editor;

  const selection = activeEditor.state.selection;
  const selectedNode = selection instanceof NodeSelection
    ? selection.node
    : activeEditor.state.doc.nodeAt(selection.from);
  const selectedMedia = selectedNode?.type.name === "image" || selectedNode?.type.name === "video"
    ? { node: selectedNode, position: selection.from }
    : null;
  const selectedVideo = selectedMedia?.node.type.name === "video" ? selectedMedia.node : null;
  const currentTextStyle = activeEditor.isActive("heading", { level: 1 }) ? "h1"
    : activeEditor.isActive("heading", { level: 2 }) ? "h2"
      : activeEditor.isActive("heading", { level: 3 }) ? "h3"
        : activeEditor.isActive("heading", { level: 4 }) ? "h4"
          : activeEditor.isActive("blockquote") ? "quote" : "paragraph";
  const videoWidth = Number(selectedVideo?.attrs.width) || 800;
  const videoHeight = Number(selectedVideo?.attrs.height) || Math.round(videoWidth * 9 / 16);

  function toggleSourceMode() {
    if (!sourceMode) {
      const html = activeEditor.getHTML();
      setSourceHtml(html);
      onChange(html);
      setSourceMode(true);
      return;
    }

    activeEditor.commands.setContent(sourceHtml, { emitUpdate: false });
    const html = activeEditor.getHTML();
    setSourceHtml(html);
    onChange(html);
    setSourceMode(false);
  }

  function updateVideoWidth(width: number) {
    if (!selectedVideo || !Number.isFinite(width)) return;
    const boundedWidth = Math.min(1200, Math.max(160, Math.round(width)));
    const ratio = videoHeight / videoWidth;
    activeEditor.commands.updateAttributes("video", {
      width: boundedWidth,
      height: Math.max(90, Math.round(boundedWidth * ratio)),
    });
  }

  function alignMedia(align: "right" | "center" | "left") {
    if (!selectedMedia) return;
    activeEditor.chain()
      .setNodeSelection(selectedMedia.position)
      .updateAttributes(selectedMedia.node.type.name, { align })
      .run();
  }

  function openLinkEditor() {
    setLinkUrl(activeEditor.getAttributes("link").href || "");
    setLinkError("");
    setLinkEditorOpen((open) => !open);
  }

  function applyLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const href = linkUrl.trim();
    if (!href || !/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href)) {
      setLinkError("لطفاً یک نشانی معتبر با http، https، mailto یا tel وارد کنید.");
      return;
    }
    activeEditor.chain().focus().setLink({ href, target: "_blank", rel: "noopener noreferrer" }).run();
    setLinkEditorOpen(false);
    setLinkError("");
  }

  function setTextStyle(style: string) {
    const chain = activeEditor.chain().focus();
    if (style === "paragraph") chain.setParagraph().run();
    else if (style === "quote") chain.toggleBlockquote().run();
    else chain.setHeading({ level: Number(style.slice(1)) as 1 | 2 | 3 | 4 }).run();
  }

  function insertMedia(media: Media, mode: PickerMode) {
    if (mode === "image") {
      activeEditor.chain().focus().setImage({
        src: media.url,
        alt: media.alt?.fa || media.title?.fa || "",
        ...(media.width ? { width: media.width } : {}),
        ...(media.height ? { height: media.height } : {}),
      }).run();
    } else if (mode === "video") {
      activeEditor.chain().focus().insertContent({ type: "video", attrs: { src: media.url } }).run();
    } else {
      const label = media.title?.fa || media.url.split("/").pop() || "دریافت فایل";
      activeEditor.chain().focus().insertContent({
        type: "text",
        text: label,
        marks: [{ type: "link", attrs: { href: media.url, target: "_blank", rel: "noopener noreferrer" } }],
      }).run();
    }
    setPicker(null);
  }

  return (
    <section className="rich-editor" aria-label="ویرایشگر محتوای غنی" dir="rtl">
      <div className="rich-editor-topbar">
        <div className="rich-editor-toolbar" role="toolbar" aria-label="ابزارهای ویرایش متن">
          <div className="rich-editor-toolbar-row" role="group" aria-label="قالب‌بندی و چیدمان">
            <div className="rich-editor-tool-group" aria-label="تاریخچه و کد">
              <ToolbarButton label="واگرد" disabled={sourceMode || !activeEditor.can().undo()} onClick={() => activeEditor.chain().focus().undo().run()}><ToolbarIcon name="undo" /></ToolbarButton>
              <ToolbarButton label="ازنو" disabled={sourceMode || !activeEditor.can().redo()} onClick={() => activeEditor.chain().focus().redo().run()}><ToolbarIcon name="redo" /></ToolbarButton>
              <ToolbarButton label={sourceMode ? "نمایش بصری" : "ویرایش HTML"} active={sourceMode} onClick={toggleSourceMode}><ToolbarIcon name="source" /></ToolbarButton>
              <ToolbarButton label="پاک‌کردن قالب‌بندی" disabled={sourceMode} onClick={() => activeEditor.chain().focus().unsetAllMarks().clearNodes().run()}><ToolbarIcon name="clear" /></ToolbarButton>
            </div>
            <label className="rich-editor-style-select">
              <span className="sr-only">سبک متن</span>
              <select value={currentTextStyle} disabled={sourceMode} onChange={(event) => setTextStyle(event.target.value)} aria-label="سبک متن">
                <option value="paragraph">متن عادی</option>
                <option value="h1">عنوان ۱</option>
                <option value="h2">عنوان ۲</option>
                <option value="h3">عنوان ۳</option>
                <option value="h4">عنوان ۴</option>
                <option value="quote">نقل‌قول</option>
              </select>
            </label>
            <div className="rich-editor-tool-group" aria-label="قالب متن">
              <ToolbarButton label="پررنگ" active={activeEditor.isActive("bold")} disabled={sourceMode} onClick={() => activeEditor.chain().focus().toggleBold().run()}><ToolbarIcon name="bold" /></ToolbarButton>
              <ToolbarButton label="ایتالیک" active={activeEditor.isActive("italic")} disabled={sourceMode} onClick={() => activeEditor.chain().focus().toggleItalic().run()}><ToolbarIcon name="italic" /></ToolbarButton>
              <ToolbarButton label="زیرخط‌دار" active={activeEditor.isActive("underline")} disabled={sourceMode} onClick={() => activeEditor.chain().focus().toggleUnderline().run()}><ToolbarIcon name="underline" /></ToolbarButton>
            </div>
            <div className="rich-editor-tool-group" aria-label="تراز متن">
              <ToolbarButton label="تراز چپ" active={activeEditor.isActive({ textAlign: "left" })} disabled={sourceMode} onClick={() => activeEditor.chain().focus().setTextAlign("left").run()}><ToolbarIcon name="align-left" /></ToolbarButton>
              <ToolbarButton label="تراز وسط" active={activeEditor.isActive({ textAlign: "center" })} disabled={sourceMode} onClick={() => activeEditor.chain().focus().setTextAlign("center").run()}><ToolbarIcon name="align-center" /></ToolbarButton>
              <ToolbarButton label="تراز راست" active={activeEditor.isActive({ textAlign: "right" })} disabled={sourceMode} onClick={() => activeEditor.chain().focus().setTextAlign("right").run()}><ToolbarIcon name="align-right" /></ToolbarButton>
              <ToolbarButton label="تراز دوطرفه" active={activeEditor.isActive({ textAlign: "justify" })} disabled={sourceMode} onClick={() => activeEditor.chain().focus().setTextAlign("justify").run()}><ToolbarIcon name="align-justify" /></ToolbarButton>
            </div>
            <div className="rich-editor-tool-group" aria-label="فهرست‌ها">
              <ToolbarButton label="فهرست نشانه‌دار" active={activeEditor.isActive("bulletList")} disabled={sourceMode} onClick={() => activeEditor.chain().focus().toggleBulletList().run()}><ToolbarIcon name="bulleted-list" /></ToolbarButton>
              <ToolbarButton label="فهرست شماره‌دار" active={activeEditor.isActive("orderedList")} disabled={sourceMode} onClick={() => activeEditor.chain().focus().toggleOrderedList().run()}><ToolbarIcon name="numbered-list" /></ToolbarButton>
              <ToolbarButton label="کاهش تورفتگی فهرست" disabled={sourceMode} onClick={() => activeEditor.chain().focus().liftListItem("listItem").run()}><ToolbarIcon name="outdent" /></ToolbarButton>
              <ToolbarButton label="افزایش تورفتگی فهرست" disabled={sourceMode} onClick={() => activeEditor.chain().focus().sinkListItem("listItem").run()}><ToolbarIcon name="indent" /></ToolbarButton>
            </div>
          </div>
          <div className="rich-editor-toolbar-row" role="group" aria-label="درج پیوند و رسانه">
            <div className="rich-editor-tool-group" aria-label="پیوند و رسانه">
              <ToolbarButton label="افزودن یا ویرایش پیوند" active={activeEditor.isActive("link")} disabled={sourceMode} onClick={openLinkEditor}><ToolbarIcon name="link" /></ToolbarButton>
              {activeEditor.isActive("link") && <ToolbarButton label="حذف پیوند" disabled={sourceMode} onClick={() => activeEditor.chain().focus().unsetLink().run()}>×</ToolbarButton>}
              <ToolbarButton label="درج تصویر از کتابخانه رسانه" disabled={sourceMode} onClick={() => setPicker("image")}><ToolbarIcon name="image" /></ToolbarButton>
              <ToolbarButton label="چاپ محتوا" disabled={sourceMode} onClick={() => window.print()}><ToolbarIcon name="print" /></ToolbarButton>
              <ToolbarButton label="درج ویدئو از کتابخانه رسانه" disabled={sourceMode} onClick={() => setPicker("video")}><ToolbarIcon name="video" /></ToolbarButton>
            </div>
            <label className="rich-editor-color-control" title="رنگ متن">
              <span className="sr-only">رنگ متن</span>
              <ToolbarIcon name="text-color" />
              <input type="color" aria-label="انتخاب رنگ متن" disabled={sourceMode} onChange={(event) => activeEditor.chain().focus().setColor(event.target.value).run()} />
            </label>
            <label className="rich-editor-color-control" title="رنگ پس‌زمینه متن">
              <span className="sr-only">رنگ پس‌زمینه متن</span>
              <ToolbarIcon name="highlight" />
              <input type="color" aria-label="انتخاب رنگ پس‌زمینه متن" disabled={sourceMode} onChange={(event) => activeEditor.chain().focus().setBackgroundColor(event.target.value).run()} />
            </label>
            <ToolbarButton label="درج جدول ۳ در ۳" disabled={sourceMode} onClick={() => activeEditor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><ToolbarIcon name="table" /></ToolbarButton>
          </div>
        </div>
      </div>

      {linkEditorOpen && !sourceMode && (
        <form className="rich-editor-link-form" onSubmit={applyLink}>
          <label htmlFor="rich-editor-link-url">نشانی پیوند</label>
          <input
            id="rich-editor-link-url"
            type="text"
            inputMode="url"
            autoFocus
            value={linkUrl}
            onChange={(event) => {
              setLinkUrl(event.target.value);
              setLinkError("");
            }}
            placeholder="https://example.com"
            aria-invalid={Boolean(linkError)}
            aria-describedby={linkError ? "rich-editor-link-error" : undefined}
          />
          <button type="submit" className="rich-editor-link-apply">اعمال</button>
          <button type="button" className="rich-editor-link-cancel" onClick={() => setLinkEditorOpen(false)}>انصراف</button>
          {linkError && <p id="rich-editor-link-error" role="alert">{linkError}</p>}
        </form>
      )}

      {selectedMedia && !sourceMode && (
        <div className="rich-editor-media-tools" role="toolbar" aria-label="تنظیمات رسانه انتخاب‌شده">
          <span>چیدمان رسانه</span>
          <ToolbarButton label="چینش راست" active={selectedMedia.node.attrs.align === "right"} onClick={() => alignMedia("right")}>راست</ToolbarButton>
          <ToolbarButton label="چینش وسط" active={selectedMedia.node.attrs.align === "center"} onClick={() => alignMedia("center")}>وسط</ToolbarButton>
          <ToolbarButton label="چینش چپ" active={selectedMedia.node.attrs.align === "left"} onClick={() => alignMedia("left")}>چپ</ToolbarButton>
          {selectedVideo && (
            <label className="rich-editor-video-size">
              <span>اندازهٔ ویدئو</span>
              <input
                type="range"
                min="160"
                max="1200"
                step="10"
                value={Math.min(1200, Math.max(160, videoWidth))}
                onChange={(event) => updateVideoWidth(Number(event.target.value))}
                aria-label="تغییر عرض ویدئو بر حسب پیکسل"
              />
              <output>{videoWidth} پیکسل</output>
            </label>
          )}
        </div>
      )}

      <div className="rich-editor-canvas">
        {sourceMode ? (
          <textarea
            className="rich-editor-source"
            value={sourceHtml}
            onChange={(event) => {
              setSourceHtml(event.target.value);
              onChange(event.target.value);
            }}
            spellCheck={false}
            dir="ltr"
            aria-label="کد HTML محتوا"
            placeholder="<p>محتوای HTML</p>"
          />
        ) : (
          <EditorContent editor={activeEditor} />
        )}
      </div>

      <MediaPicker open={picker === "image"} mode="image" onClose={() => setPicker(null)} onSelect={(media) => insertMedia(media, "image")} />
      <MediaPicker open={picker === "video"} mode="video" onClose={() => setPicker(null)} onSelect={(media) => insertMedia(media, "video")} />
      <MediaPicker open={picker === "file"} mode="file" onClose={() => setPicker(null)} onSelect={(media) => insertMedia(media, "file")} />
    </section>
  );
}
