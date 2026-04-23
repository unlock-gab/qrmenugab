export type Locale = "fr" | "ar";

const translations = {
  // Public ordering page
  takeaway: { fr: "À emporter", ar: "استلام" },
  delivery: { fr: "Livraison", ar: "توصيل" },
  dineIn: { fr: "Sur place", ar: "داخل المطعم" },
  addToCart: { fr: "Ajouter", ar: "أضف" },
  continueCheckout: { fr: "Passer la commande", ar: "متابعة للدفع" },
  checkout: { fr: "Finaliser la commande", ar: "إتمام الطلب" },
  yourOrder: { fr: "Votre commande", ar: "طلبك" },
  yourInfo: { fr: "Vos informations", ar: "معلوماتك" },
  name: { fr: "Nom *", ar: "الاسم *" },
  phone: { fr: "Téléphone *", ar: "رقم الهاتف *" },
  address: { fr: "Adresse de livraison *", ar: "عنوان التوصيل *" },
  promoCode: { fr: "Code promo (optionnel)", ar: "كود خصم (اختياري)" },
  notes: { fr: "Notes (optionnel)", ar: "ملاحظات (اختياري)" },
  placeOrder: { fr: "Confirmer la commande", ar: "تأكيد الطلب" },
  placingOrder: { fr: "Traitement…", ar: "جاري الطلب..." },
  backToMenu: { fr: "← Retour au menu", ar: "← العودة للقائمة" },
  orderPlaced: { fr: "Commande confirmée !", ar: "تم الطلب!" },
  orderNumber: { fr: "Numéro de commande", ar: "رقم الطلب" },
  newOrder: { fr: "Nouvelle commande", ar: "طلب جديد" },
  deliveryMsg: { fr: "Votre commande sera livrée à votre adresse.", ar: "سيتم التوصيل قريباً." },
  takeawayMsg: { fr: "Votre commande sera prête à emporter.", ar: "طلبك جاهز للاستلام قريباً." },
  total: { fr: "Total", ar: "الإجمالي" },
  free: { fr: "Gratuit", ar: "مجاناً" },
  outOfStock: { fr: "Épuisé", ar: "نفد" },
  chooseOne: { fr: "Choisir un", ar: "اختر واحد" },
  multiple: { fr: "Multiple", ar: "متعدد" },
  required: { fr: "Requis", ar: "مطلوب" },
  cancel: { fr: "Annuler", ar: "إلغاء" },

  // Customer auth
  customerLogin: { fr: "Connexion client", ar: "تسجيل دخول العميل" },
  customerLoginSub: { fr: "Suivez vos commandes et gagnez des points", ar: "تابع طلباتك واكسب نقاط ولاء" },
  email: { fr: "E-mail", ar: "البريد الإلكتروني" },
  password: { fr: "Mot de passe", ar: "كلمة المرور" },
  signIn: { fr: "Se connecter", ar: "تسجيل الدخول" },
  signingIn: { fr: "Connexion…", ar: "جاري الدخول..." },
  noAccount: { fr: "Pas encore de compte ?", ar: "ليس لديك حساب؟" },
  createAccount: { fr: "Créer un compte", ar: "إنشاء حساب" },
  hasAccount: { fr: "Déjà un compte ?", ar: "لديك حساب بالفعل؟" },
  register: { fr: "Créer un compte client", ar: "إنشاء حساب عميل" },
  registerSub: { fr: "Suivez vos commandes et gagnez des points fidélité", ar: "تابع طلباتك واكسب نقاط ولاء" },
  fullName: { fr: "Nom complet *", ar: "الاسم *" },
  phoneOptional: { fr: "Téléphone", ar: "الهاتف" },
  confirmPassword: { fr: "Confirmer le mot de passe *", ar: "تأكيد كلمة المرور *" },
  creating: { fr: "Création…", ar: "جاري الإنشاء..." },
  passwordMismatch: { fr: "Les mots de passe ne correspondent pas", ar: "كلمتا المرور غير متطابقتين" },
  registerSuccess: { fr: "Compte créé avec succès !", ar: "تم إنشاء حسابك!" },

  // Customer orders
  myOrders: { fr: "Mes commandes", ar: "طلباتي" },
  noOrders: { fr: "Aucune commande pour l'instant", ar: "لا توجد طلبات بعد" },
  noOrdersSub: { fr: "Passez une commande pour la voir ici", ar: "اطلب من أي مطعم لتظهر طلباتك هنا" },
  logout: { fr: "Déconnexion", ar: "خروج" },
  saved: { fr: "Économisé", ar: "وفّرت" },
  orderType: { fr: "Type", ar: "النوع" },
  branch: { fr: "Succursale", ar: "الفرع" },
  date: { fr: "Date", ar: "التاريخ" },

  // Order types
  DINE_IN: { fr: "Sur place", ar: "داخلي" },
  TAKEAWAY: { fr: "À emporter", ar: "استلام" },
  DELIVERY: { fr: "Livraison", ar: "توصيل" },

  // Order statuses
  NEW: { fr: "Nouveau", ar: "جديد" },
  PREPARING: { fr: "En préparation", ar: "يُحضَّر" },
  READY: { fr: "Prêt", ar: "جاهز" },
  SERVED: { fr: "Servi", ar: "قُدِّم" },
  PAID: { fr: "Payé", ar: "مدفوع" },
  CANCELLED: { fr: "Annulé", ar: "ملغي" },
};

type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  return translations[key]?.[locale] ?? translations[key]?.fr ?? key;
}

export function formatDA(amount: number): string {
  return `${amount.toLocaleString("fr-DZ")} DA`;
}

export function getLang(): Locale {
  if (typeof window === "undefined") return "fr";
  return (localStorage.getItem("lang") as Locale) || "fr";
}

export function setLang(lang: Locale): void {
  if (typeof window !== "undefined") localStorage.setItem("lang", lang);
}
