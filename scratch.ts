import { Sequelize } from 'sequelize';
import { db } from './server/src/models/index';
import { Product } from './server/src/models/product';

async function main() {
  const p = await Product.findOne({ where: { name: 'Lorong Keheningan Abadi' } });
  if (p) {
    console.log(JSON.stringify(p.toJSON(), null, 2));
  } else {
    console.log('Product not found');
  }
  process.exit(0);
}

main().catch(console.error);
