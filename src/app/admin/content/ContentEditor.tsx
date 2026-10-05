"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { RichEditor } from "@/components/editor/RichEditor";
import { MediaPicker } from "@/components/editor/MediaPicker";

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

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #e3e6ea", borderRadius: 16, padding: 20, display: "grid", gap: 16, boxShadow: "0 2px 10px rgba(15,23,42,.03)" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
        {description && <p style={{ margin: "6px 0 0", color: "#667085", fontSize: 13 }}>{description}</p>}
      </div>
      {children}
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
    <div style={{ position: "relative", border: "1px solid #e1e5ea", borderRadius: 12, overflow: "hidden", background: "#f8fafc" }}>
      {media.mimeType.startsWith("image/") ? (
        <img src={media.url} alt={media.alt?.fa || media.title?.fa || ""} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ minHeight: 110, display: "grid", placeItems: "center", padding: 16, fontWeight: 700 }}>{media.mimeType === "application/pdf" ? "PDF" : "فایل"}</div>
      )}
      {onRemove && <button type="button" onClick={onRemove} style={{ position: "absolute", top: 8, insetInlineEnd: 8, border: 0, borderRadius: 999, background: "#fff", padding: "4px 8px", cursor: "pointer" }}>×</button>}
    </div>
  );
}

