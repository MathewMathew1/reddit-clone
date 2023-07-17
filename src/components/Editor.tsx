import MarkdownIt from 'markdown-it';
import dynamic from 'next/dynamic';
import { Dispatch, SetStateAction } from 'react';
import 'react-markdown-editor-lite/lib/index.css';

const MdEditor = dynamic(() => import('react-markdown-editor-lite'), {
    ssr: false,
});

const Editor = ({text, setText, height = 500}:{text: string, setText: Dispatch<SetStateAction<string>>, height?: number}) => {
    const mdParser = new MarkdownIt(/* Markdown-it options */);

    function handleEditorChange({ html, text }:{html: string, text: string}) {
        setText(text)
    }

    return <div className='flex w-full max-w-[700px]'>
        <div className='w-full mb-6 '>
            <MdEditor value={text} style={{ height: `${height}px`, width: "100%" }} renderHTML={text => mdParser.render(text)} onChange={handleEditorChange} />
        </div>
    </div>
}

export default Editor