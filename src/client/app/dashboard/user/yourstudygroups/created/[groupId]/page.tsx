import YourStudyGroupsPage from '../../page';

interface CreatedStudyGroupPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function CreatedStudyGroupPage({ params }: CreatedStudyGroupPageProps) {
  const { groupId } = await params;
  return <YourStudyGroupsPage initialGroupId={groupId} initialMode="created" />;
}
