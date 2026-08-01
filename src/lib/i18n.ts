'use client'

export type Locale = 'fr' | 'en' | 'ar'

export const LOCALES: { code: Locale; label: string; dir: 'ltr' | 'rtl'; flag: string }[] = [
  { code: 'fr', label: 'Français', dir: 'ltr', flag: '🇫🇷' },
  { code: 'en', label: 'English',  dir: 'ltr', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية',   dir: 'rtl', flag: '🇩🇿' },
]

const translations: Record<Locale, Record<string, string>> = {
  fr: {
    // Nav
    'nav.save': 'Sauvegarder',
    'nav.open': 'Ouvrir',
    'nav.undo': 'Annuler',
    'nav.redo': 'Rétablir',
    // Dimensions
    'dim.width': 'Largeur',
    'dim.height': 'Hauteur',
    'dim.depth': 'Profondeur',
    'dim.glueTab': 'Languette',
    'dim.thickness': 'Épaisseur',
    'dim.bleed': 'Fond perdu',
    // Panels
    'panel.dimensions': 'Dimensions',
    'panel.layers': 'Calques',
    'panel.material': 'Matière',
    'panel.export': 'Export',
    'panel.preflight': 'Prévol',
    'panel.cost': 'Coût impression',
    'panel.nesting': 'Imposition',
    'panel.fold_sequence': 'Séquence de pliage',
    // Templates
    'template.box': 'Boîte standard',
    'template.mailer': 'Enveloppe',
    'template.tuck-end': 'Tuck-end',
    // Misc
    'btn.add': 'Ajouter',
    'btn.delete': 'Supprimer',
    'btn.cancel': 'Annuler',
    'btn.confirm': 'Confirmer',
    'status.saved': 'Sauvegardé',
    'status.saving': 'Sauvegarde...',
    'error.invalid': 'Valeur invalide',
    'mode.fold': 'Patron',
    'mode.unfold': 'Déplier',
    'approval.draft': 'Brouillon',
    'approval.pending': 'En attente',
    'approval.approved': 'Approuvé',
    'approval.rejected': 'Refusé',
  },
  en: {
    'nav.save': 'Save',
    'nav.open': 'Open',
    'nav.undo': 'Undo',
    'nav.redo': 'Redo',
    'dim.width': 'Width',
    'dim.height': 'Height',
    'dim.depth': 'Depth',
    'dim.glueTab': 'Glue Tab',
    'dim.thickness': 'Thickness',
    'dim.bleed': 'Bleed',
    'panel.dimensions': 'Dimensions',
    'panel.layers': 'Layers',
    'panel.material': 'Material',
    'panel.export': 'Export',
    'panel.preflight': 'Preflight',
    'panel.cost': 'Print Cost',
    'panel.nesting': 'Imposition',
    'panel.fold_sequence': 'Fold Sequence',
    'template.box': 'Standard Box',
    'template.mailer': 'Mailer',
    'template.tuck-end': 'Tuck-end',
    'btn.add': 'Add',
    'btn.delete': 'Delete',
    'btn.cancel': 'Cancel',
    'btn.confirm': 'Confirm',
    'status.saved': 'Saved',
    'status.saving': 'Saving...',
    'error.invalid': 'Invalid value',
    'mode.fold': 'Dieline',
    'mode.unfold': 'Unfold',
    'approval.draft': 'Draft',
    'approval.pending': 'Pending',
    'approval.approved': 'Approved',
    'approval.rejected': 'Rejected',
  },
  ar: {
    'nav.save': 'حفظ',
    'nav.open': 'فتح',
    'nav.undo': 'تراجع',
    'nav.redo': 'إعادة',
    'dim.width': 'العرض',
    'dim.height': 'الارتفاع',
    'dim.depth': 'العمق',
    'dim.glueTab': 'لسان الصق',
    'dim.thickness': 'السماكة',
    'dim.bleed': 'الزيادة للطباعة',
    'panel.dimensions': 'الأبعاد',
    'panel.layers': 'الطبقات',
    'panel.material': 'المادة',
    'panel.export': 'تصدير',
    'panel.preflight': 'فحص مسبق',
    'panel.cost': 'تكلفة الطباعة',
    'panel.nesting': 'التوضيب',
    'panel.fold_sequence': 'تسلسل الطي',
    'template.box': 'صندوق معياري',
    'template.mailer': 'ظرف بريدي',
    'template.tuck-end': 'طرف قابل للطي',
    'btn.add': 'إضافة',
    'btn.delete': 'حذف',
    'btn.cancel': 'إلغاء',
    'btn.confirm': 'تأكيد',
    'status.saved': 'تم الحفظ',
    'status.saving': 'جاري الحفظ...',
    'error.invalid': 'قيمة غير صالحة',
    'mode.fold': 'القالب',
    'mode.unfold': 'فرد',
    'approval.draft': 'مسودة',
    'approval.pending': 'معلق',
    'approval.approved': 'موافق عليه',
    'approval.rejected': 'مرفوض',
  },
}

let currentLocale: Locale = 'fr'

export function setLocale(locale: Locale) {
  currentLocale = locale
  const dir = LOCALES.find(l => l.code === locale)?.dir ?? 'ltr'
  document.documentElement.setAttribute('lang', locale)
  document.documentElement.setAttribute('dir', dir)
  localStorage.setItem('fold-studio-locale', locale)
}

export function getLocale(): Locale {
  return currentLocale
}

export function t(key: string): string {
  return translations[currentLocale]?.[key] ?? translations.fr[key] ?? key
}

export function initLocale() {
  const saved = (typeof localStorage !== 'undefined' ? localStorage.getItem('fold-studio-locale') : null) as Locale | null
  if (saved && LOCALES.some(l => l.code === saved)) {
    setLocale(saved)
  }
}
