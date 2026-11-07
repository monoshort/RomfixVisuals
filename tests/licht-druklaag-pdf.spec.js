const { test, expect } = require("@playwright/test");

const ADVICE = ["Romfix-advies", "lichte ophoging", "PRS-Neoloy", "Wings"];

function fundMpa(text) {
  const match = String(text || "").match(/(\d+)/);
  return match ? Number(match[1]) : NaN;
}

test("lichte fundering, losse druklaag en PDF zonder advies-tip", async function ({ page }) {
  await page.goto("/");
  await expect(page.locator('script[src="app.js?v=20261104-druklaag"]')).toHaveCount(1);

  await page.locator('#visual-gew button[data-id="fund"]').click();
  await page.locator("#mat-eFundering").selectOption("60|Puimsteen");

  await expect(page.locator("#panel-fields")).toContainText("Wapening druklaag");
  await expect(page.locator("#panel-fields")).toContainText("Los van de wapening op de fundering");
  await expect(page.locator("#visual-gew")).toContainText("Puimsteen");
  await expect(page.locator("#visual-gew")).toContainText("Druklaag");
  await expect(page.locator("#mat-eFundering option:checked")).toContainText("Puimsteen");
  await expect(page.locator("#mat-eOndergrond option:checked")).toHaveText("Aangepast (105 MPa)");

  const fundOptions = await page.locator("#mat-eFundering option").allTextContents();
  expect(fundOptions.some(function (t) { return t.indexOf("Puimsteen") >= 0; })).toBe(true);
  expect(fundOptions.some(function (t) { return t.indexOf("Schuimglas") >= 0; })).toBe(true);
  expect(fundOptions.some(function (t) { return t.indexOf("Argex") >= 0; })).toBe(true);
  expect(fundOptions.join("\n")).not.toContain("Wings");

  await page.locator("#wapening-fund").evaluate(function (el) {
    el.checked = true;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator("#panel-fields")).toContainText("Wapening op de lichte laag");
  await expect(page.locator("#wap-type-fund-licht")).toHaveValue("grid_cell");
  await expect(page.locator("#wap-type-druklaag")).toHaveValue("grid_only");

  await page.locator("#wap-type-druklaag").selectOption("cell_only");
  await expect(page.locator("#wap-type-druklaag")).toHaveValue("cell_only");
  await expect(page.locator("#wap-type-fund-licht")).toHaveValue("grid_cell");
  await page.locator("#wap-type-fund-licht").selectOption("grid_only");
  await expect(page.locator("#wap-type-fund-licht")).toHaveValue("grid_only");
  await expect(page.locator("#wap-type-druklaag")).toHaveValue("cell_only");

  await page.locator("#toggle-ongewapend").evaluate(function (el) {
    el.checked = true;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const gew = fundMpa(await page.locator(".visual-col--gew .visual-col-mpa").innerText());
  const ong = fundMpa(await page.locator(".visual-col--ong .visual-col-mpa").innerText());
  expect(gew).toBeGreaterThan(0);
  expect(ong).toBeGreaterThan(0);
  expect(gew).toBeGreaterThan(ong);

  const pdfBase64 = await page.evaluate(async function () {
    window.open = function () { return null; };
    const blobs = [];
    const orig = URL.createObjectURL;
    URL.createObjectURL = function (blob) {
      blobs.push(blob);
      return orig.call(URL, blob);
    };
    document.getElementById("btnDownloadPdf").click();
    const deadline = Date.now() + 5000;
    while (!blobs.length && Date.now() < deadline) {
      await new Promise(function (r) { setTimeout(r, 20); });
    }
    if (!blobs.length) throw new Error("geen PDF");
    const bytes = new Uint8Array(await blobs[0].arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  });

  const pdf = Buffer.from(pdfBase64, "base64").toString("latin1");
  expect(pdf.startsWith("%PDF-1.4")).toBe(true);
  expect(pdf).toContain("Puimsteen");
  expect(pdf).toContain("Druklaag");
  expect(pdf).toContain("R'tex");
  expect(pdf).toContain("%%EOF");
  ADVICE.forEach(function (needle) {
    expect(pdf).not.toContain(needle);
  });
  const pageText = await page.locator("body").innerText();
  ADVICE.forEach(function (needle) {
    expect(pageText).not.toContain(needle);
  });
});
