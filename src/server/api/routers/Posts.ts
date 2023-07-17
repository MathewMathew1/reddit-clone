import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { SortMethodEnum, VoteEnum } from "~/types";

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ title: z.string().min(2).max(64), description: z.string().min(3).max(600), imageLink: z.string().optional(), communityId: z.string() }))
    .mutation(async ({ input: { title, description, imageLink, communityId }, ctx }) => {
        const post = await ctx.prisma.post.create({
            data: { title: title.toLowerCase(), description: description, authorId: ctx.session.user.id, imageLink: imageLink, communityId },
        });

        await ctx.prisma.vote.create({
            data: { userId: ctx.session.user.id, postId: post.id, type: "UP"},
        }); // add upvote from creator
  
        return post
    }),
    getInfinityPosts: publicProcedure.input(z.object({
      limit: z.number().optional(),
      page: z.number().optional(),
      cursor: z.object({id: z.string(), createdAt: z.date()}).optional()
    })).query(async ( { input: { page = 1 , limit = 10, cursor}, ctx }) => {
      const currentUserId = ctx.session?.user.id;
      
      let whereClause = {}
      if(currentUserId){
        const followedCommunities = await ctx.prisma.subscription.findMany({
            where: {
                subscriberId: currentUserId,
            },
            include: {
              community: true,
            },
        })
      
        const followedCommunitiesIds = followedCommunities.map((sub) => sub.community.id)
          whereClause = {
          community: {
            id: {
              in: followedCommunitiesIds,
            },
          }
        }
      }

      const  allPosts = await ctx.prisma.post.findMany({
        where:  whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        cursor: cursor ? { createdAt_id: cursor } : undefined,
        skip: (page - 1) * limit,
        take: limit + 1,       
        select: {
          community: true,
          votes: true,
          author: true,
          comments: true,
          description: true,
          imageLink: true,
          title: true,
          id: true,
          createdAt: true,
          _count: {
            select: { votes: true }
          }
        },
      });
      
      let nextCursor: typeof cursor | undefined;
      if (allPosts.length > limit) {
        const nextItem = allPosts.pop();
        if (nextItem != null) {
          nextCursor = { id: nextItem.id, createdAt: nextItem.createdAt };
        }
      }

      let allPostsModified = allPosts.map((post)=>{ 
        let yourVote = 0
        let voteCount = 0
        post.votes.map((vote)=>{
            const valueOfVote = vote.type === "DOWN"? -1: 1
            voteCount = voteCount + valueOfVote

            if(vote.userId===currentUserId){
                yourVote = valueOfVote
            }
        })

        return {
            voteCount,
            yourVote,
            id: post.id,
            title: post.title,
            imageLink: post.imageLink,
            description: post.description,
            commentsAmount: post.comments.length,
            community: post.community,
            numberOfVotes: post.votes.length,
            createdAt: post.createdAt,
            author: post.author
        }
      })

      return {posts: allPostsModified, nextCursor}
    }),
    getPosts: publicProcedure.input(z.object({
        limit: z.number().optional(),
        page: z.number().optional(),
        communityName: z.string().optional(),
        sort: z.nativeEnum(SortMethodEnum).optional(),
      }))
      .query(async ( { input: { communityName, page = 1 , limit = 10, sort = SortMethodEnum.TIME}, ctx }) => {
        const currentUserId = ctx.session?.user.id;
        
        let whereClause = {}

        if (communityName) {
            whereClause = {
                community: {
                  name: communityName,
                },
              }
        } else if (currentUserId) {
            const followedCommunities = await ctx.prisma.subscription.findMany({
                where: {
                    subscriberId: currentUserId,
                },
                include: {
                  community: true,
                },
            })
          
            const followedCommunitiesIds = followedCommunities.map((sub) => sub.community.id)
                whereClause = {
                community: {
                  id: {
                    in: followedCommunitiesIds,
                  },
                },
            }
        }
        let allPosts

        const totalCount = await ctx.prisma.post.count({
          where: whereClause,
        });

        if(sort === SortMethodEnum.TIME){
          allPosts = await ctx.prisma.post.findMany({
            where:  whereClause,
            orderBy: {
              createdAt: 'desc',
            },
            skip: (page - 1) * limit,
            take: limit,       
            select: {
              community: true,
              votes: true,
              author: true,
              comments: true,
              description: true,
              imageLink: true,
              title: true,
              id: true,
              createdAt: true,
              _count: {
                select: { votes: true }
              }
            },
          });
        }else{
          allPosts = await ctx.prisma.post.findMany({
            where:  whereClause,     
            select: {
              community: true,
              votes: true,
              author: true,
              comments: true,
              description: true,
              imageLink: true,
              title: true,
              id: true,
              createdAt: true,
              _count: {
                select: { votes: true }
              }
            },
          });
        }
        let allPostsModified = allPosts.map((post)=>{ 
          let yourVote = 0
          let voteCount = 0
          post.votes.map((vote)=>{
              const valueOfVote = vote.type === "DOWN"? -1: 1
              voteCount = voteCount + valueOfVote

              if(vote.userId===currentUserId){
                  yourVote = valueOfVote
              }
          })

          return {
              voteCount,
              yourVote,
              id: post.id,
              title: post.title,
              imageLink: post.imageLink,
              description: post.description,
              commentsAmount: post.comments.length,
              community: post.community,
              numberOfVotes: post.votes.length,
              createdAt: post.createdAt,
              author: post.author
          }
        })
        if(sort === SortMethodEnum.VOTES){
          allPostsModified = allPostsModified
            .sort((a, b) => b.voteCount - a.voteCount)
            .slice((page - 1) * limit, page * limit);
        }
        return {allPostsModified, totalCount}
      }),
      getPost: publicProcedure.input(z.object({
        postId: z.string()
      }))
      .query(async ( { input: { postId}, ctx }) => {
        const currentUserId = ctx.session?.user.id;
        
        const post = await ctx.prisma.post.findFirst({
          where: {id: postId},
          select: {
            community: true,
            votes: true,
            author: true,
            comments: true,
            description: true,
            imageLink: true,
            title: true,
            id: true,
            createdAt: true,
          },
        })

        if(post == null) return null

        let yourVote = 0
        let voteCount = 0
        post.votes.map((vote)=>{
            const valueOfVote = vote.type === "DOWN"? -1: 1
            voteCount = voteCount + valueOfVote

            if(vote.userId===currentUserId){
                yourVote = valueOfVote
            }
        })

        return  {
            voteCount,
            yourVote,
            id: post.id,
            title: post.title,
            imageLink: post.imageLink,
            description: post.description,
            commentsAmount: post.comments.length,
            community: post.community,
            numberOfVotes: post.votes.length,
            createdAt: post.createdAt,
            author: post.author
        }
        
      }),
      vote: protectedProcedure.input(z.object({
        vote: z.nativeEnum(VoteEnum),
        postId: z.string()
      })).mutation(async ( { input: { vote, postId }, ctx }) => {
        const currentUserId = ctx.session?.user.id;
    
        const voteExisting = await ctx.prisma.vote.findFirst({
          where: { postId: postId, userId: currentUserId },
        })
    
        if(voteExisting){
          if(voteExisting.type===vote) return {vote}
          await ctx.prisma.vote.updateMany({
            where: { postId: postId, userId: currentUserId },
            data: { type: vote}
          })
        }else{
          await ctx.prisma.vote.create({
            data: { postId: postId, userId: currentUserId, type: vote }
          })       
        }
        return {vote}
      }),
});


