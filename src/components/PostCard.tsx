import {VscComment} from "react-icons/vsc"
import Link from "next/link";
import { api } from "~/utils/api";
import type { PostType } from "~/types";
import {SortMethodEnum} from "~/types";
import { VoteEnum } from "~/types";
import { VoteCounter } from "./VoteCounter";
import { formatTimeSince } from "~/helpers/dateHelpers";
import markdownItSanitizer from 'markdown-it-sanitizer';
import MarkdownIt from 'markdown-it';
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

/* eslint-disable @typescript-eslint/no-unsafe-argument */
const md = new MarkdownIt().use(markdownItSanitizer);

export const PostCard = ({post: {id, title, community, author, description, imageLink, voteCount, yourVote, commentsAmount, createdAt}, sortType = SortMethodEnum.TIME}
    :{post: PostType, sortType?: SortMethodEnum}) => {
    const [oldVote, setOldVote] = useState(0)
    const searchParams = useSearchParams()
 
    const page = searchParams.get('page')
    const imageSrc = imageLink? imageLink: "/logo.png"
    const trpcUtils = api.useContext()
    const voteOnPost = api.post.vote.useMutation({
        onError: (error) => {
            
            const updateData: Parameters<typeof trpcUtils.post.getPosts.setData>[1] = (oldData) => {
                if(oldData == null ) return 
            
                oldData.allPostsModified.forEach((obj) => {
                    if (obj.id === id) {
                        const addedVoteValue = oldVote - obj.yourVote
                        obj.voteCount = obj.voteCount + addedVoteValue
                        obj.yourVote = oldVote
                    }
                })

                return {
                    ...oldData,
                    allPostsModified: oldData.allPostsModified
                }
            }
            const updateDataInfinityData: Parameters<typeof trpcUtils.post.getInfinityPosts.setInfiniteData>[1] = (oldData) => {

                if(oldData == null ) return 
    
                return {
                    ...oldData,
                    pages: oldData.pages.map(page => {
                    return {
                        ...page,
                        posts: page.posts.map(post=> {
                            if (post.id === id) {
                                const addedVoteValue = oldVote - post.yourVote
                                post.voteCount = post.voteCount + addedVoteValue
                                post.yourVote = oldVote
                            }
                            return post
                        })
                    }
                    }),
        
                }
            }
            console.log(error)

            trpcUtils.post.getInfinityPosts.setInfiniteData({}, updateDataInfinityData);
            trpcUtils.post.getPosts.setData({communityName: community.name, page: page ? parseInt(page) : 1, sort: sortType}, updateData);
        }})
    

    const handleVote = (vote: VoteEnum) => {
        const updateData: Parameters<typeof trpcUtils.post.getPosts.setData>[1] = (oldData) => {
            if(oldData == null ) return 
            
            oldData.allPostsModified.forEach((obj) => {
                if (obj.id === id) {
                    setOldVote(obj.yourVote)
                    const voteModifier = vote === VoteEnum.UP ? 1 : -1
                    const addedVoteValue = obj.yourVote === voteModifier? voteModifier * -1: voteModifier - obj.yourVote
                    obj.voteCount = obj.voteCount + addedVoteValue
                    obj.yourVote = obj.yourVote === voteModifier? 0: voteModifier
                }
            })

            return {
                ...oldData,
                allPostsModified: oldData.allPostsModified
            }
        }

        const updateDataInfinityData: Parameters<typeof trpcUtils.post.getInfinityPosts.setInfiniteData>[1] = (oldData) => {

            if(oldData == null ) return 

            return {
                ...oldData,
                pages: oldData.pages.map(page => {
                return {
                    ...page,
                    posts: page.posts.map(post=> {
                        if (post.id === id) {
                            setOldVote(post.yourVote)
                            const voteModifier = vote === VoteEnum.UP ? 1 : -1
                            const addedVoteValue = post.yourVote === voteModifier? voteModifier * -1: voteModifier - post.yourVote
                            post.voteCount = post.voteCount + addedVoteValue
                            post.yourVote = post.yourVote === voteModifier? 0: voteModifier
                        }

                        return post
                    })
                }
                }),
    
            }
        }

        trpcUtils.post.getPosts.setData({communityName: community.name, page: page ? parseInt(page) : 1, sort: sortType}, updateData);
        trpcUtils.post.getInfinityPosts.setInfiniteData({}, updateDataInfinityData);
        voteOnPost.mutate({postId: id, vote})
    }
    
    return <div className="flex flex-col bg-white rounded-md shadow max-w-[800px] md:min-w-[550px]">
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
                <div className="overflow-hidden break-all"  >
                    <div className="overflow-hidden text-ellipsis line-clamp-5 md:line-clamp-3 custom-html-style" dangerouslySetInnerHTML={{ __html: `${md.render(description)}` }}></div>
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