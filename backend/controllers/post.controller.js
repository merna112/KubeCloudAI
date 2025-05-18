const Post = require('../models/post.model');
const User = require('../models/user.model');
const { sendEmail } = require('../utils/emailService');
const errorHandler = require('../utils/error');

const create = async (req, res, next) => {
    if (!req.user.isAdmin) {
        return next(errorHandler(403, 'You are not allowed to create a post'));
    }
    if (!req.body.title || !req.body.content) {
        return next(errorHandler(400, 'Please provide all required fields'));
    }

    const slug = req.body.title
        .split(' ')
        .join('-')
        .toLowerCase()
        .replace(/[^a-zA-Z0-9-]/g, '');

    const newPostData = {
        ...req.body,
        slug,
        userId: req.user.id,
    };

    try {
        const author = await User.findById(req.user.id);
        if (!author) {
            return next(errorHandler(404, 'Author (user) not found'));
        }

        const newPost = new Post(newPostData);
        const savedPost = await newPost.save();

        try {
            const usersToNotify = await User.find({}, 'email username');

            if (usersToNotify.length > 0) {
                const postUrl = `${process.env.FRONTEND_URL}/post/${savedPost._id}`;
                const emailSubject = `New Post on KubeCloudAI: ${savedPost.title}`; 

                const emailPromises = usersToNotify.map(user => {
                    if (user._id.toString() !== author._id.toString()) {
                        const emailText = `Hello ${user.username || 'Valued User'},\n\nA new post titled "${savedPost.title}" has been published by ${author.username}.\n\nYou can read the full post here: ${postUrl}\n\nRegards,\n KubeCloudAI Team.`;
                        const emailHtml = `
                            <p>Hello ${user.username || 'Valued User'},</p>
                            <p>A new post titled "<strong>${savedPost.title}</strong>" has been published by <strong>${author.username}</strong>.</p>
                            <p>You can read the full post by clicking the link below:</p>
                            <p><a href="${postUrl}">Read Post: ${savedPost.title}</a></p>
                            <p>Regards,<br>The KubeCloudAI Team.</p>
                            <p><small>If you do not wish to receive these notifications, you can <a href="${process.env.FRONTEND_URL}/settings/notifications">update your notification preferences</a>.</small></p>
                        `;
                        return sendEmail(user.email, emailSubject, emailText, emailHtml)
                            .catch(err => {
                                console.error(`Failed to send new post notification to ${user.email}: ${err.message}`);
                                return { status: 'failed', email: user.email, error: err.message };
                            });
                    }
                    return Promise.resolve({ status: 'skipped', email: user.email, reason: 'Author' });
                });

                await Promise.allSettled(emailPromises);
            }
        } catch (notificationError) {
            console.error("Error preparing to send new post notifications:", notificationError);
        }

        res.status(201).json(savedPost);
    } catch (error) {
        next(error);
    }
};

const getposts = async (req, res, next) => {
    try {
        const startIndex = parseInt(req.query.startIndex) || 0;
        const limit = parseInt(req.query.limit) || 9;
        
        const query = {};
        let sortOptions = {};

        const requestedSort = req.query.sort || 'desc';

        if (req.query.userId) query.userId = req.query.userId;
        if (req.query.category && req.query.category !== 'uncategorized') query.category = req.query.category;
        if (req.query.slug) query.slug = req.query.slug;
        if (req.query.postId) query._id = req.query.postId;

        if (req.query.searchTerm) {
            query.$text = { $search: req.query.searchTerm };
            
            sortOptions = { score: { $meta: "textScore" }, updatedAt: -1 }; 

            if (requestedSort === 'asc') {
                sortOptions = { updatedAt: 1 }; 
            } else if (requestedSort === 'desc') {
                sortOptions = { updatedAt: -1 }; 
            }
        } else {
            sortOptions = { updatedAt: requestedSort === 'asc' ? 1 : -1 };
        }
        
        const posts = await Post.find(query)
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limit);

        const totalPosts = await Post.countDocuments(query);

        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        const lastMonthQueryCriteria = { createdAt: { $gte: oneMonthAgo } };
        if (req.query.searchTerm) {
            lastMonthQueryCriteria.$text = { $search: req.query.searchTerm };
        }
        if (query.category) { 
            lastMonthQueryCriteria.category = query.category;
        }
        
        const lastMonthPosts = await Post.countDocuments(lastMonthQueryCriteria);

        res.status(200).json({
            posts,
            totalPosts,
            lastMonthPosts,
        });
    } catch (error) {
        console.error("Error in getposts:", error);
        next(error);
    }
};

const deletepost = async (req, res, next) => {
    if (!req.user.isAdmin && req.user.id !== req.params.userId) {
        return next(errorHandler(403, 'You are not allowed to delete this post'));
    }
    try {
        await Post.findByIdAndDelete(req.params.postId);
        res.status(200).json('The post has been deleted Successfully');
    } catch (error) {
        next(error);
    }
};

const updatepost = async (req, res, next) => {
    if (!req.user.isAdmin && req.user.id !== req.params.userId) {
        return next(errorHandler(403, 'You are not allowed to update this post'));
    }
    try {
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.postId,
            {
                $set: {
                    title: req.body.title,
                    content: req.body.content,
                    category: req.body.category,
                    image: req.body.image,
                }
            },
            { new: true }
        );

        if (!updatedPost) {
            return next(errorHandler(404, 'Post not found'));
        }

        res.status(200).json(updatedPost);
    } catch (error) {
        next(error);
    }
};

module.exports = { create, getposts, deletepost, updatepost };