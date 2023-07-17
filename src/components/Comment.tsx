import MarkdownIt from 'markdown-it'
import markdownItSanitizer from 'markdown-it-sanitizer'
import { useSession } from "next-auth/react"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import 'react-markdown-editor-lite/lib/index.css'
import { formatTimeSince } from "~/helpers/dateHelpers"
import { VoteEnum } from "~/types"
import { api } from "~/utils/api"
import { CommentType, useComments } from "./CommentSection"
import ReplyComment from "./ReplyComment"
import { VoteCounter } from "./VoteCounter"

const COLORS: { [key: string]: string } = {
    "0": "bg-slate-50",
    "1": "bg-[#F5F5F5]",
    "2": "bg-slate-200"
}


const md = new MarkdownIt().use(markdownItSanitizer);
export const Comment = ({comment, stackNumber}:{comment: CommentType, stackNumber: number}) => {
    const [isReplying, setIsReplying] = useState<boolean>(false)
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
    const voteOnPost = api.comment.vote.useMutation({onSuccess: async ({vote}) => {
        const updateData: Parameters<typeof trpcUtils.comment.get.setData>[1] = (oldData) => {
            if(oldData == null ) return 
    
            const voteModifier = vote===VoteEnum.UP ? 1 : -1
            const addedVoteValue = voteModifier - comment.yourVote
            
            return oldData.map((obj) => {
                if (obj.id === comment.id) {
                    return { 
                        ...obj,
                        voteCount: comment.voteCount + addedVoteValue,
                        yourVote: voteModifier
                    };
                }
                return obj;
            });
        }
        trpcUtils.comment.get.setData({postId: comment.postId}, updateData);
    }})

    const handleVote = (vote: VoteEnum) => {
        voteOnPost.mutate({commentId: comment.id, vote})
    }

    const colorClass = COLORS[(stackNumber % 3).toString()];

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
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {comment.author.name} {comment.voteCount} {Math.abs(comment.voteCount)===1? "point": "points"} 
                                    <span className="ml-2">{formatTimeSince(comment.createdAt)}</span>
                                </p>
                            </div>
                            <div>
                                <button onClick={()=>openWriteComment()} className="text-xs ml-1 hover:underline">reply</button>
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
                    {replies.map((comment, index) => (
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