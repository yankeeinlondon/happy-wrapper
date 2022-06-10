import { describe, expect, it } from "vitest";
import {
  safeString,
} from "../src";

describe("HappyDom's can be idempotent", () => {

  it("safeString", () => {
    const t1 = "hi there";
    const t2 = "<div>hi there</div>"; 
    const t3 = "5 is > 4";
    const t4 = "hi <span>there</span>";
    expect(safeString(t1)).toBe(t1);
    expect(safeString(t2)).toBe("hi there");
    expect(safeString(t3)).toBe(t3);
    expect(safeString(t4)).toBe("hi there");
  });


});
