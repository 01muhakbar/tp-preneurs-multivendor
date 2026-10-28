"use strict";

const CANONICAL_CLIENT_LOGO = "/uploads/branding/branding-client-1782537187787-ixm5z6x.png";

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const [rows] = await queryInterface.sequelize.query(
        "SELECT `key`, `value` FROM `settings` WHERE `key` = 'storeSettings' LIMIT 1"
      );
      if (rows && rows.length > 0) {
        const row = rows[0];
        let parsed = null;
        try {
          parsed = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
        } catch {
          parsed = null;
        }
        if (parsed && typeof parsed === "object") {
          const currentClientLogo = parsed.branding?.clientLogoUrl;
          if (!currentClientLogo || currentClientLogo.includes("1792859085016")) {
            parsed.branding = {
              ...(parsed.branding || {}),
              clientLogoUrl: CANONICAL_CLIENT_LOGO,
            };
            const updatedJson = JSON.stringify(parsed);
            await queryInterface.sequelize.query(
              "UPDATE `settings` SET `value` = :val, `updatedAt` = NOW() WHERE `key` = 'storeSettings'",
              { replacements: { val: updatedJson } }
            );
          }
        }
      }
    } catch (err) {
      console.warn("[migration][repair-client-logo] Non-fatal skip:", err.message);
    }
  },

  async down() {
    // Non-destructive: no rollback necessary
  },
};
