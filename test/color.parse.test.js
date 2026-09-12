const assert = require("assert");
const { extractColors, parseColorToRGB } = require("../extension");

suite("Color Parsing", () => {
  test("extracts hex and rgb colors from a selection", () => {
    const result = extractColors("background: #abc; color: rgb(12, 34, 56);");
    assert.strictEqual(result.length, 2);
    assert.deepStrictEqual(result[0], { original: "#abc", type: "hex" });
    assert.deepStrictEqual(result[1], { original: "rgb(12, 34, 56)", type: "rgb" });
  });

  test("parses 3-digit and 4-digit hex colors", () => {
    assert.deepStrictEqual(parseColorToRGB({ original: "#abc", type: "hex" }), {
      r: 170,
      g: 187,
      b: 204,
    });
    assert.deepStrictEqual(parseColorToRGB({ original: "#fb0a", type: "hex" }), {
      r: 255,
      g: 187,
      b: 0,
    });
  });

  test("parses rgb colors", () => {
    assert.deepStrictEqual(parseColorToRGB({ original: "rgb(10, 20, 30)", type: "rgb" }), {
      r: 10,
      g: 20,
      b: 30,
    });
  });

  test("ignores object instantiations like new Color(...)", () => {
    // Documented limitation: only CSS color strings are parsed, not dynamic
    // object constructors.
    const result = extractColors("notesScroll.setBackground(new Color(250, 250, 250));");
    assert.strictEqual(result.length, 0);
  });

  test("parses 6-digit and 8-digit hex colors", () => {
    assert.deepStrictEqual(parseColorToRGB({ original: "#ff0000", type: "hex" }), {
      r: 255,
      g: 0,
      b: 0,
    });
    assert.deepStrictEqual(parseColorToRGB({ original: "#ff0000ff", type: "hex" }), {
      r: 255,
      g: 0,
      b: 0,
    });
    assert.deepStrictEqual(parseColorToRGB({ original: "#0000ff80", type: "hex" }), {
      r: 0,
      g: 0,
      b: 255,
    });
  });

  test("returns null for malformed hex input", () => {
    assert.strictEqual(parseColorToRGB({ original: "#12345", type: "hex" }), null);
    assert.strictEqual(parseColorToRGB({ original: "#ffzz", type: "hex" }), null);
  });

  test("parses hsl colors at black and white boundaries", () => {
    assert.deepStrictEqual(parseColorToRGB({ original: "hsl(0, 0%, 0%)", type: "hsl" }), {
      r: 0,
      g: 0,
      b: 0,
    });
    assert.deepStrictEqual(parseColorToRGB({ original: "hsl(0, 0%, 100%)", type: "hsl" }), {
      r: 255,
      g: 255,
      b: 255,
    });
  });

  test("returns null for invalid rgb input", () => {
    assert.strictEqual(parseColorToRGB({ original: "rgb()", type: "rgb" }), null);
  });

  test("extracts space-separated rgb (CSS Color 4)", () => {
    const result = extractColors("color: rgb(10 20 30); background: rgb(0 0 0 / 50%);");
    assert.deepStrictEqual(result, [
      { original: "rgb(10 20 30)", type: "rgb" },
      { original: "rgb(0 0 0 / 50%)", type: "rgb" },
    ]);
    assert.deepStrictEqual(parseColorToRGB(result[0]), { r: 10, g: 20, b: 30 });
  });

  test("space and comma rgb syntax produce the same color", () => {
    assert.deepStrictEqual(
      parseColorToRGB({ original: "rgb(10 20 30)", type: "rgb" }),
      parseColorToRGB({ original: "rgb(10, 20, 30)", type: "rgb" }),
    );
  });

  test("clamps out-of-gamut rgb components", () => {
    assert.deepStrictEqual(parseColorToRGB({ original: "rgb(300, 400, 999)", type: "rgb" }), {
      r: 255,
      g: 255,
      b: 255,
    });
  });

  test("returns colors in document order regardless of format", () => {
    const result = extractColors("color: rgb(0, 0, 0); background: #ffffff;");
    assert.deepStrictEqual(result, [
      { original: "rgb(0, 0, 0)", type: "rgb" },
      { original: "#ffffff", type: "hex" },
    ]);
  });

  test("extracts hsl alongside other formats in order", () => {
    const result = extractColors("#000 hsl(120, 50%, 50%) rgb(1, 2, 3)");
    assert.deepStrictEqual(result.map((c) => c.type), ["hex", "hsl", "rgb"]);
  });

  test("extracts space-separated hsl (CSS Color 4)", () => {
    const result = extractColors("color: hsl(120 50% 50%); background: hsl(0 0% 100%);");
    assert.deepStrictEqual(result, [
      { original: "hsl(120 50% 50%)", type: "hsl" },
      { original: "hsl(0 0% 100%)", type: "hsl" },
    ]);
  });

  test("space and comma hsl syntax produce the same color", () => {
    assert.deepStrictEqual(
      parseColorToRGB({ original: "hsl(120 50% 50%)", type: "hsl" }),
      parseColorToRGB({ original: "hsl(120, 50%, 50%)", type: "hsl" }),
    );
  });

  test("parses hsl with a deg unit, decimals and slash alpha", () => {
    const result = extractColors("hsl(120deg 50% 50% / 0.5) hsl(210.5 33.3% 20%)");
    assert.deepStrictEqual(result.map((c) => c.original), [
      "hsl(120deg 50% 50% / 0.5)",
      "hsl(210.5 33.3% 20%)",
    ]);
    assert.deepStrictEqual(parseColorToRGB(result[0]), { r: 64, g: 191, b: 64 });
  });

  test("normalizes negative hue instead of dropping the sign", () => {
    // -120deg and 240deg are the same hue.
    assert.deepStrictEqual(
      parseColorToRGB({ original: "hsl(-120 50% 50%)", type: "hsl" }),
      parseColorToRGB({ original: "hsl(240 50% 50%)", type: "hsl" }),
    );
  });
});
