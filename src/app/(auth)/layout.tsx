export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/5" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/3" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img
            src="/logo.svg"
            alt="TSR Logo"
            className="h-14 w-14 rounded-2xl object-contain shadow-lg"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">TSR CMS</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              TSR
            </p>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
