import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const communityRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ title: z.string().min(2).max(32), description: z.string().min(3).max(320) }))
    .mutation(async ({ input: { title, description }, ctx }) => {
      const community = await ctx.prisma.community.create({
        data: { name: title.toLowerCase(), description: description, creatorId: ctx.session.user.id },
      });

      await ctx.prisma.subscription.create({
        data: { subscriberId: ctx.session.user.id, communityId: community.id },
      });
  
      return community
    }),
  follow: protectedProcedure.input(z.object({
    communityId: z.string()
  })).mutation(async ( { input: { communityId }, ctx }) => {
    const currentUserId = ctx.session?.user.id;

    const subscription = await ctx.prisma.subscription.findFirst({
      where: { communityId: communityId, subscriberId: currentUserId },
    })

    if(subscription){
      await ctx.prisma.subscription.deleteMany({
        where: { communityId: communityId, subscriberId: currentUserId }
      })
      return {subscription: false}
    }else{
      await ctx.prisma.subscription.create({
        data: { communityId : communityId, subscriberId: currentUserId }
      })
      return {subscription: true}
    }
  }),

  getInfo: publicProcedure.input(z.object({
      communityName: z.string()
    }))
    .query(async ( { input: { communityName }, ctx }) => {
      const currentUserId = ctx.session?.user.id;

      const communityInfo = await ctx.prisma.community.findFirst({
        where: { name: communityName },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: { select: { subscribers: true } },
       
          subscribers:
            currentUserId == null ? false : { where: { subscriberId: currentUserId } },
          creator: {
            select: { name: true, id: true, image: true },
          },
        },
      });

      if(communityInfo===null) return null
  
      return {
        id: communityInfo.id,
        name: communityInfo.name,
        creator: communityInfo.creator,
    
        description: communityInfo.description,
        members: communityInfo._count.subscribers,
        followedByMe: communityInfo.subscribers? communityInfo.subscribers.length > 0: false,
        createdAt: communityInfo.createdAt
      };
    }),
    getCommunities: publicProcedure
    .query(async ( { ctx }) => {
      const currentUserId = ctx.session?.user.id;

      const communityInfo = await ctx.prisma.community.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: { select: { subscribers: true } },
       
          subscribers:
            currentUserId == null ? false : { where: { subscriberId: currentUserId } },
          creator: {
            select: { name: true, id: true, image: true },
          },
        },
      });

      
  
      return communityInfo;
    }),

  
});
