import { Language } from '../types';

// Full list of supported languages
const languages: Language[] = [
  {
    code: "en-US",
    name: "English",
    country: "United States",
    flag: "https://flagcdn.com/us.svg"
  },
  {
    code: "es-ES",
    name: "Spanish",
    country: "Spain",
    flag: "https://flagcdn.com/es.svg"
  },
  {
    code: "fr-FR",
    name: "French",
    country: "France",
    flag: "https://flagcdn.com/fr.svg"
  },
  {
    code: "de-DE",
    name: "German",
    country: "Germany",
    flag: "https://flagcdn.com/de.svg"
  },
  {
    code: "it-IT",
    name: "Italian",
    country: "Italy",
    flag: "https://flagcdn.com/it.svg"
  },
  {
    code: "ja-JP",
    name: "Japanese",
    country: "Japan",
    flag: "https://flagcdn.com/jp.svg"
  },
  {
    code: "zh-CN",
    name: "Chinese (Simplified)",
    country: "China",
    flag: "https://flagcdn.com/cn.svg"
  },
  {
    code: "zh-TW",
    name: "Chinese (Traditional)",
    country: "Taiwan",
    flag: "https://flagcdn.com/tw.svg"
  },
  {
    code: "ko-KR",
    name: "Korean",
    country: "South Korea",
    flag: "https://flagcdn.com/kr.svg"
  },
  {
    code: "ru-RU",
    name: "Russian",
    country: "Russia",
    flag: "https://flagcdn.com/ru.svg"
  },
  {
    code: "pt-BR",
    name: "Portuguese",
    country: "Brazil",
    flag: "https://flagcdn.com/br.svg"
  },
  {
    code: "ar-SA",
    name: "Arabic",
    country: "Saudi Arabia",
    flag: "https://flagcdn.com/sa.svg"
  },
  {
    code: "hi-IN",
    name: "Hindi",
    country: "India",
    flag: "https://flagcdn.com/in.svg"
  },
  {
    code: "bn-IN",
    name: "Bengali",
    country: "India",
    flag: "https://flagcdn.com/in.svg"
  },
  {
    code: "pa-IN",
    name: "Punjabi",
    country: "India",
    flag: "https://flagcdn.com/in.svg"
  },
  {
    code: "te-IN",
    name: "Telugu",
    country: "India",
    flag: "https://flagcdn.com/in.svg"
  },
  {
    code: "tr-TR",
    name: "Turkish",
    country: "Turkey",
    flag: "https://flagcdn.com/tr.svg"
  },
  {
    code: "nl-NL",
    name: "Dutch",
    country: "Netherlands",
    flag: "https://flagcdn.com/nl.svg"
  },
  {
    code: "pl-PL",
    name: "Polish",
    country: "Poland",
    flag: "https://flagcdn.com/pl.svg"
  },
  {
    code: "id-ID",
    name: "Indonesian",
    country: "Indonesia",
    flag: "https://flagcdn.com/id.svg"
  },
  {
    code: "ms-MY",
    name: "Malay",
    country: "Malaysia",
    flag: "https://flagcdn.com/my.svg"
  },
  {
    code: "th-TH",
    name: "Thai",
    country: "Thailand",
    flag: "https://flagcdn.com/th.svg"
  },
  {
    code: "vi-VN",
    name: "Vietnamese",
    country: "Vietnam",
    flag: "https://flagcdn.com/vn.svg"
  },
  {
    code: "sv-SE",
    name: "Swedish",
    country: "Sweden",
    flag: "https://flagcdn.com/se.svg"
  },
  {
    code: "no-NO",
    name: "Norwegian",
    country: "Norway",
    flag: "https://flagcdn.com/no.svg"
  },
  {
    code: "fi-FI",
    name: "Finnish",
    country: "Finland",
    flag: "https://flagcdn.com/fi.svg"
  },
  {
    code: "da-DK",
    name: "Danish",
    country: "Denmark",
    flag: "https://flagcdn.com/dk.svg"
  },
  {
    code: "cs-CZ",
    name: "Czech",
    country: "Czech Republic",
    flag: "https://flagcdn.com/cz.svg"
  },
  {
    code: "el-GR",
    name: "Greek",
    country: "Greece",
    flag: "https://flagcdn.com/gr.svg"
  },
  {
    code: "he-IL",
    name: "Hebrew",
    country: "Israel",
    flag: "https://flagcdn.com/il.svg"
  },
  {
    code: "hu-HU",
    name: "Hungarian",
    country: "Hungary",
    flag: "https://flagcdn.com/hu.svg"
  },
  {
    code: "ro-RO",
    name: "Romanian",
    country: "Romania",
    flag: "https://flagcdn.com/ro.svg"
  },
  {
    code: "sk-SK",
    name: "Slovak",
    country: "Slovakia",
    flag: "https://flagcdn.com/sk.svg"
  },
  {
    code: "uk-UA",
    name: "Ukrainian",
    country: "Ukraine",
    flag: "https://flagcdn.com/ua.svg"
  },
  {
    code: "hr-HR",
    name: "Croatian",
    country: "Croatia",
    flag: "https://flagcdn.com/hr.svg"
  },
  {
    code: "sr-RS",
    name: "Serbian",
    country: "Serbia",
    flag: "https://flagcdn.com/rs.svg"
  },
  {
    code: "bg-BG",
    name: "Bulgarian",
    country: "Bulgaria",
    flag: "https://flagcdn.com/bg.svg"
  },
  {
    code: "lt-LT",
    name: "Lithuanian",
    country: "Lithuania",
    flag: "https://flagcdn.com/lt.svg"
  },
  {
    code: "lv-LV",
    name: "Latvian",
    country: "Latvia",
    flag: "https://flagcdn.com/lv.svg"
  },
  {
    code: "et-EE",
    name: "Estonian",
    country: "Estonia",
    flag: "https://flagcdn.com/ee.svg"
  },
  {
    code: "fa-IR",
    name: "Persian",
    country: "Iran",
    flag: "https://flagcdn.com/ir.svg"
  },
  {
    code: "ur-PK",
    name: "Urdu",
    country: "Pakistan",
    flag: "https://flagcdn.com/pk.svg"
  },
  {
    code: "af-ZA",
    name: "Afrikaans",
    country: "South Africa",
    flag: "https://flagcdn.com/za.svg"
  },
  {
    code: "sw-KE",
    name: "Swahili",
    country: "Kenya",
    flag: "https://flagcdn.com/ke.svg"
  },
  {
    code: "am-ET",
    name: "Amharic",
    country: "Ethiopia",
    flag: "https://flagcdn.com/et.svg"
  },
  {
    code: "km-KH",
    name: "Khmer",
    country: "Cambodia",
    flag: "https://flagcdn.com/kh.svg"
  },
  {
    code: "lo-LA",
    name: "Lao",
    country: "Laos",
    flag: "https://flagcdn.com/la.svg"
  },
  {
    code: "my-MM",
    name: "Myanmar",
    country: "Myanmar",
    flag: "https://flagcdn.com/mm.svg"
  },
  {
    code: "ne-NP",
    name: "Nepali",
    country: "Nepal",
    flag: "https://flagcdn.com/np.svg"
  },
  {
    code: "ka-GE",
    name: "Georgian",
    country: "Georgia",
    flag: "https://flagcdn.com/ge.svg"
  },
  {
    code: "hy-AM",
    name: "Armenian",
    country: "Armenia",
    flag: "https://flagcdn.com/am.svg"
  },
  {
    code: "mn-MN",
    name: "Mongolian",
    country: "Mongolia",
    flag: "https://flagcdn.com/mn.svg"
  }
];

export default languages;
