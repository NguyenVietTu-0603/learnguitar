import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Ban chua dang nhap. Vui long dang nhap de tiep tuc.'
    });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token khong hop le hoac da het han.'
    });
  }

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return res.status(401).json({
      success: false,
      message: 'Nguoi dung khong ton tai.'
    });
  }

  if (!currentUser.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Tai khoan da bi khoa.'
    });
  }

  req.user = {
    id: currentUser._id,
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role
  };

  next();
});

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui long dang nhap de thuc hien thao tac nay.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Ban khong co quyen thuc hien thao tac nay.'
      });
    }

    next();
  };
};
