import * as esbuild from 'esbuild'
import * as fs from 'fs';
import {minify} from "html-minifier-terser";

// Remove old dist folder
fs.rmSync('./dist', {recursive: true, force: true});

// Bundling minified JS
await esbuild.build({
    entryPoints: [
        "./src/converter.ts",
        "./src/onenote2xournalpp.ts",
    ],
    format: 'cjs',
    platform: "browser",
    minify: true,
    bundle: true,
    outdir: "./dist",
});


// Bundling minified CSS
await esbuild.build({
    entryPoints: [
        "./public/popup.css"
    ],
    format: 'cjs',
    platform: "browser",
    minify: true,
    bundle: true,
    outdir: "./dist"
});

// Minify and add to bundle HTML
const html = fs.readFileSync("./public/popup.html", {encoding: "utf8"});
const out = await minify(html, {collapseWhitespace: true, removeComments: true});
fs.writeFileSync("./dist/popup.html", out);

// Exclude already copied CSS and HTML
const exclude_files = ["popup.css", "popup.html"];

// Copy remaining assets files
const files = fs.readdirSync("./public");
files.filter(file => !exclude_files.includes(file)).forEach(file => {
    fs.copyFileSync(`./public/${file}`, `./dist/${file}`);
});


