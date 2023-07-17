
import { createContext, useContext, useMemo, useState } from "react";
import { api } from "~/utils/api";
import { Comment } from "./Comment";

const SORT_TYPE = {
    NEWEST: "Newest",
    UPVOTED: "Hottest"
}

export type CommentType = {
    author: {
        id: string;
        name: string | null;
        username: string | null;
        email: string | null;
        emailVerified: Date | null;
        image: string | null;
    },
    voteCount: number;
    yourVote: number;
    id: string;
    content: string,
    replyToId: string | null,
    postId: string,
    createdAt: Date
}

type CommentsContextProps = {    
    getReplies: (parentId: string) => CommentType[]
}


const CommentsContext = createContext({} as CommentsContextProps)

export function useComments(){
    return useContext(CommentsContext)
}

const CommentSection = ({postId}:{postId: string}) => {
    const [sortType, setSortType] = useState(SORT_TYPE.NEWEST)
    const { data: comments } = api.comment.get.useQuery({postId: postId});

    const commentsGrouped = useMemo(() => {
        const group: { [key: string]: CommentType[] } = {};
        const firstRowComments: CommentType[] = []
        if(comments==null || comments?.length===0) return {group, firstRowComments}
        
        comments.forEach(comment => {
            if(comment.replyToId==null) {
                firstRowComments.push(comment)
                return
            }
            group[comment.replyToId] ||= []
            group[comment.replyToId]!.push(comment)
        })
        return {group, firstRowComments}
    }, [comments])

    const sortedCommentsGrouped = useMemo(() => {
        const sortedTopLevelComments = commentsGrouped.firstRowComments
        const groupReplies = commentsGrouped.group
        if(sortType===SORT_TYPE.NEWEST){
            sortedTopLevelComments.sort((a, b) => (b.createdAt.getTime()) - (a.createdAt.getTime()))
            for (const key in groupReplies) {
                if (Object.hasOwnProperty.call(groupReplies, key)) {
                  const value = groupReplies[key];
                  value?.sort((a, b) => (b.createdAt.getTime()) - (a.createdAt.getTime()))
                }
            }
        }else{
            sortedTopLevelComments.sort((a, b) => b.voteCount - a.voteCount)
            for (const key in groupReplies) {
                if (Object.hasOwnProperty.call(groupReplies, key)) {
                  const value = groupReplies[key];
                  value?.sort((a, b) => b.voteCount - a.voteCount)
                }
            }
        }
        return {sortedTopLevelComments, groupReplies}
    }, [commentsGrouped, sortType])

    const getReplies = (parentId: string) => {
        const comments = sortedCommentsGrouped.groupReplies[parentId]
        return comments? comments: []
    }

    if(comments == null || comments.length === 0) return <div className="m-3">No comments in this post so far</div>

    return <div>
        <div className="flex flex-col mb-7 ml-4 text-sm">
            <p>{comments.length} Comments</p>
            <div>
                <label>Sort by:</label>
                <select value={sortType} onChange={(e)=>setSortType(e.target.value)} id="sortSelector">
                {Object.entries(SORT_TYPE).map(([key, value]) => (
                    <option key={`${key} option`} value={value}>{value}</option>
                ))}
                </select>
            </div>
        </div>
        <div className="mb-4 md:ml-3">
            <CommentsContext.Provider  value={{getReplies}}>
                {sortedCommentsGrouped.sortedTopLevelComments.map((comment) => (
                    <Comment stackNumber={0} key={`${comment.id} comment`} comment={comment}/>
                ))}
             </CommentsContext.Provider>
        </div>
    </div>
}

export default CommentSection