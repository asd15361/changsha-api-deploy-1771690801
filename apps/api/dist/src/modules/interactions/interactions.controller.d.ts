type CommentBody = {
    content: string;
};
type RepostBody = {
    quoteText?: string;
};
export declare class InteractionsController {
    getComments(postId: string): {
        postId: string;
        items: Array<{
            id: string;
            authorId: string;
            content: string;
            createdAt: string;
        }>;
    };
    createComment(postId: string, body: CommentBody): {
        success: boolean;
        postId: string;
        commentId: string;
        content: string;
    };
    deleteComment(commentId: string): {
        success: boolean;
        commentId: string;
    };
    likePost(postId: string): {
        success: boolean;
        postId: string;
    };
    unlikePost(postId: string): {
        success: boolean;
        postId: string;
    };
    repostPost(postId: string, body: RepostBody): {
        success: boolean;
        postId: string;
        repostId: string;
        quoteText: string | null;
    };
}
export {};
