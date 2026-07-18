import bankLogo from '../assets/images/bankLogo.png';
import islamicBankLogo from '../assets/images/islamicBankLogo.png';
import mahfazaLogo from '../assets/images/mahfazaLogo.webp';

export const PRESET_LOGOS = [
  { key: 'preset:bank',    src: bankLogo,        label: 'بنك فلسطين',     theme: 'bank' },
  { key: 'preset:islamic', src: islamicBankLogo, label: 'البنك الإسلامي', theme: 'islamic' },
  { key: 'preset:mahfaza', src: mahfazaLogo,     label: 'محفظة',          theme: 'mahfaza' },
];

const PRESET_MAP = Object.fromEntries(PRESET_LOGOS.map(p => [p.key, p.src]));
const THEME_MAP = Object.fromEntries(PRESET_LOGOS.map(p => [p.key, p.theme]));

const IMG_BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

export function resolveLogoSrc(logo) {
  if (!logo) return null;
  if (PRESET_MAP[logo]) return PRESET_MAP[logo];
  if (logo.startsWith('http')) return logo;
  return `${IMG_BASE}${logo}`;
}

// يحدد لون بطاقة الدفع حسب الشعار الجاهز المختار (أخضر للبنك الإسلامي، بنفسجي لمحفظة، ...)
// شعار مخصص مرفوع من الأدمن يبقى على الألوان الافتراضية للمتجر
export function resolveCardTheme(logo) {
  return THEME_MAP[logo] || 'default';
}
