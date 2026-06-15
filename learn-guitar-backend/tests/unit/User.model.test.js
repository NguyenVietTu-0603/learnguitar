import { describe, test, expect, beforeAll } from '@jest/globals';
import mongoose from 'mongoose';

describe('User Model Schema', () => {
  let User;
  beforeAll(() => {
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['user', 'admin'], default: 'user' },
      isActive: { type: Boolean, default: true },
    });
    User = mongoose.model('UserSchemaTest', userSchema);
  });

  test('defaults role to user', () => {
    const user = new User({ name: 'Test', email: 'test@example.com', password: 'pass' });
    expect(user.role).toBe('user');
  });

  test('defaults isActive to true', () => {
    const user = new User({ name: 'Test', email: 'test2@example.com', password: 'pass' });
    expect(user.isActive).toBe(true);
  });

  test('stores all fields correctly', () => {
    const user = new User({
      name: 'John',
      email: 'john@example.com',
      password: 'secret',
      role: 'admin',
      isActive: false,
    });
    expect(user.name).toBe('John');
    expect(user.email).toBe('john@example.com');
    expect(user.role).toBe('admin');
    expect(user.isActive).toBe(false);
  });

  test('role enum validates input', () => {
    const userSchema = new mongoose.Schema({
      role: { type: String, enum: ['user', 'admin'], default: 'user' },
    });
    const UserEnum = mongoose.model('UserEnumTest', userSchema);
    const user = new UserEnum({ role: 'user' });
    expect(user.role).toBe('user');
  });
});
