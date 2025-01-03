const { program } = require("commander");
const fs = require("fs");
const path = require("path");

program.argument("<env>");

program.parse();

const env = program.args[0];

console.log("Copying files", env);

if (fs.existsSync(path.resolve(process.cwd(), "secrets", `.env.${env}`))) {
  if (fs.existsSync(path.resolve(process.cwd(), ".env"))) {
    fs.unlinkSync(path.resolve(process.cwd(), ".env"));
  }
  fs.symlinkSync(
    path.resolve(process.cwd(), "secrets", `.env.${env}`),
    path.resolve(process.cwd(), ".env"),
  );
} else if (fs.existsSync(path.resolve(process.cwd(), `.env.${env}`))) {
  if (fs.existsSync(path.resolve(process.cwd(), ".env"))) {
    fs.unlinkSync(path.resolve(process.cwd(), ".env"));
  }
  fs.symlinkSync(
    path.resolve(process.cwd(), `.env.${env}`),
    path.resolve(process.cwd(), ".env"),
  );
} else {
  throw new Error(`No env file found for ${env}`);
}

/**
 * This fixes a bug where sentry variables are not set on vercel in next.config.mjs files
 */
if (process.env.VERCEL && process.env.SENTRY_PROJECT) {
  fs.appendFileSync(
    path.resolve(process.cwd(), ".env.local"),
    `\nSENTRY_PROJECT=${process.env.SENTRY_PROJECT}\nSENTRY_ORG=${process.env.SENTRY_ORG}\nSENTRY_AUTH_TOKEN=${process.env.SENTRY_AUTH_TOKEN}`,
  );
}

fs.globSync(path.resolve(process.cwd(), "apps/*/next.config.mjs")).forEach(
  (file) => {
    const envFile = path.resolve(process.cwd(), path.dirname(file), ".env");

    if (!fs.existsSync(envFile)) {
      fs.symlinkSync(path.resolve(process.cwd(), ".env"), envFile);
    }

    const envLocalFile = path.resolve(
      process.cwd(),
      path.dirname(file),
      ".env.local",
    );

    if (!fs.existsSync(envLocalFile)) {
      fs.symlinkSync(path.resolve(process.cwd(), ".env.local"), envLocalFile);
    }
  },
);
