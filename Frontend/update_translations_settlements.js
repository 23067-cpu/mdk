const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'public', 'locales');
const langs = ['fr', 'en', 'ar'];

const newKeys = {
    "settlement": {
        "reject_reason_placeholder": { fr: "Expliquez la raison du rejet...", en: "Explain the reason for rejection...", ar: "اشرح سبب الرفض..." },
        "approve_warning": { fr: "Vous êtes sur le point d'approuver ce règlement. Cette action est irréversible.", en: "You are about to approve this settlement. This action is irreversible.", ar: "أنت على وشك الموافقة على هذه التسوية. هذا الإجراء لا يمكن التراجع عنه." },
        "select_folio": { fr: "Sélectionnez un folio", en: "Select a folio", ar: "حدد ਜولة" },
        "client_placeholder": { fr: "Nom du client", en: "Client name", ar: "اسم العميل" },
        "supplier_placeholder": { fr: "Nom du fournisseur", en: "Supplier name", ar: "اسم المورد" },
        "method_placeholder": { fr: "Ex: Espèces, Virement, Chèque...", en: "Ex: Cash, Transfer, Check...", ar: "مثال: نقدي، تحويل، شيك..." },
        "reference_placeholder": { fr: "Référence optionnelle...", en: "Optional reference...", ar: "مرجع اختياري..." },
        "description": { fr: "Gérez les règlements clients et fournisseurs", en: "Manage client and supplier settlements", ar: "إدارة تسويات العملاء والموردين" },
        "status_PENDING": { fr: "En attente", en: "Pending", ar: "قيد الانتظار" },
        "total_approved": { fr: "Total approuvé", en: "Total approved", ar: "إجمالي المعتمد" },
        "total_settlements": { fr: "Total règlements", en: "Total settlements", ar: "إجمالي التسويات" },
        "not_found": { fr: "Aucun règlement", en: "No settlement", ar: "لا توجد تسويات" },
        "not_found_desc": { fr: "Aucun règlement ne correspond à vos critères", en: "No settlement matches your criteria", ar: "لا توجد تسويات تطابق معاييرك" }
    }
};

for (const lang of langs) {
    const filePath = path.join(localesDir, lang, 'common.json');
    if (!fs.existsSync(filePath)) continue;
    let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.settlement) data.settlement = {};
    for (const [key, trans] of Object.entries(newKeys.settlement)) {
        data.settlement[key] = trans[lang];
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}
console.log('Settlements specific translations updated.');
