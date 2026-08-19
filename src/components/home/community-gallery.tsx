import Image from "next/image";

export interface GalleryPhoto {
  path: string;
  alt: string;
  title: string;
  location: string;
}

export function CommunityGallery({ photos }: { photos: GalleryPhoto[] }) {
  const looped = [...photos, ...photos];

  return (
    <section className="home-gallery-wrap">
      <div className="home-container home-gallery-head">
        <p className="home-eyebrow"><span className="home-dot" />From the community</p>
        <h2 className="home-serif">Real jobs, real results</h2>
      </div>
      <div className="home-marquee-track">
        {looped.map((photo, i) => (
          <div className="home-marquee-card" key={`${photo.path}-${i}`}>
            <div className="home-marquee-card-art">
              <Image src={photo.path} alt={photo.alt} fill sizes="280px" style={{ objectFit: "cover" }} />
            </div>
            <div className="home-marquee-caption">
              {photo.title}
              <span>{photo.location}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
