const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'public', 'locales');
const langs = ['fr', 'en', 'ar'];

const newKeys = {
    "transaction": {
        "void_reason_placeholder": { fr: "Expliquez la raison de l'annulation (minimum 10 caractères)...", en: "Explain the reason for voiding (minimum 10 characters)...", ar: "اشرح سبب الإلغاء (على الأقل 10 أحرف)..." },
        "confirm_approve_void": { fr: "Approuver l'annulation de la transaction #{{id}} ?", en: "Approve the voiding of transaction #{{id}}?", ar: "الموافقة على إلغاء المعاملة #{{id}}؟" },
        "prompt_reject_reason": { fr: "Raison du refus (obligatoire)", en: "Reason for rejection (required)", ar: "سبب الرفض (إلزامي)" },
        "description": { fr: "Journal de toutes les transactions", en: "Journal of all transactions", ar: "سجل جميع المعاملات" },
        "not_found": { fr: "Aucune transaction", en: "No transaction", ar: "لا توجد معاملة" },
        "not_found_desc": { fr: "Aucune transaction ne correspond à vos critères", en: "No transaction matches your criteria", ar: "لا توجد معاملة تطابق معاييرك" },
        "approve_void": { fr: "Approuver l'annulation", en: "Approve Void", ar: "الموافقة على الإلغاء" },
        "reject_void": { fr: "Refuser l'annulation", en: "Reject Void", ar: "رفض الإلغاء" },
        "request_void": { fr: "Demander annulation", en: "Request void", ar: "طلب الإلغاء" }
    }
};

for (const lang of langs) {
    const filePath = path.join(localesDir, lang, 'common.json');
    if (!fs.existsSync(filePath)) continue;
    let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.transaction) data.transaction = {};
    for (const [key, trans] of Object.entries(newKeys.transaction)) {
        data.transaction[key] = trans[lang];
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}
console.log('Transactions specific translations updated.');
