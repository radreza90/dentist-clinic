const groups = [
  { title: "محتوای اصلی", items: [["خدمات", "/admin/content/services"], ["پزشکان", "/admin/content/doctors"], ["صفحات", "/admin/content/pages"]] },
  { title: "وبلاگ", items: [["مقالات", "/admin/content/blog"], ["دسته‌بندی مقالات", "/admin/content/blog/categories"]] },
  { title: "نمونه‌کارها", items: [["نمونه‌کارها", "/admin/content/portfolio"], ["دسته‌بندی نمونه‌کارها", "/admin/content/portfolio/categories"]] },
];

export default function ContentAdmin() {
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto" }}>
      <h1>مدیریت محتوا</h1>
      <p style={{ color: "#666" }}>تمام محتوای عمومی سایت از این بخش مدیریت می‌شود.</p>
      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", marginTop: 28 }}>
        {groups.map((group) => (
          <section key={group.title} style={{ border: "1px solid #ddd", borderRadius: 14, padding: 20 }}>
            <h2 style={{ marginTop: 0 }}>{group.title}</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {group.items.map(([label, href]) => (
                <a key={href} href={href} style={{ padding: "12px 14px", borderRadius: 10, background: "#f7f7f7", textDecoration: "none", color: "inherit" }}>{label}</a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}