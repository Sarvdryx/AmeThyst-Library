export type SupportedLocale = 'vi' | 'en';

// Format ngày ngắn gọn theo locale (vd: "Jan 12, 2026" / "12 thg 1, 2026")
// Trả về nguyên chuỗi gốc nếu parse lỗi.
export function formatShortDate(dateStr: string, locale: SupportedLocale): string {
  try {
    const d = new Date(dateStr);
    const opt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', opt);
  } catch {
    return dateStr;
  }
}

// Format last-login dạng tương đối (vd: "5m ago" / "5 phút trước"),
// fallback về formatShortDate nếu quá 24h. Trả về '-' nếu input rỗng/lỗi.
export function formatRelativeLastLogin(dateStr: string | null | undefined, locale: SupportedLocale): string {
  if (!dateStr) return '-';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return locale === 'vi' ? 'Vừa mới đây' : 'Just now';
    if (diffMins < 60) return locale === 'vi' ? `${diffMins} phút trước` : `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return locale === 'vi' ? `${diffHours} giờ trước` : `${diffHours}h ago`;

    return formatShortDate(dateStr, locale);
  } catch {
    return '-';
  }
}
