import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { db } from "@/lib/db";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ clerkId: string }>;
}) {
  const { clerkId } = await params;
  const { userId } = auth();

  if (!userId || userId !== clerkId) {
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
    <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] via-[#1A1A1A] to-[#0F0F0F] relative overflow-hidden">
      {/* 背景の装飾要素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#4BEA8A]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#3DD879]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4BEA8A]/3 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative">
        <ProfileView user={user} clerkId={clerkId} />
      </div>
    </div>
  );
} 