import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll } from "vitest";

// Test-only environment. Runs before each test file imports application code.
// Never inherit a developer/production database: tests use JSON storage in a
// unique temp directory, so they cannot reach Postgres or ./data/db.json.
delete process.env.DATABASE_URL;
process.env.STORAGE_BACKEND = "json";

const dataDir = mkdtempSync(path.join(tmpdir(), "launchrole-test-data-"));
process.env.DATA_DIR = dataDir;

afterAll(() => {
  // Removes only the temp directory created above.
  rmSync(dataDir, { recursive: true, force: true });
});
