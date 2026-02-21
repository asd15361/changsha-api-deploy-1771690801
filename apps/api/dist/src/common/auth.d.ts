export declare function issueAccessToken(userId: string): string;
export declare function parseUserIdFromAuthorizationHeader(authHeader: string | string[] | undefined): string | null;
export declare function requireUserIdFromAuthorizationHeader(authHeader: string | string[] | undefined): string;
