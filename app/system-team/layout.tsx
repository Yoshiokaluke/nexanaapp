import { redirect } from "next/navigation";
import { isSystemTeam } from "@/app/lib/auth";

export const dynamic = 'force-dynamic';

export default async function SystemTeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await isSystemTeam();
  
  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {children}
    </div>
  );
} 