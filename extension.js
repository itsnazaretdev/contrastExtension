const vscode = require("vscode");

/**
 * This method is called when your extension is activated.
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Extension "contrast-checker" is active!');

  const outputChannel = vscode.window.createOutputChannel("Contrast Checker");
  context.subscriptions.push(outputChannel);

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

      // 1. Extract raw color candidates
      const rawColorStrings = extractColors(selectedText);

      // 2. Validate and convert them to strict RGB objects
      const validColors = [];
      for (const colorCandidate of rawColorStrings) {
        const parsed = parseColorToRGB(colorCandidate);
        if (parsed) {
          validColors.push({
            original: colorCandidate.original,
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
      const passesAAA_LargeText = ratio >= 4.5;

      // 7. Present results to the user nicely
      outputChannel.clear(); // Clean last result
      outputChannel.appendLine(`=========================================`);
      outputChannel.appendLine(
        `📊 CONTRAST REPORT: ${color1.original} vs ${color2.original}`,
      );
      outputChannel.appendLine(`=========================================`);
      outputChannel.appendLine(`Ratio: ${ratio.toFixed(2)}:1\n`);
      outputChannel.appendLine(
        `[${passesAA_NormalText ? "🎉 PASS" : "❌ FAIL"}] AA Normal Text (Needs 4.5:1)`,
      );
      outputChannel.appendLine(
        `[${passesAAA_NormalText ? "🎉 PASS" : "❌ FAIL"}] AAA Normal Text (Needs 7.0:1)`,
      );
      outputChannel.appendLine(
        `[${passesAA_LargeText ? "🎉 PASS" : "❌ FAIL"}] Large Text (Needs 3.0:1)`,
      );
      outputChannel.appendLine(
        `[${passesAAA_LargeText ? "🎉 PASS" : "❌ FAIL"}] AAA Large Text (Needs 4.5:1)`,
      );
      outputChannel.appendLine(`=========================================`);

      outputChannel.show(true);
    },
  );

  context.subscriptions.push(calculateContrastCommand);
}

/**
 * Extrae los colores de un texto y los clasifica por tipo.
 *
 * @param {string} text - El texto seleccionado que contiene los colores.
 * @returns {{ original: string, type: 'hex' | 'rgb' | 'hsl' }[]} Un array de objetos con el color original y su formato.
 */
function extractColors(text) {
  /** @type {{ original: string, type: 'hex' | 'rgb' | 'hsl' }[]} */
  const results = [];

  // Single pass with named groups so results come back in document order:
  // scanning each format separately would report "#fff vs rgb(0,0,0)" for
  // "color: rgb(0, 0, 0); background: #fff;".
  const colorRegex =
    /(?<hex>#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})\b)|(?<rgb>rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\))|(?<hsl>hsla?\(\s*\d{1,3}(?:\.\d+)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\))/gi;

  for (const match of text.matchAll(colorRegex)) {
    const groups = match.groups || {};
    /** @type {'hex' | 'rgb' | 'hsl'} */
    const type = groups.hex ? "hex" : groups.rgb ? "rgb" : "hsl";
    results.push({ original: match[0].trim(), type });
  }

  return results;
}

/**
 * Restricts a value to a closed range. NaN is passed through so callers can
 * still reject it.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Converts a color object (HEX, RGB, or HSL) into a unified format of numerical R, G, B values.
 *
 * @param {{ original: string, type: 'hex' | 'rgb' | 'hsl' }} colorObj - The object containing the color text and its type.
 * @returns {{ r: number, g: number, b: number } | null} An object with Red, Green, and Blue components (from 0 to 255), or null on invalid input.
 */
function parseColorToRGB(colorObj) {
  // Accept either a raw string or the object produced by `extractColors`.
  let type = null;
  let original = "";
  if (typeof colorObj === "string") {
    original = colorObj;
  } else if (colorObj && typeof colorObj === "object") {
    original = colorObj.original || "";
    type = colorObj.type || null;
  } else {
    return null;
  }

  const str = original.toLowerCase().trim();

  if (type === "hex" || (!type && str.startsWith("#"))) {
    let hex = str.replace("#", "");
    // parseInt stops at the first invalid digit, so validate up front instead
    // of trusting it to return NaN (e.g. "ffzz" would parse as 255).
    if (!/^[0-9a-f]+$/.test(hex)) return null;
    if (hex.length === 3) {
      hex = hex.split("").map((char) => char + char).join("");
    } else if (hex.length === 4) {
      // #RGBA -> drop the alpha nibble, then expand.
      hex = hex.slice(0, 3).split("").map((char) => char + char).join("");
    } else if (hex.length === 8) {
      // #RRGGBBAA -> drop the alpha byte. Keeping it would overflow the
      // 32-bit bitwise shifts below and yield garbage components.
      hex = hex.slice(0, 6);
    } else if (hex.length !== 6) {
      return null;
    }
    const num = parseInt(hex, 16);
    if (Number.isNaN(num)) return null;
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  // rgb-like patterns (CSS `rgb(...)`)
  if (type === "rgb" || (!type && str.startsWith("rgb("))) {
    const parts = str.match(/\d+/g);
    if (parts && parts.length >= 3) {
      // Out-of-gamut components are clamped, matching CSS: browsers render
      // rgb(300, 0, 0) as rgb(255, 0, 0). Without this, luminance can exceed
      // 1 and the ratio becomes meaningless.
      return {
        r: clamp(parseInt(parts[0], 10), 0, 255),
        g: clamp(parseInt(parts[1], 10), 0, 255),
        b: clamp(parseInt(parts[2], 10), 0, 255),
      };
    }
  }

  if (type === "hsl" || (!type && str.startsWith("hsl("))) {
    const parts = str.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return null;
    const h = parseFloat(parts[0]);
    const s = clamp(parseFloat(parts[1]) / 100, 0, 1);
    const l = clamp(parseFloat(parts[2]) / 100, 0, 1);

    if (isNaN(h) || isNaN(s) || isNaN(l)) return null;

    if (s === 0) {
      const v = Math.round(l * 255);
      return { r: v, g: v, b: v };
    }

    const hue = ((h % 360) + 360) % 360 / 360; // 0..1
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const r = hue2rgb(p, q, hue + 1 / 3);
    const g = hue2rgb(p, q, hue);
    const b = hue2rgb(p, q, hue - 1 / 3);
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
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
  extractColors,
  parseColorToRGB,
  calculateLuminance,
  calculateContrastRatio,
};