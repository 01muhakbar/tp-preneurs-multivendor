const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { Sequelize, QueryTypes } = require("sequelize");

dotenv.config();

const repoRoot = path.resolve(__dirname, "../..");
const args = process.argv.slice(2);
const hasArg = (name) => args.includes(name);
const getArgValue = (name) => {
  const index = args.indexOf(name);
  if (index < 0 || index + 1 >= args.length) return null;
  return args[index + 1];
};

const printConfigOnly = hasArg("--print-config");
const allowProductionReadonly = hasArg("--allow-production-readonly");

const trimEnv = (key) => String(process.env[key] || "").trim();
const isEnvTrue = (value, defaultValue = false) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return defaultValue;
  return ["1", "true", "yes", "on"].includes(normalized);
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
  const ssl = {
    rejectUnauthorized: isEnvTrue(process.env.DB_SSL_REJECT_UNAUTHORIZED, true),
  };
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
      )}. Remove stale DB_* values or make them match before running Duitku preflight.`
    );
  }
};

const resolveDatabaseTarget = () => {
  const databaseUrl = trimEnv("DATABASE_URL");
  const target = databaseUrl ? parseDatabaseUrl(databaseUrl) : parseSplitDatabaseConfig();
  if (target.dialect && target.dialect !== "mysql") {
    throw new Error(`Unsupported database dialect for Duitku preflight: ${target.dialect}`);
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
  username: target.username ? "<redacted>" : "",
  password: target.password ? "<redacted>" : "",
  ssl: isEnvTrue(process.env.DB_SSL),
  sslRejectUnauthorized: isEnvTrue(process.env.DB_SSL_REJECT_UNAUTHORIZED, true),
});

const logicalTables = [
  "users",
  "orders",
  "suborders",
  "payments",
  "payment_proofs",
  "payment_status_logs",
  "stores",
  "store_payment_profiles",
];

const futureTables = [
  "order_collection_claims",
  "order_payment_attempts",
  "duitku_callback_inbox",
  "order_payment_attempt_events",
  "order_payment_security_events",
];

const sqlList = (values) => values.map((value) => sequelizeEscape(value)).join(",");
const sequelizeEscape = (value) => `'${String(value).replace(/'/g, "''")}'`;

const querySafe = async (sequelize, label, sql) => {
  try {
    return {
      label,
      ok: true,
      rows: await sequelize.query(sql, { type: QueryTypes.SELECT }),
    };
  } catch (error) {
    return {
      label,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      rows: [],
    };
  }
};

const renderJson = (value) => `\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n`;

const resolvePhysicalTables = (rows) => {
  const byLower = new Map();
  for (const row of rows) {
    const lower = String(row.logical_name || row.LOGICAL_NAME || "").toLowerCase();
    if (!lower) continue;
    const variants = String(row.variants || row.VARIANTS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    byLower.set(lower, variants);
  }
  const resolved = {};
  const issues = [];
  for (const logicalName of logicalTables) {
    const variants = byLower.get(logicalName) || [];
    if (variants.length !== 1) {
      issues.push({
        logicalName,
        variantCount: variants.length,
        variants,
      });
    } else {
      resolved[logicalName] = variants[0];
    }
  }
  return { resolved, issues };
};

const table = (resolved, logicalName) => {
  const physical = resolved[logicalName];
  if (!physical) return null;
  return `\`${String(physical).replace(/`/g, "``")}\``;
};

const buildReport = ({ target, sections, resolvedTables, resolutionIssues, startedAt, finishedAt }) => {
  const decision =
    resolutionIssues.length === 0
      ? "Read-only preflight completed; review required before migration approval."
      : "Read-only preflight completed with blocking table-resolution issues.";

  let markdown = `# PAY-DUITKU-STEP2: Read-Only DDL Preflight\n\n`;
  markdown += `Date: ${startedAt.slice(0, 10)}\n`;
  markdown += `Environment: ${process.env.NODE_ENV || "local development"}\n`;
  markdown += `Started at: ${startedAt}\n`;
  markdown += `Finished at: ${finishedAt}\n`;
  markdown += `Scope: Step 2 read-only schema inspection only.\n`;
  markdown += `Decision: ${decision}\n\n`;
  markdown += `## Redacted Database Target\n`;
  markdown += renderJson(redactedConfig(target));
  markdown += `## Physical Table Resolution\n`;
  markdown += renderJson({ resolvedTables, resolutionIssues });

  for (const section of sections) {
    markdown += `## ${section.label}\n`;
    if (!section.ok) {
      markdown += `Status: failed\n\n`;
      markdown += renderJson({ error: section.error });
      continue;
    }
    markdown += `Status: ok\n\n`;
    markdown += renderJson(section.rows);
  }

  markdown += `## Review Notes\n\n`;
  markdown += `- No DDL was executed by this script.\n`;
  markdown += `- No migration rows were inserted or updated by this script.\n`;
  markdown += `- Migration approval remains blocked until this artifact is reviewed.\n`;
  markdown += `- Add reviewer, owner, and remediation notes before using this report for gate approval.\n`;
  return markdown;
};

