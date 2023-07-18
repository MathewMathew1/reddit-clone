import type {  NextPage } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from 'next/router';
import { useState } from "react";
import Editor from "../../components/Editor";
import Button from "~/components/Button";
import { api } from "~/utils/api";
import Alert from "~/components/Alert";
import { PostCard } from "~/components/PostCard";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import Post from "~/components/Post";
import useDelayedAction from "~/hooks/useDelayedActions";
import { useSearchParams } from 'next/navigation'
import { SortMethodEnum } from "~/types";
import Head from 'next/head';
import Image from "next/image";

const Community: NextPage = () => {
    const [joinButtonDisabled, setJoinButtonDisabled] = useState(false)
    const session = useSession();
    const router = useRouter();
    const { slug } = router.query;

    let communityName = "" 
    let postId: string|undefined = ""
    let additionalPageString: string|undefined = ""
  
    if(typeof slug === 'string'){
        communityName = slug
    }else if(Array.isArray(slug) && slug.length>0){
        communityName = slug[0] || ""
        additionalPageString = slug[1]
        postId = slug[2]
    }

    const user = session?.data?.user;
    const { data: community, isLoading } = api.community.getInfo.useQuery({ communityName });
    
    const trpcUtils = api.useContext();
    const toggleFollow = api.community.follow.useMutation({
        onSuccess: ({ subscription }) => {
            trpcUtils.community.getInfo.setData({ communityName }, (oldData) => {
            if (oldData == null) return;
    
            const countModifier = subscription ? 1 : -1;
            return {
              ...oldData,
              followedByMe: subscription,
              members: oldData.members + countModifier,
            };
          });
        },
        onSettled: () => {
            setJoinButtonDisabled(false)
        },
      });

    if (isLoading) {
        return <div className="flex items-center justify-center flex-1"> <LoadingSpinner/> </div>
    }

    if (community == null) {
        return <div className="text-center text-3xl">Community not found</div>;
    }

    function capitalizeFirstLetter(str: string): string {
        if (str.length === 0) {
          return str; // Return an empty string if the input is empty
        }
        
        const firstLetter = str.charAt(0).toUpperCase();
        const remainingLetters = str.slice(1);
        
        return firstLetter + remainingLetters;
    }

    const joinCommunity = () => {
        setJoinButtonDisabled(true)
        toggleFollow.mutate({ communityId: community.id })
    }

    return<><Head>
            <title>{communityName}</title>
        </Head>
            <div className="flex flex-1 flex-col md:flex-row">
                <div className="justify-center flex">
                    {additionalPageString==="post"?
                        <Post postId={postId}/>
                    :
                        <>
                            {additionalPageString==="create"?
                                <CreatePost communityId={community.id} communityName={communityName}/>
                            :
                                <Posts communityName={communityName} />
                            }
                        </>
                    }
                </div>
                <div className="border-l-2 border-gray-500 h-full p-4 w-full md:w-[300px] bg-slate-200">
                    <div>
                        <Link href={`/community/${communityName}`}>
                            <h3 className="bold text-3xl text-center max-w-xs mb-4">{capitalizeFirstLetter(community.name)}</h3>
                        </Link>
                    </div> 
                    <div className="flex flex-col mb-5 gap-1"><div className="bold text-2xl">About Community:</div> <div className="italic ">{community.description}</div></div> 
                    <div>Current Members: {community.members}</div>

                    {user?
                        <div className="mb-3">
                            <Button disabled={joinButtonDisabled} className="w-full" onClick={() => joinCommunity()} 
                                color={`${community.followedByMe? "default": "green"}`}>
                                {community.followedByMe? "Unfollow": "Follow"}
                            </Button>
                        </div>
                    :
                        null
                    }    
                    {user?
                        <Link className="w-full" href={`/community/${communityName}/create`}>
                            <Button className="w-full" color="black">
                                Post
                            </Button>
                        </Link>
                    :
                        null    
                    }   
                </div>
            </div>
    </> 
}


