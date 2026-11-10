import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import ClassSection from "@/components/ClassSection";
import HomeLatest from "@/components/HomeLatest";
import GameSection from "@/components/GameSection";
import Join from "@/components/Join";


// las regatas pasan a "Anteriores" según la fecha: se recalcula cada hora

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <ClassSection />
      <HomeLatest />
      <GameSection />
      <Join />
    </>
  );
}
