const mongoose = require('mongoose');

const liveEditorSchema = new mongoose.Schema({
  editorId: { type: String, required: true, unique: true },
  language: { type: String, default: 'javascript' },
  initialCode: { type: String, default: '// Start coding here!' }
}, { _id: false });

const postSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    content: { type: String, required: true },
    title: { type: String, required: true, unique: true },
    image: { type: String, default: 'https://fatherlandgazette.com/wp-content/uploads/2021/06/blog-post-writing.png' },
    category: { type: String, default: 'uncategorized' },
    slug: { type: String, required: true, unique: true },
    liveEditorsData: [liveEditorSchema] 
  },
  { timestamps: true }
);

postSchema.index({
  title: 'text', content: 'text', category: 'text'
}, {
  weights: { title: 10, category: 5, content: 1 },
  name: "PostTextIndex"
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;