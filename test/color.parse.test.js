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
});
