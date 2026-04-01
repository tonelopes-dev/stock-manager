export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 font-sans antialiased">
      {/* 🔮 Background Mesh Elements */}
      <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] animate-float" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-orange-400/20 blur-[130px] animate-float [animation-delay:2s]" />

      {/* 🕸️ Dot Grid Overlay */}
      <div className="dot-grid absolute inset-0 opacity-[0.4]" />

      {/* 🛡️ Content Wrapper */}
      <div className="relative z-10 w-full px-4 flex justify-center">
        {children}
      </div>
    </div>
  );
}
