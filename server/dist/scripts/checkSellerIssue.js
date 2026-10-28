import { StoreRole } from "../models/index.js";
async function main() {
    const roles = await StoreRole.findAll();
    console.log("StoreRoles in DB:", roles.map((r) => r.toJSON()));
}
main().catch(console.error).finally(() => process.exit(0));
