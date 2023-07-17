import Image from 'next/image';

export const LowerBar = () => {
    return <div className=" left-0 w-full  p-2 bg-slate-300">
        <div className='flex-row sm:flex text-sm gap-10 '>
            <div className='flex-row p-6 '>
                <div className='flex'>
                    <Image src="/logo.png" alt="Description" width={20} height={16} className='mr-1' /> 
                    ReddiClon is a site that aims to imitate Reddit, incorporating most of its functionality.
                </div>
                <div>
                    Logo icon created by <a href="https://www.freepik.com/icon/reddit_2584668#position=89&page=1&term=reddit&fromView=search">Aldo Cervantes</a>
                </div>    
            </div>
            <div className='p-6'>
                <div>Contact Info</div>
                <div>Phone number: 111 222 333</div>
                <div>Email: fakeEmail@fakeEmal.com</div>
            </div>
        </div>
    </div>   
}