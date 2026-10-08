import type { Metadata } from "next";
import { BenefitsSection } from "@/components/home/benefits-section";
import { FaqSection } from "@/components/home/faq-section";
import { FeaturesSection } from "@/components/home/features-section";
import { FinalCtaSection } from "@/components/home/final-cta-section";
import { HeroSection } from "@/components/home/hero-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { JourneySection } from "@/components/home/journey-section";
import { ValueSection } from "@/components/home/value-section";
import { WhySection } from "@/components/home/why-section";
import { siteConfig } from "@/config/site";

const pageTitle = `${siteConfig.name} — Turn a future goal into a clear learning path`;

export const metadata: Metadata = {
  title: {
    absolute: pageTitle,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: pageTitle,
    description: siteConfig.description,
    url: siteConfig.url,
  },
  twitter: {
    title: pageTitle,
    description: siteConfig.description,
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValueSection />
      <HowItWorksSection />
      <FeaturesSection />
      <WhySection />
      <JourneySection />
      <BenefitsSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
