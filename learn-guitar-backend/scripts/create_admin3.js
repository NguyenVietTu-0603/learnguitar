import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.model.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'admin3@gmail.com';

    // Xóa user cũ (nếu có) để tránh dữ liệu hỏng từ lần chạy trước
    await User.deleteOne({ email });
    console.log('🧹 Cleaned up any previous admin3 user');

    const admin = await User.create({
      name: 'admin3',
      email,
      password: '123456',
      role: 'admin',
      isActive: true,
    });

    console.log('✅ Admin user created successfully');
    console.log({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

createAdmin();
