import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-vinho-escuro px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center text-center">
          <Logo claro />
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">{children}</div>
      </div>
    </main>
  );
}
