
import { MemberListClient } from '@/components/members/member-list-client';
import { getFirestoreMembers } from '@/app/fire/actions';

export default async function MembersPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const members = await getFirestoreMembers(slug);
  
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold tracking-tight mb-4">Members</h2>
      <MemberListClient initialMembers={members} />
    </div>
  );
}
