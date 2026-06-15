import "dotenv/config";
import bcrypt from "bcrypt";
import { User } from "../models/index.js";

(async () => {
  try {
    const hashedPassword = await bcrypt.hash("supersecure123", 10);
    
    await User.upsert({
      name: "Super Client",
      email: "superclient@local.dev",
      password: hashedPassword,
      role: "customer",
      status: "active",
    });

    console.log("Successfully recreated superclient@local.dev");
    process.exit(0);
  } catch (error) {
    console.error("Error recreating accounts:", error);
    process.exit(1);
  }
})();
