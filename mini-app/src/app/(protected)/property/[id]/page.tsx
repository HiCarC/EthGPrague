import { auth } from "@/auth";
import { PropertyDetails } from "@/components/PropertyDetails";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BottomNavigation } from "@/components/BottomNavigation";

interface PropertyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const session = await auth();
  const { id } = await params;

  return (
    <div className="min-h-screen bg-white">
      <ErrorBoundary>
        <PropertyDetails propertyId={id} />
      </ErrorBoundary>
      <div className="pb-20" />
      <BottomNavigation />
    </div>
  );
}
