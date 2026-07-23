export default function BrandLogo({
  className = "h-14 w-28",
  whiteOnly = false,
  fitted = false,
  horizontal = false,
  markOnly = false,
}) {
  if (horizontal || markOnly) {
    return (
      <span className={`${className} inline-flex items-center shrink-0`} aria-label="Techno Hub">
        <span className="relative block h-10 w-10 shrink-0">
          <img
            src="/brand/techno-hub-color-mark.png"
            alt=""
            className="absolute inset-0 h-full w-full object-contain dark:hidden"
          />
          <img
            src="/brand/techno-hub-white-mark.png"
            alt=""
            className="absolute inset-0 hidden h-full w-full object-contain dark:block"
          />
        </span>
        {!markOnly && (
          <span className="ml-2.5 whitespace-nowrap text-[17px] font-black leading-none tracking-[0.04em] text-[#0b4a66] dark:text-white">
            TECHNO HUB
          </span>
        )}
      </span>
    );
  }

  if (whiteOnly) {
    return <img src={fitted ? "/brand/techno-hub-white-logo.png" : "/brand/techno-hub-white-original-transparent.png"} alt="Techno Hub — Simply Learning Digitally" className={`${className} object-contain shrink-0`} />;
  }

  const colorSource = fitted ? "/brand/techno-hub-color-logo.png" : "/brand/techno-hub-color-original.jpeg";
  const whiteSource = fitted ? "/brand/techno-hub-white-logo.png" : "/brand/techno-hub-white-original-transparent.png";

  return (
    <span className={`${className} relative block shrink-0`} aria-label="Techno Hub">
      <img src={colorSource} alt="" className="absolute inset-0 h-full w-full object-contain mix-blend-multiply dark:hidden" />
      <img src={whiteSource} alt="" className="absolute inset-0 hidden h-full w-full object-contain dark:block" />
    </span>
  );
}
