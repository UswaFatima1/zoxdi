/**
 * Minimal i18n. The interface ships English-first; strings are keyed so a
 * translated set could be added without rebuilding the application. Missing
 * entries fall back to English.
 */

export type Lang = "en" | "ur";

const DICT: Record<string, { en: string; ur?: string }> = {
  "tagline": {
    en: "Learn the language of business. Master the logic of money.",
    ur: "کاروبار کی زبان سیکھیں، پیسے کی منطق سمجھیں۔",
  },
  "nav.home": { en: "Home", ur: "ہوم" },
  "nav.learn": { en: "Learn", ur: "سیکھیں" },
  "nav.progress": { en: "My Progress", ur: "میری ترقی" },
  "nav.toggle-language": { en: "اردو", ur: "English" },
  "action.check": { en: "Check answer", ur: "جواب چیک کریں" },
  "action.reset": { en: "Reset", ur: "دوبارہ" },
  "action.retry": { en: "Try again", ur: "دوبارہ کوشش کریں" },
  "action.next": { en: "Next level", ur: "اگلی سطح" },
  "action.back-to-chapters": { en: "Back to chapters", ur: "اسباق پر واپس" },
  "action.view-chapters": { en: "Choose a chapter", ur: "باب منتخب کریں" },
  "action.hint": { en: "Hint", ur: "اشارہ" },
  "hint.one-more": { en: "Last hint", ur: "آخری اشارہ" },
  "forge.debit": { en: "Debit", ur: "ڈیبٹ" },
  "forge.credit": { en: "Credit", ur: "کریڈٹ" },
  "forge.tray": { en: "Accounts", ur: "کھاتے" },
  "forge.totals": { en: "Totals", ur: "کل" },
  "forge.key": { en: "Drag an account card — or tap it, then tap Debit or Credit.", ur: "اکاؤنٹ کارڈ گھسیٹیں، یا ٹیپ کر کے ڈیبٹ یا کریڈٹ منتخب کریں۔" },
  "feedback.correct": { en: "Correct!", ur: "درست!" },
  "feedback.level-complete": { en: "Level complete", ur: "سطح مکمل" },
  "feedback.review-weaker": { en: "Recommended next", ur: "اگلا مشورہ" },
  "equation.assets": { en: "Assets", ur: "اثاثے" },
  "equation.liabilities": { en: "Liabilities", ur: "ذمہ داریاں" },
  "equation.equity": { en: "Equity", ur: "ایکویٹی" },
  "equation.revenue": { en: "Revenue", ur: "آمدنی" },
  "equation.expenses": { en: "Expenses", ur: "اخراجات" },
  "view.activity": { en: "Business", ur: "کاروبار" },
  "view.journal": { en: "Journal", ur: "جریدہ" },
  "view.equation": { en: "Equation", ur: "مساوات" },
};

export function t(key: string, lang: Lang, vars?: Record<string, string | number>): string {
  const entry = DICT[key];
  let text: string;
  if (entry?.ur && lang === "ur") text = entry.ur;
  else text = entry?.en ?? key;

  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
