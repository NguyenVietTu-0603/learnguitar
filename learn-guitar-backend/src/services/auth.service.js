import User from '../models/User.model.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

export const registerUser = async (userData) => {
  console.log("📥 Dữ liệu nhận được từ client:", userData);   // ← Thêm dòng này

  const { name, email, password } = userData;

  if (!name || !email || !password) {
    throw new Error('Vui lòng cung cấp đầy đủ tên, email và mật khẩu');
  }

  // Kiểm tra email đã tồn tại
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email này đã được sử dụng');
  }

  const user = await User.create({ name, email, password });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

export const loginUser = async (email, password) => {
  // Tìm user và lấy cả password
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    throw new Error('Email hoặc mật khẩu không chính xác');
  }

  if (!user.isActive) {
    throw new Error('Tài khoản đã bị khóa');
  }

  const token = generateToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    }
  };
};