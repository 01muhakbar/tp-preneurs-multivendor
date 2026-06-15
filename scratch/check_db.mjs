import { Sequelize } from 'sequelize';
const s = new Sequelize('mysql://root:@localhost:3306/ecommerce_dev');
s.query("SELECT email FROM users WHERE email='superseller@local.dev'").then((res) => {
  console.log('ecommerce_dev:', res[0]);
  return s.query("SELECT email FROM users WHERE email='superseller@local.dev'", { logging: false });
}).catch((err) => {
  console.error(err);
  process.exit(1);
}).then(() => process.exit(0));
