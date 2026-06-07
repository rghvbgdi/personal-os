import User from '../models/User.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { success, error } from '../utils/response.js';
import { env } from '../config/env.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return error(res, 'Email already registered', 409);

    const user = await User.create({ name, email, password });

    const accessToken = signAccessToken({ id: user._id, email: user.email });
    const refreshToken = signRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    return success(res, { user: user.toSafeObject(), accessToken }, 'Account created', 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !(await user.comparePassword(password))) {
      return error(res, 'Invalid email or password', 401);
    }

    const accessToken = signAccessToken({ id: user._id, email: user.email });
    const refreshToken = signRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    return success(res, { user: user.toSafeObject(), accessToken }, 'Logged in');
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return error(res, 'Refresh token required', 401);

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return error(res, 'Invalid refresh token', 401);
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return error(res, 'Refresh token revoked', 401);
    }

    const accessToken = signAccessToken({ id: user._id, email: user.email });
    const newRefreshToken = signRefreshToken({ id: user._id });

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);
    return success(res, { accessToken }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }
    res.clearCookie('refreshToken');
    return success(res, {}, 'Logged out');
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return error(res, 'User not found', 404);
    return success(res, { user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'currency', 'timezone', 'monthlyBudget'];
    const updates = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true, runValidators: true,
    });
    return success(res, { user: user.toSafeObject() }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};
