"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueAccessToken = issueAccessToken;
exports.parseUserIdFromAuthorizationHeader = parseUserIdFromAuthorizationHeader;
exports.requireUserIdFromAuthorizationHeader = requireUserIdFromAuthorizationHeader;
const common_1 = require("@nestjs/common");
const TOKEN_PREFIX = 'devtoken.';
function issueAccessToken(userId) {
    return `${TOKEN_PREFIX}${userId}`;
}
function parseUserIdFromAuthorizationHeader(authHeader) {
    if (!authHeader)
        return null;
    const raw = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (!raw)
        return null;
    const bearer = raw.startsWith('Bearer ') ? raw.slice('Bearer '.length).trim() : raw.trim();
    if (!bearer.startsWith(TOKEN_PREFIX))
        return null;
    const userId = bearer.slice(TOKEN_PREFIX.length).trim();
    return userId.length > 0 ? userId : null;
}
function requireUserIdFromAuthorizationHeader(authHeader) {
    const userId = parseUserIdFromAuthorizationHeader(authHeader);
    if (!userId) {
        throw new common_1.UnauthorizedException('Login required.');
    }
    return userId;
}
//# sourceMappingURL=auth.js.map