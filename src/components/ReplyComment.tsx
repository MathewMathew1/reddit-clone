import { Dispatch, SetStateAction, useState } from "react"
import { api } from "~/utils/api"
import Alert from "./Alert"
import Button from "./Button"
import Editor from "./Editor"

const ReplyComment = ({commentId, setShowEditor, postId}: {commentId: string, setShowEditor: Dispatch<SetStateAction<boolean>>, postId: string}) => {
    const [comment, setComment] = useState("")
    const [errors, setErrors] = useState<string[]>([])
    
    const createCommentApi = api.comment.create.useMutation({
        onSuccess: () => {
            window.location.reload();
        },
        onError: (e: unknown) => {
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
        createCommentApi.mutate({text: comment, postId, replyCommentId: commentId}) 
    }

    return <div>
        <div>
            {errors.map((error, index) => (
                <Alert key={index} type="error" message={error} />
            ))}
        </div>
        <Editor height={250} text={comment} setText={setComment}/>
        <div className="flex gap-3">
            <Button onClick={()=>createComment()} color="black">Comment</Button>
            <Button onClick={()=>setShowEditor(false)} color="red">Cancel</Button>
        </div>
    </div>
}

export default ReplyComment