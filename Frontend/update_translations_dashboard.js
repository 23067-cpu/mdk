const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'public', 'locales');
const langs = ['fr', 'en', 'ar'];

const newKeys = {
    "dashboard": {
        "pending_closures": { fr: "Clôtures en attente", en: "Pending Closures", ar: "إغلاقات معلقة" },
        "closures_to_approve": { fr: "Clôtures à approuver", en: "Closures to Approve", ar: "إغلاقات للموافقة عليها" },
        "settlements_to_approve": { fr: "Règlements à approuver", en: "Settlements to Approve", ar: "تسويات للموافقة عليها" },
        "cashiers_performance": { fr: "Performance Caissiers", en: "Cashiers Performance", ar: "أداء أمناء الصندوق" },
        "cash_flow_chart": { fr: "Flux de trésorerie (7 jours)", en: "Cash Flow (7 days)", ar: "التدفق النقدي (7 أيام)" },
        "receipts_label": { fr: "Encaissements", en: "Receipts", ar: "الإيرادات" },
        "payments_label": { fr: "Décaissements", en: "Payments", ar: "المدفوعات" },
        "payment_methods_chart": { fr: "Répartition par méthode de paiement", en: "Payment Methods Breakdown", ar: "توزيع طرق الدفع" },
        "current_folio": { fr: "Folio actuel", en: "Current Folio", ar: "الجولة الحالية" },
        "no_open_folio": { fr: "Aucun folio ouvert", en: "No open folio", ar: "لا توجد جولة مفتوحة" },
        "opened_on": { fr: "Ouvert le", en: "Opened on", ar: "تم الفتح في" },
        "last_receipt": { fr: "Dernier reçu", en: "Last Receipt", ar: "أخر إيصال" },
        "folio_status": { fr: "Statut Folio", en: "Folio Status", ar: "حالة الجولة" },
    }
};

for (const lang of langs) {
    const filePath = path.join(localesDir, lang, 'common.json');
    if (!fs.existsSync(filePath)) continue;
    let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.dashboard) data.dashboard = {};
    for (const [key, trans] of Object.entries(newKeys.dashboard)) {
        data.dashboard[key] = trans[lang];
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}
console.log('Dashboard specific translations updated.');
