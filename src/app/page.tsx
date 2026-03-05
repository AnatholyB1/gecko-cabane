import HoursDisplay from '@/components/HoursDisplay'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import MenuDisplay from '@/components/MenuDisplay'
import ReservationForm from '@/components/ReservationForm'

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] font-[family-name:var(--font-playfair)]">
      {/* Skip to main content - Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-[var(--primary)] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Aller au contenu principal
      </a>

      {/* Navigation */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 bg-[var(--warm-white)]/95 backdrop-blur-sm shadow-sm"
        role="navigation"
        aria-label="Navigation principale"
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
            <a href="#about" className="hover:text-[var(--primary)] transition-colors focus:outline-none focus:text-[var(--primary)] focus:underline" role="menuitem">À Propos</a>
            <a href="#menu" className="hover:text-[var(--primary)] transition-colors focus:outline-none focus:text-[var(--primary)] focus:underline" role="menuitem">Menu</a>
            <a href="#hours" className="hover:text-[var(--primary)] transition-colors focus:outline-none focus:text-[var(--primary)] focus:underline" role="menuitem">Horaires</a>
            <a href="#reservation" className="hover:text-[var(--primary)] transition-colors focus:outline-none focus:text-[var(--primary)] focus:underline" role="menuitem">Réservation</a>
            <a href="#contact" className="hover:text-[var(--primary)] transition-colors focus:outline-none focus:text-[var(--primary)] focus:underline" role="menuitem">Contact</a>
          </div>
          <a 
            href="#reservation" 
            className="bg-[var(--primary)] text-white px-5 py-2 rounded-full hover:bg-[var(--primary-dark)] transition-colors font-[family-name:var(--font-lora)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
            aria-label="Réserver une table"
          >
            Réserver
          </a>
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
            Restaurant Franco-Thaï
          </p>
          <p className="text-lg text-[var(--moss)] mb-8 font-[family-name:var(--font-lora)] italic">
            🌿 Une fusion culinaire au cœur de la jungle de Krabi 🌿
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#cuisine" 
              className="bg-[var(--warm-gold)] text-white px-8 py-4 rounded-full hover:bg-[var(--bamboo)] transition-all hover:scale-105 font-[family-name:var(--font-lora)] shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--primary)]"
              aria-label="Découvrir notre carte et nos spécialités"
            >
              🍽️ Découvrir notre cuisine
            </a>
            <a 
              href="#contact" 
              className="border-2 border-white text-white px-8 py-4 rounded-full hover:bg-white hover:text-[var(--primary-dark)] transition-all hover:scale-105 font-[family-name:var(--font-lora)] backdrop-blur-sm"
            >
              📍 Nous trouver
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
                🌿 Bienvenue dans notre cabane
              </h2>
              <div className="w-24 h-1 bg-[var(--warm-gold)] mb-8"></div>
              <p className="text-lg text-[var(--warm-gray)] font-[family-name:var(--font-lora)] leading-relaxed mb-6">
                Niché au cœur de Krabi, notre restaurant de type gastronomique Franco-Thaï avec une salle à taille humaine où la 
                <span className="text-[var(--tropical)] font-semibold"> cheffe Jariya </span> 
                et son équipe vous reçoivent avec chaleur et passion.
              </p>
              <p className="text-lg text-[var(--warm-gray)] font-[family-name:var(--font-lora)] leading-relaxed mb-6">
                Avec seulement <span className="text-[var(--primary)] font-semibold">40 places maximum</span>, 
                nous privilégions une expérience intime et personnalisée. Pour les groupes de plus de 10 personnes, 
                la réservation est préconisée par téléphone ou contact direct sur place.
              </p>
              <div className="flex items-center gap-4 p-4 bg-[var(--accent-light)] rounded-lg">
                <span className="text-3xl">⚠️</span>
                <p className="text-[var(--primary-dark)] font-[family-name:var(--font-lora)]">
                  <strong>Important :</strong> La cuisine cesse d&apos;enregistrer des commandes à partir de 22h00
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-[var(--tropical)] to-[var(--jungle-dark)] rounded-3xl p-8 text-white shadow-2xl">
                <div className="text-6xl mb-4">👩‍🍳</div>
                <h3 className="text-2xl font-bold mb-4">Chef Jariya 🦎</h3>
                <p className="font-[family-name:var(--font-lora)] opacity-90">
                  Avec amour et créativité, je fusionne les saveurs françaises et thaïlandaises 
                  pour créer des plats uniques qui racontent une histoire.
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
            🌽 Notre Cuisine
          </h2>
          <div className="w-24 h-1 bg-[var(--warm-gold)] mx-auto mb-8"></div>
          <p className="text-xl text-[var(--warm-gray)] font-[family-name:var(--font-lora)] mb-16 max-w-2xl mx-auto">
            Une fusion délicate entre la tradition française et les saveurs thaïlandaises, 
            préparée avec des ingrédients frais de la jungle
          </p>
          
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {[
              { emoji: "🧑‍🍳", title: "Française", desc: "Techniques classiques et élégantes" },
              { emoji: "🌶️", title: "Thaï", desc: "Saveurs authentiques et épicées" },
              { emoji: "✨", title: "Fusion", desc: "Créations uniques et surprenantes" },
              { emoji: "🥗", title: "Saine", desc: "Ingrédients frais et de qualité" },
            ].map((item, i) => (
              <div key={i} className="bg-[var(--warm-white)] p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 border-b-4 border-[var(--tropical)]">
                <div className="text-5xl mb-4">{item.emoji}</div>
                <h3 className="text-xl font-bold text-[var(--primary-dark)] mb-2">{item.title}</h3>
                <p className="text-[var(--warm-gray)] font-[family-name:var(--font-lora)]">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: "🍽️", title: "Dîner", desc: "Expérience gastronomique complète" },
              { emoji: "🥐", title: "Brunch", desc: "Moments gourmands du matin" },
              { emoji: "🍷", title: "Boissons", desc: "Vins fins et cocktails créatifs" },
            ].map((item, i) => (
              <div key={i} className="bg-gradient-to-br from-[var(--accent-light)] to-[var(--warm-white)] p-6 rounded-xl">
                <div className="text-4xl mb-3">{item.emoji}</div>
                <h3 className="text-lg font-bold text-[var(--primary-dark)] mb-1">{item.title}</h3>
                <p className="text-sm text-[var(--warm-gray)] font-[family-name:var(--font-lora)]">{item.desc}</p>
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
            📜 Notre Carte
          </h2>
          <div className="w-24 h-1 bg-[var(--warm-gold)] mx-auto mb-8"></div>
          <p className="text-xl text-[var(--warm-gray)] font-[family-name:var(--font-lora)] mb-12 max-w-2xl mx-auto text-center">
            Découvrez nos créations culinaires, une fusion unique de saveurs françaises et thaïlandaises
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
            🦎 Nos Services
          </h2>
          <div className="w-24 h-1 bg-[var(--warm-gold)] mx-auto mb-16"></div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[
              { emoji: "🍺", label: "Bar complet" },
              { emoji: "🍷", label: "Bières & Vins" },
              { emoji: "💳", label: "CB acceptées" },
              { emoji: "👶", label: "Chaises hautes" },
              { emoji: "📅", label: "Réservations" },
              { emoji: "🍸", label: "Alcool servi" },
              { emoji: "🛎️", label: "Service à table" },
              { emoji: "🅿️", label: "Parking rue" },
              { emoji: "📶", label: "WiFi gratuit" },
              { emoji: "🥬", label: "Végétarien" },
              { emoji: "🌾", label: "Sans gluten" },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl text-center hover:bg-white/20 transition-colors">
                <div className="text-3xl mb-2">{item.emoji}</div>
                <p className="text-sm font-[family-name:var(--font-lora)]">{item.label}</p>
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
            ⏰ Horaires d&apos;ouverture
          </h2>
          <div className="w-24 h-1 bg-[var(--warm-gold)] mx-auto mb-12"></div>
          
          <HoursDisplay />
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
            📅 Réservation
          </h2>
          <div className="w-24 h-1 bg-[var(--warm-gold)] mx-auto mb-8"></div>
          <p className="text-center text-[var(--accent-light)] font-[family-name:var(--font-lora)] mb-10">
            Réservez votre table pour vivre une expérience culinaire unique dans la jungle de Krabi
          </p>
          
          <ReservationForm />
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
            📍 Nous Trouver
          </h2>
          <div className="w-24 h-1 bg-[var(--warm-gold)] mx-auto mb-12"></div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white rounded-3xl shadow-xl p-8 border-l-4 border-[var(--tropical)]">
              <h3 className="text-2xl font-bold text-[var(--primary-dark)] mb-6">🌿 Adresse</h3>
              <p className="text-lg text-[var(--warm-gray)] font-[family-name:var(--font-lora)] mb-6 leading-relaxed">
                1/36-37 Soi Ruamjit<br />
                Maharat Road<br />
                Krabi Town 81000<br />
                Thaïlande
              </p>
              
              <div className="border-t border-[var(--accent-light)] pt-6 mt-6">
                <h4 className="font-bold text-[var(--primary-dark)] mb-4">📞 Réservation</h4>
                <a 
                  href="tel:+66819585945" 
                  className="inline-flex items-center gap-2 text-[var(--tropical)] font-semibold text-lg hover:text-[var(--primary-dark)] transition-colors mb-4"
                >
                  <span>📱</span> +66 81 958 5945
                </a>
                <p className="text-[var(--warm-gray)] font-[family-name:var(--font-lora)] text-sm">
                  Pour les groupes de plus de 10 personnes, veuillez nous contacter par téléphone 
                  ou directement sur place.
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-[var(--tropical)] to-[var(--jungle-dark)] rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
              {/* Decorative leaf */}
              <div className="absolute top-2 right-2 text-4xl opacity-20">🌿</div>
              <div className="absolute bottom-2 left-2 text-3xl opacity-20">🍃</div>
              
              <h3 className="text-2xl font-bold mb-6">🦎 Bienvenue dans la jungle!</h3>
              <p className="font-[family-name:var(--font-lora)] opacity-90 mb-8 leading-relaxed">
                Nous vous accueillons avec chaleur dans notre cabane au cœur de Krabi. 
                Une expérience gastronomique tropicale vous attend!
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">👥</span>
                  <span className="font-[family-name:var(--font-lora)]">40 places maximum</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl">👩‍🍳</span>
                  <span className="font-[family-name:var(--font-lora)]">Chef Jariya & son équipe</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl">🍽️</span>
                  <span className="font-[family-name:var(--font-lora)]">Cuisine Franco-Thaï</span>
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
                aria-label="Voir notre emplacement sur Google Maps (ouvre dans un nouvel onglet)"
              >
                Voir sur Google Maps →
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
        aria-label="Informations du restaurant"
      >
        {/* Decorative jungle elements */}
        <div className="absolute top-0 left-0 right-0 text-4xl opacity-10 flex justify-center gap-4">
          🌿🍃🌴🍃🌿🍃🌴🍃🌿
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">🦎 Gecko Cabane</h3>
              <p className="font-[family-name:var(--font-lora)] opacity-80">
                Restaurant Franco-Thaï gastronomique<br />
                🌿 Au cœur de la jungle de Krabi
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">⏰ Horaires</h4>
              <p className="font-[family-name:var(--font-lora)] opacity-80">
                Ouvert de 11h à 23h<br />
                Fermé le mardi<br />
                Dernière commande : 22h
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">📍 Contact</h4>
              <p className="font-[family-name:var(--font-lora)] opacity-80 mb-2">
                1/36-37 Soi Ruamjit<br />
                Maharat Road, Krabi Town 81000<br />
                Thaïlande 🇹🇭
              </p>
              <a href="tel:+66819585945" className="font-[family-name:var(--font-lora)] opacity-90 hover:opacity-100 transition-opacity flex items-center gap-2">
                📱 +66 81 958 5945
              </a>
            </div>
          </div>
          
          <div className="border-t border-white/20 pt-8 text-center">
            <p className="font-[family-name:var(--font-lora)] opacity-60 text-sm">
              © 2026 Gecko Cabane Restaurant 🦎 Tous droits réservés.
            </p>
            <p className="text-2xl mt-4 opacity-30">🌿🦎🌿</p>
            <p className="font-[family-name:var(--font-lora)] opacity-40 text-xs mt-4">
              Créé par{" "}
              <a 
                href="https://selenium-studio.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-100 underline transition-opacity"
              >
                selenium-studio.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
