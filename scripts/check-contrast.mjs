const themes = {
  light: { ink: "163b2f", bg: "f7f9f6", muted: "506359", surface: "ffffff" },
  dark: { ink: "f0f7ee", bg: "10231d", muted: "c0d1c7", surface: "19352b" },
  hc: { ink: "ffffff", bg: "000000", muted: "ffffff", surface: "000000" },
};
function luminance(hex) {
  return hex
    .match(/../g)
    .map((c) => parseInt(c, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);
}
let failure = false;
for (const [theme, t] of Object.entries(themes))
  for (const fg of ["ink", "muted"])
    for (const bg of ["bg", "surface"]) {
      const a = luminance(t[fg]),
        b = luminance(t[bg]),
        ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      console.log(`${theme} ${fg}/${bg}: ${ratio.toFixed(2)}:1`);
      if (ratio < 4.5) failure = true;
    }
if (failure) process.exitCode = 1;
