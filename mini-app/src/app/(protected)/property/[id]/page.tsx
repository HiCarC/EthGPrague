import { auth } from "@/auth";
import { Page } from "@/components/PageLayout";
import { PropertyDetails } from "@/components/PropertyDetails";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TopBar } from "@worldcoin/mini-apps-ui-kit-react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface PropertyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const session = await auth();
  const { id } = await params;

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Property Details"
          startAdornment={
            <Link href="/home" className="flex items-center">
              <ChevronLeft size={20} />
            </Link>
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col gap-4 mb-16">
        <ErrorBoundary>
          <PropertyDetails propertyId={id} />
        </ErrorBoundary>
      </Page.Main>
    </>
  );
}
