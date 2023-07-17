import {VscComment} from "react-icons/vsc"
import Link from "next/link";
import { api } from "~/utils/api";
import type { PostType } from "~/types";
import { VoteEnum } from "~/types";
import { VoteCounter } from "./VoteCounter";
import { formatTimeSince } from "~/helpers/dateHelpers";
import 'react-markdown-editor-lite/lib/index.css';
import markdownItSanitizer from 'markdown-it-sanitizer';
import MarkdownIt from 'markdown-it';
import { useSearchParams } from "next/navigation";
import Image from "next/image";

/* eslint-disable @typescript-eslint/no-unsafe-argument */
const md = new MarkdownIt().use(markdownItSanitizer);

export const PostCard = ({id, title, community, author, description, imageLink, voteCount, yourVote, commentsAmount, createdAt}:PostType) => {
    const searchParams = useSearchParams()
 
    const page = searchParams.get('page')
    const imageSrc = imageLink? imageLink: "/logo.png"

    const trpcUtils = api.useContext()
    const voteOnPost = api.post.vote.useMutation({onSuccess: ({vote}) => {
        const updateData: Parameters<typeof trpcUtils.post.getPosts.setData>[1] = (oldData) => {
            if(oldData == null ) return 
    
            const voteModifier = vote===VoteEnum.UP ? 1 : -1
            const addedVoteValue = voteModifier - yourVote

            return {
                ...oldData,
                allPostsModified: oldData.allPostsModified.map((obj) => {
                if (obj.id === id) {
                    return { 
                        ...obj,
                        voteCount: voteCount + addedVoteValue,
                        yourVote: voteModifier
                    };
                }
                return obj;
            })}
        }
        const updateDataInfinityData: Parameters<typeof trpcUtils.post.getInfinityPosts.setInfiniteData>[1] = (oldData) => {

            if(oldData == null ) return 
    
            const voteModifier = vote===VoteEnum.UP ? 1 : -1
            const addedVoteValue = voteModifier - yourVote
       
            return {
                ...oldData,
                pages: oldData.pages.map(page => {
                  return {
                    ...page,
                    posts: page.posts.map(post=> {
                      if(post.id === id){
                        return {
                          ...post,
                          voteCount: voteCount + addedVoteValue,
                          yourVote: voteModifier
                        }
                      }
      
                      return post
                    })
                  }
                }),
      
              }
        }

        trpcUtils.post.getInfinityPosts.setInfiniteData({}, updateDataInfinityData);
        trpcUtils.post.getPosts.setData({communityName: community.name, page: page? parseInt(page): 1}, updateData);
    }})

    const handleVote = (vote: VoteEnum) => {
        voteOnPost.mutate({postId: id, vote})
    }
    
    return <div className="flex flex-col bg-white rounded-md shadow max-w-[800px] ">
        <div className="flex p-5">
            <VoteCounter handleVote={handleVote} voteCount={voteCount} yourVote={yourVote}/>
            <div className="md:flex justify-center w-[80px] hidden items-center">
                <Image className="h-[70px]" width={70} height={70} src={imageSrc} alt={"img"}/>
            </div>
            <div className="flex flex-col pl-[1rem] flex-1">
                <div className="max-h-40 mt-1 text-xs text-gray-500">
                    <a className='underline text-zinc-900 text-sm underline-offset-2' href={`/community/${community.name}`}>
                        c/{community.name}
                    </a>
                    <span className="ml-1">Posted by {author.username? author.username: author.name} {formatTimeSince(createdAt)}</span>
                </div>
                <div>
                    <Link href={`/community/${community.name}/post/${id}`}>
                        <h3 className="h1 text-lg font-semibold py-2 leading-6 text-gray-900 cursor-pointer">{title}</h3>
                    </Link>
                </div>
                <div className="overflow-hidden"  >
                    <p className="overflow-hidden text-ellipsis line-clamp-5 md:line-clamp-3" dangerouslySetInnerHTML={{ __html: `${md.render(description)}` }}></p>
                </div>
            </div>

        </div>
        <div className="bg-gray-50 z-20 text-sm px-4 py-4 sm:px-6 flex items-center">
            <Link href={`/community/${community.name}/post/${id}`}>
                <VscComment/>
            </Link>
            <span className="ml-3">
            <Link className="hover:border-b hover:border-black" href={`/community/${community.name}/post/${id}`}>
                {commentsAmount} comments
            </Link>
            </span>
        </div>
    </div>
}

export default PostCard