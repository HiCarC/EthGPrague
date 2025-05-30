import { auth } from "@/auth";
import { Page } from "@/components/PageLayout";
import { PropertyListings } from "@/components/PropertyListings";
import { BookingNavigation } from "@/components/BookingNavigation";
import { Marble, TopBar } from "@worldcoin/mini-apps-ui-kit-react";

export default async function Home() {
  const session = await auth();

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="BookingChain"
          endAdornment={
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold capitalize">
                {session?.user.username}
              </p>
              <Marble src={session?.user.profilePictureUrl} className="w-12" />
            </div>
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col gap-4 mb-16">
        <BookingNavigation />
        <PropertyListings />
      </Page.Main>
    </>
  );
}
