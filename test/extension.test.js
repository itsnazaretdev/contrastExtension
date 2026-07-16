const vscode = require("vscode");

/**
 * This method is called when your extension is activated.
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Extension "contrast-checker" is active!');

  const calculateContrastCommand = vscode.commands.registerCommand(
    "contrast-checker.calculateContrast",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText || selectedText.trim() === "") {
        vscode.window.showWarningMessage(
          "Please select some text containing colors first.",
        );
        return;
      }

      // 1. Extract raw strings that look like colors
      const rawColorStrings = extractColors(selectedText);

      // 2. Validate and convert them to strict RGB objects
      const validColors = [];
      for (const colorStr of rawColorStrings) {
        const parsed = parseColorToRGB(colorStr);
        if (parsed) {
          validColors.push({
            original: colorStr,
            rgb: parsed,
          });
        }
      }

      // 3. Control error: We need exactly or at least 2 colors to compare
      if (validColors.length < 2) {
        vscode.window.showErrorMessage(
          `Found ${validColors.length} valid color(s). We need at least 2 valid colors to compare contrast.`,
        );
        return;
      }

      // 4. Calculate luminance for both colors
      const color1 = validColors[0];
      const color2 = validColors[1];

      const lum1 = calculateLuminance(color1.rgb.r, color1.rgb.g, color1.rgb.b);
      const lum2 = calculateLuminance(color2.rgb.r, color2.rgb.g, color2.rgb.b);

      // 5. Calculate contrast ratio
      const ratio = calculateContrastRatio(lum1, lum2);

      // 6. Evaluate WCAG standards
      const passesAA_NormalText = ratio >= 4.5;
      const passesAAA_NormalText = ratio >= 7.0;
      const passesAA_LargeText = ratio >= 3.0;

      // 7. Present results to the user nicely
      const message =
        `Contrast between ${color1.original} and ${color2.original} is ${ratio.toFixed(2)}:1. ` +
        `[AA Normal Text: ${passesAA_NormalText ? "PASS ✓" : "FAIL ✗"}] ` +
        `[AAA Normal Text: ${passesAAA_NormalText ? "PASS ✓" : "FAIL ✗"}] ` +
        `[Large Text: ${passesAA_LargeText ? "PASS ✓" : "FAIL ✗"}]`;

      if (passesAA_NormalText) {
        vscode.window.showInformationMessage(message);
      } else {
        vscode.window.showWarningMessage(message);
      }
    },
  );

  context.subscriptions.push(calculateContrastCommand);
}

/**
 * Extracts colors (HEX, RGB) from a given string using regex.
 * @param {string} text
 * @returns {string[]} Array of found color strings
 */
function extractColors(text) {
  const hexRegex = /#[0-9a-fA-F]{3,8}\b/g;
  const rgbRegex =
    /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*(?:(?:\d+(?:\.\d+)?)|(?:\.\d+)))?\s*\)/g;

  const foundColors = [];

  const hexMatches = text.match(hexRegex);
  if (hexMatches) foundColors.push(...hexMatches);

  const rgbMatches = text.match(rgbRegex);
  if (rgbMatches) foundColors.push(...rgbMatches);

  return foundColors;
}

/**
 * Parses a color string (HEX or RGB) and validates its ranges strictly.
 * @param {string} colorStr
 * @returns {{r: number, g: number, b: number} | null} RGB object or null if invalid
 */
function parseColorToRGB(colorStr) {
  const cleanStr = colorStr.trim().toLowerCase();

  // RGB / RGBA
  if (cleanStr.startsWith("rgb")) {
    const matches = cleanStr.match(/\d+/g);
    if (!matches || matches.length < 3) {
      return null;
    }

    const r = parseInt(matches[0], 10);
    const g = parseInt(matches[1], 10);
    const b = parseInt(matches[2], 10);

    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      return { r, g, b };
    }
    return null;
  }

  // HEX
  if (cleanStr.startsWith("#")) {
    const hex = cleanStr.substring(1);

    if (![3, 4, 6, 8].includes(hex.length)) {
      return null;
    }

    let r, g, b;

    if (hex.length === 3 || hex.length === 4) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return null;
    }

    return { r, g, b };
  }

  return null;
}

/**
 * Calculates the relative luminance of an RGB color.
 * WCAG 2.x Formula.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {number} Relative luminance value (0 to 1)
 */
function calculateLuminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculates the contrast ratio between two relative luminances.
 * @param {number} lum1
 * @param {number} lum2
 * @returns {number} Contrast ratio (1 to 21)
 */
function calculateContrastRatio(lum1, lum2) {
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
