import SectionHeading from "./SectionHeading";
import RegattaGame from "./RegattaGame";

export default function GameSection() {
  return (
    <section id="regata" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28">
      <SectionHeading
        index="03"
        kicker="Jugá"
        title={
          <>
            Regata <span className="text-sol">29er</span>
            <br />
            en tu pantalla
          </>
        }
      >
        Largá, ceñí hasta la boya de barlovento, izá el asimétrico en la popa y volvé a la línea. El viento rola y las ráfagas bajan por la cancha: leelas
        como en el agua. ¿Cuánto tardás?
      </SectionHeading>
      <div className="mt-14">
        <RegattaGame />
      </div>
    </section>
  );
}
