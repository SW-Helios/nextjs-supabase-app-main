import { MobileNav } from "@/components/navigation/mobile-nav";
import { MobileHeader } from "@/components/navigation/mobile-header";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-16 dark:bg-gray-950">
      {/* 모바일 최대 너비 컨테이너 */}
      <div className="bg-background mx-auto min-h-screen max-w-md shadow-sm">
        <MobileHeader />
        <main className="p-4">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
