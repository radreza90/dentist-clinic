import Link from "next/link";

const stats = [
  { label: "نوبت‌های امروز", value: "۲۸", meta: "+۱۲٪ نسبت به هفته قبل", icon: "▣", tone: "blue" },
  { label: "بیماران ثبت شده", value: "۱٬۲۴۶", meta: "+۸٫۴٪ این ماه", icon: "♧", tone: "green" },
  { label: "پزشکان فعال", value: "۱۲", meta: "۲ پزشک در مرخصی", icon: "♙", tone: "violet" },
  { label: "خدمات فعال", value: "۳۴", meta: "همه خدمات به‌روز", icon: "✦", tone: "orange" },
];

const appointments = [
  { id: "۱", patient: "علی محمدی", doctor: "دکتر احمدی", service: "ویزیت عمومی", time: "۱۰:۳۰", status: "تأیید شده", statusTone: "success" },
  { id: "۲", patient: "مریم کریمی", doctor: "دکتر رضایی", service: "جرم‌گیری", time: "۱۱:۱۵", status: "در انتظار", statusTone: "warning" },
  { id: "۳", patient: "سارا موسوی", doctor: "دکتر احمدی", service: "ترمیم دندان", time: "۱۲:۰۰", status: "تأیید شده", statusTone: "success" },
  { id: "۴", patient: "رضا حسینی", doctor: "دکتر محمدی", service: "مشاوره", time: "۱۳:۳۰", status: "در انتظار", statusTone: "warning" },
];

const activity = [
  { title: "نوبت جدید ثبت شد", detail: "سارا موسوی • ترمیم دندان", time: "۵ دقیقه پیش", icon: "＋" },
  { title: "پرداخت با موفقیت انجام شد", detail: "۲٬۴۵۰٬۰۰۰ ریال • علی محمدی", time: "۲۲ دقیقه پیش", icon: "✓" },
  { title: "پزشک جدید اضافه شد", detail: "دکتر نازنین کریمی", time: "۱ ساعت پیش", icon: "♙" },
];

export default function AdminDashboard() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-eyebrow">مرکز کنترل کلینیک</span>
          <h1>خوش آمدید، مدیر سیستم</h1>
          <p>نمای کلی عملکرد کلینیک و وضعیت نوبت‌های امروز را اینجا ببینید.</p>
        </div>
        <div className="dashboard-hero-actions"><span className="dashboard-live-dot" /><span>سیستم فعال است</span></div>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="glass-card stat-card">
            <div className={`stat-icon stat-icon-${stat.tone}`}>{stat.icon}</div>
            <div className="stat-copy"><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.meta}</small></div>
            <span className="stat-chevron">↗</span>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="glass-card chart-card">
          <div className="card-heading">
            <div><span className="card-kicker">روند ماهانه</span><h2>نوبت‌های ثبت‌شده</h2></div>
            <select defaultValue="month" aria-label="بازه زمانی"><option value="month">این ماه</option><option value="quarter">۳ ماه اخیر</option></select>
          </div>
          <div className="chart-summary"><strong>۲۳۸</strong><span>نوبت در این ماه</span></div>
          <div className="line-chart" aria-label="نمودار روند نوبت‌های ثبت‌شده">
            <div className="chart-grid-lines" />
            <svg viewBox="0 0 720 240" role="img" aria-hidden="true">
              <polyline points="20,190 90,170 160,180 230,125 300,145 370,92 440,112 510,82 580,94 650,52 700,60" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="20,190 90,170 160,180 230,125 300,145 370,92 440,112 510,82 580,94 650,52 700,60 700,240 20,240" fill="currentColor" opacity=".08" stroke="none" />
            </svg>
            <div className="chart-labels"><span>۲۵</span><span>۲۷</span><span>۲۹</span><span>۳۱</span><span>۲</span><span>۴</span><span>۶</span><span>۸</span></div>
          </div>
        </article>

        <article className="glass-card appointment-status-card">
          <div className="card-heading">
            <div><span className="card-kicker">وضعیت نوبت‌ها</span><h2>امروز</h2></div>
            <span className="soft-badge">۲۸ نوبت</span>
          </div>
          <div className="status-visual">
            <div className="donut-chart"><div className="donut-hole"><strong>۲۸</strong><span>نوبت</span></div></div>
            <div className="status-legend">
              <div><span className="legend-dot confirmed" /><span>تأیید شده</span><strong>۱۸</strong></div>
              <div><span className="legend-dot pending" /><span>در انتظار</span><strong>۶</strong></div>
              <div><span className="legend-dot cancelled" /><span>لغو شده</span><strong>۳</strong></div>
              <div><span className="legend-dot completed" /><span>انجام شده</span><strong>۱</strong></div>
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="glass-card table-card">
          <div className="card-heading"><div><span className="card-kicker">برنامه امروز</span><h2>آخرین نوبت‌ها</h2></div><Link href="/admin/appointments">مشاهده همه ←</Link></div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead><tr><th>#</th><th>بیمار</th><th>پزشک</th><th>خدمت</th><th>زمان</th><th>وضعیت</th></tr></thead>
              <tbody>{appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{appointment.id}</td><td><strong>{appointment.patient}</strong></td><td>{appointment.doctor}</td><td>{appointment.service}</td><td>{appointment.time}</td>
                  <td><span className={`status-pill ${appointment.statusTone}`}>{appointment.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </article>

        <article className="glass-card activity-card">
          <div className="card-heading"><div><span className="card-kicker">فعالیت سیستم</span><h2>رویدادهای اخیر</h2></div></div>
          <div className="activity-list">{activity.map((item) => (
            <div key={item.title} className="activity-item">
              <span className="activity-icon">{item.icon}</span>
              <div><strong>{item.title}</strong><span>{item.detail}</span></div>
              <time>{item.time}</time>
            </div>
          ))}</div>
        </article>
      </section>
    </div>
  );
}
