import "dotenv/config";
import bcrypt from "bcrypt";
import { User } from "../models/index.js";

(async () => {
  try {
    const hashedPassword = await bcrypt.hash("supersecure123", 10);
    
    await User.upsert({
      name: "Super Seller",
      email: "superseller@local.dev",
      password: hashedPassword,
      role: "seller",
      status: "active",
    });

    console.log("Successfully recreated superseller@local.dev");
    process.exit(0);
  } catch (error) {
    console.error("Error recreating accounts:", error);
    process.exit(1);
  }
})();
