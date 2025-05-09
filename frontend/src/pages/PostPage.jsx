// frontend/src/pages/PostPage.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import CallToAction from '../components/CallToAction';
import CommentSection from '../components/CommentSection';
import PostCard from '../components/PostCard';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { FaPlay } from "react-icons/fa"; 
import PropTypes from 'prop-types';
import copy from 'copy-to-clipboard';

const LIVE_EDITOR_PLACEHOLDER_REGEX = /\[--KUBECLOUD_LIVE_EDITOR_ID=([a-zA-Z0-9-]+)--]/g;

function LiveCodeEditorInstance({ initialCode = '', defaultLanguage = 'javascript', editorId }) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);

  const languageMap = {
    javascript: javascript(), python: python(), java: java(), cpp: cpp(),
    html: html(), css: css(), json: json(),
  };

  useEffect(() => {
    setCode(initialCode);
    setSelectedLanguage(defaultLanguage);
  }, [initialCode, defaultLanguage, editorId]);

  const handleCodeChange = useCallback((value) => {
    setCode(value);
  }, []);

  const handleRunCode = async () => {
    setIsRunning(true); setError(''); setOutput('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/code/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ language: selectedLanguage, code: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `API Error: ${res.status}`);
      if (data.error) setError(data.output || 'Execution error.');
      else setOutput(data.output);
    } catch (err) { setError(err.message || 'Failed to connect.'); }
    finally { setIsRunning(false); }
  };

  return (
    <div className="live-editor-instance my-6 border border-gray-600 dark:border-gray-700 rounded-lg overflow-hidden shadow-md bg-[#282c34]">
      <div className="bg-gray-700 dark:bg-gray-800 text-gray-300 px-4 py-2 flex justify-between items-center">
         <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="bg-gray-600 dark:bg-gray-700 text-white text-xs p-1.5 rounded border border-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500">
            <option value="javascript">JavaScript</option> <option value="python">Python</option>
            <option value="java">Java</option> <option value="cpp">C++</option>
            <option value="html">HTML</option> <option value="css">CSS</option>
            <option value="json">JSON</option>
         </select>
         <button onClick={handleRunCode} disabled={isRunning} className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white px-4 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors" title="Run Code">
            <FaPlay size={12}/> Run
         </button>
      </div>
      <CodeMirror value={code} theme={okaidia} extensions={[languageMap[selectedLanguage] || javascript()]} onChange={handleCodeChange}
        basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true, autocompletion: true, bracketMatching: true, indentOnInput: true, dropCursor: true }}
        height="300px" className="text-sm w-full cm-theme-custom" />
      {(output || error || isRunning) && (
        <div className="output-area bg-gray-800 dark:bg-black text-white p-3 mt-0 border-t border-gray-600 dark:border-gray-700 min-h-[60px]">
          <h4 className="text-xs font-semibold mb-1 text-gray-400">Output:</h4>
          {isRunning && <pre className="text-sm text-yellow-400 animate-pulse">Running...</pre>}
          {output && <pre className="text-sm whitespace-pre-wrap">{output}</pre>}
          {error && <pre className="text-sm text-red-400 whitespace-pre-wrap">{error}</pre>}
        </div>
      )}
    </div>
  );
}
LiveCodeEditorInstance.propTypes = { initialCode: PropTypes.string, defaultLanguage: PropTypes.string, editorId: PropTypes.string.isRequired };

