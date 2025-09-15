import { HeroSection } from '@/components/landing/sections/hero/hero-section';
import { BackgroundEffects } from '@/components/landing/shared/background-effects';

export default function HomePage() {
  return (
    <main className="relative">
      <BackgroundEffects intensity="medium" />
      <HeroSection />
    </main>
  );
}