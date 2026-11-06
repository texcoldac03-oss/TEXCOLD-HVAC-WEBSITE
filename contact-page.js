function renderContactPage({ t, url, phone, displayPhone, email, services, esc, tr, deliveryReady }) {
  return `<section class="section contact-page">
    <p class="eyebrow">${t('LET’S TALK COMFORT','HABLEMOS DE CONFORT')}</p><h1>${t('How can we help?','¿Cómo podemos ayudarte?')}</h1>
    <div class="contact-layout"><div>
      <p class="lead">${deliveryReady ? t('Tell us about your home, business or next project. Send your quote request below or call Texcold directly.','Cuéntanos sobre tu hogar, negocio o próximo proyecto. Envía tu solicitud de cotización o llama directamente a Texcold.') : t('Tell us about your home, business or next project. Call Texcold directly or prepare a quote request to send by email.','Cuéntanos sobre tu hogar, negocio o próximo proyecto. Llama directamente o prepara una solicitud de cotización para enviar por correo.')}</p>
      <a class="contact-phone" href="tel:${phone}">${displayPhone}</a><p class="contact-label">${t('Houston, Texas & surrounding areas','Houston, Texas y áreas cercanas')}</p><a class="contact-email" href="mailto:${esc(email)}">${esc(email)}</a>
      <p class="small muted">${t('Monday–Saturday: 8 AM–9 PM. Sunday: closed.','Lunes a sábado: 8 a. m.–9 p. m. Domingo: cerrado.')}</p>
      <div class="contact-tip"><strong>${t('Not sure which service?','¿No sabes qué servicio necesitas?')}</strong><p>${t('Our service selector will point you in the right direction.','Nuestro selector te ayuda a encontrar la opción adecuada.')}</p><a class="text-link" href="${url('/')}#service-selector">${t('Find my service','Encontrar mi servicio')} →</a></div>
      <p class="small muted">${t('Texcold confirms availability, pricing and appointments directly.','Texcold confirma directamente la disponibilidad, los precios y las citas.')}</p>
    </div><div class="request-panel"><h2>${t('Request a Quote','Solicitar cotización')}</h2>
      <p class="small muted">${deliveryReady ? t('Send your project details to Texcold. We will contact you to discuss the next step during business hours.','Envía los detalles de tu proyecto a Texcold. Te contactaremos para conversar sobre el siguiente paso dentro de nuestro horario de atención.') : t('Prepare your details, then open your email app to review and send them. Direct online sending is not available yet.','Prepara tus datos y abre tu aplicación de correo para revisar y enviar. El envío directo en línea todavía no está disponible.')}</p>
      <p class="small muted">${t('Fields marked * are required.','Los campos marcados con * son obligatorios.')}</p>
      <form id="request-form" data-delivery="${deliveryReady?'direct':'draft'}">
        <div class="form-row"><label>${t('Full name *','Nombre completo *')}<input name="name" autocomplete="name" required maxlength="100"></label><label>${t('Phone number *','Teléfono *')}<input name="phone" type="tel" autocomplete="tel" required maxlength="30" minlength="10"></label></div>
        <label>${t('Email (optional)','Correo electrónico (opcional)')}<input name="email" type="email" autocomplete="email" maxlength="254"></label>
        <div class="form-row"><label>${t('Property type','Tipo de propiedad')}<select name="property"><option value="residential">${t('Residential / home','Residencial / hogar')}</option><option value="commercial">${t('Commercial / business','Comercial / negocio')}</option></select></label><label>${t('Service','Servicio')}<select name="service">${Object.entries(services).filter(([key])=>key!=='commercial').map(([key,s])=>`<option value="${key}">${esc(tr(s.title))}</option>`).join('')}</select></label></div>
        <h3>${t('Service address','Dirección del servicio')}</h3><label>${t('Street and number *','Calle y número *')}<input name="address" autocomplete="address-line1" required maxlength="200"></label>
        <div class="form-row"><label>${t('City *','Ciudad *')}<input name="city" autocomplete="address-level2" required maxlength="100"></label><label>${t('State *','Estado *')}<select name="state" autocomplete="address-level1" required><option value="TX">Texas</option></select></label></div>
        <div class="form-row"><label>${t('ZIP code *','Código postal *')}<input name="zip" autocomplete="postal-code" inputmode="numeric" required pattern="[0-9]{5}(-[0-9]{4})?" maxlength="10" title="${t('Enter a 5-digit ZIP code or ZIP+4.','Escribe un código postal de 5 dígitos o ZIP+4.')}"></label><label>${t('Apartment / suite (optional)','Apartamento / local (opcional)')}<input name="unit" autocomplete="address-line2" maxlength="50"></label></div>
        <label>${t('Tell us what you need *','Cuéntanos qué necesitas *')}<textarea name="details" required maxlength="2000" rows="4"></textarea></label>
        <div class="form-trap" aria-hidden="true"><label>Website<input name="website" autocomplete="off" tabindex="-1"></label></div>
        <label class="form-consent"><input name="consent" type="checkbox" required><span>${t('Texcold may use these details to contact me about this quote request. *','Texcold puede usar estos datos para contactarme sobre esta solicitud de cotización. *')}</span></label>
        <p class="small muted">${t('Please do not include payment details, access codes or other sensitive information.','No incluyas datos de pago, códigos de acceso ni otra información sensible.')}</p>
        <button type="submit" class="btn" id="request-submit">${deliveryReady?t('Send quote request','Enviar solicitud de cotización'):t('Prepare quote request','Preparar solicitud de cotización')} →</button>
        <noscript><p>${t('Please call or email Texcold directly to request a quote.','Llama o escribe directamente a Texcold para solicitar una cotización.')}</p></noscript>
      </form>
      <div class="request-result" id="request-result" hidden tabindex="-1" aria-live="polite">
        <h3 id="request-result-title"></h3><p id="request-result-message"></p>
        <div id="request-fallback"><textarea id="request-summary" readonly rows="8" aria-label="${t('Quote request details','Datos de la solicitud de cotización')}"></textarea><div class="actions"><a id="email-request" class="btn" href="mailto:${esc(email)}">${t('Open email draft','Abrir borrador de correo')} ↗</a><button type="button" id="copy-request" class="btn btn-navy">${t('Copy details','Copiar detalles')}</button></div><p class="small muted">${t('You can also call','También puedes llamar al')} <a href="tel:${phone}">${displayPhone}</a>.</p><p id="copy-status" role="status"></p></div>
      </div>
    </div></div></section>`;
}
module.exports = { renderContactPage };
