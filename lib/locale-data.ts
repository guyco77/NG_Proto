// Update-002: IANA Timezone list grouped by region
export const TIMEZONES = [
  // Middle East
  { value: 'Asia/Jerusalem', label: 'Jerusalem (IST)', region: 'Middle East' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', region: 'Middle East' },
  { value: 'Asia/Riyadh', label: 'Riyadh (AST)', region: 'Middle East' },
  { value: 'Asia/Tehran', label: 'Tehran (IRST)', region: 'Middle East' },
  { value: 'Asia/Baghdad', label: 'Baghdad (AST)', region: 'Middle East' },
  { value: 'Asia/Beirut', label: 'Beirut (EET)', region: 'Middle East' },
  { value: 'Asia/Amman', label: 'Amman (EET)', region: 'Middle East' },
  // Europe
  { value: 'Europe/London', label: 'London (GMT/BST)', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris (CET)', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET)', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid (CET)', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Rome (CET)', region: 'Europe' },
  { value: 'Europe/Zurich', label: 'Zurich (CET)', region: 'Europe' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET)', region: 'Europe' },
  { value: 'Europe/Vienna', label: 'Vienna (CET)', region: 'Europe' },
  { value: 'Europe/Brussels', label: 'Brussels (CET)', region: 'Europe' },
  { value: 'Europe/Athens', label: 'Athens (EET)', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)', region: 'Europe' },
  // Americas
  { value: 'America/New_York', label: 'New York (EST/EDT)', region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', region: 'Americas' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)', region: 'Americas' },
  { value: 'America/Denver', label: 'Denver (MST/MDT)', region: 'Americas' },
  { value: 'America/Toronto', label: 'Toronto (EST/EDT)', region: 'Americas' },
  { value: 'America/Vancouver', label: 'Vancouver (PST/PDT)', region: 'Americas' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST)', region: 'Americas' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', region: 'Americas' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)', region: 'Americas' },
  // Asia Pacific
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', region: 'Asia Pacific' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', region: 'Asia Pacific' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', region: 'Asia Pacific' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', region: 'Asia Pacific' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)', region: 'Asia Pacific' },
  { value: 'Asia/Mumbai', label: 'Mumbai (IST)', region: 'Asia Pacific' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)', region: 'Asia Pacific' },
  { value: 'Asia/Jakarta', label: 'Jakarta (WIB)', region: 'Asia Pacific' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)', region: 'Asia Pacific' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST)', region: 'Asia Pacific' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)', region: 'Asia Pacific' },
  // Africa
  { value: 'Africa/Cairo', label: 'Cairo (EET)', region: 'Africa' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', region: 'Africa' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)', region: 'Africa' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)', region: 'Africa' },
  // UTC
  { value: 'UTC', label: 'UTC', region: 'UTC' },
]

// Group timezones by region
export const TIMEZONE_GROUPS = TIMEZONES.reduce((acc, tz) => {
  if (!acc[tz.region]) acc[tz.region] = []
  acc[tz.region].push(tz)
  return acc
}, {} as Record<string, typeof TIMEZONES>)

// Update-003: Country codes for phone input
export const COUNTRY_CODES = [
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+358', country: 'Finland', flag: '🇫🇮' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
]

// Helper to format phone number to E.164
export function formatPhoneE164(countryCode: string, localNumber: string): string {
  const cleaned = localNumber.replace(/\D/g, '')
  return `${countryCode}${cleaned}`
}

// Helper to parse E.164 to country code + local number
export function parsePhoneE164(phone: string): { countryCode: string; localNumber: string } | null {
  if (!phone || !phone.startsWith('+')) return null
  
  // Try to match country codes (longest first)
  const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)
  for (const cc of sortedCodes) {
    if (phone.startsWith(cc.code)) {
      return {
        countryCode: cc.code,
        localNumber: phone.slice(cc.code.length),
      }
    }
  }
  return null
}

// Helper to get timezone label from IANA ID
export function getTimezoneLabel(tzId: string): string {
  const tz = TIMEZONES.find(t => t.value === tzId)
  return tz?.label || tzId
}
