import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import app from '../firebase';
import { useNavigate } from 'react-router-dom';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { Button, Modal, Select as FlowbiteSelect } from 'flowbite-react';

hljs.configure({
  languages: ['javascript', 'python', 'java', 'csharp', 'cpp', 'html', 'css', 'json', 'bash', 'sql', 'go', 'ruby', 'php'],
});

const ImageBlot = Quill.import('formats/image');
ImageBlot.sanitize = function(url) { return url; };
Quill.register(ImageBlot, true);

const generateEditorId = () => `live-editor-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export default function CreatePost() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [imageUploadProgress, setImageUploadProgress] = useState(null);
  const [imageUploadError, setImageUploadError] = useState(null);
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [publishError, setPublishError] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');

  const [liveEditorsData, setLiveEditorsData] = useState([]);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [currentEditorLanguage, setCurrentEditorLanguage] = useState('javascript');
  const [currentEditorInitialCode, setCurrentEditorInitialCode] = useState('');

  const quillRef = useRef(null);
  const navigate = useNavigate();

  const openLiveEditorModal = useCallback(() => {
    setCurrentEditorLanguage('javascript');
    setCurrentEditorInitialCode(`// Default JavaScript code\nconsole.log('Hello, KubeCloudAI Live Editor!');`);
    setShowEditorModal(true);
  }, []);

  const handleAddLiveEditorFromModal = () => {
    const quill = quillRef.current?.getEditor();
    if (quill && currentEditorInitialCode.trim()) {
      const editorId = generateEditorId();
      const placeholder = `\n[--KUBECLOUD_LIVE_EDITOR_ID=${editorId}--]\n`;
      const range = quill.getSelection(true);
      quill.insertText(range.index, placeholder, 'user');
      quill.setSelection(range.index + placeholder.length);

      setLiveEditorsData(prev => [...prev, {
        editorId,
        language: currentEditorLanguage,
        initialCode: currentEditorInitialCode
      }]);
      setShowEditorModal(false);
    } else if (!currentEditorInitialCode.trim()) {
        alert("Initial code cannot be empty.");
    }
  };

  const modules = useMemo(() => ({
    toolbar: {
        container: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
            [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
            [{ 'align': [] }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'image', 'video'],
            ['clean'],
            [{ 'button': 'addLiveEditor' }]
        ],
        handlers: {
            'button': function(value) {
                if (value === 'addLiveEditor') {
                    openLiveEditorModal();
                } else {
                    const format = Object.keys(this.quill.getFormat())[0] || value;
                    this.quill.format(format, !this.quill.getFormat()[format]);
                }
            }
        }
    },
    syntax: {
      highlight: text => hljs.highlightAuto(text).value,
    },
  }), [openLiveEditorModal]);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
    'list', 'bullet', 'indent', 'align', 'color', 'background', 'link', 'image', 'video', 'button'
  ];

  const handleImageUpload = async () => {
    if (!file) { setImageUploadError('Please select an image.'); return null; }
    setImageUploadError(null); setImageUploadProgress(0);
    try {
        const storage = getStorage(app);
        const fileName = `${new Date().getTime()}-${file.name}`;
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, file);
        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed', (snap) => setImageUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
                (err) => { setImageUploadError('Upload failed.'); setImageUploadProgress(null); reject(err); },
                () => { getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject); }
            );
        });
    } catch (error) {setImageUploadError('Upload init failed.'); setImageUploadProgress(null); return null;}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPublishError(null); setAlertMessage('');
    if (!title.trim() || !content.trim() || !category) { setPublishError('Title, content, and category are required.'); return; }
    if (content.replace(/<(.|\n)*?>/g, '').trim().length < 50) {
       setPublishError('Content must be at least 50 characters long.'); return;
    }

    let imageUrl = '';
    if (file) {
        const uploadedUrl = await handleImageUpload();
        if (!uploadedUrl) return;
        imageUrl = uploadedUrl;
    } else { setPublishError('Please upload a cover image.'); return; }

    const postData = {
      title: title.trim(), category, content, image: imageUrl,
      liveEditorsData: liveEditorsData,
    };

    try {
      const token = localStorage.getItem('authToken');
      if (!token) { setPublishError('Auth token not found.'); return; }
      const res = await fetch('/api/post/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify(postData),
      });
      const data = await res.json();
      if (!res.ok) { setPublishError(data.message || 'Failed to create post.'); }
      else { setAlertMessage('Post created successfully!'); setTimeout(() => navigate(`/post/${data.slug}`), 1500); }
    } catch (error) { setPublishError('Network error creating post.'); console.error(error); }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        setFile(selectedFile);
        setImagePreview(URL.createObjectURL(selectedFile));
        setImageUploadError(null);
    }
  };

  useEffect(() => {
      const toolbar = document.querySelector('.ql-toolbar');
      if (toolbar) {
          const customButton = toolbar.querySelector('button.ql-button[value="addLiveEditor"]');
           if (customButton) {
               customButton.innerHTML = '[Embed Editor]';
               customButton.title = 'Add Interactive Code Editor Block';
           }
      }
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 min-h-screen">
      <h1 className="text-center text-3xl my-7 font-semibold">Create a Post</h1>
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 sm:flex-row justify-between">
          <input
              type="text" placeholder="Title" required id="title"
              className="flex-1 border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={title} onChange={(e) => setTitle(e.target.value)}
          />
          <select
              id="category" required value={category} onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
              <option value="" disabled>Select a category</option>
              <option value="Cloud">Cloud</option>
              <option value="Virtualization">Virtualization</option>
              <option value="AI">AI</option>
              <option value="DevOps">DevOps</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Python">Python</option>
              <option value="Java">Java</option>
              <option value="Other">Other</option>
          </select>
        </div>
        <div className="flex gap-4 items-center justify-between border-4 border-teal-500 border-dotted p-3">
          <input
              type="file" accept="image/*" onChange={handleFileChange} id="postImage"
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
          />
        </div>
        {imageUploadError && <p className="text-red-500 text-sm">{imageUploadError}</p>}
        {imagePreview && <img src={imagePreview} alt="Upload preview" className="w-full h-72 object-cover rounded-md" />}
        {imageUploadProgress !== null && imageUploadProgress > 0 && imageUploadProgress < 100 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${imageUploadProgress}%` }}></div>
          </div>
        )}

        <ReactQuill
          ref={quillRef}
          theme="snow"
          placeholder="Write something amazing... Use the '[Embed Editor]' button to insert a live code editor."
          className="h-72 mb-12 bg-white dark:bg-gray-100 dark:text-gray-900"
          value={content}
          onChange={setContent}
          modules={modules}
          formats={formats}
          required
        />
        <button
          type="submit" disabled={imageUploadProgress !== null && imageUploadProgress < 100}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity duration-150 text-lg font-semibold"
        >
          Publish Post
        </button>
        {publishError && <div className="mt-5 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">{publishError}</div>}
        {alertMessage && <div className="mt-5 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">{alertMessage}</div>}
      </form>

      <Modal show={showEditorModal} onClose={() => setShowEditorModal(false)} popup size="lg">
        <Modal.Header>Configure Live Code Editor</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label htmlFor="editorLanguage" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Language</label>
              <FlowbiteSelect id="editorLanguage" value={currentEditorLanguage} onChange={(e) => setCurrentEditorLanguage(e.target.value)} required>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
              </FlowbiteSelect>
            </div>
            <div>
              <label htmlFor="initialCode" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Initial Code</label>
              <textarea
                id="initialCode"
                value={currentEditorInitialCode}
                onChange={(e) => setCurrentEditorInitialCode(e.target.value)}
                autoFocus
                placeholder="Enter the default code for the editor..."
                required
                rows={10}
                className="text-sm font-mono w-full p-2.5 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleAddLiveEditorFromModal} gradientDuoTone="purpleToPink">Add Editor to Post</Button>
          <Button color="gray" onClick={() => setShowEditorModal(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}