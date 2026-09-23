import type { Metadata } from "next";
import Image from "next/image";
import { BookOpen, CheckCircle2, Clock3, PackageCheck } from "lucide-react";
import { QuoteCta } from "@/components/quote-cta";
import { Reveal } from "@/components/reveal";
import { getAbsoluteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";
import { guideItems } from "@/data/guides";

 className="news-image-wrap news-image-wrap-large">
                  <Image
                    src={featured.image}
                    alt={featured.title}
                    fill
                    priority
                    sizes="(max-width: 900px) 100vw, 55vw"
                    className="news-image"
                  />
                </div>
                <div className="news-feature-topline">
                  <span className="news-badge">{featured.badge}</span>
                  <span className="news-meta">
                    <Clock3 size={14} /> {featured.readingTime}
                  </span>
                </div>
                <h3>{featured.title}</h3>
                <p>{featured.summary}</p>
                <ul className="news-points">
                  {featured.highlights.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <div className="news-feature-footer">
                  <span className="news-source">Hướng dẫn Hưng Phát</span>
                </div>
              </article>
            </Reveal>

            <div className="news-stack">
              {stackItems.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.05}>
                  <article className="news-card">
                    <div className="news-image-wrap">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 900px) 100vw, 30vw"
                        className="news-image"
                      />
                    </div>
                    <div className="news-card-topline">
                      <span className="news-badge">{item.badge}</span>
                      <span className="news-meta">
                        <Clock3 size={14} /> {item.readingTime}
                      </span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <ul className="news-points news-points-compact">
                      {item.highlights.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                    <div className="news-card-footer">
                      <span className="news-source">Hướng dẫn Hưng Phát</span>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <QuoteCta />
        </div>
      </section>
    </main>
  );
}
