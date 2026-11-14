import { describe, expect, it } from "vitest";
import { getVihaanPracticePlan } from "@/server/vihaan-practice";

describe("canonical published-bank integration",()=>{
  it("excludes all pilot drafts from practice and weak-topic selection",()=>{
    expect(getVihaanPracticePlan(20)).toEqual([]);
    expect(getVihaanPracticePlan(20,{subject:"numeracy",weakTopics:["Fraction of a remainder"]})).toEqual([]);
  });
});
