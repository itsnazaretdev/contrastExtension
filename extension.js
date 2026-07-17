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
      const passesAAA_LargeText = ratio >= 4.5;

      // 7. Present results to the user nicely
      const outputChannel =
        vscode.window.createOutputChannel("Contrast Checker");

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
  // Expresión regular que detecta HEX, RGB/RGBA y HSL/HSLA
  const colorRegex =
    /#([0-9a-fA-F]{3,8})|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*(?:0|1|0?\.\d+))?\)|hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*(?:0|1|0?\.\d+))?\)/g;

  const matches = text.match(colorRegex) || [];
  return matches.map((match) => {
    /** @type {'hex' | 'rgb' | 'hsl'} */
    let type = "hex";
    if (match.startsWith("rgb")) {
      type = "rgb";
    } else if (match.startsWith("hsl")) {
      type = "hsl";
    }
    return {
      original: match,
      type: type,
    };
  });
}

/**
 * Converts a color object (HEX, RGB, or HSL) into a unified format of numerical R, G, B values.
 *
 * @param {{ original: string, type: 'hex' | 'rgb' | 'hsl' }} colorObj - The object containing the color text and its type.
 * @returns {{ r: number, g: number, b: number }} An object with Red, Green, and Blue components (from 0 to 255).
 */
function parseColorToRGB(colorObj) {
  const str = colorObj.original.toLowerCase();

  // --- HEX CONVERSION ---
  if (colorObj.type === "hex") {
    let hex = str.replace("#", "");
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    } else if (hex.length === 4) {
      hex = hex
        .slice(0, 3)
        .split("")
        .map((char) => char + char)
        .join("");
    }
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  // --- RGB CONVERSION ---
  if (colorObj.type === "rgb") {
    const parts = str.match(/\d+/g);
    if (!parts || parts.length < 3) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(parts[0], 10),
      g: parseInt(parts[1], 10),
      b: parseInt(parts[2], 10),
    };
  }

  // --- HSL CONVERSION ---
  if (colorObj.type === "hsl") {
    const parts = str.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return { r: 0, g: 0, b: 0 };

    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;

    // Mathematical formulas for HSL to RGB conversion
    /** @param {number} n */
    const k = (n) => (n + h / 30) % 12;

    const a = s * Math.min(l, 1 - l);

    /** @param {number} n */
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));

    return {
      r: Math.round(f(0) * 255),
      g: Math.round(f(8) * 255),
      b: Math.round(f(4) * 255),
    };
  }

  return { r: 0, g: 0, b: 0 };
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
