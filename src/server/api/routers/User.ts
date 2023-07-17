import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  changeName: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(32)}))
    .mutation(async ({ input: { name }, ctx }) => {
      const update = await ctx.prisma.user.update({
        where: {id: ctx.session.user.id},
        data: { username: name },
      });
  
      return {update}
    }), 
    getUserInfo: publicProcedure
    .input(z.object({ id: z.string()}))
    .query(async ({ input: { id }, ctx }) => {
      const userInfo = await ctx.prisma.user.findFirst({
        where: {id: id},
        select: {
          id: true,
          name: true,
          username: true,
          createdAt: true,
          comment: true,
          createdCommunities: true,
          post: true,
          _count: { select: { subscription: true } },
        }
      });
      if(userInfo==null) return userInfo
  
      return {
        id: userInfo.id,
        name: userInfo.name,
        username: userInfo.username,
        createdAt: userInfo.createdAt,
        subscriptionCount: userInfo._count.subscription,
        createdCommunities: userInfo.createdCommunities,
        postsAmount: userInfo.post.length,
        commentsAmount: userInfo.comment.length,
      };
    }), 
});