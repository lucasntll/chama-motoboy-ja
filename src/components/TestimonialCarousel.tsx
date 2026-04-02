import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StarRating from "@/components/StarRating";

const testimonials = [
  {
    name: "Maria Silva",
    initials: "MS",
    text: "Pedi um remédio às 22h e chegou em 20 minutos. Salvou minha noite!",
    rating: 5,
  },
  {
    name: "João Pedro",
    initials: "JP",
    text: "Uso toda semana pra buscar marmita no centro. Rápido e barato!",
    rating: 5,
  },
  {
    name: "Dona Lúcia",
    initials: "DL",
    text: "Muito fácil de usar, nem precisa instalar nada. Meus filhos que indicaram!",
    rating: 5,
  },
  {
    name: "Carlos Eduardo",
    initials: "CE",
    text: "Melhor serviço de motoboy da cidade. Sempre pontual e educado.",
    rating: 4,
  },
];

const TestimonialCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <div className="w-full">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {testimonials.map((t, i) => (
            <div key={i} className="min-w-0 shrink-0 grow-0 basis-full px-2">
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <StarRating rating={t.rating} size={14} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {testimonials.map((_, i) => (
          <button
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === selectedIndex ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
            }`}
            onClick={() => emblaApi?.scrollTo(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default TestimonialCarousel;
