import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  HiAnnotation,
  HiArrowNarrowUp,
  HiDocumentText,
  HiOutlineUserGroup,
} from 'react-icons/hi';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

export default function DashboardOverview() {
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [posts, setPosts] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [lastMonthUsers, setLastMonthUsers] = useState(0);
  const [lastMonthPosts, setLastMonthPosts] = useState(0);
  const [lastMonthComments, setLastMonthComments] = useState(0);
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, postsRes, commentsRes] = await Promise.all([
          fetch('/api/user/getusers?limit=5'),
          fetch('/api/post/getposts?limit=5'),
          fetch('/api/comment/getcomments?limit=5'),
        ]);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users);
          setTotalUsers(usersData.totalUsers);
          setLastMonthUsers(usersData.lastMonthUsers);
        }

        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData.posts);
          setTotalPosts(postsData.totalPosts);
          setLastMonthPosts(postsData.lastMonthPosts);
        }

        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData.comments);
          setTotalComments(commentsData.totalComments);
          setLastMonthComments(commentsData.lastMonthComments);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (currentUser.isAdmin) {
      fetchData();
    }
  }, [currentUser]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card
          title="Total Users"
          total={totalUsers}
          lastMonth={lastMonthUsers}
          icon={<HiOutlineUserGroup className="text-white text-5xl" />}
          bgColor="bg-teal-600"
        />
        <Card
          title="Total Comments"
          total={totalComments}
          lastMonth={lastMonthComments}
          icon={<HiAnnotation className="text-white text-5xl" />}
          bgColor="bg-indigo-600"
        />
        <Card
          title="Total Posts"
          total={totalPosts}
          lastMonth={lastMonthPosts}
          icon={<HiDocumentText className="text-white text-5xl" />}
          bgColor="bg-lime-600"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <RecentData
          title="Recent Users"
          data={users}
          render={(user) => (
            <>
              <img
                src={user.profilePicture}
                alt={user.username}
                className="w-10 h-10 rounded-full"
              />
              <span>{user.username}</span>
            </>
          )}
          link="/dashboard?tab=users"
        />
        <RecentData
          title="Recent Comments"
          data={comments}
          render={(comment) => (
            <>
              <span className="line-clamp-2">{comment.content}</span>
              <span>{comment.numberOfLikes}</span>
            </>
          )}
          link="/dashboard?tab=comments"
        />
        <RecentData
          title="Recent Posts"
          data={posts}
          render={(post) => (
            <>
              <img
                src={post.image}
                alt={post.title}
                className="w-14 h-10 rounded-md"
              />
              <span>{post.title}</span>
              <span>{post.category}</span>
            </>
          )}
          link="/dashboard?tab=posts"
        />
      </div>
    </div>
  );
}

function Card({ title, total, lastMonth, icon, bgColor }) {
  return (
    <div className="flex flex-col p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-gray-500 text-sm uppercase">{title}</h3>
          <p className="text-2xl font-semibold">{total}</p>
        </div>
        <div
          className={`${bgColor} text-white rounded-full p-3 shadow-lg flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4 text-sm">
        <span className="text-green-500 flex items-center">
          <HiArrowNarrowUp />
          {lastMonth}
        </span>
        <span className="ml-2 text-gray-500">Last month</span>
      </div>
    </div>
  );
}

Card.propTypes = {
  title: PropTypes.string.isRequired,
  total: PropTypes.number.isRequired,
  lastMonth: PropTypes.number.isRequired,
  icon: PropTypes.node.isRequired,
  bgColor: PropTypes.string.isRequired,
};

function RecentData({ title, data, render, link }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link to={link} className="text-blue-500">
          See all
        </Link>
      </div>
      <div className="space-y-4">
        {data && data.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-4">
            {render(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

RecentData.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.array.isRequired,
  render: PropTypes.func.isRequired,
  link: PropTypes.string.isRequired,
};
