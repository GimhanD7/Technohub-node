"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { fetchApi } from "@/lib/api";
import { digitsOnly, getEmailError, getPhoneError, normalizeEmail } from "@/lib/validation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";

const fallbackSettings = {
  heroBadge: "Student Support Desk",
  title: "Contact Techno-Hub",
  subtitle: "Speak with our education support team about classes, e-books, exam preparation, online lessons, and professional learning pathways.",
  phone: "+94 77 123 4567",
  whatsapp: "+94 77 123 4567",
  email: "support@technohub.lk",
  address: "Techno-Hub Learning Center, Colombo, Sri Lanka",
  officeHours: "Monday - Saturday, 8.30 AM - 6.00 PM",
  mapUrl: "",
  primaryCtaLabel: "Start a Conversation",
  primaryCtaUrl: "mailto:support@technohub.lk",
};

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  learnerType: "Student",
  subject: "",
  message: "",
};

const supportOptions = [
  { title: "Course Guidance", description: "Choose the right learning path for school, university, or professional goals." },
  { title: "Exam Support", description: "Ask about quizzes, ranking, e-books, and preparation resources." },
  { title: "Online Learning", description: "Get help with classes, video lessons, accounts, and access issues." },
];

function getWhatsappHref(phone) {
  if (!phone) return "#";
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

export default function ContactUsPage() {
  const [settings, setSettings] = useState(fallbackSettings);
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      const data = await fetchApi("/contact/get_settings");
      setIsLoading(false);

      if (data.success) {
        setSettings({ ...fallbackSettings, ...data.settings });
      }
    };

    loadSettings();
  }, []);

  const contactMethods = useMemo(() => [
    {
      label: "Phone",
      value: settings.phone,
      href: settings.phone ? `tel:${settings.phone}` : "#",
      icon: Phone,
    },
    {
      label: "Email",
      value: settings.email,
      href: settings.email ? `mailto:${settings.email}` : "#",
      icon: Mail,
    },
    {
      label: "WhatsApp",
      value: settings.whatsapp,
      href: getWhatsappHref(settings.whatsapp),
      icon: MessageCircle,
    },
  ].filter((item) => item.value), [settings.email, settings.phone, settings.whatsapp]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: field === "phone" ? digitsOnly(value) : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const emailError = getEmailError(form.email);
    if (emailError) {
      setErrorMsg(emailError);
      return;
    }

    if (form.phone) {
      const phoneError = getPhoneError(form.phone);
      if (phoneError) {
        setErrorMsg(phoneError);
        return;
      }
    }

    setIsSending(true);

    const response = await fetchApi("/contact/submit_message", {
      method: "POST",
      body: JSON.stringify({ ...form, email: normalizeEmail(form.email) }),
    });

    setIsSending(false);

    if (response.success) {
      setSuccessMsg(response.message);
      setForm(initialForm);
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      setErrorMsg(response.message || "Failed to send your message.");
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8fafc]">
        <section className="pt-28 pb-10 px-6 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.95fr_1.05fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-5">
                <Sparkles className="w-4 h-4" />
                {settings.heroBadge}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950 mb-5">
                {settings.title}
              </h1>
              <p className="text-slate-600 dark:text-white text-lg max-w-2xl leading-8">
                {settings.subtitle}
              </p>

              <div className="mt-8 grid sm:grid-cols-3 gap-3">
                {contactMethods.map((method) => {
                  const MethodIcon = method.icon;
                  return (
                    <a key={method.label} href={method.href} target={method.label === "WhatsApp" ? "_blank" : "_self"} rel="noreferrer" className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 text-left hover:border-primary/30 hover:bg-white dark:bg-[#1e293b] transition-colors">
                      <MethodIcon className="w-5 h-5 text-primary mb-3" />
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{method.label}</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1 break-words">{method.value}</p>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 min-h-[360px]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#1a3cb6_55%,#efc300_140%)]" />
              <div className="relative p-7 md:p-8 text-white h-full flex flex-col justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/60 font-bold">Education Help Center</p>
                  <h2 className="text-2xl md:text-3xl font-bold mt-4 max-w-lg">Get guidance before your next learning step.</h2>
                </div>
                <div className="grid sm:grid-cols-3 gap-3 mt-10">
                  {supportOptions.map((option, index) => (
                    <div key={option.title} className="rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#1e293b]/10 p-4 min-h-36">
                      <div className={`h-10 w-10 rounded-md flex items-center justify-center mb-5 ${index === 1 ? "bg-secondary text-slate-950" : "bg-primary dark:bg-[#1e293b]/15 text-white"}`}>
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{option.title}</h3>
                      <p className="text-xs leading-5 text-slate-600 dark:text-white/70 mt-2">{option.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-8">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.85fr_1.15fr] gap-6 items-start">
            <aside className="space-y-4">
              <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Visit and Support Hours</h2>
                {settings.address && (
                  <div className="flex gap-3 text-sm text-slate-600 dark:text-white mb-4">
                    <MapPin className="w-5 h-5 text-primary shrink-0" />
                    <span>{settings.address}</span>
                  </div>
                )}
                {settings.officeHours && (
                  <div className="flex gap-3 text-sm text-slate-600 dark:text-white">
                    <Clock className="w-5 h-5 text-primary shrink-0" />
                    <span>{settings.officeHours}</span>
                  </div>
                )}
                {settings.mapUrl && (
                  <a href={settings.mapUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-slate-900 dark:text-white">
                    Open Location
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>

              {settings.primaryCtaUrl && (
                <a href={settings.primaryCtaUrl} target="_blank" rel="noreferrer" className="block bg-white dark:bg-[#1e293b] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:border-primary/30 transition-colors">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Action</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-base font-bold text-slate-900 dark:text-white">{settings.primaryCtaLabel || "Contact Now"}</span>
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                </a>
              )}
            </aside>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1e293b] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5 md:p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Send a Message</h2>
                <p className="text-sm text-slate-500 dark:text-white mt-1">Share your question and the support team will follow up.</p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 dark:border-red-900/50 text-red-600 text-sm font-medium rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-green-50 border border-green-200 dark:border-green-900/50 text-green-700 text-sm font-medium rounded-lg flex gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  {successMsg}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                <input
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Full name"
                  className="h-11 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm outline-none focus:border-primary dark:bg-[#0f172a] focus:bg-white dark:bg-[#1e293b]"
                  required
                />
                <select
                  value={form.learnerType}
                  onChange={(event) => updateField("learnerType", event.target.value)}
                  className="h-11 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm outline-none focus:border-primary dark:bg-[#0f172a] focus:bg-white dark:bg-[#1e293b]"
                >
                  <option>Student</option>
                  <option>Parent</option>
                  <option>Teacher</option>
                  <option>Professional Learner</option>
                  <option>Institute Partner</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="Email address"
                  className="h-11 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm outline-none focus:border-primary dark:bg-[#0f172a] focus:bg-white dark:bg-[#1e293b]"
                />
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Phone number"
                  className="h-11 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm outline-none focus:border-primary dark:bg-[#0f172a] focus:bg-white dark:bg-[#1e293b]"
                />
              </div>

              <input
                value={form.subject}
                onChange={(event) => updateField("subject", event.target.value)}
                placeholder="Subject"
                className="h-11 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm outline-none focus:border-primary dark:bg-[#0f172a] focus:bg-white dark:bg-[#1e293b]"
                required
              />

              <textarea
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="How can we help?"
                rows={6}
                className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 py-3 text-sm outline-none focus:border-primary dark:bg-[#0f172a] focus:bg-white dark:bg-[#1e293b] resize-none"
                required
              />

              <Button type="submit" className="gap-2" disabled={isSending || isLoading}>
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
