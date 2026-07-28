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

  test("returns zero values for invalid rgb input", () => {
    assert.deepStrictEqual(parseColorToRGB({ original: "rgb()", type: "rgb" }), {
      r: 0,
      g: 0,
      b: 0,
    });
  });
});
