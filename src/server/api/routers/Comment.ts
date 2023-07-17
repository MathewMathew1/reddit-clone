import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { VoteEnum } from "~/types";

export const commentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ text: z.string().min(1).max(640), postId: z.string(), replyCommentId: z.string().optional() }))
    .mutation(async ({ input: { text, postId, replyCommentId }, ctx }) => {
      const comment = await ctx.prisma.comment.create({
        data: { content: text, postId, authorId: ctx.session.user.id, replyToId: replyCommentId },
      });

      await ctx.prisma.commentVote.create({
        data: { userId: ctx.session.user.id, commentId: comment.id, type: "UP" },
      });
  
      return {comment}
    }),
    get: publicProcedure
    .input(z.object({ postId: z.string().optional() }))
    .query(async ({ input: { postId }, ctx }) => {
      const currentUserId = ctx.session?.user.id;

      const comments = await ctx.prisma.comment.findMany({
        where: {postId},
        include: {
          author: true,
          votes: true,
        
        },
      });

      return comments.map((comment)=>{
        let yourVote = 0
        let voteCount = 0
        comment.votes.map((vote)=>{
            const valueOfVote = vote.type === "DOWN"? -1: 1
            voteCount = voteCount + valueOfVote

            if(vote.userId===currentUserId){
                yourVote = valueOfVote
            }
        })

        return {
            voteCount,
            yourVote,
            id: comment.id,
            content: comment.content,
            author: comment.author,
            numberOfVotes: comment.votes.length,
            createdAt: comment.createdAt,
            replyToId: comment.replyToId,
            postId: comment.postId
        }
    })
    }),
    vote: protectedProcedure.input(z.object({
      vote: z.nativeEnum(VoteEnum),
      commentId: z.string()
    })).mutation(async ( { input: { vote, commentId }, ctx }) => {
      const currentUserId = ctx.session?.user.id;
  
      const voteExisting = await ctx.prisma.commentVote.findFirst({
        where: { commentId: commentId, userId: currentUserId },
      })
  
      if(voteExisting){
        if(voteExisting.type===vote) return {vote}
        await ctx.prisma.commentVote.updateMany({
          where: { commentId: commentId, userId: currentUserId },
          data: { type: vote}
        })
      }else{
        await ctx.prisma.commentVote.create({
          data: { commentId: commentId, userId: currentUserId, type: vote }
        })       
      }
      return {vote}
    }),
  

  

  
});
