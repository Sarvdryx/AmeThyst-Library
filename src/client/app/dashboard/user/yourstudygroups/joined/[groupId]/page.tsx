import YourStudyGroupsPage from '../../page';

interface JoinedStudyGroupPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function JoinedStudyGroupPage({ params }: JoinedStudyGroupPageProps) {
  const { groupId } = await params;
  return <YourStudyGroupsPage initialGroupId={groupId} initialMode="joined" />;
}
