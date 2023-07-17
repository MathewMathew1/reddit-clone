import InfiniteScroll from "react-infinite-scroll-component";
import type { PostType } from "~/types";
import { LoadingSpinner } from "./LoadingSpinner";
import PostCard from "./PostCard";


  
type InfinitePostListProps = {
    isLoading: boolean;
    isError: boolean;
    hasMore: boolean | undefined;
    fetchNewTweets: () => Promise<unknown>;
    posts?: PostType[];
};


export default function InfinitePostList({ posts,
    isError,
    isLoading,
    fetchNewTweets,
    hasMore = false,}: InfinitePostListProps){
   
    if(isLoading) return <LoadingSpinner/>

    if(isError) return <h1>Error...</h1>
    if(posts == null || posts.length === 0) {
        return <h2 className="my-4 text-center text-2xl text-gray-500">There are no posts in your current feed</h2>
    }

    return <ul className="flex gap-2">
        <InfiniteScroll loader={<LoadingSpinner/>} 
        next={fetchNewTweets} 
        hasMore={hasMore} 
        dataLength={posts.length}>
            {posts.map((post, index)=> {
                return <div className="mb-4" key={`post ${index}`}>
                    <PostCard  {...post}/>
                </div>
            })}
        </InfiniteScroll>
    </ul>
}