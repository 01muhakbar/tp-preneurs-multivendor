import "dotenv/config";
import { sequelize, User } from "../models/index.js";

async function main() {
  await sequelize.authenticate();
  const email = process.env.SEED_SUPER_EMAIL || "superadmin@local.dev";
  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.log(`[repair] No user found for ${email}`);
    return;
  }

  const before = user.get({ plain: true });
  const normalizedRole = String(before.role || "").trim().toLowerCase();
  if (normalizedRole !== "super_admin") {
    console.log(`[repair] Repairing role for ${email}. current role=${JSON.stringify(before.role)}`);
    await user.update({ role: "super_admin", status: "active", name: "Super Admin" });
  } else {
    console.log(`[repair] Role already valid for ${email}: ${normalizedRole}`);
  }

  const after = (await User.findOne({ where: { email } }))?.get({ plain: true });
  console.log(JSON.stringify(after, null, 2));
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
