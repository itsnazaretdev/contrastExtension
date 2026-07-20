# 🎨 Contrast Checker for VS Code
![WCAG Compliance](https://img.shields.io/badge/WCAG_2.1-Compliant-success?style=for-the-badge&logo=w3c&logoColor=white)
![Supported Formats](https://img.shields.io/badge/Formats-HEX_%7C_RGB_%7C_HSL-blue?style=for-the-badge)
![Dependencies](https://img.shields.io/badge/Dependencies-None_(Zero--Config)-orange?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)

A lightweight, high-precision Visual Studio Code extension to verify color contrast ratios directly from your stylesheets. Ensure your UI matches the international web accessibility standards without leaving your editor.

This extension streamlines web development workflows by allowing fast validation of text-to-background contrast while coding, avoiding the friction of switching to external browser tools.

## 🎯 Why this extension?

This extension was built to solve specific workflow gaps:

* **Format-Agnostic:** This extension natively parses **HEX**, **RGB**, and **HSL**  without requiring manual conversion.

* **On-Demand & Non-Intrusive:** Instead of scanning entire files and cluttering your editor with warning squiggles, it runs only when you request it, keeping your workspace clean.

* **Granular Compliance Matrix:** Rather than giving a single raw number or a generic pass/fail, it instantly breaks down your selection into the 4 official WCAG criteria so you know exactly where your contrast stands.

## ✨ Features

* **Multi-Format Parsing:** Seamlessly reads colors written in **HEX**, **RGB**, and **HSL** formats.

* **WCAG 2.1 Compliance:** Computes exact relative luminance to calculate strict contrast ratios.

* **Granular 4-Level Report:** Outputs a detailed compliance breakdown in a dedicated Output Channel:
  * `AA Normal Text` (Minimum 4.5:1)
  * `AAA Normal Text` (Minimum 7.0:1)
  * `AA Large Text` (Minimum 3.0:1)
  * `AAA Large Text` (Minimum 4.5:1)
  
* **Bidirectional Validation:** Works perfectly whether you select the text color or the background color first.

---

## 🚀 How it works & architecture

The extension is engineered with performance and reliability in mind, utilizing strict **JSDoc** typing to ensure type safety without adding runtime overhead.

1. **Color Normalization:** The `parseColorToRGB` module translates varied CSS formats into a unified RGB numerical space ($0-255$).
2. **Luminance Calculation:** Applies the W3C coefficients to determine the exact brightness perceived by the human eye.
3. **Contrast Ratio Matrix:** Evaluates the luminance ratio and returns direct visual feedback (`[🎉 PASS]` / `[❌ FAIL]`) into the VS Code interface.

---
## 🛠️ How to use

No external dependencies or configuration required. 

1. Select any two color strings in your file (HEX, RGB, or HSL).
2. **Right-click** on the selection.
3. Click on **`Contrast Checker: Check Selection`** in the context menu.
4. Check the results instantly in the **Output** panel (under the `Contrast Checker` tab).

> 💡 **Tip for Multiple Selections:** To select two separate color strings, hold `Alt` (Windows/Linux) or `Option` (macOS) while making your selections with the mouse.

## 📦 Manual Installation (.vsix)

If you downloaded the `.vsix` file directly from the [Releases](../../releases) page, you can install it manually using any of these methods:

### Option 1: Drag & Drop (Easiest)
1. Open **VS Code**.
2. Go to the **Extensions** view (`Ctrl+Shift+X` / `Cmd+Shift+X`).
3. Drag and drop the downloaded `.vsix` file into the extensions sidebar.

### Option 2: Extensions Menu
Click the three dots (**`...`**) in the top-right corner of the Extensions panel and select **Install from VSIX...**

### Option 3: Terminal (CLI)
Run the following command in your terminal:

`code --install-extension contrast-checker-0.0.1.vsix `

---

## ⚙️ Extension settings

This extension currently operates on a zero-config basis to keep your workspace fast and lightweight. 

## 🐛 Known issues & roadmap

### Current limitations
* Modern CSS functions like `color-mix()` or CSS variables (`var(--main-color)`) are currently not parsed.

* **Tailwind CSS:** The extension successfully parses raw color formats inside arbitrary values (e.g., `text-[#3b82f6]`), but it does not currently resolve standard Tailwind class names (e.g., `text-blue-500`).

### 🗺️ Future roadmap
Given the massive adoption of Tailwind CSS and modern CSS architectures, the next planned releases will focus on:

1. **Tailwind Class Resolver:** Integrating `resolveConfig` to automatically map standard classes (like `bg-slate-100`) to their HEX values by reading the local `tailwind.config.js`.

2. **CSS Custom Properties Support:** Resolving CSS variables by scanning the document's `:root` declarations.

## 📜 Release notes

### 1.0.0
* Initial release.
* Support for HEX, RGB, and HSL color strings.
* Full 4-tier WCAG 2.1 report matrix implementation.
* Native Output Channel printing integration.

---
## ⚖️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
---
*Developed with ❤️ for an accessible web.*