const mapsUrl = 'https://maps.app.goo.gl/ERhRFbynu8uMsAgRA';
const writeReviewUrl = 'https://search.google.com/local/writereview?placeid=ChIJuSFCFvFXR4YR-JAN-QCi11g';

const reviews = [
  {name: 'Maria Anguiano', lang: 'es', quote: 'Muy buen travajo garantisado'},
  {name: 'Sergio Triana', lang: 'en', quote: 'my a/c is working like new'},
  {name: 'A.B Castaneda', lang: 'en', quote: 'The installation was professional, efficient'},
  {name: 'Angela Bozo', lang: 'es', quote: 'Excelente y responsable atención'},
  {name: 'Nick Wingfield', lang: 'en', quote: 'do a great job'}
];

function renderReviews({t, esc}) {
  const title = t('Testimonials', 'Testimonios');
  return `<section id="reviews" class="reviews-section" aria-labelledby="reviews-title">
    <div class="section">
      <div class="reviews-heading">
        <h2 id="reviews-title">${title}</h2>
        <div class="reviews-divider" aria-hidden="true">”</div>
      </div>
      <div class="reviews-panel">
        <div class="reviews-summary">
          <strong>Texcold A/C Services LLC</strong>
          <div class="reviews-rating"><span class="review-stars" aria-hidden="true">★★★★★</span> <strong>${t('5.0 out of 5','5.0 de 5')}</strong></div>
          <span>${t('30 Google reviews','30 reseñas en Google')}</span>
          <small>${t('As of Nov 6, 2026','Al 6 nov 2026')}</small>
          <div class="reviews-actions">
            <a class="btn btn-outline" href="${writeReviewUrl}">${t('Write a review','Escribir una reseña')}</a>
            <a class="text-link" href="${mapsUrl}">${t('See all on Google Maps','Ver todas en Google Maps')}</a>
          </div>
        </div>
        <div class="reviews-carousel">
          <div class="reviews-track" id="reviews-track" role="region" aria-label="${t('Selected reviews','Reseñas seleccionadas')}" tabindex="0">
            ${reviews.map(review => `
              <figure class="review-card">
                <figcaption>
                  <span class="review-avatar" aria-hidden="true">${esc(review.name[0])}</span>
                  <span><strong>${esc(review.name)}</strong><small>${t('Posted on Google','Publicado en Google')}</small></span>
                </figcaption>
                <span class="review-stars" role="img" aria-label="${t('5 out of 5 stars','5 de 5 estrellas')}">★★★★★</span>
                <blockquote lang="${review.lang}"><p>“${esc(review.quote)}”</p></blockquote>
              </figure>`).join('')}
          </div>
          <div class="reviews-carousel-footer">
            <small>${t('Excerpts from Google reviews','Extractos de reseñas de Google')}</small>
            <div class="reviews-controls" hidden>
              <button type="button" data-review-direction="-1" aria-controls="reviews-track" aria-label="${t('Previous review','Reseña anterior')}" disabled>‹</button>
              <button type="button" data-review-direction="1" aria-controls="reviews-track" aria-label="${t('Next review','Siguiente reseña')}">›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

module.exports = {renderReviews};
