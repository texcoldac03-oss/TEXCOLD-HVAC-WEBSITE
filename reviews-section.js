const mapsUrl = 'https://maps.app.goo.gl/ERhRFbynu8uMsAgRA';

const reviews = [
  {
    name: 'A.B Castaneda',
    lang: 'en',
    quote: 'The installation was professional, efficient, and everything was completed very well.'
  },
  {
    name: 'Sergio Triana',
    lang: 'en',
    quote: 'my a/c is working like new'
  },
  {
    name: 'Angela Bozo',
    lang: 'es',
    quote: 'Excelente y responsable atención… 100% recomendado'
  }
];

function renderReviews({t, esc}) {
  return `<section id="reviews" class="reviews-section" aria-labelledby="reviews-title">
    <div class="section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t('GOOGLE REVIEWS','RESEÑAS DE GOOGLE')}</p>
          <h2 id="reviews-title">${t('What our customers say','Lo que dicen nuestros clientes')}</h2>
          <p class="lead">${t('Selected excerpts from customer reviews on Google.','Extractos de reseñas de nuestros clientes en Google.')}</p>
        </div>
        <a class="btn btn-navy reviews-maps" href="${mapsUrl}">${t('See all reviews on Google Maps','Ver todas las reseñas en Google Maps')}</a>
      </div>
      <p class="reviews-summary">
        <span class="review-stars" aria-hidden="true">★★★★★</span>
        <strong>${t('5.0 out of 5','5.0 de 5')}</strong>
        <span>${t('30 Google reviews as of Nov 6, 2026','30 reseñas de Google al 6 nov 2026')}</span>
      </p>
      <div class="reviews-grid">
        ${reviews.map(review => `
          <figure class="review-card">
            <span class="review-stars" role="img" aria-label="${t('5 out of 5 stars','5 de 5 estrellas')}">★★★★★</span>
            <blockquote lang="${review.lang}"><p>“${esc(review.quote)}”</p></blockquote>
            <figcaption>${esc(review.name)} <span>· Google</span></figcaption>
          </figure>`).join('')}
      </div>
    </div>
  </section>`;
}

module.exports = {renderReviews};
