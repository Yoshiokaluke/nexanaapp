import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { db } from "@/lib/db";

export default async function ProfilePage({
  params,
}: {
  params: { clerkId: string };
}) {
  const { userId } = auth();

  if (!userId || userId !== params.clerkId) {
    redirect("/");
  }

  const user = await db.user.findUnique({
    where: {
      clerkId: userId,
    },
    include: {
      profile: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ProfileView user={user} clerkId={params.clerkId} />
    </div>
  );
} 