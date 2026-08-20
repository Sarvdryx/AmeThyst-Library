export const calculateDamageCost = (conditions, bookPrice, policy, damageCapAmount = null) => {
  const coefficients = [...new Set(conditions)]
    .map((condition) => policy.DAMAGE_COEFFICIENTS[condition] || 0)
    .filter((coefficient) => coefficient > 0);

  if (coefficients.length === 0) return 0;

  const coefficientTotal = coefficients.reduce((total, coefficient) => total + coefficient, 0);
  const additionalConditionCount = Math.max(0, coefficients.length - 1);
  const calculatedCost = (coefficientTotal * bookPrice)
    + coefficients.length * policy.FEE_ADMIN
    + additionalConditionCount * policy.FEE_ADDON;
  const nonNegativeCost = Math.max(0, calculatedCost);
  return damageCapAmount == null ? nonNegativeCost : Math.min(nonNegativeCost, damageCapAmount);
};

export const calculateOverdueCost = (overdueDays, bookPrice) => {
  if (overdueDays <= 0) return 0;
  return 0.05 * bookPrice + Math.max(0, overdueDays - 3) * 0.02 * bookPrice;
};

export const calculateLostPenalty = (lostPenaltyAmount, bookPrice, policy) => (
  lostPenaltyAmount ?? (bookPrice * policy.DAMAGE_COEFFICIENTS.lost)
);

export const calculateTotalPenalty = (conditions, bookPrice, overdueDays, policy, lostPenaltyAmount = null) => {
  if (conditions.includes('lost')) {
    const amount = calculateLostPenalty(lostPenaltyAmount, bookPrice, policy);
    return { amount: Math.round(amount * 100) / 100, issue: 'LOST' };
  }

  const isPerfect = conditions.includes('perfect_condition');
  const hasDamage = conditions.some((condition) => condition !== 'perfect_condition');

  let amount = hasDamage ? calculateDamageCost(conditions, bookPrice, policy, lostPenaltyAmount) : 0;
  let issue = hasDamage ? 'DAMAGED' : null;
  if (overdueDays > 0) {
    amount += calculateOverdueCost(overdueDays, bookPrice);
    issue = hasDamage ? 'COMBINED' : 'OVERDUE';
  }
  return { amount: Math.round(amount * 100) / 100, issue };
};
