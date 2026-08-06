const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { Sequelize } = require("sequelize");

dotenv.config();

const migrationsDir = path.resolve(__dirname, "../migrations");
const args = new Set(process.argv.slice(2));
const printConfigOnly = args.has("--print-config");
const dryRun = args.has("--dry-run");

const trimEnv = (key) => String(process.env[key] || "").trim();
const isEnvTrue = (value, defaultValue = false) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return defaultValue;
  return ["1", "true", "yes", "on"].includes(normalized);
};

const redact = (value) => {
  if (!value) return "";
  return "<redacted>";
};

const parseDatabaseUrl = (databaseUrl) => {
  const parsed = new URL(databaseUrl);
  return {
    mode: "DATABASE_URL",
    dialect: parsed.protocol.replace(":", "") || "mysql",
    host: parsed.hostname || "",
    port: parsed.port ? Number(parsed.port) : 3306,
    database: parsed.pathname ? decodeURIComponent(parsed.pathname.replace(/^\//, "")) : "",
    username: parsed.username ? decodeURIComponent(parsed.username) : "",
    password: parsed.password ? decodeURIComponent(parsed.password) : "",
  };
};

const parseSplitDatabaseConfig = () => ({
  mode: "DB_*",
  dialect: "mysql",
  host: trimEnv("DB_HOST") || "localhost",
  port: trimEnv("DB_PORT") ? Number(trimEnv("DB_PORT")) : 3306,
  database: trimEnv("DB_NAME") || "ecommerce_dev",
  username: trimEnv("DB_USER") || "root",
  password: process.env.DB_PASS || "",
});

const buildSslOptions = () => {
  if (!isEnvTrue(process.env.DB_SSL)) return null;
  const rejectUnauthorized = isEnvTrue(process.env.DB_SSL_REJECT_UNAUTHORIZED, true);
  const ssl = { rejectUnauthorized };
  const caPath = trimEnv("DB_SSL_CA_FILE");
  if (caPath) {
    ssl.ca = fs.readFileSync(path.resolve(caPath), "utf8");
  } else if (process.env.DB_SSL_CA) {
    ssl.ca = process.env.DB_SSL_CA;
  }
  return ssl;
};

const normalizeComparableConfig = (config) => ({
  host: String(config.host || "").toLowerCase(),
  port: Number(config.port || 3306),
  database: String(config.database || ""),
  username: String(config.username || ""),
  password: String(config.password || ""),
});

const assertMixedConfigMatchesDatabaseUrl = (runtimeTarget) => {
  const databaseUrl = trimEnv("DATABASE_URL");
  const hasSplitConfig =
    trimEnv("DB_HOST") || trimEnv("DB_PORT") || trimEnv("DB_NAME") || trimEnv("DB_USER") || process.env.DB_PASS;
  if (!databaseUrl || !hasSplitConfig) return;

  const splitTarget = normalizeComparableConfig(parseSplitDatabaseConfig());
  const urlTarget = normalizeComparableConfig(runtimeTarget);
  const mismatches = [];

  for (const key of ["host", "port", "database", "username", "password"]) {
    const splitValue = splitTarget[key];
    const urlValue = urlTarget[key];
    if (splitValue && urlValue && splitValue !== urlValue) {
      mismatches.push(key);
    }
  }

  if (mismatches.length > 0) {
    throw new Error(
      `DATABASE_URL and DB_* point to different database target fields: ${mismatches.join(
        ", "
      )}. Remove stale DB_* values or make them match before running migrations.`
    );
  }
};

const resolveDatabaseTarget = () => {
  const databaseUrl = trimEnv("DATABASE_URL");
  const target = databaseUrl ? parseDatabaseUrl(databaseUrl) : parseSplitDatabaseConfig();
  if (target.dialect && target.dialect !== "mysql") {
    throw new Error(`Unsupported database dialect for migrations: ${target.dialect}`);
  }
  if (!target.host || !target.database || !target.username) {
    throw new Error("Missing database target. Set DATABASE_URL or DB_HOST, DB_NAME, and DB_USER.");
  }
  if (!Number.isInteger(target.port) || target.port <= 0) {
    throw new Error(`Invalid DB_PORT: ${target.port}`);
  }
  assertMixedConfigMatchesDatabaseUrl(target);
  return target;
};

const buildSequelizeArgs = (target) => {
  const dialectOptions = {};
  const ssl = buildSslOptions();
  if (ssl) dialectOptions.ssl = ssl;

  if (isEnvTrue(process.env.MIGRATION_MULTIPLE_STATEMENTS, true)) {
    dialectOptions.multipleStatements = true;
  }

  if (target.mode === "DATABASE_URL") {
    return [
      trimEnv("DATABASE_URL"),
      {
        logging: false,
        dialect: "mysql",
        dialectOptions,
      },
    ];
  }

  return [
    target.database,
    target.username,
    target.password,
    {
      host: target.host,
      port: target.port,
      dialect: "mysql",
      logging: false,
      dialectOptions,
    },
  ];
};

const redactedConfig = (target) => ({
  mode: target.mode,
  dialect: "mysql",
  host: target.host,
  port: target.port,
  database: target.database,
  username: target.username ? redact(target.username) : "",
  password: target.password ? redact(target.password) : "",
  ssl: isEnvTrue(process.env.DB_SSL),
  sslRejectUnauthorized: isEnvTrue(process.env.DB_SSL_REJECT_UNAUTHORIZED, true),
  multipleStatements: isEnvTrue(process.env.MIGRATION_MULTIPLE_STATEMENTS, true),
  dbSync: trimEnv("DB_SYNC") || "false",
});

const restrictedCjs = process.env.CJS_MIGRATIONS
  ? new Set(
      process.env.CJS_MIGRATIONS.split(",")
        .map((name) => name.trim())
        .filter(Boolean)
    )
  : null;

const isDuitkuFinancialMigration = (filename) =>
  /duitku|payment_attempt|collection_claim|callback_inbox|allocation_key/i.test(filename);

async function ensureMigrationsTable(sequelize) {
  await sequelize.query(
    "CREATE TABLE IF NOT EXISTS migrations (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, filename VARCHAR(255) NOT NULL UNIQUE, created_at DATETIME NOT NULL)"
  );
}

async function getMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }
  return fs
    .readdirSync(migrationsDir)
    .filter((name) => {
      if (name.endsWith(".sql")) return true;
      if (name.endsWith(".cjs")) {
        if (!restrictedCjs) return true;
        return restrictedCjs.has(name);
      }
      return false;
    })
    .sort();
}

