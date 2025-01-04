import { readFile, writeFile } from "fs/promises";

import { endpointsMap } from "./codegen";

const entryPoints = endpointsMap.map((e) => e[0]);

const config = {
  entryPoints: [
    "./src/index.ts",
    ...entryPoints.map((e) => {
      const [dir, file] = e.split("/");
      return `./src/modules/${dir}/${file ?? dir}.codegen.ts`;
    }),
  ], // The entry point(s) of your library
  format: ["esm"], // The desired output format(s)
  clean: true,
  splitting: true,
  outDir: "dist",
  skipNodeModulesBundle: true,
  minify: process.env.NODE_ENV !== "development", // Whether to minify the output
  sourcemap: process.env.NODE_ENV !== "development", // Whether to generate sourcemaps
  // splitting: true, // Whether to split the bundle into chunks
  dts: process.env.VERCEL !== "1", // Whether to generate TypeScript declaration files
  // target: "node18", // Specify your target environment

  async onSuccess() {
    const pkgJson = JSON.parse(
      await readFile("./package.json", {
        encoding: "utf-8",
      }),
    ) as PackageJson;

    pkgJson.exports = {
      ".": {
        import: "./dist/index.js",
        types: "./dist/index.d.ts",
      },
    };

    entryPoints.forEach((entry) => {
      const [dir, file] = entry.split("/");

      pkgJson.exports[`./${entry}`] = {
        import: `./dist/modules/${dir}/${file ?? dir}.codegen.js`,
        types: `./dist/modules/${dir}/${file ?? dir}.codegen.d.ts`,
      };
      pkgJson.typesVersions["*"][entry] = [
        `./dist/modules/${dir}/${file ?? dir}.codegen.d.ts`,
      ];
    });

    await writeFile("./package.json", JSON.stringify(pkgJson, null, 2));
  },
};

export default config;

type PackageJson = {
  name: string;
  exports: Record<string, { import: string; types: string } | string>;
  typesVersions: Record<"*", Record<string, string[]>>;
  files: string[];
  dependencies: Record<string, string>;
  pnpm: {
    overrides: Record<string, string>;
  };
};
