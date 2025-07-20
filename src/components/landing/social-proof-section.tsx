'use client';

export function SocialProofSection() {
  const stats = [
    { value: '15,000+', label: 'Students Helped' },
    { value: '50+', label: 'Universities Worldwide' },
    { value: '1 Million+', label: 'Summaries Generated' },
    { value: '4.9/5', label: 'User Rating' },
  ];

  const logos = [
    { name: 'Harvard', src: '/logos/harvard.svg' },
    { name: 'Stanford', src: '/logos/stanford.svg' },
    { name: 'MIT', src: '/logos/mit.svg' },
    { name: 'UCLA', src: '/logos/ucla.svg' },
    { name: 'NYU', src: '/logos/nyu.svg' },
    { name: 'Johns Hopkins', src: '/logos/hopkins.svg' },
  ];

  return (
    <section id="social-proof" className="py-20">
      <div className="container mx-auto px-4">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index}>
              <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Logos Section */}
        <div className="mt-16">
          <p className="text-center text-lg text-muted-foreground">
            Trusted by students at the world's top universities
          </p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8 items-center">
            {logos.map((logo, index) => (
              <div key={index} className="flex justify-center">
                <img src={logo.src} alt={`${logo.name} logo`} className="h-8 filter grayscale hover:grayscale-0 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
