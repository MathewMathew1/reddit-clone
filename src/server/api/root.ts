import { communityRouter } from "~/server/api/routers/Communities";
import { createTRPCRouter } from "~/server/api/trpc";
import { postRouter } from "./routers/Posts";
import { commentRouter } from "./routers/Comment";
import { userRouter } from "./routers/User";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  community: communityRouter,
  post: postRouter,
  comment: commentRouter,
  user: userRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
