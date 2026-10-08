"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { RichEditor } from "@/components/editor/RichEditor";
import { MediaPicker } from "@/components/editor/MediaPicker";
import { PersianDatePicker } from "@/components/admin/PersianDatePicker";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";

type Kind = "page" | "blog" | "doctor" | "portfolio";
type Locale = "fa" | "en";
type Localized = { fa: string; en: string };
type SeoForm = {
  title: Localized;
  description: Localized;
  canonical: Localized;
  keywords: string;
  index: boolean;
  follow: boolean;
  ogTitle: Localized;
  ogDescription: Localized;
  ogImageMediaId: string | null;
  twitterCard: "summary" | "summary_large_image";
};
type Certificate = { title: Localized; issuer: Localized; year: string; mediaId: string | null };
type Course = { title: Localized; provider: Localized; year: string };
type Credential = { title: Localized; description: Localized };
type DoctorRecordEditor =
  | { type: "certificate"; index: number | null; value: Certificate }
  | { type: "course"; index: number | null; value: Course }
  | { type: "credential"; index: number | null; value: Credential };
type Faq = { question: Localized; answer: Localized };
type FormState = {
  kind: Kind;
  slug: string;
  title: Localized;
  name: Localized;
  excerpt: Localized;
  shortBio: Localized;
  bio: Localized;
  content: Localized;
  description: Localized;
  treatment: Localized;
  university: Localized;
  cv: Localized;
  photoMediaId: string | null;
  coverMediaId: string | null;
  certificates: Certificate[];
  courses: Course[];
  credentials: Credential[];
  services: string[];
  categoryIds: string[];
  beforeMediaIds: string[];
  afterMediaIds: string[];
  doctorId: string | null;
  authorId: string;
  privacy: { consentStatus: "unknown" | "granted" | "revoked"; hideIdentity: boolean };
  faqs: Faq[];
  status: "draft" | "published" | "scheduled" | "archived";
  publishedAt: string;
  scheduledAt: string;
  seo: SeoForm;
};

type Option = { _id: string; label: string };
type Media = { _id: string; url: string; mimeType: string; alt?: Localized; title?: Localized };

const localized = (): Localized => ({ fa: "", en: "" });
const seo = (): SeoForm => ({
  title: localized(),
  description: localized(),
  canonical: localized(),
  keywords: "",
  index: true,
  follow: true,
  ogTitle: localized(),
  ogDescription: localized(),
  ogImageMediaId: null,
  twitterCard: "summary_large_image",
});

const emptyForm = (kind: Kind): FormState => ({
  kind,
  slug: "",
  title: localized(),
  name: localized(),
  excerpt: localized(),
  shortBio: localized(),
  bio: localized(),
  content: localized(),
  description: localized(),
  treatment: localized(),
  university: localized(),
  cv: localized(),
  photoMediaId: null,
  coverMediaId: null,
  certificates: [],
  courses: [],
  credentials: [],
  services: [],
  categoryIds: [],
  beforeMediaIds: [],
  afterMediaIds: [],
  doctorId: null,
  authorId: "",
  privacy: { consentStatus: "unknown", hideIdentity: true },
  faqs: [],
  status: "draft",
  publishedAt: "",
  scheduledAt: "",
  seo: seo(),
});

function pickLabel(item: Record<string, unknown>) {
  const localizedValue = (item.name || item.title) as { fa?: string; en?: string } | undefined;
  const fa = localizedValue?.fa?.trim();
  const en = localizedValue?.en?.trim();
  return fa || en || String(item.slug || item._id || "—");
}

function toLocalDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalDateTime(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function Section({ title, description, children, className, collapsible = false }: { title: string; description?: string; children: ReactNode; className?: string; collapsible?: boolean }) {
  return (
    <section className={className} style={{ background: "#fff", border: "1px solid #e3e6ea", borderRadius: 16, padding: 20, display: "grid", gap: 16, boxShadow: "0 2px 10px rgba(15,23,42,.03)" }}>
      {collapsible ? (
        <details className="content-section-accordion">
          <summary>
            <div className="content-section-heading">
              <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
              {description && <p style={{ margin: "6px 0 0", color: "#667085", fontSize: 13 }}>{description}</p>}
            </div>
            <span className="content-section-accordion-icon" aria-hidden="true">⌄</span>
          </summary>
          <div className="content-section-accordion-body">{children}</div>
        </details>
      ) : (
        <>
          <div className="content-section-heading">
            <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
            {description && <p style={{ margin: "6px 0 0", color: "#667085", fontSize: 13 }}>{description}</p>}
          </div>
          {children}
        </>
      )}
    </section>
  );
}

function FieldGrid({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>{children}</div>;
}

function LocalizedField({
  label,
  value,
  onChange,
  multiline = false,
  rich = false,
}: {
  label: string;
  value: Localized;
  onChange: (next: Localized) => void;
  multiline?: boolean;
  rich?: boolean;
}) {
  const editor = (locale: Locale, placeholder: string) =>
    rich ? (
      <div>
        <div style={{ fontSize: 12, color: "#667085", marginBottom: 6 }}>{placeholder}</div>
        <RichEditor value={value[locale]} onChange={(html) => onChange({ ...value, [locale]: html })} placeholder={placeholder} />
      </div>
    ) : multiline ? (
      <textarea value={value[locale]} onChange={(e) => onChange({ ...value, [locale]: e.target.value })} placeholder={placeholder} rows={4} />
    ) : (
      <input value={value[locale]} onChange={(e) => onChange({ ...value, [locale]: e.target.value })} placeholder={placeholder} dir={locale === "en" ? "ltr" : "rtl"} />
    );

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <strong style={{ fontSize: 13 }}>{label}</strong>
      {editor("fa", `${label} فارسی`)}
      {editor("en", `${label} English`)}
    </div>
  );
}

function Pill({ children, tone = "#f2f4f7" }: { children: ReactNode; tone?: string }) {
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "5px 9px", borderRadius: 999, background: tone, fontSize: 12 }}>{children}</span>;
}

