"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatJalaliDate, fromJalaliDate, jalaliMonthLength, toJalaliDate } from "@/lib/jalali-date";

type PickerMode = "date" | "datetime" | "time";

type PersianDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  mode?: PickerMode;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  clearable?: boolean;
};

const monthNames = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];
const weekDays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const persianNumber = new Intl.NumberFormat("fa-IR", { useGrouping: false });

function todayIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function currentValueDate(value: string, mode: PickerMode): string {
  if (mode === "time") return todayIsoDate();
  return value.slice(0, 10) || todayIsoDate();
}

function timeFromValue(value: string, mode: PickerMode): string {
  if (mode === "time") return /^\d{2}:\d{2}$/.test(value) ? value : "09:00";
  const time = value.slice(11, 16);
  return /^\d{2}:\d{2}$/.test(time) ? time : "09:00";
}

function formatTime(value: string) {
  return value.replace(/\d/g, (digit) => persianNumber.format(Number(digit)));
}

export function PersianDatePicker({
  value,
  onChange,
  mode = "date",
  label,
  placeholder,
  disabled = false,
  id,
  clearable = true,
}: PersianDatePickerProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(() => ({ year: 1400, month: 1 }));
  const containerRef = useRef<HTMLDivElement>(null);
  const dateValue = currentValueDate(value, mode);
  const selectedJalali = toJalaliDate(dateValue);
  const selectedTime = timeFromValue(value, mode);

  useEffect(() => {
    if (!open) return;
    function closeOnOutside(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const days = useMemo(() => {
    if (mode === "time") return [];
    const firstDay = fromJalaliDate(visible.year, visible.month, 1);
    if (!firstDay) return [];
    const dateParts = firstDay.split("-").map(Number);
    const weekOffset = (new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2])).getUTCDay() + 1) % 7;
    const monthLength = jalaliMonthLength(visible.year, visible.month);
    return Array.from({ length: 42 }, (_, index) => {
      const day = index - weekOffset + 1;
      if (day < 1 || day > monthLength) return null;
      const isoDate = fromJalaliDate(visible.year, visible.month, day);
      return isoDate ? { day, isoDate } : null;
    });
  }, [mode, visible]);

  function showPicker() {
    const initialDate = toJalaliDate(currentValueDate(value, mode)) ?? toJalaliDate(todayIsoDate());
    if (initialDate) setVisible({ year: initialDate.year, month: initialDate.month });
    setOpen(true);
  }

  function changeMonth(amount: number) {
    setVisible((current) => {
      const monthIndex = current.month - 1 + amount;
      const year = current.year + Math.floor(monthIndex / 12);
      return { year, month: ((monthIndex % 12) + 12) % 12 + 1 };
    });
  }

  function selectDate(isoDate: string) {
    if (mode === "datetime") {
      onChange(`${isoDate}T${selectedTime}`);
      return;
    }
    onChange(isoDate);
    setOpen(false);
  }

  function selectTime(part: "hour" | "minute", nextValue: string) {
    const [hour, minute] = selectedTime.split(":");
    const nextTime = `${part === "hour" ? nextValue : hour}:${part === "minute" ? nextValue : minute}`;
    onChange(mode === "time" ? nextTime : `${dateValue}T${nextTime}`);
  }

  const displayValue = mode === "time"
    ? (value ? formatTime(value) : "")
    : value
      ? `${formatJalaliDate(dateValue)}${mode === "datetime" ? `، ${formatTime(selectedTime)}` : ""}`
      : "";
  const emptyPlaceholder = placeholder ?? (mode === "time" ? "انتخاب ساعت" : mode === "datetime" ? "انتخاب تاریخ و ساعت" : "انتخاب تاریخ شمسی");
  const today = todayIsoDate();

  return (
    <div className={`persian-picker-field${disabled ? " is-disabled" : ""}`} ref={containerRef}>
      {label && <span className="persian-picker-label" id={`${fieldId}-label`}>{label}</span>}
      <button
        id={fieldId}
        className="persian-picker-trigger"
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={label ? `${fieldId}-label ${fieldId}` : undefined}
        onClick={() => open ? setOpen(false) : showPicker()}
      >
        <span className={`persian-picker-value${displayValue ? "" : " is-placeholder"}`}>{displayValue || emptyPlaceholder}</span>
        <span className="persian-picker-trigger-icon" aria-hidden="true">{mode === "time" ? "◷" : "▦"}</span>
      </button>

      {open && (
        <div className={`persian-picker-popover${mode === "datetime" ? " has-time" : ""}`} role="dialog" aria-modal="false" aria-label={label || emptyPlaceholder} dir="rtl">
          {mode !== "time" && (
            <section className="persian-calendar">
              <header className="persian-calendar-header">
                <button type="button" className="persian-calendar-nav" aria-label="ماه قبل" onClick={() => changeMonth(-1)}>‹</button>
                <div className="persian-calendar-heading">
                  <select aria-label="ماه شمسی" value={visible.month} onChange={(event) => setVisible((current) => ({ ...current, month: Number(event.target.value) }))}>
                    {monthNames.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                  </select>
                  <select aria-label="سال شمسی" value={visible.year} onChange={(event) => setVisible((current) => ({ ...current, year: Number(event.target.value) }))}>
                    {Array.from({ length: 21 }, (_, index) => visible.year - 10 + index).map((year) => <option key={year} value={year}>{persianNumber.format(year)}</option>)}
                  </select>
                </div>
                <button type="button" className="persian-calendar-nav" aria-label="ماه بعد" onClick={() => changeMonth(1)}>›</button>
              </header>
              <div className="persian-calendar-grid persian-calendar-weekdays">
                {weekDays.map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="persian-calendar-grid persian-calendar-days">
                {days.map((day, index) => day ? (
                  <button
                    key={day.isoDate}
                    type="button"
                    className={`${day.isoDate === dateValue ? "selected" : ""}${day.isoDate === today ? " today" : ""}`}
                    aria-pressed={day.isoDate === dateValue}
                    aria-label={`${persianNumber.format(day.day)} ${monthNames[visible.month - 1]} ${persianNumber.format(visible.year)}`}
                    onClick={() => selectDate(day.isoDate)}
                  >{persianNumber.format(day.day)}</button>
                ) : <span key={`empty-${visible.year}-${visible.month}-${index}`} aria-hidden="true" />)}
              </div>
              <div className="persian-calendar-actions">
                <button type="button" className="persian-calendar-today" onClick={() => selectDate(today)}>امروز</button>
                {clearable && <button type="button" className="persian-calendar-clear" onClick={() => { onChange(""); setOpen(false); }}>پاک کردن</button>}
              </div>
            </section>
          )}
          {mode !== "date" && (
            <section className="persian-time-panel">
              <h3>انتخاب ساعت</h3>
              <div className="persian-time-selects" dir="ltr">
                <label>
                  <span>ساعت</span>
                  <select value={selectedTime.split(":")[0]} onChange={(event) => selectTime("hour", event.target.value)} aria-label="ساعت">
                    {Array.from({ length: 24 }, (_, hour) => <option key={hour} value={String(hour).padStart(2, "0")}>{persianNumber.format(hour)}</option>)}
                  </select>
                </label>
                <span className="persian-time-colon">:</span>
                <label>
                  <span>دقیقه</span>
                  <select value={selectedTime.split(":")[1]} onChange={(event) => selectTime("minute", event.target.value)} aria-label="دقیقه">
                    {Array.from({ length: 60 }, (_, minute) => <option key={minute} value={String(minute).padStart(2, "0")}>{persianNumber.format(minute)}</option>)}
                  </select>
                </label>
              </div>
              {mode === "datetime" && <p className="persian-time-hint">{selectedJalali ? `${persianNumber.format(selectedJalali.day)} ${monthNames[selectedJalali.month - 1]} ${persianNumber.format(selectedJalali.year)}` : "ابتدا تاریخ را انتخاب کنید"}</p>}
              <div className="persian-time-actions">
                {clearable && <button type="button" className="persian-calendar-clear" onClick={() => { onChange(""); setOpen(false); }}>پاک کردن</button>}
                <button type="button" className="persian-picker-done" onClick={() => setOpen(false)}>تأیید</button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
