/**
 * Token Utility — JWT Generation & Verification
 */
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export function generateAuthToken(payload) {
  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn
  });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, config.auth.jwtSecret);
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    maxAge: config.auth.cookieMaxAge,
    path: '/'
  };
}

export function getClearCookieOptions() {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/'
  };
}