function MediaThumb({ media, onRemove }: { media?: Media; onRemove?: () => void }) {
  if (!media) return null;
  return (
    <div className="content-media-preview">
      {media.mimeType.startsWith("image/") ? (
        <img src={media.url} alt={media.alt?.fa || media.title?.fa || ""} />
      ) : (
        <div className="content-media-file"><span>{media.mimeType === "application/pdf" ? "PDF" : media.mimeType.split("/").pop()?.toUpperCase() || "FILE"}</span><small>فایل پیوست‌شده</small></div>
      )}
      {onRemove && <button type="button" onClick={onRemove} className="content-media-remove" aria-label="حذف فایل پیوست">×</button>}
    </div>
  );
}

export function ContentEditor({ kind, title, endpoint, id }: { kind: Kind; title: string; endpoint: string; id?: string }) {
  const {toast}=useAdminFeedback();
  const [form, setForm] = useState<FormState>(() => emptyForm(kind));
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState<"photo" | "cover" | "certificate" | "before" | "after" | "ogImage" | null>(null);
  const [recordEditor, setRecordEditor] = useState<DoctorRecordEditor | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [services, setServices] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [doctors, setDoctors] = useState<Option[]>([]);
  const [authors, setAuthors] = useState<Option[]>([]);
  const [optionsError, setOptionsError] = useState("");

  const base = kind === "doctor" ? "doctors" : kind === "blog" ? "blog" : kind === "portfolio" ? "portfolio" : "pages";
  const titleField = kind === "doctor" ? "name" : "title";

  const mediaById = useMemo(() => new Map(media.map((item) => [item._id, item])), [media]);

  const selectedBefore = useMemo(() => form.beforeMediaIds.map((value) => mediaById.get(value)).filter(Boolean) as Media[], [form.beforeMediaIds, mediaById]);
  const selectedAfter = useMemo(() => form.afterMediaIds.map((value) => mediaById.get(value)).filter(Boolean) as Media[], [form.afterMediaIds, mediaById]);

  const loadOptions = useCallback(async () => {
    try {
      const requests: Promise<Response>[] = [
        fetch("/api/v1/admin/media", { cache: "no-store" }),
      ];
      if (kind === "doctor") requests.push(fetch("/api/v1/admin/services?limit=100", { cache: "no-store" }));
      if (kind === "blog") requests.push(fetch("/api/v1/admin/blog-categories?limit=100", { cache: "no-store" }));
      if (kind === "portfolio") {
        requests.push(fetch("/api/v1/admin/portfolio-categories?limit=100", { cache: "no-store" }));
        requests.push(fetch("/api/v1/admin/doctors?limit=100", { cache: "no-store" }));
      }
      if (kind === "blog") requests.push(fetch("/api/v1/admin/users?role=content", { cache: "no-store" }));
      const responses = await Promise.all(requests);
      for (const response of responses) {
        if (!response.ok) throw new Error("یکی از منابع کمکی بارگذاری نشد.");
      }
      const payloads = await Promise.all(responses.map((response) => response.json()));
      setMedia(payloads[0].data || []);

      let index = 1;
      if (kind === "doctor") {
        setServices((payloads[index].data?.items || []).map((item: Record<string, unknown>) => ({ _id: String(item._id), label: pickLabel(item) })));
        index += 1;
      }
      if (kind === "blog") {
        setCategories((payloads[index].data?.items || []).map((item: Record<string, unknown>) => ({ _id: String(item._id), label: pickLabel(item) })));
        index += 1;
        setAuthors((payloads[index].data?.items || []).map((item: Record<string, unknown>) => ({
          _id: String(item._id),
          label: [item.firstName, item.lastName].filter(Boolean).join(" ") || String(item.email || item.phone || "کاربر"),
        })));
      }
      if (kind === "portfolio") {
        setCategories((payloads[index].data?.items || []).map((item: Record<string, unknown>) => ({ _id: String(item._id), label: pickLabel(item) })));
        index += 1;
        setDoctors((payloads[index].data?.items || []).map((item: Record<string, unknown>) => ({ _id: String(item._id), label: pickLabel(item) })));
      }
    } catch (e) {
      setOptionsError(e instanceof Error ? e.message : "منابع کمکی بارگذاری نشدند.");
    }
  }, [kind]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`${endpoint}/${id}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error?.message || "خطا در دریافت محتوا");
        const data = payload.data as Record<string, unknown>;
        const current = emptyForm(kind);
        const rawSeo = data.seo as Record<string, unknown> | undefined;
        const rawTitle = (data.title || current.title) as Partial<Localized>;
        const rawName = (data.name || current.name) as Partial<Localized>;
        const canonical = rawSeo?.canonical as Partial<Localized> | undefined;
        const seoTitle = rawSeo?.title as Partial<Localized> | undefined;
        const seoDescription = rawSeo?.description as Partial<Localized> | undefined;
        const ogTitle = rawSeo?.ogTitle as Partial<Localized> | undefined;
        const ogDescription = rawSeo?.ogDescription as Partial<Localized> | undefined;
        const robots = rawSeo?.robots as Partial<{ index: boolean; follow: boolean }> | undefined;

        setForm({
          ...current,
          ...data,
          slug: String(data.slug || ""),
          title: { fa: rawTitle.fa || "", en: rawTitle.en || "" },
          name: { fa: rawName.fa || "", en: rawName.en || "" },
          excerpt: { fa: ((data.excerpt as Localized | undefined)?.fa || ""), en: ((data.excerpt as Localized | undefined)?.en || "") },
          shortBio: { fa: ((data.shortBio as Localized | undefined)?.fa || ""), en: ((data.shortBio as Localized | undefined)?.en || "") },
          bio: { fa: ((data.bio as Localized | undefined)?.fa || ""), en: ((data.bio as Localized | undefined)?.en || "") },
          content: { fa: ((data.content as Localized | undefined)?.fa || ""), en: ((data.content as Localized | undefined)?.en || "") },
          description: { fa: ((data.description as Localized | undefined)?.fa || ""), en: ((data.description as Localized | undefined)?.en || "") },
          treatment: { fa: ((data.treatment as Localized | undefined)?.fa || ""), en: ((data.treatment as Localized | undefined)?.en || "") },
          university: { fa: ((data.university as Localized | undefined)?.fa || ""), en: ((data.university as Localized | undefined)?.en || "") },
          cv: { fa: ((data.cv as Localized | undefined)?.fa || ""), en: ((data.cv as Localized | undefined)?.en || "") },
          photoMediaId: data.photoMediaId ? String(data.photoMediaId) : null,
          coverMediaId: data.coverMediaId ? String(data.coverMediaId) : null,
          certificates: Array.isArray(data.certificates) ? data.certificates.map((item: Record<string, unknown>) => {
            const itemTitle = item.title as Localized | undefined;
            const issuer = item.issuer as Localized | undefined;
            return { title: { fa: itemTitle?.fa || "", en: itemTitle?.en || "" }, issuer: { fa: issuer?.fa || "", en: issuer?.en || "" }, year: item.year ? String(item.year) : "", mediaId: item.mediaId ? String(item.mediaId) : null };
          }) : [],
          courses: Array.isArray(data.courses) ? data.courses.map((item: Record<string, unknown>) => {
            const itemTitle = item.title as Localized | undefined;
            const provider = item.provider as Localized | undefined;
            return { title: { fa: itemTitle?.fa || "", en: itemTitle?.en || "" }, provider: { fa: provider?.fa || "", en: provider?.en || "" }, year: item.year ? String(item.year) : "" };
          }) : [],
          credentials: Array.isArray(data.credentials) ? data.credentials.map((item: Record<string, unknown>) => {
            const itemTitle = item.title as Localized | undefined;
            const description = item.description as Localized | undefined;
            return { title: { fa: itemTitle?.fa || "", en: itemTitle?.en || "" }, description: { fa: description?.fa || "", en: description?.en || "" } };
          }) : [],
          services: Array.isArray(data.services) ? data.services.map(String) : [],
          categoryIds: Array.isArray(data.categoryIds) ? data.categoryIds.map(String) : [],
          beforeMediaIds: Array.isArray(data.beforeMediaIds) ? data.beforeMediaIds.map(String) : [],
          afterMediaIds: Array.isArray(data.afterMediaIds) ? data.afterMediaIds.map(String) : [],
          doctorId: data.doctorId ? String(data.doctorId) : null,
          authorId: data.authorId ? String(data.authorId) : "",
          privacy: { consentStatus: ((data.privacy as { consentStatus?: string } | undefined)?.consentStatus === "granted" || (data.privacy as { consentStatus?: string } | undefined)?.consentStatus === "revoked") ? (data.privacy as { consentStatus: "granted" | "revoked" }).consentStatus : "unknown", hideIdentity: (data.privacy as { hideIdentity?: boolean } | undefined)?.hideIdentity !== false },
          faqs: Array.isArray(data.faqs) ? data.faqs.map((item: Record<string, unknown>) => {
            const question = item.question as Localized | undefined;
            const answer = item.answer as Localized | undefined;
            return { question: { fa: question?.fa || "", en: question?.en || "" }, answer: { fa: answer?.fa || "", en: answer?.en || "" } };
          }) : [],
          status: (data.status as FormState["status"]) || "draft",
          publishedAt: toLocalDateTime(data.publishedAt as string | undefined),
          scheduledAt: toLocalDateTime(data.scheduledAt as string | undefined),
          seo: {
            title: { fa: seoTitle?.fa || "", en: seoTitle?.en || "" },
            description: { fa: seoDescription?.fa || "", en: seoDescription?.en || "" },
            canonical: { fa: canonical?.fa || "", en: canonical?.en || "" },
            keywords: Array.isArray(rawSeo?.keywords) ? (rawSeo?.keywords as unknown[]).join(", ") : "",
            index: robots?.index !== false,
            follow: robots?.follow !== false,
            ogTitle: { fa: ogTitle?.fa || "", en: ogTitle?.en || "" },
            ogDescription: { fa: ogDescription?.fa || "", en: ogDescription?.en || "" },
            ogImageMediaId: rawSeo?.ogImageMediaId ? String(rawSeo.ogImageMediaId) : null,
            twitterCard: rawSeo?.twitterCard === "summary" ? "summary" : "summary_large_image",
          },
          kind,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "خطا در دریافت محتوا"))
      .finally(() => setLoading(false));
  }, [endpoint, id, kind]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const updateLocalized = (key: keyof FormState, locale: Locale, value: string) => {
    setForm((current) => ({ ...current, [key]: { ...(current[key] as Localized), [locale]: value } }));
  };

  const addMedia = (key: "beforeMediaIds" | "afterMediaIds", mediaId: string) => {
    setForm((current) => current[key].includes(mediaId) ? current : { ...current, [key]: [...current[key], mediaId] });
  };

  const moveMedia = (key: "beforeMediaIds" | "afterMediaIds", index: number, direction: -1 | 1) => {
    setForm((current) => {
      const next = [...current[key]];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, [key]: next };
    });
  };

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        slug: form.slug,
        status: form.status,
        seo: {
          ...form.seo,
          keywords: form.seo.keywords.split(",").map((value) => value.trim()).filter(Boolean),
          canonical: form.seo.canonical,
          robots: { index: form.seo.index, follow: form.seo.follow },
        },
      };

      if (kind === "doctor") {
        body.name = form.name;
        body.shortBio = form.shortBio;
        body.bio = form.bio;
        body.university = form.university;
        body.cv = form.cv;
        body.photoMediaId = form.photoMediaId;
        body.certificates = form.certificates.map((item) => ({ ...item, year: item.year ? Number(item.year) : undefined }));
        body.courses = form.courses.map((item) => ({ ...item, year: item.year ? Number(item.year) : undefined }));
        body.credentials = form.credentials;
        body.services = form.services;
        body.publishedAt = fromLocalDateTime(form.publishedAt);
        body.scheduledAt = fromLocalDateTime(form.scheduledAt);
      } else if (kind === "blog") {
        body.title = form.title;
        body.excerpt = form.excerpt;
        body.content = form.content;
        body.categoryIds = form.categoryIds;
        body.coverMediaId = form.coverMediaId;
        body.authorId = form.authorId || undefined;
        body.publishedAt = fromLocalDateTime(form.publishedAt);
        body.scheduledAt = fromLocalDateTime(form.scheduledAt);
      } else if (kind === "portfolio") {
        body.title = form.title;
        body.description = form.description;
        body.treatment = form.treatment;
        body.categoryIds = form.categoryIds;
        body.beforeMediaIds = form.beforeMediaIds;
        body.afterMediaIds = form.afterMediaIds;
        body.doctorId = form.doctorId;
        body.privacy = form.privacy;
        body.scheduledAt = fromLocalDateTime(form.scheduledAt);
        body.publishedAt = fromLocalDateTime(form.publishedAt);
      } else {
        body.title = form.title;
        body.excerpt = form.excerpt;
        body.content = form.content;
      }

      const response = await fetch(id ? `${endpoint}/${id}` : endpoint, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || "ذخیره انجام نشد");
      toast("تغییرات با موفقیت ذخیره شد.");
      if (!id && payload.data?._id) window.history.replaceState(null, "", `/admin/content/${base}/${payload.data._id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  function removeFromList(key: "beforeMediaIds" | "afterMediaIds", mediaId: string) {
    update(key, form[key].filter((idValue) => idValue !== mediaId));
  }

  function openDoctorRecord(type: DoctorRecordEditor["type"], index: number | null = null) {
    if (type === "certificate") {
      const value = index === null ? { title: localized(), issuer: localized(), year: "", mediaId: null } : form.certificates[index];
      if (value) setRecordEditor({ type, index, value: { ...value, title: { ...value.title }, issuer: { ...value.issuer } } });
    } else if (type === "course") {
      const value = index === null ? { title: localized(), provider: localized(), year: "" } : form.courses[index];
      if (value) setRecordEditor({ type, index, value: { ...value, title: { ...value.title }, provider: { ...value.provider } } });
    } else {
      const value = index === null ? { title: localized(), description: localized() } : form.credentials[index];
      if (value) setRecordEditor({ type, index, value: { ...value, title: { ...value.title }, description: { ...value.description } } });
    }
  }

  function saveDoctorRecord() {
    if (!recordEditor) return;
    setForm((current) => {
      if (recordEditor.type === "certificate") {
        const certificates = [...current.certificates];
        if (recordEditor.index === null) certificates.push(recordEditor.value);
        else certificates[recordEditor.index] = recordEditor.value;
        return { ...current, certificates };
      }
      if (recordEditor.type === "course") {
        const courses = [...current.courses];
        if (recordEditor.index === null) courses.push(recordEditor.value);
        else courses[recordEditor.index] = recordEditor.value;
        return { ...current, courses };
      }
      const credentials = [...current.credentials];
      if (recordEditor.index === null) credentials.push(recordEditor.value);
      else credentials[recordEditor.index] = recordEditor.value;
      return { ...current, credentials };
    });
    setRecordEditor(null);
  }

  if (loading) return <main><p>در حال بارگذاری…</p></main>;

  const photo = form.photoMediaId ? mediaById.get(form.photoMediaId) : undefined;
  const cover = form.coverMediaId ? mediaById.get(form.coverMediaId) : undefined;
  const ogImage = form.seo.ogImageMediaId ? mediaById.get(form.seo.ogImageMediaId) : undefined;

  return (
    <main className={kind === "doctor" ? "doctor-editor-page" : undefined} style={{ maxWidth: 1150 }}>
      <div className={`content-editor-heading${kind === "doctor" ? " doctor-editor-heading" : ""}`}>
        <div className="content-editor-title">
          <Pill tone={id ? "#eef6ff" : "#ecfdf3"}>{id ? "ویرایش" : "ایجاد جدید"}</Pill>
          <h1 style={{ margin: "10px 0 6px", fontSize: 28 }}>{id ? `ویرایش ${title}` : `افزودن ${title}`}</h1>
          <p style={{ margin: 0, color: "#667085" }}>{kind === "doctor" ? "پروفایل حرفه‌ای پزشک را تکمیل کنید؛ تغییرات پس از ذخیره در صفحه پزشک نمایش داده می‌شوند." : "اطلاعات فارسی و انگلیسی، رسانه، محتوای تخصصی و تنظیمات SEO را از همین صفحه مدیریت کنید."}</p>
        </div>
        <div className="content-editor-actions">
          {id&&<Link href={"/admin/content/revisions?contentType="+encodeURIComponent(kind)+"&contentId="+encodeURIComponent(id)} style={{padding:"9px 13px",border:"1px solid #d0d5dd",borderRadius:10,background:"#fff"}}>تاریخچه نسخه‌ها</Link>}
          <Link href={`/admin/content/${base}`} style={{ padding: "9px 13px", border: "1px solid #d0d5dd", borderRadius: 10, background: "#fff" }}>بازگشت به فهرست</Link>
        </div>
      </div>

      {optionsError && <div className="content-editor-notice" style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "#fff7ed", color: "#9a3412" }}>{optionsError}</div>}

      <form onSubmit={save} className={kind === "doctor" ? "doctor-editor-form" : "content-editor-form"}>
        <Section className={kind === "doctor" ? "doctor-identity-card" : undefined} title={kind === "doctor" ? "اطلاعات هویتی" : "اطلاعات پایه"} description={kind === "doctor" ? "نام پزشک، تخصص و مسیر صفحه عمومی." : "شناسه و عنوان اصلی محتوا."}>
          <FieldGrid>
            <label style={{ display: "grid", gap: 7 }}><span>Slug</span><input required value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder="example-slug" dir="ltr" /></label>
            {kind === "doctor" ? (
              <label style={{ display: "grid", gap: 7 }}><span>نام فارسی</span><input required value={form.name.fa} onChange={(e) => updateLocalized("name", "fa", e.target.value)} /></label>
            ) : (
              <label style={{ display: "grid", gap: 7 }}><span>عنوان فارسی</span><input required value={form.title.fa} onChange={(e) => updateLocalized("title", "fa", e.target.value)} /></label>
            )}
            <label style={{ display: "grid", gap: 7 }}><span>{kind === "doctor" ? "نام انگلیسی" : "عنوان انگلیسی"}</span><input value={kind === "doctor" ? form.name.en : form.title.en} onChange={(e) => updateLocalized(kind === "doctor" ? "name" : "title", "en", e.target.value)} dir="ltr" /></label>
            {kind === "doctor" && <div className="doctor-university-fields"><label><span>دانشگاه / مرکز آموزشی</span><input value={form.university.fa} onChange={(e) => updateLocalized("university", "fa", e.target.value)} placeholder="نام دانشگاه به فارسی" /></label><label><span>University / Institute</span><input value={form.university.en} onChange={(e) => updateLocalized("university", "en", e.target.value)} placeholder="University name" dir="ltr" /></label></div>}
          </FieldGrid>
        </Section>

        {kind === "doctor" && (
          <>
            <Section className="doctor-professional-card" title="معرفی و تخصص" description="معرفی کوتاه، بیوگرافی و حوزه‌های درمانی پزشک.">
              <FieldGrid>
                <LocalizedField label="معرفی کوتاه" value={form.shortBio} onChange={(value) => update("shortBio", value)} multiline />
                <LocalizedField label="رزومه / CV" value={form.cv} onChange={(value) => update("cv", value)} multiline />
              </FieldGrid>
              <LocalizedField label="بیوگرافی کامل" value={form.bio} onChange={(value) => update("bio", value)} rich />
              {services.length > 0 && (
                <div style={{ display: "grid", gap: 10 }}>
                  <div className="doctor-services-heading"><strong>خدمات قابل ارائه</strong><span>{form.services.length} خدمت انتخاب شده</span></div>
                  <div className="doctor-services-grid">
                    {services.map((service) => (
                      <label className={form.services.includes(service._id) ? "is-selected" : ""} key={service._id}>
                        <input type="checkbox" checked={form.services.includes(service._id)} onChange={() => setForm((current) => ({ ...current, services: current.services.includes(service._id) ? current.services.filter((idValue) => idValue !== service._id) : [...current.services, service._id] }))} />
                        <span>{service.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {services.length === 0 && <p className="doctor-services-empty">هنوز خدمتی ثبت نشده است؛ بعداً می‌توانید خدمات را به پزشک متصل کنید.</p>}
            </Section>

            <Section className="doctor-credentials-card" title="سوابق و مدارک" description="گواهی‌ها، دوره‌های آموزشی و صلاحیت‌های حرفه‌ای.">
              <div className="doctor-credential-list">
                <div className="doctor-subsection-heading"><span>✳</span><div><strong>گواهی‌ها</strong><small>مدارک و گواهی‌های رسمی</small></div></div>
                {form.certificates.map((item, index) => (
                  <article className="doctor-record-entry" key={index}>
                    <div className="doctor-record-copy">
                      <strong>{item.title.fa || item.title.en || `گواهی شماره ${index + 1}`}</strong>
                      <span>{[item.issuer.fa || item.issuer.en, item.year].filter(Boolean).join(" • ") || "صادرکننده یا سال ثبت نشده"}</span>
                      {item.mediaId && <small>فایل مدرک پیوست شده</small>}
                    </div>
                    <div className="doctor-record-actions">
                      <button type="button" onClick={() => openDoctorRecord("certificate", index)}>ویرایش</button>
                      <button className="admin-action-danger" type="button" aria-label={`حذف گواهی ${index + 1}`} onClick={() => setForm((current) => ({ ...current, certificates: current.certificates.filter((_, itemIndex) => itemIndex !== index) }))}>حذف</button>
                    </div>
                  </article>
                ))}
                <button className="admin-action-create" type="button" onClick={() => openDoctorRecord("certificate")}>افزودن گواهی</button>
              </div>

              <div className="doctor-credential-list">
                <div className="doctor-subsection-heading"><span>◷</span><div><strong>دوره‌های آموزشی</strong><small>دوره‌های تخصصی و تکمیلی</small></div></div>
                {form.courses.map((item, index) => (
                  <article className="doctor-record-entry" key={index}>
                    <div className="doctor-record-copy">
                      <strong>{item.title.fa || item.title.en || `دوره آموزشی ${index + 1}`}</strong>
                      <span>{[item.provider.fa || item.provider.en, item.year].filter(Boolean).join(" • ") || "برگزارکننده یا سال ثبت نشده"}</span>
                    </div>
                    <div className="doctor-record-actions">
                      <button type="button" onClick={() => openDoctorRecord("course", index)}>ویرایش</button>
                      <button className="admin-action-danger" type="button" aria-label={`حذف دوره ${index + 1}`} onClick={() => setForm((current) => ({ ...current, courses: current.courses.filter((_, itemIndex) => itemIndex !== index) }))}>حذف</button>
                    </div>
                  </article>
                ))}
                <button className="admin-action-create" type="button" onClick={() => openDoctorRecord("course")}>افزودن دوره</button>
              </div>

              <div className="doctor-credential-list">
                <div className="doctor-subsection-heading"><span>◇</span><div><strong>صلاحیت‌ها</strong><small>مجوزها و توانمندی‌های حرفه‌ای</small></div></div>
                {form.credentials.map((item, index) => (
                  <article className="doctor-record-entry" key={index}>
                    <div className="doctor-record-copy">
                      <strong>{item.title.fa || item.title.en || `مجوز / صلاحیت ${index + 1}`}</strong>
                      <span>{item.description.fa || item.description.en || "توضیحات ثبت نشده"}</span>
                    </div>
                    <div className="doctor-record-actions">
                      <button type="button" onClick={() => openDoctorRecord("credential", index)}>ویرایش</button>
                      <button className="admin-action-danger" type="button" aria-label={`حذف صلاحیت ${index + 1}`} onClick={() => setForm((current) => ({ ...current, credentials: current.credentials.filter((_, itemIndex) => itemIndex !== index) }))}>حذف</button>
                    </div>
                  </article>
                ))}
                <button className="admin-action-create" type="button" onClick={() => openDoctorRecord("credential")}>افزودن صلاحیت</button>
              </div>
            </Section>

            <Section className="doctor-portrait-card" title="تصویر پروفایل" description="تصویر واضح و حرفه‌ای، با کادر عمودی انتخاب کنید.">
              <div className={`doctor-portrait-preview${photo ? " has-photo" : ""}`}>
                {photo ? <MediaThumb media={photo} onRemove={() => update("photoMediaId", null)} /> : <div className="doctor-portrait-placeholder"><span>♙</span><strong>تصویر پزشک</strong><small>پیش‌نمایش تصویر پروفایل</small></div>}
              </div>
              <button className="doctor-portrait-select" type="button" onClick={() => setPicker("photo")}>{photo ? "تغییر تصویر" : "＋ انتخاب تصویر"}</button>
            </Section>
          </>
        )}

        {kind === "blog" && (
          <>
            <Section title="مقاله" description="متن مقاله را برای هر زبان جداگانه مدیریت کنید.">
              <LocalizedField label="خلاصه" value={form.excerpt} onChange={(value) => update("excerpt", value)} multiline />
              <LocalizedField label="محتوا" value={form.content} onChange={(value) => update("content", value)} rich />
            </Section>

            <Section title="انتشار و طبقه‌بندی">
              <FieldGrid>
                <label style={{ display: "grid", gap: 7 }}><span>نویسنده</span><select value={form.authorId} onChange={(e) => update("authorId", e.target.value)}><option value="">انتخاب نویسنده</option>{authors.map((author) => <option key={author._id} value={author._id}>{author.label}</option>)}</select></label>
                <div style={{ display: "grid", gap: 8 }}><strong>دسته‌بندی‌ها</strong>{categories.length ? categories.map((category) => <label key={category._id} style={{ display: "flex", gap: 9, alignItems: "center" }}><input type="checkbox" checked={form.categoryIds.includes(category._id)} onChange={() => setForm((current) => ({ ...current, categoryIds: current.categoryIds.includes(category._id) ? current.categoryIds.filter((idValue) => idValue !== category._id) : [...current.categoryIds, category._id] }))} />{category.label}</label>) : <Pill>دسته‌ای وجود ندارد</Pill>}</div>
                <PersianDatePicker mode="datetime" label="تاریخ و زمان انتشار" value={form.publishedAt} onChange={(value) => update("publishedAt", value)} />
                <PersianDatePicker mode="datetime" label="زمان انتشار زمان‌بندی‌شده" value={form.scheduledAt} onChange={(value) => update("scheduledAt", value)} />
              </FieldGrid>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button type="button" onClick={() => setPicker("cover")}>انتخاب کاور مقاله</button>
                <MediaThumb media={cover} onRemove={() => update("coverMediaId", null)} />
              </div>
            </Section>
          </>
        )}

        {kind === "portfolio" && (
          <>
            <Section title="معرفی کیس" description="شرح کیس و توضیحات درمانی نمونه‌کار.">
              <LocalizedField label="شرح کوتاه" value={form.description} onChange={(value) => update("description", value)} multiline />
              <LocalizedField label="شرح درمان" value={form.treatment} onChange={(value) => update("treatment", value)} rich />
            </Section>

            <Section title="طبقه‌بندی و پزشک">
              <FieldGrid>
                <label style={{ display: "grid", gap: 7 }}><span>پزشک مرتبط</span><select value={form.doctorId || ""} onChange={(e) => update("doctorId", e.target.value || null)}><option value="">بدون پزشک</option>{doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.label}</option>)}</select></label>
                <div style={{ display: "grid", gap: 8 }}><strong>دسته‌بندی‌ها</strong>{categories.length ? categories.map((category) => <label key={category._id} style={{ display: "flex", gap: 9, alignItems: "center" }}><input type="checkbox" checked={form.categoryIds.includes(category._id)} onChange={() => setForm((current) => ({ ...current, categoryIds: current.categoryIds.includes(category._id) ? current.categoryIds.filter((idValue) => idValue !== category._id) : [...current.categoryIds, category._id] }))} />{category.label}</label>) : <Pill>دسته‌ای وجود ندارد</Pill>}</div>
                <PersianDatePicker mode="datetime" label="تاریخ و زمان انتشار" value={form.publishedAt} onChange={(value) => update("publishedAt", value)} />
              </FieldGrid>
            </Section>

            <Section title="حریم خصوصی و رضایت بیمار" description="نمونه‌کار فقط وقتی در سایت عمومی نمایش داده می‌شود که رضایت انتشار ثبت شده باشد.">
              <FieldGrid>
                <label style={{ display: "grid", gap: 7 }}><span>وضعیت رضایت</span><select value={form.privacy.consentStatus} onChange={(e) => setForm((current) => ({ ...current, privacy: { ...current.privacy, consentStatus: e.target.value as "unknown" | "granted" | "revoked" } }))}><option value="unknown">نامشخص</option><option value="granted">رضایت ثبت شده</option><option value="revoked">رضایت لغو شده</option></select></label>
                <label style={{ display: "flex", gap: 9, alignItems: "center", paddingTop: 28 }}><input type="checkbox" checked={form.privacy.hideIdentity} onChange={(e) => setForm((current) => ({ ...current, privacy: { ...current.privacy, hideIdentity: e.target.checked } }))} /> هویت بیمار در سایت نمایش داده نشود</label>
              </FieldGrid>
            </Section>

            <Section title="گالری قبل از درمان" description="ترتیب تصاویر با دکمه‌های جابه‌جایی حفظ می‌شود.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
                {selectedBefore.map((item, index) => <div key={item._id}><MediaThumb media={item} onRemove={() => removeFromList("beforeMediaIds", item._id)} /><div style={{ display: "flex", gap: 5, marginTop: 6 }}><button type="button" disabled={index === 0} onClick={() => moveMedia("beforeMediaIds", index, -1)}>←</button><button type="button" disabled={index === selectedBefore.length - 1} onClick={() => moveMedia("beforeMediaIds", index, 1)}>→</button></div></div>)}
              </div>
              <button className="admin-action-create" type="button" onClick={() => setPicker("before")}>افزودن تصویر قبل از درمان</button>
            </Section>

            <Section title="گالری بعد از درمان" description="این تصاویر در صفحه نمونه‌کار به‌عنوان نتیجه درمان نمایش داده می‌شوند.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
                {selectedAfter.map((item, index) => <div key={item._id}><MediaThumb media={item} onRemove={() => removeFromList("afterMediaIds", item._id)} /><div style={{ display: "flex", gap: 5, marginTop: 6 }}><button type="button" disabled={index === 0} onClick={() => moveMedia("afterMediaIds", index, -1)}>←</button><button type="button" disabled={index === selectedAfter.length - 1} onClick={() => moveMedia("afterMediaIds", index, 1)}>→</button></div></div>)}
              </div>
              <button className="admin-action-create" type="button" onClick={() => setPicker("after")}>افزودن تصویر بعد از درمان</button>
            </Section>
          </>
        )}

        {kind !== "doctor" && kind !== "blog" && kind !== "portfolio" && (
          <Section title="محتوا">
            <LocalizedField label="خلاصه" value={form.excerpt} onChange={(value) => update("excerpt", value)} multiline />
            <LocalizedField label="محتوا" value={form.content} onChange={(value) => update("content", value)} rich />
          </Section>
        )}

        <Section className={kind === "doctor" ? "doctor-seo-card" : undefined} title="SEO" description="عنوان، توضیحات، canonical، Open Graph و robots برای هر زبان." collapsible>
          <FieldGrid>
            <LocalizedField label="SEO title" value={form.seo.title} onChange={(value) => setForm((current) => ({ ...current, seo: { ...current.seo, title: value } }))} />
            <LocalizedField label="Meta description" value={form.seo.description} onChange={(value) => setForm((current) => ({ ...current, seo: { ...current.seo, description: value } }))} multiline />
            <LocalizedField label="Canonical" value={form.seo.canonical} onChange={(value) => setForm((current) => ({ ...current, seo: { ...current.seo, canonical: value } }))} />
          </FieldGrid>
          <label style={{ display: "grid", gap: 7 }}><span>Keywords</span><input value={form.seo.keywords} onChange={(e) => setForm((current) => ({ ...current, seo: { ...current.seo, keywords: e.target.value } }))} placeholder="implant, dentist, ..." dir="ltr" /></label>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <label><input type="checkbox" checked={form.seo.index} onChange={(e) => setForm((current) => ({ ...current, seo: { ...current.seo, index: e.target.checked } }))} /> index</label>
            <label><input type="checkbox" checked={form.seo.follow} onChange={(e) => setForm((current) => ({ ...current, seo: { ...current.seo, follow: e.target.checked } }))} /> follow</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>Twitter <select value={form.seo.twitterCard} onChange={(e) => setForm((current) => ({ ...current, seo: { ...current.seo, twitterCard: e.target.value as SeoForm["twitterCard"] } }))}><option value="summary_large_image">summary_large_image</option><option value="summary">summary</option></select></label>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <strong>Open Graph</strong>
            <LocalizedField label="OG title" value={form.seo.ogTitle} onChange={(value) => setForm((current) => ({ ...current, seo: { ...current.seo, ogTitle: value } }))} />
            <LocalizedField label="OG description" value={form.seo.ogDescription} onChange={(value) => setForm((current) => ({ ...current, seo: { ...current.seo, ogDescription: value } }))} multiline />
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}><button type="button" onClick={() => setPicker("ogImage")}>انتخاب OG image</button><MediaThumb media={ogImage} onRemove={() => setForm((current) => ({ ...current, seo: { ...current.seo, ogImageMediaId: null } }))} /></div>
          </div>
        </Section>

        <Section className={kind === "doctor" ? "doctor-publish-card" : undefined} title="انتشار">
          <FieldGrid>
            <label style={{ display: "grid", gap: 7 }}><span>وضعیت</span><select value={form.status} onChange={(e) => update("status", e.target.value as FormState["status"])}><option value="draft">پیش‌نویس</option><option value="published">منتشرشده</option><option value="scheduled">زمان‌بندی‌شده</option><option value="archived">بایگانی</option></select></label>
            {(kind === "doctor" || kind === "portfolio" || kind === "blog") && <PersianDatePicker mode="datetime" label="زمان‌بندی انتشار" value={form.scheduledAt} onChange={(value) => update("scheduledAt", value)} />}
          </FieldGrid>
        </Section>

        {error && <div className={kind === "doctor" ? "doctor-editor-error" : undefined} style={{ padding: 12, borderRadius: 10, background: "#fff1f3", color: "#b42318" }}>{error}</div>}
        <div className={kind === "doctor" ? "doctor-editor-submit" : "content-editor-submit"} style={{ position: "sticky", bottom: 12, display: "flex", justifyContent: "flex-start", gap: 10, padding: 12, border: "1px solid #e4e7ec", borderRadius: 14, background: "rgba(255,255,255,.94)", backdropFilter: "blur(8px)" }}>
          <button className={kind === "doctor" ? "doctor-save-button" : undefined} disabled={saving} type="submit" style={{ background: "#111827", color: "#fff", border: 0, borderRadius: 10, padding: "11px 18px", fontWeight: 700 }}>{saving ? "در حال ذخیره…" : id ? "ذخیره تغییرات" : `ایجاد ${title}`}</button>
          <Link href={`/admin/content/${base}`} style={{ padding: "10px 14px", border: "1px solid #d0d5dd", borderRadius: 10, background: "#fff" }}>انصراف</Link>
        </div>
      </form>

      {recordEditor && (
        <div className="doctor-record-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setRecordEditor(null); }}>
          <section className="doctor-record-modal" role="dialog" aria-modal="true" aria-labelledby="doctor-record-modal-title" dir="rtl" onKeyDown={(event) => { if (event.key === "Escape" && picker === null) setRecordEditor(null); }}>
            <header className="doctor-record-modal-header">
              <div>
                <span className="dashboard-eyebrow">{recordEditor.index === null ? "افزودن سابقه" : "ویرایش سابقه"}</span>
                <h2 id="doctor-record-modal-title">
                  {recordEditor.type === "certificate" ? "گواهی و مدرک" : recordEditor.type === "course" ? "دوره آموزشی" : "صلاحیت حرفه‌ای"}
                </h2>
              </div>
              <button className="media-icon-button" type="button" aria-label="بستن" autoFocus onClick={() => setRecordEditor(null)}>×</button>
            </header>
            <div className="doctor-record-modal-content">
              {recordEditor.type === "certificate" && (
                <>
                  <LocalizedField label="عنوان گواهی" value={recordEditor.value.title} onChange={(value) => setRecordEditor((current) => current?.type === "certificate" ? { ...current, value: { ...current.value, title: value } } : current)} />
                  <LocalizedField label="صادرکننده" value={recordEditor.value.issuer} onChange={(value) => setRecordEditor((current) => current?.type === "certificate" ? { ...current, value: { ...current.value, issuer: value } } : current)} />
                  <label className="doctor-record-modal-year"><span>سال دریافت</span><input inputMode="numeric" value={recordEditor.value.year} onChange={(event) => setRecordEditor((current) => current?.type === "certificate" ? { ...current, value: { ...current.value, year: event.target.value.replace(/\D/g, "").slice(0, 4) } } : current)} /></label>
                  <div className="doctor-record-attachment">
                    <div><strong>فایل مدرک</strong><span>{recordEditor.value.mediaId ? "فایل پیوست انتخاب شده" : "فایل یا تصویر گواهی را انتخاب کنید."}</span></div>
                    <button type="button" onClick={() => setPicker("certificate")}>{recordEditor.value.mediaId ? "تغییر فایل" : "انتخاب فایل / تصویر"}</button>
                    {recordEditor.value.mediaId && <button className="admin-action-danger" type="button" onClick={() => setRecordEditor((current) => current?.type === "certificate" ? { ...current, value: { ...current.value, mediaId: null } } : current)}>حذف پیوست</button>}
                    {recordEditor.value.mediaId && <MediaThumb media={mediaById.get(recordEditor.value.mediaId)} />}
                  </div>
                </>
              )}
              {recordEditor.type === "course" && (
                <>
                  <LocalizedField label="عنوان دوره" value={recordEditor.value.title} onChange={(value) => setRecordEditor((current) => current?.type === "course" ? { ...current, value: { ...current.value, title: value } } : current)} />
                  <LocalizedField label="برگزارکننده" value={recordEditor.value.provider} onChange={(value) => setRecordEditor((current) => current?.type === "course" ? { ...current, value: { ...current.value, provider: value } } : current)} />
                  <label className="doctor-record-modal-year"><span>سال</span><input inputMode="numeric" value={recordEditor.value.year} onChange={(event) => setRecordEditor((current) => current?.type === "course" ? { ...current, value: { ...current.value, year: event.target.value.replace(/\D/g, "").slice(0, 4) } } : current)} /></label>
                </>
              )}
              {recordEditor.type === "credential" && (
                <>
                  <LocalizedField label="عنوان صلاحیت / مجوز" value={recordEditor.value.title} onChange={(value) => setRecordEditor((current) => current?.type === "credential" ? { ...current, value: { ...current.value, title: value } } : current)} />
                  <LocalizedField label="توضیحات" value={recordEditor.value.description} onChange={(value) => setRecordEditor((current) => current?.type === "credential" ? { ...current, value: { ...current.value, description: value } } : current)} multiline />
                </>
              )}
              <div className="doctor-record-modal-actions">
                <button className="doctor-save-button" type="button" onClick={saveDoctorRecord}>{recordEditor.index === null ? "افزودن به فهرست" : "ذخیره تغییرات"}</button>
                <button className="admin-action-neutral" type="button" onClick={() => setRecordEditor(null)}>انصراف</button>
              </div>
            </div>
          </section>
        </div>
      )}

      <MediaPicker
        open={picker !== null}
        mode={picker === "certificate" ? "file" : "image"}
        onClose={() => setPicker(null)}
        onSelect={(selected) => {
          if (picker === "photo") update("photoMediaId", selected._id);
          if (picker === "cover") update("coverMediaId", selected._id);
          if (picker === "before") addMedia("beforeMediaIds", selected._id);
          if (picker === "after") addMedia("afterMediaIds", selected._id);
          if (picker === "ogImage") setForm((current) => ({ ...current, seo: { ...current.seo, ogImageMediaId: selected._id } }));
          if (picker === "certificate") setRecordEditor((current) => current?.type === "certificate" ? { ...current, value: { ...current.value, mediaId: selected._id } } : current);
          setPicker(null);
          setMedia((current) => current.some((item) => item._id === selected._id) ? current : [...current, { ...selected, alt: selected.alt ? { fa: selected.alt.fa || "", en: selected.alt.en || "" } : undefined, title: selected.title ? { fa: selected.title.fa || "", en: selected.title.en || "" } : undefined }]);
        }}
      />
    </main>
  );
}
