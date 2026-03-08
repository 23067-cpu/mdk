const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'public', 'locales');
const langs = ['fr', 'en', 'ar'];

const newKeys = {
    "folio": {
        "notes_placeholder": { fr: "Notes optionnelles...", en: "Optional notes...", ar: "ملاحظات اختيارية..." },
        "description": { fr: "Gérez vos folios de caisse et suivez les transactions", en: "Manage your cash folios and track transactions", ar: "إدارة جولات الصندوق الخاصة بك وتتبع المعاملات" },
        "not_found": { fr: "Aucun folio trouvé", en: "No folios found", ar: "لم يتم العثور على جولات" },
        "not_found_status": { fr: "Aucun folio avec le statut \"{{status}}\"", en: "No folios with status \"{{status}}\"", ar: "لم يتم العثور على جولات بالحالة \"{{status}}\"" },
        "start_create": { fr: "Commencez par créer un nouveau folio", en: "Start by creating a new folio", ar: "ابدأ بإنشاء جولة جديدة" },
        "variance": { fr: "Écart", en: "Variance", ar: "الفرق" }
    }
};

for (const lang of langs) {
    const filePath = path.join(localesDir, lang, 'common.json');
    if (!fs.existsSync(filePath)) continue;
    let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.folio) data.folio = {};
    for (const [key, trans] of Object.entries(newKeys.folio)) {
        data.folio[key] = trans[lang];
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}
console.log('Folios specific translations updated.');
