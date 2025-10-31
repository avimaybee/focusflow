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
    <section id="social-proof" className="py-24">
      <div className="container mx-auto px-4">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center justify-center">
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2 leading-none">{stat.value}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Logos Section */}
        <div className="mt-20">
          <p className="text-center text-lg text-muted-foreground mb-10 leading-relaxed">
            Trusted by students at the world&apos;s top universities
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-10 items-center max-w-6xl mx-auto">
            {logos.map((logo, index) => (
              <div key={index} className="flex justify-center">
                <span className="text-lg font-semibold text-muted-foreground grayscale hover:grayscale-0 transition-all">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
