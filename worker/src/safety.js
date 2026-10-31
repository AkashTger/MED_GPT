export const fieldsBySection = {
  what_it_is: ['purpose', 'description'], uses: ['indications_and_usage', 'purpose'],
  how_it_works: ['mechanism_of_action', 'clinical_pharmacology'],
  how_to_take: ['dosage_and_administration'], food: ['dosage_and_administration', 'drug_interactions'],
  dosage: ['dosage_and_administration'], side_effects: ['adverse_reactions', 'warnings'],
  precautions: ['warnings', 'boxed_warning', 'contraindications', 'drug_interactions', 'do_not_use', 'ask_doctor', 'pregnancy_or_breast_feeding', 'stop_use', 'overdosage'],
};
export const critical = new Set(['dosage', 'how_to_take', 'food', 'side_effects', 'precautions']);
export const normalize = text => text.trim().toLowerCase().replace(/\s+/g, ' ').replace(/^paracetamol$/, 'acetaminophen');

export function selectLabel(records, lookup) {
  const name = normalize(lookup.activeIngredient);
  const strength = lookup.strength?.match(/^(\d+(?:\.\d+)?)\s*(mg|mcg|g)$/i);
  if (!strength || !['Tablet', 'Capsule'].includes(lookup.dosageForm)) return null;
  const strengthPattern = new RegExp(`\\b${strength[1].replace('.', '\\.')}\\s*${strength[2]}\\b`, 'i');
  return records.filter(record => {
    const generic = record.openfda?.generic_name || [];
    const ingredients = record.openfda?.substance_name || [];
    const route = record.openfda?.route || [];
    const active = (record.active_ingredient || []).join(' ');
    const formText = [...(record.dosage_forms_and_strengths || []), ...(record.description || []), active, ...(record.dosage_and_administration || [])].join(' ');
    return generic.some(x => normalize(x) === name) && ingredients.length === 1 && normalize(ingredients[0]) === name && route.includes('ORAL') &&
      strengthPattern.test(active) && new RegExp(`\\b${lookup.dosageForm}s?\\b`, 'i').test(formText) &&
      !/extended.release|delayed.release|sustained.release|modified.release|enteric.coated/i.test(formText);
  }).sort((a, b) => String(b.effective_time || '').localeCompare(String(a.effective_time || '')))[0] || null;
}

export function validateEvidence(result, label) {
  if (!Array.isArray(result.sections) || !result.sections.length || result.sections.length > 8) return false;
  const seen = new Set();
  return result.sections.every(section => {
    if (!section || seen.has(section.id) || !fieldsBySection[section.id]?.includes(section.field)) return false;
    seen.add(section.id);
    if (typeof section.title !== 'string' || !section.title.trim() || section.title.length > 50 || typeof section.content !== 'string' || !section.content.trim() || section.content.length > 2200 || typeof section.quote !== 'string' || section.quote.length < 20 || section.quote.length > 2200 || !label.facts[section.field]?.includes(section.quote)) return false;
    if (critical.has(section.id)) return section.content === section.quote;
    return !/\d/.test(section.content);
  });
}
