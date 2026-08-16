// Dosing arithmetic: concentrations, how much is left in a vial, and the
// reconstitution calculator.
//
// Shared by mobile/ and dose-tracker-plain/. Pure functions over plain
// objects, no imports — see the note in dates.js for why that matters.
//
// This is the copy that had drifted: the plain app's remainingMg subtracts
// peptide.priorUsedMg (carry-over from a previous vial) and the phone's
// did not, so the two disagreed about how much was left. This version keeps
// the subtraction; `|| 0` means a vial without the field behaves exactly as
// the old mobile copy did.

export function concentration(peptide) {
  if (!peptide?.vialAmountMg || !peptide?.bacWaterMl) return 0;
  return peptide.vialAmountMg / peptide.bacWaterMl;
}

export function mcgPerUnit(peptide) {
  const conc = concentration(peptide);
  const perMl = peptide?.unitsPerMl || 100;
  return (conc * 1000) / perMl;
}

export function remainingMg(peptide, dosesForThisPeptide) {
  const conc = concentration(peptide);
  const perUnit = mcgPerUnit(peptide);
  const usedMg = dosesForThisPeptide.reduce((sum, dose) => {
    if (!dose.taken || dose.amount == null) return sum;
    if (dose.unit === 'mg') return sum + dose.amount;
    if (dose.unit === 'mcg') return sum + dose.amount / 1000;
    if (dose.unit === 'units') return sum + (dose.amount * perUnit) / 1000;
    if (dose.unit === 'ml') return sum + dose.amount * conc;
    return sum;
  }, 0);
  const priorUsed = peptide.priorUsedMg || 0;
  return Math.max(0, peptide.vialAmountMg - priorUsed - usedMg);
}

export function remainingSupplementAmount(supplement, logsForThisSupplement) {
  if (supplement.containerAmount == null) return null;
  const priorUsed = supplement.priorUsedAmount || 0;
  const used = logsForThisSupplement.reduce((sum, log) => {
    if (!log.taken || log.amount == null) return sum;
    return sum + log.amount;
  }, 0);
  return Math.max(0, supplement.containerAmount - priorUsed - used);
}

export function calculatorUnits(vialMg, bacWaterMl, doseMg) {
  if (!vialMg || !bacWaterMl || !doseMg) return null;
  const concentration = vialMg / bacWaterMl; // mg/mL
  const volumeMl = doseMg / concentration;
  return volumeMl * 100;
}

export function componentConcentration(peptide, componentMg) {
  if (!componentMg || !peptide?.bacWaterMl) return 0;
  return componentMg / peptide.bacWaterMl;
}

export function componentMcgPerUnit(peptide, componentMg) {
  const conc = componentConcentration(peptide, componentMg);
  const perMl = peptide?.unitsPerMl || 100;
  return (conc * 1000) / perMl;
}

export function doseVolumeMl(peptide, amount, unit) {
  const n = Number(amount);
  if (!n) return 0;
  const totalConc = concentration(peptide);
  if (unit === 'ml') return n;
  if (unit === 'units') return n / (peptide?.unitsPerMl || 100);
  if (unit === 'mg') return totalConc ? n / totalConc : 0;
  if (unit === 'mcg') return totalConc ? n / 1000 / totalConc : 0;
  return 0;
}

export function blendDoseBreakdown(peptide, amount, unit) {
  if (!peptide?.isBlend || !Array.isArray(peptide.blendComponents) || peptide.blendComponents.length === 0) {
    return null;
  }
  const volumeMl = doseVolumeMl(peptide, amount, unit);
  if (!volumeMl) return null;
  return peptide.blendComponents.map((c) => ({
    name: c.name,
    mg: componentConcentration(peptide, Number(c.mg)) * volumeMl,
  }));
}
