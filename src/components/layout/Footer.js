import Link from 'next/link';
import { Cpu, Globe, MessageCircle, Mail, Send, ArrowRight } from 'lucide-react';

const TwitterIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>;
const GithubIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>;
const LinkedinIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>;

export default function Footer() {
  return (
    <footer className="relative border-t border-black/5 dark:border-white/10 pt-20 pb-10 mt-24 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
     

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-4 lg:col-span-5">
            <Link href="/home" className="inline-flex items-center gap-3 mb-6 group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <Cpu className="w-6 h-6 transition-transform group-hover:rotate-12" />
              </div>
              <span className="font-bold text-2xl tracking-tight">Techno-Hub</span>
            </Link>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-sm leading-relaxed">
              Empowering the next generation of builders with tools that scale. We build the foundation, you build the future.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 hover:bg-primary hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 hover:bg-primary hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <GithubIcon className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 hover:bg-primary hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <LinkedinIcon className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 hover:bg-primary hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {/* Links Columns */}
          <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold mb-6 text-foreground">Platform</h4>
              <ul className="space-y-4">
                <li><Link href="/home" className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center group"><ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> Home</Link></li>
                <li><Link href="/dashboard" className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center group"><ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> Dashboard</Link></li>
                <li><Link href="/login" className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center group"><ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> Login</Link></li>
                <li><Link href="/register" className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center group"><ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> Register</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-foreground">Learning</h4>
              <ul className="space-y-4">
                <li><Link href="/home/courses" className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center group"><ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> Courses</Link></li>
                <li><Link href="/home/online-class" className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center group"><ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> Online Class</Link></li>
                <li><Link href="/home/exam-hall" className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center group"><ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> Exam Hall</Link></li>
                <li><Link href="/home/e-book" className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center group"><ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> E-Book</Link></li>
                <li><Link href="/home/ranker" className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center group"><ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> Ranker</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-foreground">Company</h4>
              <ul className="space-y-4">
                <li><Link href="/home/about" className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center group"><ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> About</Link></li>
                <li><Link href="/home/gallery" className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center group"><ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> Gallery</Link></li>
                <li><Link href="/home/contact-us" className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center group"><ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> Contact Us</Link></li>
                <li><Link href="/privacy" className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center group"><ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center group"><ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-black/5 dark:border-white/10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p className="text-sm text-zinc-500">
              © {new Date().getFullYear()} Techno-Hub Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-zinc-500 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full border border-black/5 dark:border-white/10">
              <span>Design By</span>
              <a href="https://www.facebook.com/share/1BToLNwWPY/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-bold text-[#061a59] dark:text-[#20c8e8] hover:text-[#0877ee] transition-colors group">
                <img src="/vortex-digital-labs-icon.png" alt="Vortex Digital Labs" className="h-5 w-5 rounded-full object-cover" />
                <span>Vortex Digital Labs</span>
              </a>
            </div>
          </div>
          
          <div className="flex gap-8">
            <Link href="/privacy" className="text-sm text-zinc-500 hover:text-foreground transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-[1px] after:w-0 after:bg-foreground hover:after:w-full after:transition-all after:duration-300">Privacy Policy</Link>
            <Link href="/terms" className="text-sm text-zinc-500 hover:text-foreground transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-[1px] after:w-0 after:bg-foreground hover:after:w-full after:transition-all after:duration-300">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
