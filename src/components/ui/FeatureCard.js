import { cn } from '@/lib/utils';

export default function FeatureCard({ icon, title, description, className }) {
  return (
    <div className={cn("p-6 rounded-2xl glass hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group", className)}>
      <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}
