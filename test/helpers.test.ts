import { describe, expect, it } from "vitest";

import { createElement, peers } from "../src/index"
import { query } from "../src/query";

// Note: while type tests clearly fail visible inspection, they pass from Vitest
// standpoint so always be sure to run `tsc --noEmit` over your test files to 
// gain validation that no new type vulnerabilities have cropped up.

describe("helpers", () => {

  it("peers", () => {
    const html = `<div><div class="one"></div><div class="two">TWO</div><div class="three"></div></div>`;
    const el = createElement(html);
    const two = peers(query(el, ".one", "throw"), ".two");
    
    expect(two.textContent).toBe("TWO");
  });

});
