import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function CommunityPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col pt-32 pb-20 px-6 max-w-7xl mx-auto w-full text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">Join the Community</h1>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto text-lg">
          Connect with thousands of developers and tech enthusiasts worldwide.
        </p>
      </main>
      <Footer />
    </>
  );
}
