const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/authService');
const { logAudit } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS } = require('../config/constants');

// Frontend and backend are deployed on different onrender.com subdomains, which
// browsers treat as different sites (Render is on the Public Suffix List so its
// per-customer subdomains don't share cookie scope) - so this cookie must be
// SameSite=None to be sent on cross-site requests at all. None requires Secure,
// which is already tied to the same production check. Locally (shared "localhost"
// site) this is same-site regardless, so 'lax' there is just a safer default.
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log('LOGIN ATTEMPT RECEIVED FOR:', email);
  const { user, accessToken, refreshToken } = await authService.login(email, password);

  res.cookie('refreshToken', refreshToken, {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  await logAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.LOGIN,
    entityType: 'User',
    entityId: user.id,
    ipAddress: req.ip,
  });

  ApiResponse.send(res, 200, { user, accessToken }, 'Login successful');
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  const { accessToken } = await authService.refresh(token);
  ApiResponse.send(res, 200, { accessToken }, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);

  await logAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.LOGOUT,
    entityType: 'User',
    entityId: req.user.id,
    ipAddress: req.ip,
  });

  ApiResponse.send(res, 200, null, 'Logged out successfully');
});

const me = asyncHandler(async (req, res) => {
  ApiResponse.send(res, 200, req.user, 'Current user retrieved');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  ApiResponse.send(res, 200, null, 'Password changed successfully');
});

module.exports = { login, refresh, logout, me, changePassword };
