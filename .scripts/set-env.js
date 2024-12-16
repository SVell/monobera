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
