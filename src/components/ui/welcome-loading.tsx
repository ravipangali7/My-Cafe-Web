import { cn } from "@/lib/utils";

export function WelcomeLoading({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "min-h-screen flex flex-col items-center justify-center bg-background",
        className
      )}
    >
      <img
        src="/welcome-loading.png"
        alt=""
        className="w-full max-w-[200px] sm:max-w-[280px] h-auto object-contain"
        loading="eager"
      />
      <h2 className="mt-6 text-xl sm:text-2xl font-semibold text-foreground animate-pulse">
        Welcome to My Cafe
      </h2>
    </div>
  );
}
