import { Code2, Zap, Shield, Globe, Layers, Rocket } from 'lucide-react';
import FeatureCard from '@/components/ui/FeatureCard';

const features = [
  {
    icon: <Code2 className="w-6 h-6 text-primary" />,
    title: "Clean Architecture",
    description: "Built with scalable patterns that ensure your codebase stays pristine as your project grows."
  },
  {
    icon: <Zap className="w-6 h-6 text-secondary" />,
    title: "Lightning Fast",
    description: "Optimized for performance from the ground up, delivering sub-second load times worldwide."
  },
  {
    icon: <Shield className="w-6 h-6 text-primary" />,
    title: "Enterprise Security",
    description: "Bank-grade encryption and security protocols come standard out of the box."
  },
  {
    icon: <Globe className="w-6 h-6 text-secondary" />,
    title: "Global Edge Network",
    description: "Deploy globally instantly and serve your content from the edge for lowest latency."
  },
  {
    icon: <Layers className="w-6 h-6 text-primary" />,
    title: "Modular Design",
    description: "Easily plug in and out components, microservices, and databases without headaches."
  },
  {
    icon: <Rocket className="w-6 h-6 text-secondary" />,
    title: "Continuous Delivery",
    description: "Push code and let our automated pipelines handle testing, building, and deployment."
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need, <span className="text-zinc-500">nothing you don't.</span></h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">Experience a platform engineered for speed, scalability, and unmatched developer experience.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
