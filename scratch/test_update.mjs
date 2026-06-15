import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });
import { sequelize } from '../server/src/models/index.ts';
import { Order } from '../server/src/models/Order.ts';
import { Shipment } from '../server/src/models/Shipment.ts';

(async () => {
  try {
    const order = await Order.findOne();
    if (!order) {
      console.log('No order found.');
      process.exit(0);
    }
    console.log('ORDER ID:', order.id);

    const mappedFulfillmentStatus = 'SHIPPED';
    let mappedShipmentStatus = 'SHIPPED';
    
    await sequelize.models.Suborder.update(
      { fulfillmentStatus: mappedFulfillmentStatus, updatedAt: new Date() },
      { where: { orderId: order.id } }
    );
    
    if (mappedShipmentStatus) {
      await Shipment.update(
        { status: mappedShipmentStatus, updatedAt: new Date() },
        { where: { orderId: order.id } }
      );
    }

    const shipments = await Shipment.findAll({ where: { orderId: order.id } });
    for (const shipment of shipments) {
      console.log('SHIPMENT ID:', shipment.id, 'STATUS:', shipment.status);
    }
    
    console.log('SETUP DONE');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
