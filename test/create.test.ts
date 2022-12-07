import { describe, expect, it } from "vitest";
import { ClassApi, createElement, createFragment, createInlineStyle, createTextNode, toHtml } from "../src";

describe("create", () => {

  it("inline style API", () => {
    const style = createInlineStyle()
      .addCssVariable("my-width", "45px")
      .addCssVariable("my-height", "65px")
      .addClassDefinition(".code-wrapper", c => c
        .addProps({
          display: "flex",
          flexDirection: "row",
        }),
      );

    const html = toHtml(style.finish());

    expect(html).toContain("--my-width: 45px;");
    expect(html).toContain("--my-height: 65px;");
    expect(html, html).toContain("display: flex;");
    expect(html, html).toContain('type="text/css"');

    const vHtml = toHtml(style.convertToVueStyleBlock("css", true).finish());
    expect(vHtml, vHtml).not.toContain('type="text/css"');
    expect(vHtml, vHtml).toContain('lang="css"');
  });

  it("inline style with nested selectors", () => {
    const style = createInlineStyle()
      .addClassDefinition(".code-wrapper", c => c
        .addProps({ height: "99px" })
        .addChild(".code-block", { display: "flex" })
        .addChild(".foobar", { width: "25px" }),
      )
      .finish();

    const html = toHtml(style);
    expect(html).toContain(".code-wrapper {");
    expect(html).toContain(".code-wrapper .code-block {");
    expect(html).toContain(".code-wrapper .foobar {");
  });

  it("createFragment() utility", () => {
    const text = "foobar";
    const html = "<span>foobar</span>";

    expect(toHtml(createFragment(html)), "plain html").toBe(html);
    expect(toHtml(createFragment(createElement(html))), "html as element").toBe(html);
    expect(toHtml(createFragment(text)), "plain text").toBe(text);
    expect(toHtml(createFragment(createTextNode(text))), "text as text node").toBe(text);
  });

  it("sluggifies classnames", () => {
    const addProp = (propName: string) => (c: ClassApi) => c.addProps({ [propName]: "propValue" })
    const style = createInlineStyle()
      .addClassDefinition(".camelCase", addProp("camelCase"))
      .addClassDefinition(".PascalCase", addProp("PascalCase"))
      .addClassDefinition(".multi-word", addProp("multi word"))
      .finish()

    const html = toHtml(style);
    expect(html).toContain("camel-case: propValue;")
    expect(html).toContain("pascal-case: propValue;")
    expect(html).toContain("multi-word: propValue;")
  });

});