export function ContentEditor({ kind, title, endpoint, id }: { kind: Kind; title: string; endpoint: string; id?: string }) {
  const [form, setForm] = useState<FormState>(() => emptyForm(kind));
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [picker, setPicker] = useState<"photo" | "cover" | "certificate" | "before" | "after" | "ogImage" | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<number | null>(null);
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
    setMessage("");
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
      setMessage("تغییرات با موفقیت ذخیره شد.");
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

  function insertCertificateMedia(mediaId: string) {
    if (editingCertificate === null) return;
    setForm((current) => ({ ...current, certificates: current.certificates.map((item, index) => index === editingCertificate ? { ...item, mediaId } : item) }));
  }

  function addCertificate() {
    const index = form.certificates.length;
    setForm((current) => ({ ...current, certificates: [...current.certificates, { title: localized(), issuer: localized(), year: "", mediaId: null }] }));
    setEditingCertificate(index);
  }

  if (loading) return <main><p>در حال بارگذاری…</p></main>;

  const photo = form.photoMediaId ? mediaById.get(form.photoMediaId) : undefined;
  const cover = form.coverMediaId ? mediaById.get(form.coverMediaId) : undefined;
  const ogImage = form.seo.ogImageMediaId ? mediaById.get(form.seo.ogImageMediaId) : undefined;

  return (
    <main style={{ maxWidth: 1150 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <Pill tone={id ? "#eef6ff" : "#ecfdf3"}>{id ? "ویرایش" : "ایجاد جدید"}</Pill>
          <h1 style={{ margin: "10px 0 6px", fontSize: 28 }}>{id ? `ویرایش ${title}` : `افزودن ${title}`}</h1>
          <p style={{ margin: 0, color: "#667085" }}>اطلاعات فارسی و انگلیسی، رسانه، محتوای تخصصی و تنظیمات SEO را از همین صفحه مدیریت کنید.</p>
        </div>
        <Link href={`/admin/content/${base}`} style={{ padding: "9px 13px", border: "1px solid #d0d5dd", borderRadius: 10, background: "#fff" }}>بازگشت به فهرست</Link>
      </div>

      {optionsError && <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "#fff7ed", color: "#9a3412" }}>{optionsError}</div>}

      <form onSubmit={save} style={{ display: "grid", gap: 16 }}>
        <Section title="اطلاعات پایه" description="شناسه و عنوان اصلی محتوا.">
          <FieldGrid>
            <label style={{ display: "grid", gap: 7 }}><span>Slug</span><input required value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder="example-slug" dir="ltr" /></label>
            {kind === "doctor" ? (
              <label style={{ display: "grid", gap: 7 }}><span>نام فارسی</span><input required value={form.name.fa} onChange={(e) => updateLocalized("name", "fa", e.target.value)} /></label>
            ) : (
              <label style={{ display: "grid", gap: 7 }}><span>عنوان فارسی</span><input required value={form.title.fa} onChange={(e) => updateLocalized("title", "fa", e.target.value)} /></label>
            )}
            <label style={{ display: "grid", gap: 7 }}><span>{kind === "doctor" ? "نام انگلیسی" : "عنوان انگلیسی"}</span><input value={kind === "doctor" ? form.name.en : form.title.en} onChange={(e) => updateLocalized(kind === "doctor" ? "name" : "title", "en", e.target.value)} dir="ltr" /></label>
            {kind === "doctor" && <label style={{ display: "grid", gap: 7 }}><span>دانشگاه</span><input value={form.university.fa} onChange={(e) => updateLocalized("university", "fa", e.target.value)} /><input value={form.university.en} onChange={(e) => updateLocalized("university", "en", e.target.value)} placeholder="University" dir="ltr" /></label>}
          </FieldGrid>
        </Section>

        {kind === "doctor" && (
          <>
            <Section title="هویت حرفه‌ای پزشک" description="معرفی، رزومه و خدماتی که پزشک ارائه می‌کند.">
              <FieldGrid>
                <LocalizedField label="معرفی کوتاه" value={form.shortBio} onChange={(value) => update("shortBio", value)} multiline />
                <LocalizedField label="رزومه / CV" value={form.cv} onChange={(value) => update("cv", value)} multiline />
              </FieldGrid>
              <LocalizedField label="بیوگرافی کامل" value={form.bio} onChange={(value) => update("bio", value)} rich />
              {services.length > 0 && (
                <div style={{ display: "grid", gap: 10 }}>
                  <strong>خدمات</strong>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
                    {services.map((service) => (
                      <label key={service._id} style={{ border: "1px solid #e4e7ec", borderRadius: 10, padding: 10, display: "flex", gap: 9, alignItems: "center", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.services.includes(service._id)} onChange={() => setForm((current) => ({ ...current, services: current.services.includes(service._id) ? current.services.filter((idValue) => idValue !== service._id) : [...current.services, service._id] }))} />
                        <span>{service.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section title="مدارک و دوره‌ها" description="گواهی‌ها، دوره‌های آموزشی و مجوزهای قابل نمایش در صفحه پزشک.">
              <div style={{ display: "grid", gap: 12 }}>
                {form.certificates.map((item, index) => (
                  <div key={index} style={{ border: "1px solid #e4e7ec", borderRadius: 14, padding: 14, display: "grid", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <strong>گواهی شماره {index + 1}</strong>
                      <button type="button" onClick={() => setForm((current) => ({ ...current, certificates: current.certificates.filter((_, itemIndex) => itemIndex !== index) }))}>حذف</button>
                    </div>
                    <FieldGrid>
                      <LocalizedField label="عنوان" value={item.title} onChange={(value) => setForm((current) => ({ ...current, certificates: current.certificates.map((row, rowIndex) => rowIndex === index ? { ...row, title: value } : row) }))} />
                      <LocalizedField label="صادرکننده" value={item.issuer} onChange={(value) => setForm((current) => ({ ...current, certificates: current.certificates.map((row, rowIndex) => rowIndex === index ? { ...row, issuer: value } : row) }))} />
                    </FieldGrid>
                    <label style={{ display: "grid", gap: 7, maxWidth: 180 }}><span>سال</span><input inputMode="numeric" value={item.year} onChange={(e) => setForm((current) => ({ ...current, certificates: current.certificates.map((row, rowIndex) => rowIndex === index ? { ...row, year: e.target.value.replace(/\\D/g, "").slice(0, 4) } : row) }))} /></label>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <button type="button" onClick={() => { setEditingCertificate(index); setPicker("certificate"); }}>انتخاب فایل / تصویر مدرک</button>
                      {item.mediaId && <Pill>مدرک پیوست شده</Pill>}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addCertificate}>افزودن گواهی</button>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {form.courses.map((item, index) => (
                  <div key={index} style={{ border: "1px solid #e4e7ec", borderRadius: 14, padding: 14, display: "grid", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><strong>دوره آموزشی {index + 1}</strong><button type="button" onClick={() => setForm((current) => ({ ...current, courses: current.courses.filter((_, itemIndex) => itemIndex !== index) }))}>حذف</button></div>
                    <FieldGrid>
                      <LocalizedField label="عنوان دوره" value={item.title} onChange={(value) => setForm((current) => ({ ...current, courses: current.courses.map((row, rowIndex) => rowIndex === index ? { ...row, title: value } : row) }))} />
                      <LocalizedField label="برگزارکننده" value={item.provider} onChange={(value) => setForm((current) => ({ ...current, courses: current.courses.map((row, rowIndex) => rowIndex === index ? { ...row, provider: value } : row) }))} />
                    </FieldGrid>
                    <input value={item.year} onChange={(e) => setForm((current) => ({ ...current, courses: current.courses.map((row, rowIndex) => rowIndex === index ? { ...row, year: e.target.value.replace(/\\D/g, "").slice(0, 4) } : row) }))} placeholder="سال" inputMode="numeric" />
                  </div>
                ))}
                <button type="button" onClick={() => setForm((current) => ({ ...current, courses: [...current.courses, { title: localized(), provider: localized(), year: "" }] }))}>افزودن دوره</button>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {form.credentials.map((item, index) => (
                  <div key={index} style={{ border: "1px solid #e4e7ec", borderRadius: 14, padding: 14, display: "grid", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><strong>مجوز / صلاحیت {index + 1}</strong><button type="button" onClick={() => setForm((current) => ({ ...current, credentials: current.credentials.filter((_, itemIndex) => itemIndex !== index) }))}>حذف</button></div>
                    <LocalizedField label="عنوان" value={item.title} onChange={(value) => setForm((current) => ({ ...current, credentials: current.credentials.map((row, rowIndex) => rowIndex === index ? { ...row, title: value } : row) }))} />
                    <LocalizedField label="توضیحات" value={item.description} onChange={(value) => setForm((current) => ({ ...current, credentials: current.credentials.map((row, rowIndex) => rowIndex === index ? { ...row, description: value } : row) }))} multiline />
                  </div>
                ))}
                <button type="button" onClick={() => setForm((current) => ({ ...current, credentials: [...current.credentials, { title: localized(), description: localized() }] }))}>افزودن صلاحیت</button>
              </div>
            </Section>

            <Section title="تصویر پزشک">
              <div style={{ maxWidth: 260, display: "grid", gap: 10 }}>
                <button type="button" onClick={() => setPicker("photo")}>انتخاب تصویر</button>
                <MediaThumb media={photo} onRemove={() => update("photoMediaId", null)} />
                {!photo && <Pill>تصویری انتخاب نشده</Pill>}
              </div>
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
                <label style={{ display: "grid", gap: 7 }}><span>تاریخ انتشار</span><input type="datetime-local" value={form.publishedAt} onChange={(e) => update("publishedAt", e.target.value)} /></label>
                <label style={{ display: "grid", gap: 7 }}><span>زمان انتشار زمان‌بندی‌شده</span><input type="datetime-local" value={form.scheduledAt} onChange={(e) => update("scheduledAt", e.target.value)} /></label>
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
                <label style={{ display: "grid", gap: 7 }}><span>زمان انتشار</span><input type="datetime-local" value={form.publishedAt} onChange={(e) => update("publishedAt", e.target.value)} /></label>
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
              <button type="button" onClick={() => setPicker("before")}>افزودن تصویر قبل از درمان</button>
            </Section>

            <Section title="گالری بعد از درمان" description="این تصاویر در صفحه نمونه‌کار به‌عنوان نتیجه درمان نمایش داده می‌شوند.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
                {selectedAfter.map((item, index) => <div key={item._id}><MediaThumb media={item} onRemove={() => removeFromList("afterMediaIds", item._id)} /><div style={{ display: "flex", gap: 5, marginTop: 6 }}><button type="button" disabled={index === 0} onClick={() => moveMedia("afterMediaIds", index, -1)}>←</button><button type="button" disabled={index === selectedAfter.length - 1} onClick={() => moveMedia("afterMediaIds", index, 1)}>→</button></div></div>)}
              </div>
              <button type="button" onClick={() => setPicker("after")}>افزودن تصویر بعد از درمان</button>
            </Section>
          </>
        )}

        {kind !== "doctor" && kind !== "blog" && kind !== "portfolio" && (
          <Section title="محتوا">
            <LocalizedField label="خلاصه" value={form.excerpt} onChange={(value) => update("excerpt", value)} multiline />
            <LocalizedField label="محتوا" value={form.content} onChange={(value) => update("content", value)} rich />
          </Section>
        )}

        <Section title="SEO" description="عنوان، توضیحات، canonical، Open Graph و robots برای هر زبان.">
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

        <Section title="انتشار">
          <FieldGrid>
            <label style={{ display: "grid", gap: 7 }}><span>وضعیت</span><select value={form.status} onChange={(e) => update("status", e.target.value as FormState["status"])}><option value="draft">پیش‌نویس</option><option value="published">منتشرشده</option><option value="scheduled">زمان‌بندی‌شده</option><option value="archived">بایگانی</option></select></label>
            {(kind === "doctor" || kind === "portfolio" || kind === "blog") && <label style={{ display: "grid", gap: 7 }}><span>زمان‌بندی انتشار</span><input type="datetime-local" value={form.scheduledAt} onChange={(e) => update("scheduledAt", e.target.value)} /></label>}
          </FieldGrid>
        </Section>

        {error && <div style={{ padding: 12, borderRadius: 10, background: "#fff1f3", color: "#b42318" }}>{error}</div>}
        {message && <div style={{ padding: 12, borderRadius: 10, background: "#ecfdf3", color: "#027a48" }}>{message}</div>}
        <div style={{ position: "sticky", bottom: 12, display: "flex", justifyContent: "flex-start", gap: 10, padding: 12, border: "1px solid #e4e7ec", borderRadius: 14, background: "rgba(255,255,255,.94)", backdropFilter: "blur(8px)" }}>
          <button disabled={saving} type="submit" style={{ background: "#111827", color: "#fff", border: 0, borderRadius: 10, padding: "11px 18px", fontWeight: 700 }}>{saving ? "در حال ذخیره…" : id ? "ذخیره تغییرات" : `ایجاد ${title}`}</button>
          <Link href={`/admin/content/${base}`} style={{ padding: "10px 14px", border: "1px solid #d0d5dd", borderRadius: 10, background: "#fff" }}>انصراف</Link>
        </div>
      </form>

      <MediaPicker
        open={picker !== null}
        mode={picker === "certificate" ? "file" : "image"}
        onClose={() => { setPicker(null); setEditingCertificate(null); }}
        onSelect={(selected) => {
          if (picker === "photo") update("photoMediaId", selected._id);
          if (picker === "cover") update("coverMediaId", selected._id);
          if (picker === "before") addMedia("beforeMediaIds", selected._id);
          if (picker === "after") addMedia("afterMediaIds", selected._id);
          if (picker === "ogImage") setForm((current) => ({ ...current, seo: { ...current.seo, ogImageMediaId: selected._id } }));
          if (picker === "certificate") insertCertificateMedia(selected._id);
          setPicker(null);
          setEditingCertificate(null);
          setMedia((current) => current.some((item) => item._id === selected._id) ? current : [...current, selected]);
        }}
      />
    </main>
  );
}
