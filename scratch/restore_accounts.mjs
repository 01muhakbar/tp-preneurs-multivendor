import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });
import bcrypt from 'bcrypt';
import { User } from '../server/src/models/User.ts';

(async () => {
  try {
    const hashedPassword = await bcrypt.hash('supersecure123', 10);
    
    await User.upsert({
      name: 'Super Seller',
      email: 'superseller@local.dev',
      password: hashedPassword,
      role: 'seller',
      status: 'active',
    });

    await User.upsert({
      name: 'Super Buyer',
      email: 'superbuyer@local.dev',
      password: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    console.log('Successfully recreated superseller@local.dev and superbuyer@local.dev');
    process.exit(0);
  } catch (error) {
    console.error('Error recreating accounts:', error);
    process.exit(1);
  }
})();
