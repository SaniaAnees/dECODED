import { GITHUB_URL } from "@/lib/site";

export function Footer() {
  return (
    <footer>
      <hr className="rule mx-auto max-w-5xl" />
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <p className="font-serif tracking-[0.18em] text-moon">dECODED</p>
          <p className="mt-2 max-w-sm font-serif italic text-dusk">
            Fewer tokens. Same work. The rest, in due season.
          </p>
        </div>
        <div className="flex items-center gap-8">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-serif text-[15px] text-mist hover:text-moon"
          >
            GitHub
          </a>
          <a href="#start" className="font-serif text-[15px] text-mist hover:text-moon">
            Waitlist
          </a>
          <p className="font-serif text-[15px] text-dusk">© 2026</p>
        </div>
      </div>
    </footer>
  );
}
