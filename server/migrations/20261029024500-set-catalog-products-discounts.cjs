'use strict';

/**
 * Migration: Set initial promo/sale prices on catalog products
 * Ensures products appearing in "Latest Discounted Products" on the storefront
 * match the actual products registered in the catalog (/admin/catalog/products).
 */

async function resolveProductsTableName(queryInterface) {
  for (const candidate of ['Products', 'products']) {
    try {
      await queryInterface.describeTable(candidate);
      return candidate;
    } catch {
      // continue to next candidate
    }
  }
  return 'products';
}

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableName = await resolveProductsTableName(queryInterface);

      const discounts = [
        { slug: 'crochet-manz', salePrice: 12000 },
        { slug: 'sweet-flower', salePrice: 68000 },
        { slug: 'kreasi-singkong', salePrice: 8500 },
        { slug: 'picturestic', salePrice: 120000 },
        { slug: 'white-florist', salePrice: 59500 },
      ];

      for (const item of discounts) {
        await queryInterface.sequelize.query(
          `UPDATE \`${tableName}\`
           SET \`sale_price\` = :salePrice, \`updatedAt\` = NOW()
           WHERE \`slug\` = :slug AND (\`sale_price\` IS NULL OR \`sale_price\` = 0)`,
          {
            replacements: {
              salePrice: item.salePrice,
              slug: item.slug,
            },
          }
        );
      }
    } catch (err) {
      console.warn('[migration][set-catalog-discounts] Non-fatal skip:', err.message);
    }
  },

  async down(queryInterface) {
    // Non-destructive: no rollback necessary
  },
};