const Posts = ({communityName}:{communityName: string}) => {
    const searchParams = useSearchParams()
    const { push, query } = useRouter()
    const page = searchParams.get('page')
    const [sortType, setSortType] = useState<SortMethodEnum>(SortMethodEnum.TIME)
    
    const pageNumber = page? parseInt(page): 1

    const { data, isLoading } = api.post.getPosts.useQuery({ communityName, page: pageNumber, sort: sortType});
    const posts = data?.allPostsModified
    
    if(isLoading) return <LoadingSpinner/>
    if(data==null || posts?.length===0 || posts==null) return <div>No Posts have been found</div>

    const setPage = (newPage: string) => {
        void push({ query: { ...query, page: newPage } }, undefined, { shallow: true })
    }

    return <div  className="flex gap-4 flex-col my-6">
            <div>
                <label className="mb-2 font-medium" htmlFor="sortSelector">Sort by:</label>
                <select className="px-3 py-1 ml-2 border rounded-md" value={sortType} 
                onChange={(e)=>setSortType(e.target.value as SortMethodEnum)} id="sortSelector">
                {Object.keys(SortMethodEnum).map((key, value) => (
                    <option key={value} value={SortMethodEnum[key as keyof typeof SortMethodEnum]}>{SortMethodEnum[key as keyof typeof SortMethodEnum]}</option>
                ))}
                </select>
            </div>
        {posts.map((post, index) => (        
            <PostCard key={index} sortType={sortType}  post={post} />      
        ))}
        <div>
            {pageNumber>1?<Button onClick={()=>setPage((pageNumber-1).toString())} color="black">Previous</Button>:null}
            {Math.ceil(data.totalCount / 10) > pageNumber?<Button onClick={()=>setPage((pageNumber+1).toString())} color="black">Next</Button>:null}
        </div>
    </div>
}

const CreatePost = ({communityId, communityName}:{communityId: string, communityName: string}) => {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [imageLink, setImageLink] = useState("")
    const [isAnImage, setIsAnImage] = useState(false);
    useDelayedAction<string>(imageLink, 1000, () => {
        void handleImageInputChange();
    });
    const [errors, setErrors] = useState<string[]>([])
    const session = useSession()
    const user = session.data?.user
    const router = useRouter();
    
    async function handleImageInputChange() {
        setIsAnImage(await checkIfIsImageLink(imageLink))
    }

    const checkIfIsImageLink = async (url: string) => {
        try {
            const response = await fetch(url);
            const contentType = response.headers.get('Content-Type');
            if(contentType==null) return false
            return contentType.startsWith('image/');
        } catch (error) {
            console.error('Error checking image link:', error);
            return false;
        }
      };

    const createPostApi = api.post.create.useMutation({
        onSuccess: (newPost) => {
          void router.push(`/community/${communityName}/post/${newPost.id}`);
        },
        onError: () => { 
            setErrors(["Unexpected error"])
        }
    })

    const createPost = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault()
        const newErrors = []
        if(title.length < 2){
            newErrors.push("Title too short at least two letters required.")
        }
        if(title.length > 64){
            newErrors.push("Title too long, 64 letter is maximum number.")
        }
        if(description.length < 3){
            newErrors.push("Description too short at least 3 letters required.")
        }
        if(description.length > 600){
            newErrors.push("Description too long, 600 letter is maximum number.")
        }

        if(newErrors.length > 0){
        setErrors(newErrors)
        return
        }

        setErrors([])
        const body = {
            title,
            description,
            imageLink: imageLink.length>0? imageLink: undefined,
            communityId: communityId
        }
        createPostApi.mutate(body)
    }

    if(!user) return <h2 className="bold text-xl">You need to be logged to create post.</h2>

    return <div className="flex flex-1 flex-col items-center"> 
        <div className="mb-4 flex flex-col md:flex-row gap-4">
            <div>
                <label htmlFor="title" className="block text-gray-700 font-bold mb-2 text-center">
                Title
                </label>
                <input
                    value={title}
                    onChange={(e)=>setTitle(e.target.value)}
                    id="title"
                    type="text"
                    placeholder="Enter your title"
                    className="appearance-none border  border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-indigo-500"
                />
            </div>
            <div>
                <label htmlFor="image" className="block text-gray-700 font-bold mb-2 text-center">
                Image Link*
                </label>
                <input
                    value={imageLink}
                    onChange={(e)=>setImageLink(e.target.value)}
                    id="image"
                    type="text"
                    placeholder="Enter your image link"
                    className="appearance-none border md:min-w-[300px] w-full  border-gray-300 rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-indigo-500"
                />
            </div>
        </div>

        {isAnImage?
            <div className="mb-3">
                <Image width={200} height={200} src={imageLink} alt="Image Preview" /> 
            </div>
        :
            null
        }
        <Editor text={description} setText={setDescription}></Editor>
        <div className="mb-6">
          {errors.map((error, index) => (
            <Alert key={index} type="error" message={error} />
          ))}
        </div>
        <div className="mb-6">
            <Button onClick={(e)=>createPost(e)} className="w-[200px]" color="black">Create</Button>
        </div>
    </div>
}

export default Community