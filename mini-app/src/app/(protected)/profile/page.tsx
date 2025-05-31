import { auth } from "@/auth";
import { Page } from "@/components/PageLayout";
import { Marble, TopBar } from "@worldcoin/mini-apps-ui-kit-react";
import { ProfileContent } from "@/components/ProfileContent";

export default async function ProfilePage() {
  const session = await auth();

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Profile"
          endAdornment={
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold capitalize">
                {session?.user.username}
                {session?.user.walletAddress}
              </p>
              <Marble src={session?.user.profilePictureUrl} className="w-12" />
            </div>
          }
        />
      </Page.Header>
      <Page.Main>{session && <ProfileContent />}</Page.Main>
    </>
  );
}
