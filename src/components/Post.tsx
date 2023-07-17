import MarkdownIt from 'markdown-it';
import markdownItSanitizer from 'markdown-it-sanitizer';
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import 'react-markdown-editor-lite/lib/index.css';
import { formatTimeSince } from "~/helpers/dateHelpers";
import { VoteEnum } from "~/types";
import { api } from "~/utils/api";
import Alert from "./Alert";
import Button from "./Button";
import CommentSection from "./CommentSection";
import Editor from "./Editor";
import { LoadingSpinner } from "./LoadingSpinner";
import { VoteCounter } from "./VoteCounter";
import Image from 'next/image';

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const md = new MarkdownIt().use(markdownItSanitizer);

const Post = ({postId}:{postId: string|undefined}) => {
    const [comment, setComment] = useState("")
    const [errors, setErrors] = useState<string[]>([])
    const postIdModified = postId? postId: ""
    const session = useSession()
    const user = session.data?.user
    const { data: post, isLoading } = api.post.getPost.useQuery({postId: postIdModified});

    const trpcUtils = api.useContext()
    const voteOnPost = api.post.vote.useMutation({onSuccess: ({vote}) => {
        const updateData: Parameters<typeof trpcUtils.post.getPost.setData>[1] = (oldData) => {
            if(oldData == null ) return 
    
            const voteModifier = vote===VoteEnum.UP ? 1 : -1
            const addedVoteValue = voteModifier - oldData.yourVote
            
            
            return { 
                ...oldData,
                voteCount: oldData.voteCount + addedVoteValue,
                yourVote: voteModifier
            };
             
        }
        trpcUtils.post.getPost.setData({postId: postIdModified}, updateData);
    }})

    const createCommentApi = api.comment.create.useMutation({
        onSuccess: () => {
            window.location.reload();
        },
        onError: () => {
            setErrors(["Unexpected error try again"])
        }
    })

    const createComment = () => {
        const newErrors = []
        if(comment.length < 2){
            newErrors.push("Text too short at least one letter required")
        }
        if(newErrors.length > 0){
            setErrors(newErrors)
            return
        }
      
        setErrors([])
        createCommentApi.mutate({text: comment, postId: postIdModified}) 
    }

    function handleVote(vote: VoteEnum){
        voteOnPost.mutate({postId: postIdModified, vote})
    }

    if(isLoading) return <LoadingSpinner/>
    if(post==null) return <div>Post not found</div>

    const imageSrc = post.imageLink? post.imageLink: "/logo.png"
    
    return <div className="flex-1 bg-white pt-3">
        <div className="flex  w-full flex-1 bg-slate-100 shadow py-3 px-2 flex-col">
            <div className="flex">
                <VoteCounter handleVote={handleVote} voteCount={post?.voteCount} yourVote={post.yourVote}/>
                <div className="md:flex justify-center w-[80px] hidden items-center">
                    <a href={imageSrc} target="_blank" rel="noopener noreferrer">
                        <Image className="h-[70px]" width={70} height={70} src={imageSrc} alt={"img"}/>
                    </a>
                </div>
                <div className="flex flex-col">
                    <div>{post?.title}</div>
                    <div className="max-h-40 mt-1 text-xs text-gray-500">
                        <span className="ml-1">Posted by {post.author.username? post.author.username: post.author.name} {formatTimeSince(post.createdAt)} {post.commentsAmount} comments</span>
                    </div>
                    <div>
                    <p className="custom-html-style" dangerouslySetInnerHTML={{ __html: `${md.render(post.description)}` }}></p> 
                    </div>
                </div>
            </div>
            { user?
                <div className="flex  flex-col pl-10 mb-3">
                    <div>Write a comment</div>
                    <div>
                        {errors.map((error, index) => (
                            <Alert key={index} type="error" message={error} />
                        ))}
                    </div>
                    <Editor height={300} text={comment} setText={setComment}/>
                    <Button className="w-[200px]" color="black" onClick={()=>createComment()}>Comment</Button>
                </div>
            :
                <div className="mt-5 ml-5">
                    <Button onClick={()=>void signIn()} color="black">Login to Write Comment</Button>
                </div>
            }
        </div>
        <div>
            <CommentSection postId={postIdModified}/>
        </div>
    </div>
}

export default  Post