function assertDuitkuMigrationGuard(files) {
  const duitkuFiles = files.filter(isDuitkuFinancialMigration);
  if (duitkuFiles.length === 0) return;
  if (process.env.DB_SYNC === "true") {
    throw new Error(
      `DB_SYNC=true is not allowed while Duitku financial migrations are present: ${duitkuFiles.join(", ")}`
    );
  }
}

function validateMigrationFile(filename) {
  const fullPath = path.join(migrationsDir, filename);
  if (filename.endsWith(".sql")) {
    fs.readFileSync(fullPath, "utf8");
    return;
  }
  if (filename.endsWith(".cjs")) {
    const migration = require(fullPath);
    if (typeof migration.up !== "function") {
      throw new Error(`Migration missing up(): ${filename}`);
    }
  }
}

async function hasMigration(sequelize, filename) {
  const [rows] = await sequelize.query("SELECT id FROM migrations WHERE filename = ? LIMIT 1", {
    replacements: [filename],
  });
  return Array.isArray(rows) && rows.length > 0;
}

async function markMigration(sequelize, filename) {
  await sequelize.query("INSERT INTO migrations (filename, created_at) VALUES (?, NOW())", {
    replacements: [filename],
  });
}

async function run() {
  let sequelize;
  try {
    const target = resolveDatabaseTarget();
    const files = await getMigrationFiles();
    assertDuitkuMigrationGuard(files);

    if (printConfigOnly || dryRun) {
      console.log(JSON.stringify(redactedConfig(target), null, 2));
    }

    if (restrictedCjs) {
      console.log(
        `CJS_MIGRATIONS active. Running only selected .cjs migrations: ${Array.from(restrictedCjs).join(", ")}`
      );
    }

    if (dryRun) {
      for (const filename of files) {
        validateMigrationFile(filename);
        console.log(`Dry-run: ${filename}`);
      }
      if (files.length === 0) {
        console.log("Dry-run: no migration files found.");
      }
      return;
    }

    if (printConfigOnly) {
      return;
    }

    sequelize = new Sequelize(...buildSequelizeArgs(target));
    await sequelize.authenticate();
    await ensureMigrationsTable(sequelize);

    if (files.length === 0) {
      console.log("No migration files found.");
      return;
    }

    for (const filename of files) {
      const applied = await hasMigration(sequelize, filename);
      if (applied) {
        console.log(`Skipped: ${filename} (already applied)`);
        continue;
      }
      const fullPath = path.join(migrationsDir, filename);
      if (filename.endsWith(".sql")) {
        const sql = fs.readFileSync(fullPath, "utf8");
        if (!sql.trim()) {
          await markMigration(sequelize, filename);
          console.log(`Applied: ${filename}`);
          continue;
        }
        await sequelize.query(sql);
        await markMigration(sequelize, filename);
        console.log(`Applied: ${filename}`);
        continue;
      }

      if (filename.endsWith(".cjs")) {
        const migration = require(fullPath);
        if (typeof migration.up !== "function") {
          throw new Error(`Migration missing up(): ${filename}`);
        }
        const queryInterface = sequelize.getQueryInterface();
        await migration.up(queryInterface, Sequelize);
        await markMigration(sequelize, filename);
        console.log(`Applied: ${filename}`);
      }
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

run();
