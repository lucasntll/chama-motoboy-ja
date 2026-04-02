

## Landing Page Completa — ChamaMotoboy

### Visao Geral
Reescrever `Index.tsx` como uma landing page de alta conversao com 6 secoes, animacoes de scroll via Intersection Observer, e design mobile-first. Adicionar um hook `useScrollAnimation` e um botao flutuante de WhatsApp.

### Estrutura da Pagina

```text
┌─────────────────────────┐
│  HERO                   │  Headline animada + CTA grande
│  "A gente busca pra vc" │  + circulos decorativos
├─────────────────────────┤
│  COMO FUNCIONA          │  3 cards com icones
│  1. Pede  2. Busca  3.  │  (animam ao entrar na tela)
│     Entrega             │
├─────────────────────────┤
│  CONTADORES             │  +500 entregas | +50 clientes
│  (animam contando)      │  | 4.9 avaliacao
├─────────────────────────┤
│  DEPOIMENTOS            │  Carrossel com embla-carousel
│  (auto-play)            │  3-4 depoimentos locais
├─────────────────────────┤
│  CTA FINAL              │  Fundo primary, botao grande
│  "Peca agora"           │  "CHAMAR MOTOBOY"
├─────────────────────────┤
│  BOTTOM NAV             │  (existente)
└─────────────────────────┘
  [WhatsApp FAB]            Botao flutuante fixo
```

### Arquivos a Criar/Editar

1. **`src/hooks/useScrollAnimation.ts`** (novo)
   - Hook com IntersectionObserver que retorna ref + classe `isVisible`
   - Threshold 0.15, triggerOnce

2. **`src/components/AnimatedCounter.tsx`** (novo)
   - Componente que conta de 0 ate o valor alvo quando visivel
   - Usa requestAnimationFrame, duracao ~2s

3. **`src/components/TestimonialCarousel.tsx`** (novo)
   - Usa embla-carousel (ja instalado) com autoplay
   - 4 depoimentos com avatar, nome, texto e estrelas
   - Dots indicadores

4. **`src/components/WhatsAppFAB.tsx`** (novo)
   - Botao flutuante verde fixo no canto inferior direito
   - Acima do BottomNav (bottom-24)
   - Animacao pulse sutil

5. **`src/pages/Index.tsx`** (reescrita completa)
   - Hero: bg-primary com headline, subtitulo, botao CTA grande + botao WhatsApp secundario
   - Como Funciona: 3 cards com icones (ShoppingBag, Bike, Package) animados com scroll
   - Contadores: 3 AnimatedCounter em grid
   - Depoimentos: TestimonialCarousel
   - CTA Final: secao com bg-primary, texto persuasivo, botao grande
   - BottomNav no final

6. **`tailwind.config.ts`** — adicionar keyframe `count-up` (se necessario) e animacao `pulse-slow`

### Animacoes
- Hero: fade-in-up existente no load
- Secoes: fade-in-up via useScrollAnimation (Intersection Observer)
- Contadores: contagem progressiva quando visivel
- Carrossel: autoplay com embla-carousel-autoplay plugin
- WhatsApp FAB: pulse continuo sutil
- Botoes: hover:scale-105 + active:scale-95

### Dependencias
- `embla-carousel-autoplay` — precisa instalar para autoplay do carrossel

