require('dotenv').config({ path: './server/.env' });
const { sequelize, Order, Suborder, Shipment } = require('./server/src/models/index.js');

(async () => {
  try {
    const order = await Order.findOne({ where: { checkoutMode: 'MULTI_STORE' } });
    if (!order) {
      console.log('No MULTI_STORE order found.');
      process.exit(0);
    }
    console.log('ORDER ID:', order.id);

    await sequelize.query(`UPDATE orders SET status='processing' WHERE id=${order.id}`);
    await sequelize.query(`UPDATE suborders SET fulfillmentStatus='PROCESSING' WHERE orderId=${order.id}`);
    await sequelize.query(`UPDATE shipments SET status='PROCESSING' WHERE orderId=${order.id}`);

    console.log('SETUP DONE');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
