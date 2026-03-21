import React from 'react';
import Layout from '../components/Layout';
import Guestbook from '../components/Guestbook';
import { User } from 'firebase/auth';

interface PageProps {
  user: User | null;
}

const GuestbookPage: React.FC<PageProps> = ({ user }) => {
  return (
    <Layout title="방명록">
       {/* Set showTitle to false because Layout already has the main title */}
       <Guestbook isAdmin={!!user} showTitle={false} />
    </Layout>
  );
};

export default GuestbookPage;