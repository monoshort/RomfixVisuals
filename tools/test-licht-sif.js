#!/usr/bin/env node
const { computeRomfixWerkboek } = require("../public/excel-exact.js");

function base(extra) {
  return Object.assign(
    {
      sheet: "roadbase",
      B12: 225,
      B13: 450,
      B14: 250,
      C13: 150,
      C14: 150,
      C15: 105,
      B19: 250,
      B20: 150,
      D19: 10,
      D20: 10,
      E19: 4.3,
      E20: 3.8,
      F13: "vrij",
    },
    extra
  );
}

const std = computeRomfixWerkboek(base());
const lichtOff = computeRomfixWerkboek(
  base({
    B19: 300,
    D19: 5,
    E19: 2.8,
    B13Licht: 100,
    C13Licht: 50,
    sifLicht: 0,
    mifLicht: 4.5,
  })
);
const lichtOn = computeRomfixWerkboek(
  base({
    B19: 300,
    D19: 5,
    E19: 2.8,
    B13Licht: 100,
    C13Licht: 50,
    sifLicht: 10,
    mifLicht: 4.5,
  })
);

function ok(name, cond, detail) {
  console.log((cond ? "OK  " : "FAIL") + " " + name + (detail ? " — " + detail : ""));
  if (!cond) process.exitCode = 1;
}

ok("standaard B27 zonder licht", std.state.B27 >= 0, "B27=" + std.state.B27);
ok(
  "licht split: B27 = lichtMm",
  lichtOn.state.B27 === 100,
  "B27=" + lichtOn.state.B27 + " B26=" + lichtOn.state.B26 + " B25=" + lichtOn.state.B25
);
ok(
  "licht SIF 10: C27 > eLicht",
  lichtOn.state.C27 > 50,
  "C27=" + lichtOn.state.C27 + " D28=" + lichtOn.state.D28
);
ok(
  "zonder SIF licht: C27 ≈ D46 (ongewapend)",
  lichtOff.state.C27 === lichtOff.state.D46,
  "C27=" + lichtOff.state.C27 + " D46=" + lichtOff.state.D46
);
ok(
  "geogrid druklaag: C26 gebruikt D19=5",
  lichtOn.state.C26 > 0 && lichtOn.state.C26 <= 5 * lichtOn.state.D27 + 1,
  "C26=" + lichtOn.state.C26 + " D19*D27=" + 5 * lichtOn.state.D27
);
ok("gewapend E13 > ongewapend pad", lichtOn.output.E13 >= lichtOn.output.D13, "E13=" + lichtOn.output.E13 + " D13=" + lichtOn.output.D13);

console.log(
  JSON.stringify(
    {
      std: { D13: std.output.D13, E13: std.output.E13, B26: std.state.B26, B27: std.state.B27, C26: std.state.C26 },
      lichtOff: { D13: lichtOff.output.D13, E13: lichtOff.output.E13, B26: lichtOff.state.B26, B27: lichtOff.state.B27, C26: lichtOff.state.C26, C27: lichtOff.state.C27 },
      lichtOn: { D13: lichtOn.output.D13, E13: lichtOn.output.E13, B25: lichtOn.state.B25, B26: lichtOn.state.B26, B27: lichtOn.state.B27, C26: lichtOn.state.C26, C27: lichtOn.state.C27 },
    },
    null,
    2
  )
);
