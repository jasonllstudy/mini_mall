import { describe, it, expect } from "vitest";
import {
  getDiscountRate,
  computeMembershipLevel,
  getNextLevelInfo,
  getMembershipLabel,
  MEMBERSHIP_RULES,
} from "../membership";

describe("会员等级系统", () => {
  describe("getDiscountRate", () => {
    it("普通会员应返回1.0", () => {
      expect(getDiscountRate("NONE")).toBe(1.0);
    });

    it("心悦1级应返回0.95", () => {
      expect(getDiscountRate("LEVEL_1")).toBe(0.95);
    });

    it("心悦2级应返回0.9", () => {
      expect(getDiscountRate("LEVEL_2")).toBe(0.9);
    });

    it("心悦3级应返回0.8", () => {
      expect(getDiscountRate("LEVEL_3")).toBe(0.8);
    });

    it("未知等级应返回默认值1.0", () => {
      expect(getDiscountRate("UNKNOWN")).toBe(1.0);
    });
  });

  describe("computeMembershipLevel", () => {
    it("消费0应为普通会员", () => {
      expect(computeMembershipLevel(0)).toBe("NONE");
    });

    it("消费8000应为心悦1级", () => {
      expect(computeMembershipLevel(8000)).toBe("LEVEL_1");
    });

    it("消费80000应为心悦2级", () => {
      expect(computeMembershipLevel(80000)).toBe("LEVEL_2");
    });

    it("消费800000应为心悦3级", () => {
      expect(computeMembershipLevel(800000)).toBe("LEVEL_3");
    });

    it("消费1500000应为心悦3级（最高级）", () => {
      expect(computeMembershipLevel(1500000)).toBe("LEVEL_3");
    });
  });

  describe("getNextLevelInfo", () => {
    it("普通会员应显示下一级为心悦1级", () => {
      const info = getNextLevelInfo(0);
      expect(info.hasNext).toBe(true);
      expect(info.currentLabel).toBe("普通会员");
      expect(info.nextLabel).toBe("心悦1级");
      expect(info.gap).toBe(8000);
    });

    it("心悦3级应显示无下一级", () => {
      const info = getNextLevelInfo(1000000);
      expect(info.hasNext).toBe(false);
    });
  });

  describe("getMembershipLabel", () => {
    it("应返回正确的中文标签", () => {
      expect(getMembershipLabel("NONE")).toBe("普通会员");
      expect(getMembershipLabel("LEVEL_1")).toBe("心悦1级");
      expect(getMembershipLabel("LEVEL_2")).toBe("心悦2级");
      expect(getMembershipLabel("LEVEL_3")).toBe("心悦3级");
    });

    it("未知等级应返回默认标签", () => {
      expect(getMembershipLabel("UNKNOWN")).toBe("普通会员");
    });
  });
});
