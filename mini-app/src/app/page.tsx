import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Page } from "@/components/PageLayout";
import { AuthButton } from "../components/AuthButton";

export default async function Home() {
  const session = await auth();

  // Redirect authenticated users to the property listings
  if (session) {
    redirect("/home");
  }

  return (
    <Page>
      <Page.Main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                BookingWLD
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The future of property booking powered by blockchain technology.
              Secure, transparent, and decentralized accommodation booking.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                🔐
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                All transactions are secured by blockchain technology and smart
                contracts.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                🌍
              </div>
              <h3 className="text-lg font-semibold mb-2">Global Access</h3>
              <p className="text-gray-600">
                Access properties worldwide with your World ID verification.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                💎
              </div>
              <h3 className="text-lg font-semibold mb-2">No Hidden Fees</h3>
              <p className="text-gray-600">
                Transparent pricing with smart contract-based transactions.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-600 mb-6">
              Sign in with World ID to start booking properties or list your
              own.
            </p>
            <AuthButton />
          </div>
        </div>
      </Page.Main>
    </Page>
  );
}
