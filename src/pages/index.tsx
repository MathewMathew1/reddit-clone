import { useRouter } from 'next/router';
import type { Dispatch, SetStateAction } from "react";
import { useState } from 'react';
import { VscHome  } from "react-icons/vsc";
import Alert from "~/components/Alert";
import Button from "~/components/Button";
import InfinitePostList from '~/components/InfinityPostList';
import { api } from "~/utils/api";

export default function Home() {
  const posts = api.post.getInfinityPosts.useInfiniteQuery(
    {},
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  return (
    <div className="flex md:flex-row flex-col w-full">
      <div className="flex justify-end flex-1 bg-slate-200">
        <div className='flex-1 mb-4'>
          <h3 className="text-3xl text-center font-bold mb-3">Your Feed:</h3>     
            <InfinitePostList
              posts={posts.data?.pages.flatMap((page) => page.posts)}
              isError={posts.isError}
              isLoading={posts.isLoading}
              hasMore={posts.hasNextPage}
              fetchNewTweets={posts.fetchNextPage}
            />
        </div>
      </div>
      <HomeCard/> 
    </div>
  );
}

const HomeCard = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return( 
    <div className="flex flex-col justify-start max-w-xl border border-gray-300 rounded-md leading-6">
      <div className="bg-green-100 p-4 ">
        <div className="flex items-center font-bold "> <VscHome/>Home Page </div>
      </div>
      <div className="p-4">You personal page in ReddiClon. Here you can find latest posts from your personal feed.</div>
      <div className="flex p-3 items-center"><Button onClick={()=>setIsDialogOpen(true)} className="w-full" color="black">Create Community</Button></div>
      <ModalCreateCommunity isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen}/>
    </div>
  )
}


const ModalCreateCommunity = ({isDialogOpen, setIsDialogOpen}:{isDialogOpen: boolean, setIsDialogOpen: Dispatch<SetStateAction<boolean>>}) => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const router = useRouter();

  const createCommunityApi = api.community.create.useMutation({
    onSuccess: (newCommunity) => {
      void router.push(`/community/${newCommunity.name}`);
    },
    onError: () => {
      setErrors(["This name for community is already taken"])
    }
})

  const createCommunity = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>{
    e.preventDefault()
    const newErrors = []
    if(title.length < 3){
      newErrors.push("Title too short at least 3 letters required.")
    }
    if(title.length > 32){
      newErrors.push("Title too long, 32 letter is maximum number.")
    }
    if(description.length < 3){
      newErrors.push("Description too short at least 3 letters required.")
    }
    if(description.length > 320){
      newErrors.push("Description too long, 320 letter is maximum number.")
    }

    if(newErrors.length > 0){
      setErrors(newErrors)
      return
    }

    setErrors([])

    createCommunityApi.mutate({title, description})
  }

  return(
    <dialog className="border-none z-20 rounded-md p-10 shadow-md  min-w-[250px]" open={isDialogOpen}>
      <div className="flex flex-col gap-3">
        <div><h3 className="text-2xl font-bold">Create new Community!</h3></div>
        <div className="flex flex-col">
          <label htmlFor="titleField" className="mb-2 text-center">Title of Community</label>
          <input max={32} value={title} onChange={(e)=>setTitle(e.target.value)} type="text" id="titleField" placeholder="Community of grumpy people" className="border  border-gray-300 rounded-md py-2 px-4" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="descriptionField" className="mb-2 text-center">Description of community</label>
          <textarea maxLength={320} rows={5} value={description} onChange={(e)=>setDescription(e.target.value)}  
          id="descriptionField" placeholder="Describe your community" className="flex-grow resize-none p-4   border-gray-300 border rounded-md"  />
        </div>
        <div>
          {errors.map((error, index) => (
            <Alert key={index} type="error" message={error} />
          ))}
        </div>
        <div className="flex gap-3 mt-2 justify-end">
          <Button className="px-10" onClick={()=>setIsDialogOpen(false)} color="red">Cancel</Button>
          <Button onClick={(e)=>createCommunity(e)} className="px-10" color="black">Create</Button>
        </div>
      </div>
    </dialog>
  )
}



