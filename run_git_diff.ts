import { execSync } from "child_process";

try {
  console.log("=== RUNNING SYSTEM GIT STATUS ===");
  const status = execSync("git status", { encoding: "utf8" });
  console.log(status);
  
  console.log("=== RUNNING SYSTEM GIT DIFF ===");
  const diff = execSync("git diff HEAD", { encoding: "utf8" });
  console.log(diff.substring(0, 5000));
} catch (err: any) {
  console.error("Error running git:", err.message);
}
