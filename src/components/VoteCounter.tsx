import { useSession } from "next-auth/react"
import { BiSolidDownvote, BiSolidUpvote } from "react-icons/bi"
import { VoteEnum } from "~/types"

const COLOR_OF_VOTE: any = {
    "-1": "text-blue-500",
    "0": "text-zinc-900",
    "1": "text-orange-400"
}

export const VoteCounter = ({handleVote, yourVote, voteCount, showVoteNumber = true, center = true}:
    {yourVote: number, voteCount: number, showVoteNumber?: boolean, handleVote: (vote: VoteEnum) => void, center?: boolean }) => {
    const voteCountColor: string = COLOR_OF_VOTE[yourVote.toString()]
    const session = useSession()
    const user = session.data?.user

    const handleVoting = (vote: VoteEnum) => {
        if(!user){
            window.alert("You need to be logged in to vote")
            return
        }
        handleVote(vote)
    }

    return <div className={`flex flex-col gap-2 px-4 ${center? "justify-center": ""} `}>
        <div onClick={()=>handleVoting(VoteEnum.UP)} className="cursor-pointer"><BiSolidUpvote fill={`${yourVote===1? "orange": ""}`}/></div>
        {showVoteNumber? <div className={`text-center py-2 font-medium text-sm ${voteCountColor}`}>{voteCount}</div> : null}
        <div onClick={()=>handleVoting(VoteEnum.DOWN)} className="cursor-pointer"><BiSolidDownvote fill={`${yourVote===-1? "blue": ""}`}/></div>
    </div>
}