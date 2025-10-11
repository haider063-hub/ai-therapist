export default async function AuthLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <main className="relative w-full flex flex-col min-h-screen">
      {/* Background */}
      <div className="echonest-gradient-bg"></div>
      <div className="flex-1 relative z-10">
        <div className="flex min-h-screen w-full">
          <div className="hidden lg:flex lg:w-1/2 bg-muted border-r flex-col p-18 relative sticky top-0 h-screen">
            {/* Welcome Section - Matching the provided image */}
            <div className="flex-1 flex flex-col justify-center items-start space-y-6 animate-in fade-in duration-1000">
              <h1 className="text-4xl font-bold">
                <span className="text-foreground">Welcome to </span>
                <span className="gradient-text">EchoNest</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                Your AI-powered therapy companion. Find support, guidance, and
                healing through personalized conversations designed to help you
                thrive.
              </p>

              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="text-base font-semibold text-black">
                    24/7 Support
                  </h3>
                  <p className="text-sm text-gray-600">
                    Always here when you need us
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="text-base font-semibold text-black">
                    Private & Secure
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your conversations stay confidential
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 p-0 sm:p-6 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