export default function PostPage() {
  const { postSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [post, setPost] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const contentRef = useRef(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true); setError(null);
        const res = await fetch(`/api/post/getposts?slug=${postSlug}`);
        const data = await res.json();
        if (!res.ok) { setError(data.message || 'Failed to fetch post.'); setPost(null); }
        else if (data.posts && data.posts.length > 0) { setPost(data.posts[0]); }
        else { setError('Post not found.'); setPost(null); }
      } catch (err) { setError('Network error fetching post.'); setPost(null); console.error("Fetch post error:", err); }
      finally { setLoading(false); }
    };
    fetchPost();
  }, [postSlug]);

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const res = await fetch(`/api/post/getposts?limit=3`);
        const data = await res.json();
        if (res.ok) { setRecentPosts(data.posts?.filter(p => p.slug !== postSlug) || []); }
      } catch (err) { console.error("Fetch recent posts error:", err.message); }
    };
    if(post) fetchRecentPosts();
  }, [post, postSlug]);

  const renderContentWithLiveEditors = (htmlContent, liveEditorsDataArray = []) => {
    if (!htmlContent) return [];
    let lastIndex = 0;
    const elements = [];
    let match;
    const regex = new RegExp(LIVE_EDITOR_PLACEHOLDER_REGEX.source, 'g');

    while ((match = regex.exec(htmlContent)) !== null) {
      elements.push(<div key={`part-${lastIndex}`} dangerouslySetInnerHTML={{ __html: htmlContent.substring(lastIndex, match.index) }}></div>);
      const editorId = match[1];
      const editorData = liveEditorsDataArray.find(ed => ed.editorId === editorId);
      if (editorData) {
        elements.push(
          <LiveCodeEditorInstance
            key={`editor-${editorId}`}
            editorId={editorId}
            initialCode={editorData.initialCode}
            defaultLanguage={editorData.language}
          />
        );
      } else {
        elements.push(<div key={`error-${editorId}`} className="text-red-500 p-2 my-2 border border-red-500 rounded">Error: Live editor data not found for ID: {editorId}. Placeholder: {match[0]}</div>);
      }
      lastIndex = regex.lastIndex;
    }
    elements.push(<div key={`part-${lastIndex}-end`} dangerouslySetInnerHTML={{ __html: htmlContent.substring(lastIndex) }}></div>);
    return elements;
  };

  useEffect(() => {
    if (post && post.content && contentRef.current) {
      const preElements = contentRef.current.querySelectorAll('.prose pre, pre.ql-syntax');
      preElements.forEach((preElement) => {
        if (preElement.closest('.cm-editor') || preElement.closest('.live-editor-instance') || preElement.querySelector('.copy-code-button')) {
          return;
        }
        let codeBlockToHighlight = preElement.querySelector('code');
        if (!codeBlockToHighlight && preElement.classList.contains('ql-syntax')) {
            codeBlockToHighlight = preElement;
        }
        if (codeBlockToHighlight) {
            if (!codeBlockToHighlight.dataset.highlighted) {
                hljs.highlightElement(codeBlockToHighlight);
                codeBlockToHighlight.dataset.highlighted = 'true';
            }
            const button = document.createElement('button');
            button.className = 'copy-code-button';
            const copyIconSVG = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"></path><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"></path></svg>';
            const checkIconSVG = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 0 0-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z"></path></svg>';
            button.innerHTML = copyIconSVG;
            button.title = 'Copy code';

            button.onclick = () => {
                const codeToCopy = codeBlockToHighlight.innerText;
                if (copy(codeToCopy)) {
                    button.innerHTML = checkIconSVG;
                    button.title = 'Copied!';
                    setTimeout(() => {
                        button.innerHTML = copyIconSVG;
                        button.title = 'Copy code';
                    }, 2000);
                } else {
                    button.innerText = 'Error';
                    setTimeout(() => {
                        button.innerHTML = copyIconSVG;
                        button.title = 'Copy code';
                    }, 2000);
                }
            };
            if (getComputedStyle(preElement).position === 'static') {
                 preElement.style.position = 'relative';
            }
            preElement.appendChild(button);
        }
      });
    }
  }, [post]);

  if (loading) {
     return (<div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div></div>);
  }
  if (error) {
     return (<div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 text-center"><h2 className="text-2xl font-semibold text-red-600 mb-4">Oops!</h2><p className="text-red-500 dark:text-red-400">{error}</p><Link to="/" className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Go Home</Link></div>);
  }
  if (!post) {
     return (<div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900"><p className="text-gray-500 text-xl">Post not available.</p></div>);
  }

  return (
    <main className='p-3 flex flex-col max-w-6xl mx-auto min-h-screen'>
      <h1 className='text-3xl mt-10 p-3 text-center font-serif max-w-2xl mx-auto lg:text-4xl dark:text-white'>{post?.title}</h1>
      <Link to={`/search?category=${post?.category}`} className='self-center mt-5 mb-5'>
        <button className='bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'>
          {post?.category}
        </button>
      </Link>
       <img src={post?.image} alt={post?.title} className='mt-5 p-3 max-h-[600px] w-full object-cover rounded-lg shadow-md' />
      <div className="flex justify-between p-3 border-b border-slate-300 dark:border-slate-700 mx-auto w-full max-w-2xl text-xs text-gray-600 dark:text-gray-400 mb-6">
        <span>{new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span className='italic'>{(post.content?.length / 1000).toFixed(0)} min read</span>
      </div>
      <div
        ref={contentRef}
        className="p-3 max-w-2xl mx-auto w-full prose prose-lg dark:prose-invert prose-img:rounded-xl prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:underline"
      >
         {post.liveEditorsData && post.liveEditorsData.length > 0
            ? renderContentWithLiveEditors(post.content, post.liveEditorsData)
            : <div dangerouslySetInnerHTML={{ __html: post.content || '' }}></div>
         }
      </div>
      <div className='max-w-4xl mx-auto w-full my-10'> <CallToAction /> </div>
      <div className="flex flex-col items-center mb-10 border-t border-gray-300 dark:border-gray-700 pt-10">
        <h2 className="text-2xl font-semibold mb-5 text-center dark:text-white">Recent Articles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {recentPosts && recentPosts.length > 0 ? (
             recentPosts.map((recentPost) => <PostCard key={recentPost._id} post={recentPost} />)
          ) : ( <p className="text-center col-span-full text-gray-500">No recent posts to display.</p> )}
        </div>
      </div>
      {post?._id && <CommentSection postId={post._id} />}
    </main>
  );
}