async function run() {
  let sequelize;
  try {
    if (process.env.NODE_ENV === "production" && !allowProductionReadonly) {
      throw new Error("Refusing production preflight without --allow-production-readonly.");
    }

    const target = resolveDatabaseTarget();
    if (printConfigOnly) {
      console.log(JSON.stringify(redactedConfig(target), null, 2));
      return;
    }

    const startedAt = new Date().toISOString();
    sequelize = new Sequelize(...buildSequelizeArgs(target));
    await sequelize.authenticate();

    const baseTableList = sqlList(logicalTables);
    const futureTableList = sqlList(futureTables);
    const sections = [];

    sections.push(
      await querySafe(
        sequelize,
        "MySQL Version And Active Schema",
        "SELECT VERSION() AS mysql_version, DATABASE() AS current_schema"
      )
    );
    sections.push(
      await querySafe(
        sequelize,
        "Base Table Engines",
        `SELECT table_name, engine
         FROM information_schema.tables
         WHERE table_schema = DATABASE()
           AND LOWER(table_name) IN (${baseTableList})
         ORDER BY LOWER(table_name), table_name`
      )
    );
    const physicalResolution = await querySafe(
      sequelize,
      "Base Table Case Variants",
      `SELECT LOWER(table_name) AS logical_name,
              COUNT(*) AS variant_count,
              GROUP_CONCAT(table_name ORDER BY table_name SEPARATOR ',') AS variants
       FROM information_schema.tables
       WHERE table_schema = DATABASE()
         AND LOWER(table_name) IN (${baseTableList})
       GROUP BY LOWER(table_name)
       ORDER BY LOWER(table_name)`
    );
    sections.push(physicalResolution);

    const { resolved, issues } = physicalResolution.ok
      ? resolvePhysicalTables(physicalResolution.rows)
      : { resolved: {}, issues: logicalTables.map((logicalName) => ({ logicalName, variantCount: 0, variants: [] })) };

    sections.push(
      await querySafe(
        sequelize,
        "Base Columns",
        `SELECT table_name, column_name, column_type, is_nullable, column_default, column_key, extra
         FROM information_schema.columns
         WHERE table_schema = DATABASE()
           AND LOWER(table_name) IN (${baseTableList})
         ORDER BY LOWER(table_name), ordinal_position`
      )
    );
    sections.push(
      await querySafe(
        sequelize,
        "Base Indexes",
        `SELECT table_name, index_name, non_unique,
                GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',') AS columns_in_order
         FROM information_schema.statistics
         WHERE table_schema = DATABASE()
           AND LOWER(table_name) IN (${baseTableList})
         GROUP BY table_name, index_name, non_unique
         ORDER BY LOWER(table_name), index_name`
      )
    );
    sections.push(
      await querySafe(
        sequelize,
        "Base Foreign Keys",
        `SELECT kcu.table_name, kcu.column_name, kcu.constraint_name,
                kcu.referenced_table_name, kcu.referenced_column_name,
                rc.update_rule, rc.delete_rule
         FROM information_schema.key_column_usage kcu
         JOIN information_schema.referential_constraints rc
           ON rc.constraint_schema = kcu.constraint_schema
          AND rc.constraint_name = kcu.constraint_name
         WHERE kcu.table_schema = DATABASE()
           AND LOWER(kcu.table_name) IN (${baseTableList})
           AND kcu.referenced_table_name IS NOT NULL
         ORDER BY LOWER(kcu.table_name), kcu.constraint_name, kcu.ordinal_position`
      )
    );
    sections.push(
      await querySafe(
        sequelize,
        "Enum Columns",
        `SELECT table_name, column_name, column_type
         FROM information_schema.columns
         WHERE table_schema = DATABASE()
           AND (
             (LOWER(table_name) = 'payments' AND column_name IN ('payment_channel','payment_type','status'))
             OR (LOWER(table_name) = 'suborders' AND column_name IN ('payment_method','payment_status'))
             OR (LOWER(table_name) = 'stores' AND column_name = 'status')
             OR (LOWER(table_name) = 'store_payment_profiles' AND column_name IN ('provider_code','payment_type','snapshot_status','verification_status'))
           )`
      )
    );
    sections.push(
      await querySafe(
        sequelize,
        "Partial Duitku Tables",
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = DATABASE()
           AND LOWER(table_name) IN (${futureTableList})
         ORDER BY LOWER(table_name)`
      )
    );
    sections.push(
      await querySafe(
        sequelize,
        "Partial Duitku Columns",
        `SELECT table_name, column_name, column_type, is_nullable, column_default, column_key, extra
         FROM information_schema.columns
         WHERE table_schema = DATABASE()
           AND (
             LOWER(table_name) IN (${futureTableList})
             OR (LOWER(table_name) = 'payments' AND column_name IN ('allocation_key','paid_by_order_payment_attempt_id'))
           )
         ORDER BY LOWER(table_name), ordinal_position`
      )
    );
    sections.push(
      await querySafe(
        sequelize,
        "Partial Duitku Indexes",
        `SELECT table_name, index_name, non_unique,
                GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',') AS columns_in_order
         FROM information_schema.statistics
         WHERE table_schema = DATABASE()
           AND LOWER(table_name) IN (${futureTableList}, 'payments')
         GROUP BY table_name, index_name, non_unique
         ORDER BY LOWER(table_name), index_name`
      )
    );
    sections.push(
      await querySafe(
        sequelize,
        "Migration Records",
        `SELECT filename, created_at
         FROM migrations
         WHERE filename LIKE '%duitku%'
            OR filename LIKE '%payment_attempt%'
            OR filename LIKE '%collection_claim%'
            OR filename LIKE '%callback_inbox%'
            OR filename LIKE '%allocation_key%'
         ORDER BY created_at, filename`
      )
    );

    const ordersTable = table(resolved, "orders");
    const subordersTable = table(resolved, "suborders");
    const paymentsTable = table(resolved, "payments");
    const storesTable = table(resolved, "stores");
    const profilesTable = table(resolved, "store_payment_profiles");

    if (ordersTable && subordersTable) {
      sections.push(
        await querySafe(
          sequelize,
          "Orphan Suborders",
          `SELECT s.id, s.order_id
           FROM ${subordersTable} s
           LEFT JOIN ${ordersTable} o ON o.id = s.order_id
           WHERE o.id IS NULL
           LIMIT 50`
        )
      );
    }
    if (paymentsTable && subordersTable) {
      sections.push(
        await querySafe(
          sequelize,
          "Orphan Payments",
          `SELECT p.id, p.suborder_id
           FROM ${paymentsTable} p
           LEFT JOIN ${subordersTable} s ON s.id = p.suborder_id
           WHERE s.id IS NULL
           LIMIT 50`
        )
      );
    }
    if (ordersTable) {
      sections.push(
        await querySafe(
          sequelize,
          "Order Amount Anomalies",
          `SELECT id, total_amount
           FROM ${ordersTable}
           WHERE total_amount IS NULL OR total_amount <= 0 OR total_amount <> ROUND(total_amount, 0)
           LIMIT 50`
        )
      );
    }
    if (subordersTable && storesTable && profilesTable) {
      sections.push(
        await querySafe(
          sequelize,
          "QRIS Active Profile Readiness Sampling",
          `SELECT s.order_id,
                  s.store_id,
                  COUNT(DISTINCT spp.id) AS eligible_profile_count
           FROM ${subordersTable} s
           JOIN ${storesTable} st
             ON st.id = s.store_id
           LEFT JOIN ${profilesTable} spp
             ON spp.id = st.active_store_payment_profile_id
            AND spp.store_id = st.id
            AND spp.is_active = 1
            AND spp.verification_status = 'ACTIVE'
            AND spp.snapshot_status = 'ACTIVE'
            AND spp.provider_code = 'MANUAL_QRIS'
            AND spp.payment_type = 'QRIS_STATIC'
            AND spp.qris_image_url IS NOT NULL
            AND spp.qris_image_url <> ''
           WHERE st.status = 'ACTIVE'
           GROUP BY s.order_id, s.store_id
           HAVING eligible_profile_count <> 1
           LIMIT 50`
        )
      );
    }

    const finishedAt = new Date().toISOString();
    const outputArg = getArgValue("--output");
    const outputPath = outputArg
      ? path.resolve(process.cwd(), outputArg)
      : path.join(repoRoot, "docs", "payments", "preflight", `${startedAt.slice(0, 10)}-duitku-ddl-preflight.md`);
    const report = buildReport({
      target,
      sections,
      resolvedTables: resolved,
      resolutionIssues: issues,
      startedAt,
      finishedAt,
    });

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, report, "utf8");
    console.log(`Wrote read-only preflight report: ${path.relative(repoRoot, outputPath)}`);
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
