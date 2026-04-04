const { buildSync } = require("esbuild");

buildSync({
  entryPoints: ["bracket/src/app.jsx"],
  outfile: "bracket/app.js",
  loader: { ".jsx": "jsx" },
  bundle: false,
  target: ["chrome80"],
});

buildSync({
  entryPoints: ["bracket/view/src/app.jsx"],
  outfile: "bracket/view/app.js",
  loader: { ".jsx": "jsx" },
  bundle: false,
  target: ["chrome80"],
});

console.log("Build complete: bracket/app.js, bracket/view/app.js");
