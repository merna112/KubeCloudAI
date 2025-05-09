import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashSidebar from '../components/DashSidebar';
import DashProfile from '../components/DashProfile';
import DashPosts from '../components/DashPosts';
import DashUsers from '../components/DashUsers';
import DashComments from '../components/DashComments';
import DashboardOverview from '../components/DashboardOverview';
import DashNotifications from '../components/DashNotifications';

export default function DashBoard() {
  const location = useLocation();
  const [tab, setTab] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) {
      setTab(tabFromUrl);
    }
  }, [location.search]);
  return (
    <div className="flex">
      {/* Sidebar */}
      <DashSidebar />
      
      {/* Main Content */}
       <div className="flex-grow p-4">
        {tab === 'profile' && <DashProfile />}
      {/* posts */}
      {tab==='posts' &&<DashPosts/>}
      {/* users */}
      {tab==='users' &&<DashUsers/>}
      {/* comments */}
      {tab=='comments' && <DashComments/>}
      {/* DashboardOverview */}
      {tab==='overview' && <DashboardOverview/>}
      {/* notifications */}
      {tab==='notifications' && <DashNotifications />}
      </div>
    </div>
  );
}
