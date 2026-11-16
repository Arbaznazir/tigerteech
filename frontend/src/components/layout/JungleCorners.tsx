import Image from "next/image";

/**
 * Corner canopy on every page. Clicks pass through so the header stays usable.
 * Hidden while the mobile menu is open (see globals.css).
 */
export function JungleCorners() {
  return (
    <div className="jungle-corners pointer-events-none" aria-hidden>
      <div className="absolute left-0 top-0 z-10 w-[118px] sm:w-[168px] md:z-[52] md:w-[210px] lg:w-[248px]">
        <Image
          src="/images/jungle/macaw-canopy.webp"
          alt=""
          width={863}
          height={1822}
          priority
          className="h-auto w-full"
          sizes="(min-width: 1024px) 248px, 168px"
        />
      </div>
      <div className="absolute right-0 top-0 z-10 w-[128px] sm:w-[186px] md:z-[52] md:w-[240px] lg:w-[286px]">
        <Image
          src="/images/jungle/owl-corner.webp"
          alt=""
          width={1024}
          height={1536}
          priority
          className="h-auto w-full"
          sizes="(min-width: 1024px) 286px, 186px"
        />
      </div>
    </div>
  );
}
