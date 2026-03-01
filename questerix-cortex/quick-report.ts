import * as fs from "fs";
import * as path from "path";
import { Project } from "ts-morph";
import { Reporter } from "./src/reporter";
import { Scanner } from "./src/scanner";

async function main() {
    const root = path.resolve(__dirname, "..");
    const adminPath = path.resolve(__dirname, "..", "admin-panel");
    const srcPath = path.join(adminPath, "src");
    const outputsPath = path.join(__dirname, "outputs");

    const project = new Project({
        tsConfigFilePath: path.join(adminPath, "tsconfig.json"),
        skipAddingFilesFromTsConfig: true,
    });
    project.addSourceFilesAtPaths([
        path.join(srcPath, "features/**/*.{ts,tsx}"),
    ]);

    const scanner = new Scanner(project, srcPath);
    const surfaceMap = scanner.scan();
    
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, "cortex.config.json"), "utf-8"));
    const reporter = new Reporter(__dirname, config.outputs, root);
    
    // We only want to update the surface portions of the health report
    // Reporter.generate() takes results, surfaceMap, etc.
    reporter.generate({}, surfaceMap);
    
    console.log("Report updated with fixed scanner logic.");
}

main();
