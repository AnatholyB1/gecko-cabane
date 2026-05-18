// src/app/[locale]/page.tsx
import { getTranslations } from 'next-intl/server'
import HoursDisplay from '@/components/HoursDisplay'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import MenuDisplay from '@/components/MenuDisplay'
import ReservationForm from '@/components/ReservationForm'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import GcDivider from '@/components/ui/GcDivider'

export default async function Home() {
  const t = await getTranslations()

  return (
    <div className="min-h-screen bg-gc-void font-cormorant">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-gc-gold focus:text-gc-void focus:px-4 focus:py-2 focus:font-cinzel focus:text-[12px] focus:tracking-[0.1em]"
      >
        {t('common.skipToContent')}
      </a>

      {/* ═══ NAVIGATION ═══ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-gc-void border-b border-gc-gold/10"
        role="navigation"
        aria-label={t('common.mainNav')}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-[72px] flex justify-between items-center">
          <a
            href="#"
            className="font-cinzel-decorative font-bold text-gc-gold text-xl tracking-[0.1em] focus:outline-none focus:ring-1 focus:ring-gc-gold"
            aria-label="Gecko Cabane - Accueil"
          >
            GECKO CABANE
          </a>
          <div className="hidden md:flex gap-8 font-raleway font-light text-[13px] tracking-[0.2em] uppercase" role="menubar">
            {[
              { href: '#about', key: 'common.about' },
              { href: '#menu', key: 'common.menu' },
              { href: '#hours', key: 'common.hours' },
              { href: '#reservation', key: 'common.reservation' },
              { href: '#contact', key: 'common.contact' },
            ].map(({ href, key }) => (
              <a
                key={href}
                href={href}
                className="text-gc-ivory/65 hover:text-gc-ivory transition-colors focus:outline-none focus:text-gc-gold"
                role="menuitem"
              >
                {t(key as Parameters<typeof t>[0])}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <a
              href="#reservation"
              className="font-cinzel text-[12px] tracking-[0.15em] uppercase text-gc-gold border border-gc-gold px-5 py-2.5 hover:bg-gc-gold hover:text-gc-void transition-all focus:outline-none focus:ring-1 focus:ring-gc-gold"
              aria-label={t('common.bookTable')}
            >
              {t('common.book')}
            </a>
          </div>
        </div>
      </nav>

      {/* Announcement Banner */}
      <div className="fixed top-[72px] left-0 right-0 z-40">
        <AnnouncementBanner />
      </div>

      <main id="main-content">

        {/* ═══ HERO ═══ */}
        <section className="relative min-h-screen flex items-center justify-center bg-gc-void pt-[72px] overflow-hidden">
          {/* Hero background image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-bg.jpg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            style={{ opacity: 0.28 }}
          />
          {/* Noise */}
          <div className="absolute inset-0 gc-noise pointer-events-none" aria-hidden="true" />
          {/* Vignette forte pour lisibilité du texte */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 85% 85% at 50% 50%, rgba(13,31,23,0.45) 30%, rgba(13,31,23,0.88) 100%)' }}
            aria-hidden="true"
          />
          {/* Botanical right */}
          <div className="absolute bottom-0 right-0 w-72 h-[440px] opacity-[0.07] gc-botanical pointer-events-none select-none" aria-hidden="true">
            <img src="/botanical-heliconia.svg" alt="" className="w-full h-full object-contain object-bottom" />
          </div>
          {/* Botanical left */}
          <div className="absolute top-20 left-0 w-56 h-80 opacity-[0.05] gc-botanical-slow pointer-events-none select-none" aria-hidden="true">
            <img src="/botanical-palm.svg" alt="" className="w-full h-full object-contain" />
          </div>

          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
            {/* Gecko décoratif au-dessus du titre */}
            <div className="flex justify-center mb-2" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/gecko-decorative.svg" alt="" className="gc-botanical" style={{ height: '72px', opacity: 0.75 }} />
            </div>
            <GcDivider />
            <h1 className="font-cinzel-decorative font-bold text-gc-gold tracking-[0.05em] leading-tight mt-5 mb-5"
                style={{ fontSize: 'clamp(40px, 8vw, 96px)' }}>
              GECKO CABANE
            </h1>
            <GcDivider />
            <p className="font-cormorant italic font-light text-gc-ivory/90 mt-7 mb-2 tracking-wide"
               style={{ fontSize: 'clamp(18px, 2.5vw, 24px)' }}>
              {t('hero.subtitle')}
            </p>
            <p className="font-raleway font-light text-[13px] tracking-[0.3em] uppercase text-gc-gold/55 mb-10">
              Krabi Town · Thaïlande
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#menu"
                className="font-cinzel text-[13px] tracking-[0.15em] uppercase text-gc-gold border border-gc-gold px-8 py-4 hover:bg-gc-gold hover:text-gc-void transition-all focus:outline-none focus:ring-1 focus:ring-gc-gold"
                aria-label={t('hero.discoverAriaLabel')}
              >
                {t('hero.discoverButton')}
              </a>
              <a
                href="#contact"
                className="font-raleway font-light text-[13px] tracking-[0.15em] uppercase text-gc-ivory/75 border border-gc-ivory/30 px-8 py-4 hover:border-gc-ivory/70 transition-all"
              >
                {t('hero.findUsButton')}
              </a>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" aria-hidden="true">
            <div className="w-px h-12 bg-gc-gold/50 gc-scroll-line" />
          </div>
        </section>

        {/* ═══ SIGNATURE ═══ */}
        <section className="relative bg-gc-jungle py-16 px-6 overflow-hidden">
          <div className="absolute inset-0 gc-noise pointer-events-none opacity-50" aria-hidden="true" />
          <div className="max-w-[720px] mx-auto text-center relative z-10">
            <GcDivider />
            <blockquote className="font-cormorant italic font-light text-gc-ivory leading-relaxed mt-6 mb-6"
                        style={{ fontSize: 'clamp(18px, 2.5vw, 26px)' }}>
              &ldquo;{t('about.chefQuote')}&rdquo;
            </blockquote>
            <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-gold/65">
              — {t('about.chefName')}
            </p>
            <GcDivider className="mt-6" />
          </div>
        </section>

        {/* ═══ ABOUT ═══ */}
        <section id="about" className="py-24 px-6 bg-gc-parchment relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-brass mb-4">
                  Notre Histoire
                </p>
                <h2
                  className="font-cinzel font-normal text-gc-text-dark leading-tight mb-6"
                  style={{ fontSize: 'clamp(26px, 3.5vw, 42px)' }}
                >
                  {t('about.title')}
                </h2>
                <div className="w-12 h-px bg-gc-gold mb-8" />
                <p className="font-cormorant text-[17px] text-gc-text-mid leading-[1.85] mb-5">
                  {t.rich('about.description1', {
                    chef: (chunks) => <span className="text-gc-text-dark font-semibold not-italic">{chunks}</span>
                  })}
                </p>
                <p className="font-cormorant text-[17px] text-gc-text-mid leading-[1.85] mb-8">
                  {t.rich('about.description2', {
                    seats: (chunks) => <span className="text-gc-text-dark font-semibold not-italic">{chunks}</span>
                  })}
                </p>
                <div className="flex items-start gap-4 p-5 border-l-[3px] border-gc-gold bg-gc-gold/5">
                  <svg className="w-5 h-5 text-gc-brass mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <p className="font-cormorant text-[16px] text-gc-text-dark leading-relaxed">
                    <strong>{t('about.important')} :</strong> {t('about.kitchenClose')}
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gc-void relative overflow-hidden" style={{ border: '1px solid rgba(198,155,60,0.2)' }}>
                  {/* Coins décoratifs */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gc-gold z-10" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gc-gold z-10" />

                  {/* Photo de la cheffe */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/chef-jariya.jpg"
                    alt="Chef Jariya — Gecko Cabane, Krabi"
                    className="w-full object-cover"
                    style={{ aspectRatio: '3/4', filter: 'sepia(0.3) contrast(1.05)', objectPosition: 'center top' }}
                  />

                  {/* Caption overlay */}
                  <div
                    className="relative z-10 text-center px-8 py-6"
                    style={{ background: 'linear-gradient(to bottom, transparent, rgba(13,31,23,0.97))' }}
                  >
                    <div className="w-20 h-px bg-gc-gold/30 mx-auto mb-4" />
                    <p className="font-raleway font-light text-[10px] tracking-[0.3em] uppercase text-gc-gold/65 mb-2">
                      Chef de cuisine
                    </p>
                    <h3 className="font-cinzel font-normal text-gc-ivory text-xl tracking-wide mb-3">
                      {t('about.chefName')}
                    </h3>
                    <p className="font-cormorant italic text-[16px] text-gc-ivory/70 leading-relaxed">
                      {t('about.chefQuote')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CUISINE ═══ */}
        <section id="cuisine" className="py-24 px-6 bg-gc-void relative overflow-hidden">
          <div className="absolute inset-0 gc-noise pointer-events-none" aria-hidden="true" />
          <div className="max-w-[1200px] mx-auto relative z-10">
            <div className="text-center mb-16">
              <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-gold/65 mb-4">
                Notre Cuisine
              </p>
              <h2
                className="font-cinzel font-normal text-gc-ivory mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 42px)' }}
              >
                {t('cuisine.title')}
              </h2>
              <GcDivider />
              <p className="font-cormorant italic text-[18px] text-gc-ivory/65 max-w-2xl mx-auto mt-6">
                {t('cuisine.description')}
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-16">
              {[
                {
                  icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 21H9m6 0a2 2 0 0 0 2-2v-2.25H7V19a2 2 0 0 0 2 2h6Zm-7.5-7.5h9" />
                    </svg>
                  ),
                  titleKey: 'french', descKey: 'frenchDesc',
                },
                {
                  icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                    </svg>
                  ),
                  titleKey: 'thai', descKey: 'thaiDesc',
                },
                {
                  icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  ),
                  titleKey: 'fusion', descKey: 'fusionDesc',
                },
                {
                  icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                    </svg>
                  ),
                  titleKey: 'healthy', descKey: 'healthyDesc',
                },
              ].map((item, i) => (
                <div key={i} className="gc-card-pilier group">
                  <div className="text-gc-gold mb-5 group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <h3 className="font-cinzel font-normal text-[17px] text-gc-ivory mb-3 tracking-wide">
                    {t(`cuisine.${item.titleKey}` as Parameters<typeof t>[0])}
                  </h3>
                  <p className="font-cormorant text-[15px] text-gc-ivory/60 leading-relaxed">
                    {t(`cuisine.${item.descKey}` as Parameters<typeof t>[0])}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                { titleKey: 'dinner', descKey: 'dinnerDesc' },
                { titleKey: 'brunch', descKey: 'brunchDesc' },
                { titleKey: 'drinks', descKey: 'drinksDesc' },
              ].map((item, i) => (
                <div key={i} className="border border-gc-gold/20 p-7 text-center hover:border-gc-gold/50 transition-colors">
                  <h3 className="font-cinzel font-normal text-[14px] text-gc-ivory tracking-widest uppercase mb-3">
                    {t(`cuisine.${item.titleKey}` as Parameters<typeof t>[0])}
                  </h3>
                  <div className="w-8 h-px bg-gc-gold/35 mx-auto mb-3" />
                  <p className="font-cormorant italic text-[15px] text-gc-ivory/55">
                    {t(`cuisine.${item.descKey}` as Parameters<typeof t>[0])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ MENU ═══ */}
        <section id="menu" className="py-24 px-6 bg-gc-parchment relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-12">
              <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-brass mb-4">
                La Carte
              </p>
              <h2
                className="font-cinzel font-normal text-gc-text-dark mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 42px)' }}
              >
                {t('menuSection.title')}
              </h2>
              <GcDivider dark />
              <p className="font-cormorant italic text-[18px] text-gc-text-mid max-w-2xl mx-auto mt-6">
                {t('menuSection.description')}
              </p>
            </div>
            <MenuDisplay />
          </div>
        </section>

        {/* ═══ GALERIE PLATS ═══ */}
        <section id="galerie" className="py-24 px-6 bg-gc-void relative overflow-hidden">
          <div className="absolute inset-0 gc-noise pointer-events-none" aria-hidden="true" />
          <div className="max-w-[1200px] mx-auto relative z-10">
            <div className="text-center mb-14">
              <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--gc-gold)' }}>
                Nos Créations
              </p>
              <h2
                className="font-cinzel font-normal text-gc-ivory"
                style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', letterSpacing: '0.03em' }}
              >
                La Table du Chef Jariya
              </h2>
              <GcDivider className="mt-4" />
            </div>

            {/* Grille 2×2 desktop, 1 col mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { src: '/food-curry.png', alt: 'Curry rouge gastronomique Franco-Thaï', caption: 'Curry Rouge · Lait de Coco & Kaffir' },
                { src: '/food-carpaccio.png', alt: 'Carpaccio de thon au sésame et gingembre', caption: 'Carpaccio de Thon · Sésame & Gingembre' },
                { src: '/food-dessert.png', alt: 'Panna cotta jasmin et coulis de fruit de la passion', caption: 'Panna Cotta Jasmin · Fruit de la Passion' },
                { src: '/food-seabass.png', alt: 'Bar grillé à la citronnelle et beurre blanc', caption: 'Bar de Mer · Citronnelle & Beurre Blanc' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden"
                  style={{ border: '1px solid rgba(198,155,60,0.12)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Caption overlay */}
                  <div
                    className="absolute bottom-0 left-0 right-0 px-5 py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                    style={{ background: 'linear-gradient(to top, rgba(13,31,23,0.95) 60%, transparent)' }}
                  >
                    <p
                      className="font-cormorant italic text-center"
                      style={{ fontSize: '16px', color: 'var(--gc-ivory)', letterSpacing: '0.04em' }}
                    >
                      {item.caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <p className="font-cormorant italic text-gc-ivory/50 text-[15px]">
                Cuisine Franco-Thaï gastronomique · Chef Jariya · Krabi, Thaïlande
              </p>
            </div>
          </div>
        </section>

        {/* ═══ SERVICES ═══ */}
        <section className="py-20 px-6 bg-gc-jungle relative overflow-hidden">
          <div className="absolute inset-0 gc-noise pointer-events-none opacity-50" aria-hidden="true" />
          <div className="max-w-[1200px] mx-auto relative z-10">
            <div className="text-center mb-12">
              <h2
                className="font-cinzel font-normal text-gc-ivory tracking-wide"
                style={{ fontSize: 'clamp(20px, 2.5vw, 32px)' }}
              >
                {t('services.title')}
              </h2>
              <GcDivider className="mt-4" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                {
                  icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" /></svg>,
                  labelKey: 'freeWifi',
                },
                {
                  icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>,
                  labelKey: 'cardsAccepted',
                },
                {
                  icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>,
                  labelKey: 'reservations',
                },
                {
                  icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>,
                  labelKey: 'tableService',
                },
                {
                  icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" /></svg>,
                  labelKey: 'streetParking',
                },
                {
                  icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>,
                  labelKey: 'vegetarian',
                },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3 p-5 border border-gc-ivory/10 hover:border-gc-gold/30 transition-colors text-center">
                  <div className="text-gc-gold">{item.icon}</div>
                  <p className="font-raleway font-light text-[11px] tracking-[0.1em] uppercase text-gc-ivory/65">
                    {t(`services.${item.labelKey}` as Parameters<typeof t>[0])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOURS ═══ */}
        <section id="hours" className="py-24 px-6 bg-gc-parchment relative overflow-hidden">
          <div className="max-w-[720px] mx-auto">
            <div className="text-center mb-12">
              <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-brass mb-4">
                Horaires
              </p>
              <h2
                className="font-cinzel font-normal text-gc-text-dark mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 42px)' }}
              >
                {t('hoursSection.title')}
              </h2>
              <GcDivider dark />
            </div>
            <HoursDisplay />
          </div>
        </section>

        {/* ═══ SOCIAL ═══ */}
        <section className="py-20 px-6 bg-gc-void relative overflow-hidden">
          <div className="absolute inset-0 gc-noise pointer-events-none" aria-hidden="true" />
          <div className="max-w-[860px] mx-auto text-center relative z-10">
            <h2
              className="font-cinzel font-normal text-gc-ivory mb-4"
              style={{ fontSize: 'clamp(20px, 2.5vw, 32px)' }}
            >
              {t('social.title')}
            </h2>
            <GcDivider className="mb-8" />
            <p className="font-cormorant italic text-[18px] text-gc-ivory/65 mb-12 max-w-xl mx-auto">
              {t('social.description')}
            </p>
            <div className="grid md:grid-cols-2 gap-5">
              <a
                href="https://fr.tripadvisor.be/Restaurant_Review-g297927-d2413872-Reviews-Gecko_Cabane_Restaurant_krabi-Krabi_Town_Krabi_Province.html"
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-gc-gold/20 p-8 hover:border-gc-gold/50 transition-colors text-left"
              >
                <p className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold/55 mb-4">TripAdvisor</p>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-gc-gold text-gc-gold" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <p className="font-cormorant text-[16px] text-gc-ivory/65 mb-5 leading-relaxed">
                  {t('social.tripAdvisorText')}
                </p>
                <span className="font-cinzel text-[12px] tracking-[0.1em] uppercase text-gc-gold group-hover:tracking-[0.2em] transition-all">
                  {t('social.readReviews')} →
                </span>
              </a>

              <a
                href="https://www.facebook.com/GeckoCabaneRestaurant/"
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-gc-gold/20 p-8 hover:border-gc-gold/50 transition-colors text-left"
              >
                <p className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold/55 mb-4">Facebook</p>
                <svg className="w-8 h-8 fill-gc-gold opacity-50 mb-4" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <p className="font-cormorant text-[16px] text-gc-ivory/65 mb-5 leading-relaxed">
                  {t('social.facebookText')}
                </p>
                <span className="font-cinzel text-[12px] tracking-[0.1em] uppercase text-gc-gold group-hover:tracking-[0.2em] transition-all">
                  {t('social.followUs')} →
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* ═══ RESERVATION ═══ */}
        <section id="reservation" className="py-24 px-6 bg-gc-jungle relative overflow-hidden">
          <div className="absolute inset-0 gc-noise pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-48 h-72 opacity-[0.05] pointer-events-none" aria-hidden="true">
            <img src="/botanical-lotus.svg" alt="" className="w-full h-full object-contain" />
          </div>
          <div className="max-w-[600px] mx-auto relative z-10">
            <div className="text-center mb-10">
              <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-gold/65 mb-4">
                Réservation
              </p>
              <h2
                className="font-cinzel font-normal text-gc-ivory mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 42px)' }}
              >
                {t('reservationForm.title')}
              </h2>
              <GcDivider />
              <p className="font-cormorant italic text-[17px] text-gc-ivory/65 mt-6">
                {t('reservationForm.subtitle')}
              </p>
            </div>

            <ReservationForm />
          </div>
        </section>

        {/* ═══ CONTACT ═══ */}
        <section id="contact" className="py-24 px-6 bg-gc-parchment relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-12">
              <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-brass mb-4">
                Nous trouver
              </p>
              <h2
                className="font-cinzel font-normal text-gc-text-dark mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 42px)' }}
              >
                {t('contactSection.title')}
              </h2>
              <GcDivider dark />
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="font-cinzel font-normal text-[18px] text-gc-text-dark tracking-wide mb-5">
                  {t('contactSection.addressTitle')}
                </h3>
                <div className="w-8 h-px bg-gc-gold mb-6" />
                <address className="font-cormorant not-italic text-[17px] text-gc-text-mid leading-[2.1] mb-8">
                  1/36-37 Soi Ruamjit<br />
                  Maharat Road<br />
                  Krabi Town 81000<br />
                  {t('contactSection.thailand')}
                </address>
                <div className="border-t border-gc-aged pt-6">
                  <h4 className="font-cinzel font-normal text-[13px] tracking-[0.15em] uppercase text-gc-text-dark mb-4">
                    {t('contactSection.reservationTitle')}
                  </h4>
                  <a
                    href="tel:+66819585945"
                    className="font-cormorant text-[22px] text-gc-brass hover:text-gc-text-dark transition-colors block mb-3"
                  >
                    +66 81 958 5945
                  </a>
                  <p className="font-cormorant italic text-[15px] text-gc-text-mid">
                    {t('contactSection.groupInfo')}
                  </p>
                </div>
              </div>

              <div className="bg-gc-void p-10 relative">
                <div className="absolute inset-0 border border-gc-gold/20" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gc-gold" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gc-gold" />
                <div className="relative z-10">
                  <h3 className="font-cinzel font-normal text-[18px] text-gc-ivory tracking-wide mb-5">
                    {t('contactSection.welcomeTitle')}
                  </h3>
                  <div className="w-8 h-px bg-gc-gold mb-6" />
                  <p className="font-cormorant text-[16px] text-gc-ivory/75 leading-[1.85] mb-8">
                    {t('contactSection.welcomeText')}
                  </p>
                  <div className="space-y-3 mb-8">
                    {[
                      t('contactSection.maxSeats'),
                      t('contactSection.chefTeam'),
                      t('contactSection.cuisineType'),
                    ].map((label, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-px h-4 bg-gc-gold/50 shrink-0" />
                        <span className="font-cormorant text-[15px] text-gc-ivory/65">{label}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-3">
                      <div className="w-px h-4 bg-gc-gold/50 shrink-0" />
                      <a href="tel:+66819585945" className="font-cormorant text-[15px] text-gc-ivory hover:text-gc-gold transition-colors">
                        +66 81 958 5945
                      </a>
                    </div>
                  </div>
                  <a
                    href="https://maps.google.com/?q=1/36-37+Soi+Ruamjit+Maharat+Road+Krabi+Town+81000+Thailand"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-cinzel text-[12px] tracking-[0.15em] uppercase text-gc-gold border border-gc-gold px-6 py-3 hover:bg-gc-gold hover:text-gc-void transition-all inline-block focus:outline-none focus:ring-1 focus:ring-gc-gold"
                    aria-label={t('contactSection.viewMapAriaLabel')}
                  >
                    {t('contactSection.viewOnMap')} →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ═══ FOOTER ═══ */}
      <footer
        className="bg-gc-void border-t border-gc-gold/15 py-16 px-6 relative overflow-hidden"
        role="contentinfo"
        aria-label={t('footer.restaurantInfo')}
      >
        <div className="absolute inset-0 gc-noise pointer-events-none" aria-hidden="true" />
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/gecko-decorative.svg" alt="" aria-hidden="true" style={{ height: '36px', opacity: 0.7 }} />
                <p className="font-cinzel-decorative font-bold text-gc-gold text-lg tracking-[0.1em]">
                  GECKO CABANE
                </p>
              </div>
              <GcDivider className="!text-left !mx-0 mb-4 text-[10px]" />
              <p className="font-cormorant text-[14px] text-gc-ivory/45 leading-relaxed">
                {t('footer.subtitle')}<br />
                {t('footer.location')}
              </p>
            </div>
            <div>
              <h4 className="font-cinzel font-normal text-[12px] tracking-[0.2em] uppercase text-gc-ivory/75 mb-4">
                {t('footer.hoursTitle')}
              </h4>
              <p className="font-cormorant text-[14px] text-gc-ivory/45 leading-[1.85]">
                {t('footer.openHours')}<br />
                {t('footer.closedDay')}<br />
                {t('footer.lastOrder')}
              </p>
            </div>
            <div>
              <h4 className="font-cinzel font-normal text-[12px] tracking-[0.2em] uppercase text-gc-ivory/75 mb-4">
                {t('footer.contactTitle')}
              </h4>
              <p className="font-cormorant text-[14px] text-gc-ivory/45 leading-[1.85] mb-2">
                1/36-37 Soi Ruamjit<br />
                Maharat Road, Krabi Town 81000<br />
                {t('contactSection.thailand')}
              </p>
              <a href="tel:+66819585945" className="font-cormorant text-[14px] text-gc-ivory/55 hover:text-gc-gold transition-colors">
                +66 81 958 5945
              </a>
            </div>
            <div>
              <h4 className="font-cinzel font-normal text-[12px] tracking-[0.2em] uppercase text-gc-ivory/75 mb-4">
                {t('footer.legalTitle')}
              </h4>
              <ul className="font-cormorant text-[13px] text-gc-ivory/35 space-y-1.5 leading-relaxed">
                <li>{t('footer.legalBusiness')}</li>
                <li>{t('footer.legalVat')}</li>
                <li>{t('footer.legalAlcohol')}</li>
                <li className="mt-2">{t('footer.legalPdpa')}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gc-gold/10 pt-5 mb-4">
            <p className="font-cormorant text-[12px] text-gc-ivory/25 leading-relaxed">
              {t('footer.legalNotice')}
            </p>
          </div>
          <div className="border-t border-gc-gold/10 pt-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-cormorant text-[13px] text-gc-ivory/35">
              © 2026 Gecko Cabane Restaurant
            </p>
            <GcDivider className="hidden md:block" />
            <p className="font-cormorant text-[12px] text-gc-ivory/25 text-center md:text-right">
              {t('footer.createdBy')}{' '}
              <a href="https://selenium-studio.com" target="_blank" rel="noopener noreferrer"
                 className="hover:text-gc-gold/60 underline transition-colors">selenium-studio.com</a>
              {' & '}
              <a href="https://anatholy-bricon.com" target="_blank" rel="noopener noreferrer"
                 className="hover:text-gc-gold/60 underline transition-colors">anatholy-bricon.com</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
