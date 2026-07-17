const assert = require("assert");

// Puedes importar VS Code si necesitas probar su API
const vscode = require("vscode");
// const myExtension = require('../../extension');

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Sample test", () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });
});
