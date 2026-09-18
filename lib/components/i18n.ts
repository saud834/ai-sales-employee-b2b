export type Lang = "ar" | "en";

const STRINGS = {
  en: {
    name: "Name",
    email: "Email",
    message: "Message",
    send: "Send Message",
    thanksMessage: "Thanks! Your message has been received. We will get back to you shortly.",
    date: "Date",
    time: "Time",
    guests: "Guests",
    sendWhatsapp: "Send via WhatsApp",
    addWhatsapp: "Add a WhatsApp number to enable booking",
    callUs: "Or call us at",
    subscribe: "Subscribe",
    subscribed: "You're subscribed — thank you!",
    choosePlan: "Choose Plan",
    whatsapp: "WhatsApp",
  },
  ar: {
    name: "الاسم",
    email: "البريد الإلكتروني",
    message: "الرسالة",
    send: "إرسال الرسالة",
    thanksMessage: "شكرًا لك! تم استلام رسالتك وسنتواصل معك قريبًا.",
    date: "التاريخ",
    time: "الوقت",
    guests: "عدد الأشخاص",
    sendWhatsapp: "إرسال عبر واتساب",
    addWhatsapp: "أضف رقم واتساب لتفعيل الحجز",
    callUs: "أو اتصل بنا على",
    subscribe: "اشتراك",
    subscribed: "تم الاشتراك — شكرًا لك!",
    choosePlan: "اختر الباقة",
    whatsapp: "واتساب",
  },
} satisfies Record<Lang, Record<string, string>>;

export type StringKey = keyof (typeof STRINGS)["en"];

export function t(lang: Lang | undefined, key: StringKey): string {
  return STRINGS[lang ?? "en"][key];
}
