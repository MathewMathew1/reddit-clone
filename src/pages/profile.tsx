import { useSession, signOut, signIn } from "next-auth/react"
import { Head } from "next/document"
import { useState } from "react"
import Button from "~/components/Button"
import { LoadingSpinner } from "~/components/LoadingSpinner"
import { api } from "~/utils/api"

export default function Profile()  {
    const session = useSession()
    const user = session.data?.user
    const [username, setUsername] = useState("")
    const userId = user? user.id: ""
    const { data: userInfo, isLoading } = api.user.getUserInfo.useQuery({ id: userId });
    const [errors, setErrors] = useState<string[]>([])

    const changeNameApi = api.user.changeName.useMutation({
        onSuccess: () => {
          location.reload()
        },
        
    })
    
    if(isLoading) return <LoadingSpinner/>
    if(!userInfo) return <div>Couldnt find user in database</div>
    if(!user) return <div>
        <Button onClick={()=> void signIn()}>Login to View profile</Button>
    </div>

    const changeName = () => {
        const newErrors = []
        if(username.length < 2){
        newErrors.push("Username too short at least 2 letters required.")
        }
        if(username.length > 32){
            newErrors.push("Username too long, 32 is limit.")
        }

        if(newErrors.length > 0){
            setErrors(newErrors)
            return
        }

        setErrors([])
        changeNameApi.mutate({name: username})
    }

    const formattedDate = userInfo.createdAt.toLocaleDateString('en-GB')
    
    return <>
        <Head>
            <title>Profile</title>
        </Head>
        <div className="flex flex-col items-center flex-1 mt-4">
            <div className="p-4 bg-gray-100 shadow sm:w-[550px] w-full">
                <div><h3 className="text-2xl text-center font-bold mb-3">Current Info:</h3></div>
                <div>Username: {user.username? user.username: user.name}</div>
                <div>Account Created: {formattedDate}</div>
                <div>Amount of Posts: {userInfo.postsAmount}</div>
                <div>Amount of Comments: {userInfo.commentsAmount}</div>
                <div>Follower in {userInfo.subscriptionCount} communities</div>
            </div>
            <div className="flex flex-col gap-5  mt-4 bg-gray-100 shadow sm:w-[550px] p-5 w-full">
                <div><h3 className="text-2xl text-center font-bold mb-3">Update Info About Your Account:</h3></div>
                <div className="flex flex-col md:flex-row items-center gap-2">
                    <label className="font-medium">Update Your username:</label>
                    <input className="px-4 py-2 border rounded-md w-full max-w-[300px]" placeholder="new username(2-32letters)" value={username} onChange={(e)=>setUsername(e.target.value)}></input>
                </div>
                <div className="flex justify-end">
                    <Button className="w-[200px]" onClick={()=>changeName()} color="green">Change username</Button>
                </div>
            </div>
            <div className="mt-5">
                <Button color="black" onClick={()=>void signOut({ callbackUrl: '' })}>Logout</Button>
            </div>
        </div>
    </>
}