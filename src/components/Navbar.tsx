import { signIn, useSession } from "next-auth/react";
import Image from 'next/image';
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { VscSearch } from "react-icons/vsc";
import { api } from "~/utils/api";
import Button from "./Button";
import { ProfileImage } from "./ProfileImage";

export  const SearchBar = () => {
    const [searchedText, setSearchedText] = useState("")
    const { data: communities } = api.community.getCommunities.useQuery();
    const router = useRouter();

    const communityNames = communities?.map((community) => community.name) || [];

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            router.push(`/community/${searchedText}`)
        }
    };

    return <div className="">
    <div className="flex justify-end items-center relative">
      <input
        id="searchField"
        value={searchedText}
        onChange={(e) => setSearchedText(e.target.value)}
        placeholder="Search communities"
        list="searchOptions"
        onKeyDown={(e)=>handleKeyDown(e)}
        className="border border-gray-400 rounded-lg p-2 pl-7 w-full sm:w-96"
      />
      <span onClick={()=>router.push(`/community/${searchedText}`)} className="absolute left-2 mr-2 w-10">
        <VscSearch />
      </span>
      <datalist id="searchOptions">
        {communityNames.map((option, index) => (
          <option key={index} value={option} />
        ))}
      </datalist>
    </div>
  </div>
}

export function Navbar(){
    const session = useSession()
    const user = session.data?.user
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return <>
    <nav className="relative flex flex-wrap items-center justify-between px-2 py-3 bg-slate-50 border-b-2 border-gray-300">
      <div className="container px-4 mx-auto flex flex-wrap items-center justify-between sm:flex-row">
        <div className="w-full relative flex justify-between lg:w-auto lg:static lg:block lg:justify-start">
            <div className="flex items-start">
                <Link href="/">
                    <div className="flex">
                        <span className="mr-2 text-2xl font-bold text-gray-900">ReddiClon</span>
                        <Image src="/logo.png" alt="Description" width={30} height={2} />
                    </div>
                </Link>
            </div>
            <button onClick={()=>setIsMenuOpen(!isMenuOpen)} data-collapse-toggle="navbar-default" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-default" aria-expanded="false">
                <span className="sr-only">Open main menu</span>
                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
                </svg>
            </button>
        </div>
        <div className={`${isMenuOpen? "flex": "hidden"} w-full md:w-auto flex-col md:flex md:flex-row  flex-1 md:gap-0 gap-2`} id="navbar-default">   
            <div className="flex flex-1 md:justify-center">
                <SearchBar/>
            </div>
            <div className="lg:flex  items-center" id="example-navbar-danger">
            <ul className="flex flex-col lg:flex-row list-none lg:ml-auto">
                {user !== undefined?
                    <li className="nav-item">
                        <div className="flex items-center  gap-5">
                            <Link href="/profile">
                                <ProfileImage size="big" src={user.image}/>
                            </Link>
                            <div className="hover:underline">
                                <Link href="/profile">
                                    {user.username? user.username: user.name}
                                </Link>
                            </div>
                        </div>
                    </li>
                : 
                    <li className="nav-item">
                        <Button color="black" onClick={()=>void signIn()}>         
                            <span className="hidden text-lg md:inline">Log in</span>
                        </Button>
                    </li>
                }
            </ul>
            </div>
        </div>
      </div> 
    </nav>
  </>
    
}