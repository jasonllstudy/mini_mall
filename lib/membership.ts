/**
 * 会员等级与折扣规则
 */
export const MEMBERSHIP_RULES = [
  { level: "NONE",    threshold: 0,      rate: 1.0,  label: "普通会员" },
  { level: "LEVEL_1", threshold: 8000,   rate: 0.95, label: "心悦1级" },
  { level: "LEVEL_2", threshold: 80000,  rate: 0.9,  label: "心悦2级" },
  { level: "LEVEL_3", threshold: 800000, rate: 0.8,  label: "心悦3级" },
] as const;

export type MembershipLevel = (typeof MEMBERSHIP_RULES)[number]["level"];

/**
 * 根据会员等级获取折扣率
 */
export function getDiscountRate(level: string): number {
  const rule = MEMBERSHIP_RULES.find((r) => r.level === level);
  return rule?.rate ?? 1.0;
}

/**
 * 根据累计消费计算应达到的会员等级
 */
export function computeMembershipLevel(totalSpent: number): MembershipLevel {
  if (totalSpent >= 800000) return "LEVEL_3";
  if (totalSpent >= 80000) return "LEVEL_2";
  if (totalSpent >= 8000) return "LEVEL_1";
  return "NONE";
}

/**
 * 获取下一等级信息
 */
export function getNextLevelInfo(totalSpent: number) {
  const current = MEMBERSHIP_RULES.findLast(
    (r) => totalSpent >= r.threshold
  ) ?? MEMBERSHIP_RULES[0];

  const nextIndex = MEMBERSHIP_RULES.findIndex((r) => r.level === current.level) + 1;
  const next = MEMBERSHIP_RULES[nextIndex];

  if (!next) {
    return { hasNext: false as const, currentLabel: current.label };
  }

  return {
    hasNext: true as const,
    currentLabel: current.label,
    nextLabel: next.label,
    nextRate: next.rate,
    gap: next.threshold - totalSpent,
  };
}
