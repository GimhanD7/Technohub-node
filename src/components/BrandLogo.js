export default function BrandLogo({ className = "h-14 w-28", whiteOnly = false, fitted = false }) {
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
