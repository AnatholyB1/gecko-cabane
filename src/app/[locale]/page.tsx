import { getTranslations } from 'next-intl/server'
import HoursDisplay from '@/components/HoursDisplay'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import MenuDisplay from '@/components/MenuDisplay'
import ReservationForm from '@/components/ReservationForm'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default async function Home() {
  const t = await getTranslations()

  return (
    <div className="min-h-screen bg-[var(--background)] font-[family-name:var(--font-playfair)]">
      {/* Skip to main content - Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-[var(--primary)] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        {t('common.skipToContent')}
      </a>

      {/* Navigation */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 bg-[var(--warm-white)]/95 backdrop-blur-sm shadow-sm"
        role="navigation"
        aria-label={t('common.mainNav')}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <a 
            href="#" 
            className="text-2xl font-bold text-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 rounded-lg"
            aria-label="Gecko Cabane - Accueil"
          >
            🦎 Gecko Cabane
          </a>
          <div className="hidden md:flex gap-8 text-[var(--warm-gray)] font-[family-name:var(--font-lora)]" role="menubar">
            <a href="#about" className="hover:text-[var(--primary)] transition-colors focus:outline-none focus:text-[var(--primary)] focus:underline" role="menuitem">{t('common.about')}</a>
            <a href="#menu" className="hover:text-[var(--primary)] transition-colors focus:outline-none focus:text-[var(--primary)] focus:underline" role="menuitem">{t('common.menu')}</a>
            <a href="#hours" className="hover:text-[var(--primary)] transition-colors focus:outline-none focus:text-[var(--primary)] focus:underline" role="menuitem">{t('common.hours')}</a>
            <a href="#reservation" className="hover:text-[var(--primary)] transition-colors focus:outline-none focus:text-[var(--primary)] focus:underline" role="menuitem">{t('common.reservation')}</a>
            <a href="#contact" className="hover:text-[var(--primary)] transition-colors focus:outline-none focus:text-[var(--primary)] focus:underline" role="menuitem">{t('common.contact')}</a>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <a 
              href="#reservation" 
              className="bg-[var(--primary)] text-white px-5 py-2 rounded-full hover:bg-[var(--primary-dark)] transition-colors font-[family-name:var(--font-lora)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
              aria-label={t('common.bookTable')}
            >
              {t('common.book')}
            </a>
          </div>
        </div>
      </nav>

      {/* Announcement Banner - below nav */}
      <div className="fixed top-[72px] left-0 right-0 z-40">
        <AnnouncementBanner />
      </div>

      <main id="main-content">
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--jungle-dark)] via-[var(--primary)] to-[var(--accent)] pt-20 overflow-hidden">
        {/* Jungle decorations */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating leaves and light effects */}
          <div className="absolute top-20 left-10 w-40 h-40 bg-[var(--leaf-green)] rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-40 right-20 w-56 h-56 bg-[var(--moss)] rounded-full blur-3xl opacity-25"></div>
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-[var(--tropical)] rounded-full blur-2xl opacity-30"></div>
          <div className="absolute top-10 right-10 w-24 h-24 bg-[var(--warm-gold)] rounded-full blur-2xl opacity-20"></div>
          
          {/* Decorative leaves */}
          <div className="absolute top-20 left-0 text-6xl md:text-8xl opacity-20 transform -rotate-45">🌿</div>
          <div className="absolute top-40 right-5 text-5xl md:text-7xl opacity-20 transform rotate-12">🍃</div>
          <div className="absolute bottom-32 left-10 text-5xl md:text-7xl opacity-20 transform rotate-45">🌿</div>
          <div className="absolute bottom-20 right-20 text-4xl md:text-6xl opacity-20 transform -rotate-12">🍃</div>
          <div className="absolute top-1/3 right-1/4 text-4xl opacity-15">🌴</div>
          <div className="absolute bottom-1/3 left-1/4 text-5xl opacity-15">🌴</div>
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="text-7xl md:text-8xl mb-6 drop-shadow-lg">🦎</div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            Gecko Cabane
          </h1>
          <p className="text-xl md:text-2xl text-[var(--accent-light)] mb-4 font-[family-name:var(--font-lora)]">
            {t('hero.subtitle')}
          </p>
          <p className="text-lg text-[var(--moss)] mb-8 font-[family-name:var(--font-lora)] italic">
            🌿 {t('hero.tagline')} 🌿
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#cuisine" 
              className="bg-[var(--warm-gold)] text-white px-8 py-4 rounded-full hover:bg-[var(--bamboo)] transition-all hover:scale-105 font-[family-name:var(--font-lora)] shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--primary)]"
              aria-label={t('hero.discoverAriaLabel')}
            >
              🍽️ {t('hero.discoverButton')}
            </a>
            <a 
              href="#contact" 
              className="border-2 border-white text-white px-8 py-4 rounded-full hover:bg-white hover:text-[var(--primary-dark)] transition-all hover:scale-105 font-[family-name:var(--font-lora)] backdrop-blur-sm"
            >
              📍 {t('hero.findUsButton')}
            </a>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
        
        {/* Bottom jungle border */}
        <div className="absolute bottom-0 left-0 right-0 text-4xl md:text-6xl flex justify-center gap-2 opacity-30">
          🌿🍃🌴🍃🌿🍃🌴🍃🌿
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-[var(--warm-white)] relative overflow-hidden">
        {/* Decorative leaves */}
        <div className="absolute top-10 right-10 text-6xl opacity-10">🌿</div>
        <div className="absolute bottom-10 left-10 text-6xl opacity-10">🍃</div>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-[var(--primary-dark)] mb-6">
                🌿 {t('about.title')}
              </h2>
              <div className="w-24 h-1 bg-[var(--warm-gold)] mb-8"></div>
              <p className="text-lg text-[var(--warm-gray)] font-[family-name:var(--font-lora)] leading-relaxed mb-6">
                {t.rich('about.description1', {
                  chef: (chunks) => <span className="text-[var(--tropical)] font-semibold">{chunks}</span>
                })}
              </p>
              <p className="text-lg text-[var(--warm-gray)] font-[family-name:var(--font-lora)] leading-relaxed mb-6">
                {t.rich('about.description2', {
                  seats: (chunks) => <span className="text-[var(--primary)] font-semibold">{chunks}</span>
                })}
              </p>
              <div className="flex items-center gap-4 p-4 bg-[var(--accent-light)] rounded-lg">
                <span className="text-3xl">⚠️</span>
                <p className="text-[var(--primary-dark)] font-[family-name:var(--font-lora)]">
                  <strong>{t('about.important')}:</strong> {t('about.kitchenClose')}
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-[var(--tropical)] to-[var(--jungle-dark)] rounded-3xl p-8 text-white shadow-2xl">
                <div className="text-6xl mb-4">👩‍🍳</div>
                <h3 className="text-2xl font-bold mb-4">{t('about.chefName')} 🦎</h3>
                <p className="font-[family-name:var(--font-lora)] opacity-90">
                  {t('about.chefQuote')}
                </p>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[var(--leaf-green)] rounded-full opacity-40"></div>
              <div className="absolute -top-2 -left-2 text-4xl opacity-30">🌿</div>
            </div>
          </div>
        </div>
      </section>

      {/* Cuisine Section */}
      <section id="cuisine" className="py-24 px-6 bg-[var(--background)] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 text-8xl opacity-5">🌿</div>
        <div className="absolute bottom-0 right-0 text-8xl opacity-5">🍃</div>
        
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--primary-dark)] mb-6">
            🌽 {t('cuisine.title')}
          </h2>
          <div className="w-24 h-1 bg-[var(--warm-gold)] mx-auto mb-8"></div>
          <p className="text-xl text-[var(--warm-gray)] font-[family-name:var(--font-lora)] mb-16 max-w-2xl mx-auto">
            {t('cuisine.description')}
          </p>
          
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {[
              { emoji: "🧑‍🍳", titleKey: "french", descKey: "frenchDesc" },
              { emoji: "🌶️", titleKey: "thai", descKey: "thaiDesc" },
              { emoji: "✨", titleKey: "fusion", descKey: "fusionDesc" },
              { emoji: "🥗", titleKey: "healthy", descKey: "healthyDesc" },
            ].map((item, i) => (
              <div key={i} className="bg-[var(--warm-white)] p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 border-b-4 border-[var(--tropical)]">
                <div className="text-5xl mb-4">{item.emoji}</div>
                <h3 className="text-xl font-bold text-[var(--primary-dark)] mb-2">{t(`cuisine.${item.titleKey}`)}</h3>
                <p className="text-[var(--warm-gray)] font-[family-name:var(--font-lora)]">{t(`cuisine.${item.descKey}`)}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: "🍽️", titleKey: "dinner", descKey: "dinnerDesc" },
              { emoji: "🥐", titleKey: "brunch", descKey: "brunchDesc" },
              { emoji: "🍷", titleKey: "drinks", descKey: "drinksDesc" },
            ].map((item, i) => (
              <div key={i} className="bg-gradient-to-br from-[var(--accent-light)] to-[var(--warm-white)] p-6 rounded-xl">
                <div className="text-4xl mb-3">{item.emoji}</div>
                <h3 className="text-lg font-bold text-[var(--primary-dark)] mb-1">{t(`cuisine.${item.titleKey}`)}</h3>
                <p className="text-sm text-[var(--warm-gray)] font-[family-name:var(--font-lora)]">{t(`cuisine.${item.descKey}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-24 px-6 bg-[var(--warm-white)] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 text-8xl opacity-10">🍽️</div>
        <div className="absolute bottom-10 left-10 text-8xl opacity-10">🌿</div>
        
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--primary-dark)] text-center mb-6">
            📜 {t('menuSection.title')}
          </h2>
          <div className="w-24 h-1 bg-[var(--warm-gold)] mx-auto mb-8"></div>
          <p className="text-xl text-[var(--warm-gray)] font-[family-name:var(--font-lora)] mb-12 max-w-2xl mx-auto text-center">
            {t('menuSection.description')}
          </p>
          
          <MenuDisplay />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-[var(--jungle-dark)] to-[var(--primary-dark)] text-white relative overflow-hidden">
        {/* Jungle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl">🌿</div>
          <div className="absolute top-20 right-20 text-5xl">🍃</div>
          <div className="absolute bottom-10 left-1/4 text-6xl">🌴</div>
          <div className="absolute bottom-20 right-10 text-5xl">🌿</div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6">
            🦎 {t('services.title')}
          </h2>
          <div className="w-24 h-1 bg-[var(--warm-gold)] mx-auto mb-16"></div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[
              { emoji: "🍺", labelKey: "fullBar" },
              { emoji: "🍷", labelKey: "beersWines" },
              { emoji: "💳", labelKey: "cardsAccepted" },
              { emoji: "👶", labelKey: "highChairs" },
              { emoji: "📅", labelKey: "reservations" },
              { emoji: "🍸", labelKey: "alcoholServed" },
              { emoji: "🛎️", labelKey: "tableService" },
              { emoji: "🅿️", labelKey: "streetParking" },
              { emoji: "📶", labelKey: "freeWifi" },
              { emoji: "🥬", labelKey: "vegetarian" },
              { emoji: "🌾", labelKey: "glutenFree" },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl text-center hover:bg-white/20 transition-colors">
                <div className="text-3xl mb-2">{item.emoji}</div>
                <p className="text-sm font-[family-name:var(--font-lora)]">{t(`services.${item.labelKey}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hours Section */}
      <section id="hours" className="py-24 px-6 bg-[var(--warm-white)] relative overflow-hidden">
        {/* Decorative leaves */}
        <div className="absolute top-0 left-0 text-9xl opacity-5">🌿</div>
        <div className="absolute bottom-0 right-0 text-9xl opacity-5">🍃</div>
        
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--primary-dark)] text-center mb-6">
            ⏰ {t('hoursSection.title')}
          </h2>
          <div className="w-24 h-1 bg-[var(--warm-gold)] mx-auto mb-12"></div>
          
          <HoursDisplay />
        </div>
      </section>

      {/* Social & Reviews Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[var(--background)] to-[var(--accent-light)] relative overflow-hidden">
        <div className="absolute top-10 right-10 text-6xl opacity-10">🌿</div>
        <div className="absolute bottom-10 left-10 text-6xl opacity-10">🍃</div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--primary-dark)] mb-6">
            ⭐ {t('social.title')}
          </h2>
          <div className="w-24 h-1 bg-[var(--warm-gold)] mx-auto mb-8"></div>
          <p className="text-xl text-[var(--warm-gray)] font-[family-name:var(--font-lora)] mb-12 max-w-2xl mx-auto">
            {t('social.description')}
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* TripAdvisor */}
            <a 
              href="https://fr.tripadvisor.be/Restaurant_Review-g297927-d2413872-Reviews-Gecko_Cabane_Restaurant_krabi-Krabi_Town_Krabi_Province.html"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border-b-4 border-[#00af87]"
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="#00af87">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                <span className="text-2xl font-bold text-[#00af87]">TripAdvisor</span>
              </div>
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-2xl">⭐</span>
                ))}
              </div>
              <p className="text-[var(--warm-gray)] font-[family-name:var(--font-lora)] mb-4">
                {t('social.tripAdvisorText')}
              </p>
              <span className="inline-flex items-center gap-2 text-[#00af87] font-semibold group-hover:gap-3 transition-all">
                {t('social.readReviews')} →
              </span>
            </a>

            {/* Facebook */}
            <a 
              href="https://www.facebook.com/GeckoCabaneRestaurant/"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border-b-4 border-[#1877f2]"
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="#1877f2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-2xl font-bold text-[#1877f2]">Facebook</span>
              </div>
              <div className="text-4xl mb-4">👍</div>
              <p className="text-[var(--warm-gray)] font-[family-name:var(--font-lora)] mb-4">
                {t('social.facebookText')}
              </p>
              <span className="inline-flex items-center gap-2 text-[#1877f2] font-semibold group-hover:gap-3 transition-all">
                {t('social.followUs')} →
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Reservation Section */}
      <section id="reservation" className="py-24 px-6 bg-gradient-to-br from-[var(--primary)] via-[var(--jungle-dark)] to-[var(--primary-dark)] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 text-8xl opacity-10">🌿</div>
        <div className="absolute bottom-10 right-10 text-8xl opacity-10">🍃</div>
        <div className="absolute top-1/2 left-1/4 text-6xl opacity-10">🦎</div>
        
        <div className="max-w-2xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
            📅 {t('reservationForm.title')}
          </h2>
          <div className="w-24 h-1 bg-[var(--warm-gold)] mx-auto mb-8"></div>
          <p className="text-center text-[var(--accent-light)] font-[family-name:var(--font-lora)] mb-10">
            {t('reservationForm.subtitle')}
          </p>
          
          {/* Coming-soon overlay */}
          <div className="relative">
            {/* Banner */}
            <div className="mb-6 rounded-2xl overflow-hidden shadow-lg">
              <div className="bg-amber-400 px-5 py-3 flex items-center justify-center gap-2">
                <span className="text-lg">🔨</span>
                <span className="font-bold text-amber-900 text-sm uppercase tracking-wider">{t('reservationForm.comingSoonBadge')}</span>
                <span className="text-lg">🔨</span>
              </div>
              <div className="bg-amber-50 px-6 py-4 text-center border-x-2 border-b-2 border-amber-400 rounded-b-2xl">
                <p className="font-bold text-amber-900 text-lg mb-1">{t('reservationForm.comingSoonTitle')}</p>
                <p className="text-amber-800 text-sm">{t('reservationForm.comingSoonText')}</p>
              </div>
            </div>

            {/* Form — visible but not interactive */}
            <div className="pointer-events-none select-none opacity-50 blur-[1px]" aria-hidden="true">
              <ReservationForm />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 bg-gradient-to-br from-[var(--accent-light)] via-[var(--background)] to-[var(--warm-white)] relative overflow-hidden">
        {/* Decorative jungle elements */}
        <div className="absolute top-10 left-5 text-7xl opacity-10">🌿</div>
        <div className="absolute bottom-10 right-5 text-7xl opacity-10">🌴</div>
        <div className="absolute top-1/2 right-10 text-5xl opacity-10">🍃</div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--primary-dark)] text-center mb-6">
            📍 {t('contactSection.title')}
          </h2>
          <div className="w-24 h-1 bg-[var(--warm-gold)] mx-auto mb-12"></div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white rounded-3xl shadow-xl p-8 border-l-4 border-[var(--tropical)]">
              <h3 className="text-2xl font-bold text-[var(--primary-dark)] mb-6">🌿 {t('contactSection.addressTitle')}</h3>
              <p className="text-lg text-[var(--warm-gray)] font-[family-name:var(--font-lora)] mb-6 leading-relaxed">
                1/36-37 Soi Ruamjit<br />
                Maharat Road<br />
                Krabi Town 81000<br />
                {t('contactSection.thailand')}
              </p>
              
              <div className="border-t border-[var(--accent-light)] pt-6 mt-6">
                <h4 className="font-bold text-[var(--primary-dark)] mb-4">📞 {t('contactSection.reservationTitle')}</h4>
                <a 
                  href="tel:+66819585945" 
                  className="inline-flex items-center gap-2 text-[var(--tropical)] font-semibold text-lg hover:text-[var(--primary-dark)] transition-colors mb-4"
                >
                  <span>📱</span> +66 81 958 5945
                </a>
                <p className="text-[var(--warm-gray)] font-[family-name:var(--font-lora)] text-sm">
                  {t('contactSection.groupInfo')}
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-[var(--tropical)] to-[var(--jungle-dark)] rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
              {/* Decorative leaf */}
              <div className="absolute top-2 right-2 text-4xl opacity-20">🌿</div>
              <div className="absolute bottom-2 left-2 text-3xl opacity-20">🍃</div>
              
              <h3 className="text-2xl font-bold mb-6">🦎 {t('contactSection.welcomeTitle')}</h3>
              <p className="font-[family-name:var(--font-lora)] opacity-90 mb-8 leading-relaxed">
                {t('contactSection.welcomeText')}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">👥</span>
                  <span className="font-[family-name:var(--font-lora)]">{t('contactSection.maxSeats')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl">👩‍🍳</span>
                  <span className="font-[family-name:var(--font-lora)]">{t('contactSection.chefTeam')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl">🍽️</span>
                  <span className="font-[family-name:var(--font-lora)]">{t('contactSection.cuisineType')}</span>
                </div>
                <a href="tel:+66819585945" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                  <span className="text-2xl">📱</span>
                  <span className="font-[family-name:var(--font-lora)] font-semibold">+66 81 958 5945</span>
                </a>
              </div>
              
              <a 
                href="https://maps.google.com/?q=1/36-37+Soi+Ruamjit+Maharat+Road+Krabi+Town+81000+Thailand"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-8 bg-white text-[var(--primary)] px-6 py-3 rounded-full font-semibold hover:bg-[var(--accent-light)] transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                aria-label={t('contactSection.viewMapAriaLabel')}
              >
                {t('contactSection.viewOnMap')} →
              </a>
            </div>
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer 
        className="bg-gradient-to-br from-[var(--jungle-dark)] to-[var(--primary-dark)] text-white py-12 px-6 relative overflow-hidden"
        role="contentinfo"
        aria-label={t('footer.restaurantInfo')}
      >
        {/* Decorative jungle elements */}
        <div className="absolute top-0 left-0 right-0 text-4xl opacity-10 flex justify-center gap-4">
          🌿🍃🌴🍃🌿🍃🌴🍃🌿
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Main footer grid */}
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div>
              <h3 className="text-2xl font-bold mb-4">🦎 Gecko Cabane</h3>
              <p className="font-[family-name:var(--font-lora)] opacity-80 text-sm leading-relaxed">
                {t('footer.subtitle')}<br />
                🌿 {t('footer.location')}
              </p>
            </div>

            {/* Hours */}
            <div>
              <h4 className="font-bold mb-4">⏰ {t('footer.hoursTitle')}</h4>
              <p className="font-[family-name:var(--font-lora)] opacity-80 text-sm leading-relaxed">
                {t('footer.openHours')}<br />
                {t('footer.closedDay')}<br />
                {t('footer.lastOrder')}
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold mb-4">📍 {t('footer.contactTitle')}</h4>
              <p className="font-[family-name:var(--font-lora)] opacity-80 text-sm leading-relaxed mb-2">
                1/36-37 Soi Ruamjit<br />
                Maharat Road, Krabi Town 81000<br />
                {t('contactSection.thailand')} 🇹🇭
              </p>
              <a href="tel:+66819585945" className="font-[family-name:var(--font-lora)] opacity-90 hover:opacity-100 transition-opacity flex items-center gap-2 text-sm">
                📱 +66 81 958 5945
              </a>
            </div>

            {/* Mentions légales */}
            <div>
              <h4 className="font-bold mb-4">⚖️ {t('footer.legalTitle')}</h4>
              <ul className="font-[family-name:var(--font-lora)] opacity-80 text-sm space-y-1 leading-relaxed">
                <li>{t('footer.legalBusiness')}</li>
                <li>{t('footer.legalVat')}</li>
                <li>{t('footer.legalAlcohol')}</li>
                <li className="mt-2">{t('footer.legalPdpa')}</li>
              </ul>
            </div>
          </div>

          {/* Legal notice block */}
          <div className="border-t border-white/10 pt-6 mb-6">
            <p className="font-[family-name:var(--font-lora)] opacity-50 text-xs leading-relaxed">
              {t('footer.legalNotice')}
            </p>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-[family-name:var(--font-lora)] opacity-60 text-sm text-center md:text-left">
              © 2026 Gecko Cabane Restaurant 🦎 {t('footer.rights')}
            </p>
            <p className="text-xl opacity-20">🌿🦎🌿</p>
            <p className="font-[family-name:var(--font-lora)] opacity-40 text-xs text-center md:text-right">
              {t('footer.createdBy')}{" "}
              <a 
                href="https://selenium-studio.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-100 underline transition-opacity"
              >
                selenium-studio.com
              </a>
              {" & "}
              <a 
                href="https://anatholy-bricon.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-100 underline transition-opacity"
              >
                anatholy-bricon.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
