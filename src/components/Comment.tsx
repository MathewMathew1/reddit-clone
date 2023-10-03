import MarkdownIt from 'markdown-it'
import markdownItSanitizer from 'markdown-it-sanitizer'
import { useSession } from "next-auth/react"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import 'react-markdown-editor-lite/lib/index.css'
import { formatTimeSince } from "~/helpers/dateHelpers"
import { VoteEnum } from "~/types"
import { api } from "~/utils/api"
import type { CommentType } from "./CommentSection";
import { useComments } from "./CommentSection";
import ReplyComment from "./ReplyComment"
import { VoteCounter } from "./VoteCounter"
import { ProfileImage } from './ProfileImage'

const COLORS: { [key: string]: string } = {
    "0": "bg-slate-50",
    "1": "bg-[#F5F5F5]",
    "2": "bg-slate-200"
}

/* eslint-disable @typescript-eslint/no-unsafe-argument */
const md = new MarkdownIt().use(markdownItSanitizer);

export const Comment = ({comment, stackNumber}:{comment: CommentType, stackNumber: number}) => {
    const [isReplying, setIsReplying] = useState<boolean>(false)
    const [oldVote, setOldVote] = useState(0)
    const session = useSession()
    const user = session.data?.user
    const router = useRouter()
    const [showComment, setShowComment] = useState(stackNumber<4)
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
        setIsSmallScreen(window.innerWidth < 500);
        };

        handleResize(); // Check screen size on initial render

        window.addEventListener('resize', handleResize); // Update screen size on resize

        return () => {
        window.removeEventListener('resize', handleResize); // Clean up event listener
        };
    }, []);

    const commentSection = useComments()
    const replies = commentSection.getReplies(comment.id)

    const trpcUtils = api.useContext()
    const voteOnPost = api.comment.vote.useMutation({
        onError: (error) => {
          
            const updateData: Parameters<typeof trpcUtils.comment.get.setData>[1] = (oldData) => {
                if(oldData == null ) return 
    
                return oldData.map((obj) => {
                     
                    if (obj.id === comment.id) {
                        const addedVoteValue = oldVote - obj.yourVote 
                        return { 
                            ...obj,
                            voteCount: obj.voteCount + addedVoteValue,
                            yourVote: oldVote
                        };
                    }
                    return obj;
                });
            }
            console.log(error)
            trpcUtils.comment.get.setData({postId: comment.postId}, updateData);
        }})

    const handleVote = (vote: VoteEnum) => {
        const updateData: Parameters<typeof trpcUtils.comment.get.setData>[1] = (oldData) => {
            if(oldData == null ) return 
    
            return oldData.map((obj) => {

                
                if (obj.id === comment.id) {
                    setOldVote(obj.yourVote)
                    const voteModifier = vote === VoteEnum.UP ? 1 : -1
                    const addedVoteValue = obj.yourVote === voteModifier? voteModifier * -1: voteModifier - obj.yourVote
                    return { 
                        ...obj,
                        voteCount: obj.voteCount + addedVoteValue,
                        yourVote: obj.yourVote === voteModifier? 0: voteModifier
                    };
                }
                return obj;
            });
        }
        trpcUtils.comment.get.setData({postId: comment.postId}, updateData);

        voteOnPost.mutate({commentId: comment.id, vote})
    }

    const colorClass = COLORS[(stackNumber % 3).toString()] || "";

    const openWriteComment = () => {
        if(!user){
            return router.push('/sign-in')
        }
        setIsReplying(true)
    }

    return<div className="flex mb-3 shadow flex-1">
        {!isSmallScreen?
            <div onClick={()=>setShowComment(!showComment)} className="bg-slate-300 text-sm  text-center on hover:bg-red-500 hover:text-white">{showComment? "[-]": "[+]"}</div>
        :
            null
        }
        {showComment?
            <div className={`flex ${colorClass} flex-col ${!isSmallScreen? "p-2": ""} pl-0 flex-1 `}> 
               
                <div className={`flex  `}>
                    {isSmallScreen?
                        <div onClick={()=>setShowComment(!showComment)} className="bg-slate-300 text-sm  text-center on hover:bg-red-500 hover:text-white">{showComment? "[-]": "[+]"}</div>
                    :
                        null
                    }
                    <VoteCounter center={false} showVoteNumber={false} handleVote={handleVote} voteCount={comment.voteCount} yourVote={comment.yourVote}/>
                    <div className="flex flex-col flex-1 ">
                        <div className='ml-2 flex items-center flex-wrap'>
                            <div className='flex flex-col md:flex-row md:gap-2'>
                                <div className="text-sm font-medium text-gray-900 flex gap-1">
                                    <ProfileImage className='w-[20px] h-auto' src={comment.author.image}/>
                                    {comment.author.username? comment.author.username: comment.author.name} 
                                </div>
                                <p className="text-sm font-medium text-gray-900 ">
                                    {comment.voteCount} {Math.abs(comment.voteCount)===1? "point": "points"} 
                                    <span className="ml-2">{formatTimeSince(comment.createdAt)}</span>
                                    
                                        <button onClick={()=>void openWriteComment()} className="text-xs ml-1 hover:underline">reply</button>
                                    
                                </p>
                            </div>
                            
                        </div>
                        <div className="custom-html-style mb-2" dangerouslySetInnerHTML={{ __html: `${md.render(comment.content)}` }}></div>
                    </div>
                </div>
                {isReplying?
                    <div className="md:ml-8 ml-4">
                        <ReplyComment setShowEditor={setIsReplying} commentId={comment.id} postId={comment.postId}/>
                    </div>
                :
                    null
                }
                <div className="md:ml-3">
                    {replies.map((comment) => (
                        <Comment stackNumber={stackNumber+1} key={`${comment.id}comment`} comment={comment}/>
                    ))}
                </div>
            </div>
            :
            <div className="flex">
                {isSmallScreen?
                    <div onClick={()=>setShowComment(!showComment)} className="bg-slate-300 text-sm  text-center on hover:bg-red-500 hover:text-white">{showComment? "[-]": "[+]"}</div>
                :
                    null
                }
                <span className="text-sm pl-4">hidden comment</span>
            </div>
        }
    </div>
}