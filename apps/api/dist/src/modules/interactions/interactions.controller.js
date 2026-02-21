"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionsController = void 0;
const common_1 = require("@nestjs/common");
let InteractionsController = class InteractionsController {
    getComments(postId) {
        return {
            postId,
            items: [
                {
                    id: 'comment_mock_001',
                    authorId: 'user_mock_004',
                    content: '收到，已关注活动。',
                    createdAt: new Date().toISOString(),
                },
            ],
        };
    }
    createComment(postId, body) {
        return {
            success: true,
            postId,
            commentId: 'comment_mock_002',
            content: body.content,
        };
    }
    deleteComment(commentId) {
        return { success: true, commentId };
    }
    likePost(postId) {
        return { success: true, postId };
    }
    unlikePost(postId) {
        return { success: true, postId };
    }
    repostPost(postId, body) {
        return {
            success: true,
            postId,
            repostId: 'repost_mock_001',
            quoteText: body.quoteText ?? null,
        };
    }
};
exports.InteractionsController = InteractionsController;
__decorate([
    (0, common_1.Get)('posts/:postId/comments'),
    __param(0, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], InteractionsController.prototype, "getComments", null);
__decorate([
    (0, common_1.Post)('posts/:postId/comments'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Object)
], InteractionsController.prototype, "createComment", null);
__decorate([
    (0, common_1.Delete)('comments/:commentId'),
    __param(0, (0, common_1.Param)('commentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], InteractionsController.prototype, "deleteComment", null);
__decorate([
    (0, common_1.Post)('posts/:postId/like'),
    __param(0, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], InteractionsController.prototype, "likePost", null);
__decorate([
    (0, common_1.Delete)('posts/:postId/like'),
    __param(0, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], InteractionsController.prototype, "unlikePost", null);
__decorate([
    (0, common_1.Post)('posts/:postId/repost'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Object)
], InteractionsController.prototype, "repostPost", null);
exports.InteractionsController = InteractionsController = __decorate([
    (0, common_1.Controller)()
], InteractionsController);
//# sourceMappingURL=interactions.controller.js.map