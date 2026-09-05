import { SignInPanelPlane } from "@/components/auth/SignInPanelPlane";
import { Wordmark } from "@/components/landing/Wordmark";

export function SignInBrandPanel() {
  return (
    <div className="relative flex min-h-[240px] flex-col overflow-hidden md:min-h-screen">
      <SignInPanelPlane />
      <div className="relative z-10 flex flex-1 flex-col items-center px-2 pt-[14vh] md:pt-[16vh]">
        <Wordmark
          className="text-[1.85rem] font-medium text-[#f7f1e6] md:text-4xl"
          href="/"
        />
      </div>
    </div>
  );
}
