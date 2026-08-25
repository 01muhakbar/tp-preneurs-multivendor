import "dotenv/config";
import { sequelize, User } from "../models/index.js";

async function main() {
  await sequelize.authenticate();
  const email = "superadmin@local.dev";
  const user = await User.findOne({ where: { email } });
  console.log(JSON.stringify(user ? user.get({ plain: true }) : null, null, 2));
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
