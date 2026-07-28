const assert = require("assert");
const { calculateLuminance, calculateContrastRatio } = require("../extension");

suite("Contrast Calculation", () => {
  test("calculates luminance for white and black", () => {
    assert.strictEqual(calculateLuminance(255, 255, 255), 1);
    assert.strictEqual(calculateLuminance(0, 0, 0), 0);
  });

  test("calculates the maximum WCAG contrast ratio", () => {
    assert.strictEqual(calculateContrastRatio(1, 0), 21);
  });

  test("contrast ratio is symmetric", () => {
    assert.strictEqual(calculateContrastRatio(0.18, 0.05), calculateContrastRatio(0.05, 0.18));
  });
});
