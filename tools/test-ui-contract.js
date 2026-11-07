#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { compareHostReports, htmlFingerprint } = require("../lib/host-sync");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "public/app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "public/index.html"), "utf8");
const i18n = fs.readFileSync(path.join(root, "public/i18n.js"), "utf8");

function must(cond, message) {
  if (!cond) {
    console.error("FAIL " + message);
    process.exitCode = 1;
  } else {
    console.log("OK   " + message);
  }
}

must(
  app.includes('const LICHT_FUNDERING_LABELS = ["Puimsteen", "Schuimglas", "Argex"];'),
  "lichte vulling blijft fundering: Puimsteen, Schuimglas, Argex"
);
must(!app.includes("applyLightFillAsOndergrond"), "lichte vulling wordt niet naar de ondergrond verplaatst");
must(!app.includes('label: "Wings"'), "Wings hoort niet in de live materiaallijst");
must(app.includes("Wapening druklaag"), "druklaag heeft een eigen wapeningsblok");
must(app.includes('data-druklaag-onafhankelijk="1"'), "druklaagwapening staat los van de fundering");
must(
  app.includes("Romfix adviseert bij elke overgang van funderingsmateriaal een R'tex scheidingsdoek."),
  "bestaande R'tex-regel in de PDF blijft"
);
must(!app.includes("Romfix-advies (lichte ophoging)"), "advies-tip lichte ophoging zit niet in de app");
must(!app.includes("PRS-Neoloy"), "advies-tip noemt geen PRS-Neoloy");
must(!i18n.includes("Romfix-advies (lichte ophoging)"), "advies-tip zit niet in de vertalingen");
must(!i18n.includes("PRS-Neoloy"), "vertalingen bevatten de advies-tip niet");
must(html.includes("app.js?v=20261104-druklaag"), "scriptversie blijft 20261104-druklaag");
must(html.includes("styles.css?v=20261104-druklaag"), "stijlversie blijft 20261104-druklaag");

const same = compareHostReports([
  { origin: "a", status: 200, etag: "abc", fingerprint: "app.js?v=20261104-druklaag", commit: "2d0807f" },
  { origin: "b", status: 200, etag: "abc", fingerprint: "app.js?v=20261104-druklaag", commit: "2d0807f" },
]);
must(same.length === 0, "gelijke hosts zijn synchroon");

const split = compareHostReports([
  { etag: "abc", fingerprint: "a", commit: "aaaa" },
  { etag: "abc", fingerprint: "a", commit: "bbbb" },
]);
must(split.some(function (e) { return e.indexOf("commit") >= 0; }), "verschillende commits falen");

const half = compareHostReports([
  { etag: "abc", fingerprint: "a", commit: "aaaa" },
  { etag: "abc", fingerprint: "a", commit: null },
]);
must(half.length > 0, "versie op één host faalt");

const legacy = compareHostReports([
  { origin: "a", status: 200, etag: "ea821f", fingerprint: "app.js?v=20261104-druklaag", commit: null },
  { origin: "b", status: 200, etag: "ea821f", fingerprint: "app.js?v=20261104-druklaag", commit: null },
]);
must(legacy.length === 0, "twee hosts zonder versie-endpoint mogen gelijk zijn");

const fp = htmlFingerprint(html);
must(fp.indexOf("app.js?v=20261104-druklaag") >= 0, "fingerprint leest de scriptversie");

assert.strictEqual(process.exitCode || 0, 0);
