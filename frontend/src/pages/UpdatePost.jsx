import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import app from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { Button, Modal, Textarea as FlowbiteTextarea, Select as FlowbiteSelect } from 'flowbite-react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';


hljs.configure({
  languages: ['javascript', 'python', 'java', 'csharp', 'cpp', 'html', 'css', 'json', 'bash', 'sql', 'go', 'ruby', 'php'],
});

const ImageBlot = Quill.import('formats/image');
ImageBlot.sanitize = function(url) { return url; };
Quill.register(ImageBlot, true);

const generateEditorId = () => `live-editor-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export default function UpdatePost() {
  const [file, setFile] = useState(null);
  const [imageUploadProgress, setImageUploadProgress] = useState(null);
  const [imageUploadError, setImageUploadError] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    image: '',
    liveEditorsData: []
  });
  const [publishError, setPublishError] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');

  const [showEditorModal, setShowEditorModal] = useState(false);
  const [currentEditorLanguage, setCurrentEditorLanguage] = useState('javascript');
  const [currentEditorInitialCode, setCurrentEditorInitialCode] = useState('');
  const [editingEditorId, setEditingEditorId] = useState(null);

  const quillRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const { postId } = useParams();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/post/getposts?postId=${postId}`);
        const data = await res.json();
        if (!res.ok) {
          setPublishError(data.message || 'Failed to fetch post data.');
          return;
        }
        if (data.posts && data.posts.length > 0) {
          const postToUpdate = data.posts[0];
          setFormData({
            title: postToUpdate.title || '',
            category: postToUpdate.category || '',
            content: postToUpdate.content || '',
            image: postToUpdate.image || '',
            liveEditorsData: postToUpdate.liveEditorsData || [],
          });
          setImagePreview(postToUpdate.image || '');
        } else {
          setPublishError('Post not found.');
        }
      } catch (error) {
        setPublishError('Error fetching post data.');
        console.error(error);
      }
    };
    if (postId) {
        fetchPost();
    }
  }, [postId]);


  const openLiveEditorModal = useCallback((editorData = null) => {
      if (editorData && editorData.editorId) {
        setEditingEditorId(editorData.editorId);
        setCurrentEditorLanguage(editorData.language);
        setCurrentEditorInitialCode(editorData.initialCode);
      } else {
        setEditingEditorId(null);
        setCurrentEditorLanguage('javascript');
        setCurrentEditorInitialCode(`// Default JavaScript code\nconsole.log('Hello, KubeCloudAI!');`);
      }
      setShowEditorModal(true);
    }, []);

  const handleAddOrUpdateLiveEditorFromModal = () => {
    const quill = quillRef.current?.getEditor();
    if (!currentEditorInitialCode.trim()) {
      alert("Initial code cannot be empty.");
      return;
    }

    if (editingEditorId) {
      setFormData(prev => ({
        ...prev,
        liveEditorsData: (prev.liveEditorsData || []).map(editor =>
          editor.editorId === editingEditorId
            ? { ...editor, language: currentEditorLanguage, initialCode: currentEditorInitialCode }
            : editor
        )
      }));
    } else {
      if (!quill) {
        alert("Quill editor instance not available.");
        return;
      }
      const editorId = generateEditorId();
      const placeholder = `\n[--KUBECLOUD_LIVE_EDITOR_ID=${editorId}--]\n`;
      const range = quill.getSelection(true) || { index: quill.getLength() -1 , length: 0 };
      quill.insertText(range.index, placeholder, Quill.sources.USER);
      quill.setSelection(range.index + placeholder.length);
      setFormData(prev => ({
        ...prev,
        liveEditorsData: [...(prev.liveEditorsData || []), {
          editorId,
          language: currentEditorLanguage,
          initialCode: currentEditorInitialCode
        }]
      }));
    }
    setShowEditorModal(false);
    setEditingEditorId(null);
  };

  const handleDeleteLiveEditor = (editorIdToDelete) => {
    if (!confirm("Are you sure you want to delete this live editor block and its placeholder from the content?")) {
        return;
    }
    setFormData(prev => ({
        ...prev,
        liveEditorsData: (prev.liveEditorsData || []).filter(editor => editor.editorId !== editorIdToDelete)
    }));

    const quill = quillRef.current?.getEditor();
    if (quill && formData.content) {
        const placeholderToRemove = `[--KUBECLOUD_LIVE_EDITOR_ID=${editorIdToDelete}--]`;
        const regex = new RegExp(placeholderToRemove.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\n/g, '\\n'), 'g');
        const newContentHTML = formData.content.replace(regex, '');
        setFormData(prev => ({ ...prev, content: newContentHTML }));
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
    if (!formData.title?.trim() || !formData.content?.trim() || !formData.category) {
      setPublishError('Title, content, and category are required.'); return;
    }
    if (formData.content.replace(/<(.|\n)*?>/g, '').trim().length < 50) {
       setPublishError('Content must be at least 50 characters long.'); return;
    }

    let finalImageUrl = formData.image;
    if (file) {
        const uploadedUrl = await handleImageUpload();
        if (!uploadedUrl) return;
        finalImageUrl = uploadedUrl;
    }

    const updatedPostData = {
      title: formData.title.trim(),
      category: formData.category,
      content: formData.content,
      image: finalImageUrl,
      liveEditorsData: formData.liveEditorsData || [],
    };

    try {
      const token = localStorage.getItem('authToken');
      if (!token || !currentUser || !currentUser._id) {
        setPublishError('Authentication required.'); return;
      }
      const res = await fetch(`/api/post/updatepost/${postId}/${currentUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify(updatedPostData),
      });
      const data = await res.json();
      if (!res.ok) { setPublishError(data.message || 'Failed to update post.'); }
      else { setAlertMessage('Post updated successfully!'); setTimeout(() => navigate(`/post/${data.slug}`), 1500); }
    } catch (error) { setPublishError('Network error updating post.'); console.error(error); }
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
      <h1 className="text-center text-3xl my-7 font-semibold">Update Post</h1>
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 sm:flex-row justify-between">
          <input
              type="text" placeholder="Title" required id="title"
              className="flex-1 border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
          <FlowbiteSelect
              id="category" required value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
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
          </FlowbiteSelect>
        </div>
        <div className="flex gap-4 items-center justify-between border-4 border-teal-500 border-dotted p-3">
          <input
              type="file" accept="image/*" onChange={handleFileChange} id="postImage"
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
          />
        </div>
        {imageUploadError && <p className="text-red-500 text-sm">{imageUploadError}</p>}
        {imagePreview && (
          <img src={imagePreview} alt="Upload preview" className="w-full h-72 object-cover rounded-md" />
        )}
         {imageUploadProgress !== null && imageUploadProgress > 0 && imageUploadProgress < 100 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${imageUploadProgress}%` }}></div>
          </div>
        )}

        {formData.liveEditorsData && formData.liveEditorsData.length > 0 && (
          <div className="my-4 p-3 border rounded-md dark:border-gray-700">
            <h3 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-200">Configured Live Editors:</h3>
            <ul className="space-y-2">
              {formData.liveEditorsData.map((editor) => (
                <li key={editor.editorId} className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm">
                  <div className='flex flex-col'>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        ID: <code className="text-xs bg-gray-200 dark:bg-gray-600 p-1 rounded">{editor.editorId.slice(-7)}</code>
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Lang: {editor.language}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="xs" outline gradientDuoTone="cyanToBlue" onClick={() => openLiveEditorModal(editor)}>
                      <FaEdit className="h-3 w-3"/>
                    </Button>
                    <Button size="xs" outline color="failure" onClick={() => handleDeleteLiveEditor(editor.editorId)}>
                      <FaTrashAlt className="h-3 w-3"/>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ReactQuill
          ref={quillRef}
          theme="snow"
          placeholder="Write something amazing... Use the '[Embed Editor]' button to insert a live code editor."
          className="h-72 mb-12 bg-white dark:bg-gray-100 dark:text-gray-900"
          value={formData.content}
          onChange={(value) => setFormData({...formData, content: value})}
          modules={modules}
          formats={formats}
          required
        />
        <Button type="submit" gradientDuoTone="purpleToPink" disabled={imageUploadProgress !== null && imageUploadProgress < 100} className="text-lg">
          Update Post
        </Button>
        {publishError && <div className="mt-5 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">{publishError}</div>}
        {alertMessage && <div className="mt-5 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">{alertMessage}</div>}
      </form>

      <Modal show={showEditorModal} onClose={() => {setShowEditorModal(false); setEditingEditorId(null);}} popup size="xl">
        <Modal.Header>{editingEditorId ? 'Edit Live Editor Content' : 'Add New Live Code Editor'}</Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div>
              <label htmlFor="editorLanguageModal" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Language</label>
              <FlowbiteSelect id="editorLanguageModal" value={currentEditorLanguage} onChange={(e) => setCurrentEditorLanguage(e.target.value)} required>
                <option value="javascript">JavaScript</option> <option value="python">Python</option>
                <option value="java">Java</option> <option value="cpp">C++</option>
                <option value="html">HTML</option> <option value="css">CSS</option>
                <option value="json">JSON</option>
              </FlowbiteSelect>
            </div>
            <div>
              <label htmlFor="initialCodeModal" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Initial Code</label>
              <FlowbiteTextarea
                id="initialCodeModal"
                value={currentEditorInitialCode}
                onChange={(e) => setCurrentEditorInitialCode(e.target.value)}
                placeholder="Enter the default code for the editor..."
                required
                rows={15}
                className="text-sm font-mono bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleAddOrUpdateLiveEditorFromModal} gradientDuoTone="purpleToPink">
            {editingEditorId ? 'Update Editor Code' : 'Add Editor to Post'}
          </Button>
          <Button color="gray" onClick={() => {setShowEditorModal(false); setEditingEditorId(null);}}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}