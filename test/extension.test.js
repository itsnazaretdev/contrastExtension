// Puedes importar VS Code si necesitas probar su API
const assert = require("assert");
const vscode = require("vscode");

require("./color.parse.test.js");
require("./contrast.calc.test.js");

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Sample test", () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });
});
