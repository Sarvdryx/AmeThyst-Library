import StudyTogetherPage from '../page';

interface StudyTogetherGroupPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function StudyTogetherGroupPage({ params }: StudyTogetherGroupPageProps) {
  const { groupId } = await params;
  return <StudyTogetherPage initialGroupId={groupId} />;
}
