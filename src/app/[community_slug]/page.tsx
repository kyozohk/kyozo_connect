'use client';
import { useUser, useCollection, firestore } from '@/firebase';
import { useState, useEffect } from 'react';
import { CreatePost } from '@/components/communities/CreatePost';
import { Button } from '@/components/ui/button';
import { collection, where, query } from 'firebase/firestore';

const CommunityPage = ({ params }: { params: { community_slug: string } }) => {
  const { user } = useUser();
  const [community, setCommunity] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isCreatePostOpen, setCreatePostOpen] = useState(false);
  const communitiesCollection = collection(firestore, 'communities');
  const communityQuery = query(communitiesCollection, where('slug', '==', params.community_slug));
  const { data: communities, loading, error } = useCollection(communityQuery);

  useEffect(() => {
    if (communities && communities.length > 0) {
      const communityData = communities[0];
      setCommunity(communityData);
      if (user && user.uid === communityData.owner) {
        setIsOwner(true);
      }
    }
  }, [communities, user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!community) {
    return <div>Community not found</div>;
  }

  return (
    <div>
      <h1>{community.name}</h1>
      <p>{community.lore}</p>
      {isOwner && (
        <Button onClick={() => setCreatePostOpen(true)}>Create Post</Button>
      )}
      <CreatePost
        isOpen={isCreatePostOpen}
        onClose={() => setCreatePostOpen(false)}
        communityId={community.id}
      />
    </div>
  );
};

export default CommunityPage;
