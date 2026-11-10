(() => {
  'use strict';
  const es=document.documentElement.lang==='es', t=(en,sp)=>es?sp:en;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const query=new URLSearchParams(location.search);
  const route=(path,params={})=>{const q=new URLSearchParams(params);if(es)q.set('lang','es');return path+(q.size?'?'+q:'');};
  const serviceNames={maintenance:t('Preventive Maintenance','Mantenimiento preventivo'),service:t('HVAC Service','Servicio HVAC'),installation:t('HVAC Installation & Replacement','Instalación y reemplazo HVAC'),repair:t('AC & Heating Repair','Reparación de aire y calefacción'),generators:t('Electric Generator Sales','Venta de generadores eléctricos')};
  const language=$('[data-language-toggle]');
  if(language){const next=new URL(location.href);next.searchParams.set('lang',es?'en':'es');language.href=next.pathname+next.search+next.hash;}
  const menu=$('.menu'), nav=$('#mainnav');
  function closeMenu(){nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');}
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));});
  $$('#mainnav a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){closeMenu();menu.focus();}});
  document.addEventListener('click',e=>{if(nav?.classList.contains('open')&&!e.target.closest('header'))closeMenu();});

  const reviewTrack = $('#reviews-track');
  if (reviewTrack) {
    const controls = $('.reviews-controls');
    const [previous, next] = [...controls.querySelectorAll('button')];
    const [firstCard, secondCard] = reviewTrack.children;
    const updateControls = () => {
      previous.disabled = reviewTrack.scrollLeft < 1;
      next.disabled = reviewTrack.scrollWidth - reviewTrack.clientWidth - reviewTrack.scrollLeft < 1;
    };
    controls.addEventListener('click', event => {
      const direction = Number(event.target.dataset.reviewDirection);
      if (direction) reviewTrack.scrollBy({left: direction * (secondCard.offsetLeft - firstCard.offsetLeft)});
    });
    reviewTrack.addEventListener('scroll', updateControls, {passive: true});
    new ResizeObserver(updateControls).observe(reviewTrack);
    controls.hidden = false;
  }

  // A deterministic service guide. It does not require an AI account or API.
  const propertyStep=$('#property-step'), needStep=$('#need-step'), result=$('#selector-result');
  let property='residential';
  const progress=$('#selector-progress');
  const serviceDescriptions={maintenance:t('Start with planned care, inspection and tune-up recommendations.','Comienza con mantenimiento programado, inspección y recomendaciones.'),service:t('Start with an evaluation of your equipment, airflow and comfort concerns.','Comienza con una evaluación del equipo, flujo de aire y problemas de confort.'),repair:t('A system that has stopped cooling or heating needs an on-site diagnosis. Contact Texcold to discuss the symptoms and availability.','Un sistema que dejó de enfriar o calentar necesita diagnóstico en el lugar. Contacta a Texcold para revisar los síntomas y la disponibilidad.'),installation:t('Discuss a new system, equipment replacement or ductwork project with Texcold.','Consulta con Texcold por un sistema nuevo, reemplazo de equipo o proyecto de ductos.'),generators:t('Tell Texcold what you want to keep powered and ask about generator options.','Cuéntale a Texcold qué deseas mantener encendido y consulta opciones de generadores.')};
  function resetSelector(){propertyStep.hidden=false;needStep.hidden=true;result.hidden=true;progress.textContent=t('STEP 1 OF 2 · YOUR PROPERTY','PASO 1 DE 2 · TU PROPIEDAD');}
  $$('[data-property]').forEach(button=>button.addEventListener('click',()=>{property=button.dataset.property;propertyStep.hidden=true;needStep.hidden=false;result.hidden=true;progress.textContent=t('STEP 2 OF 2 · YOUR NEEDS','PASO 2 DE 2 · TUS NECESIDADES');needStep.focus({preventScroll:true});}));
  $$('[data-need]').forEach(button=>button.addEventListener('click',()=>{const chosen=button.dataset.need==='unsure'?'service':button.dataset.need;needStep.hidden=true;result.hidden=false;progress.textContent=t('YOUR NEXT STEP','TU SIGUIENTE PASO');$('#recommendation').textContent=serviceNames[chosen];$('#recommendation-copy').textContent=(property==='commercial'?t('For your business. ','Para tu negocio. '):t('For your home. ','Para tu hogar. '))+serviceDescriptions[chosen];$('#recommendation-contact').href=route('/contact',{service:chosen,property,need:button.dataset.need});$('#recommendation-page').href=route('/'+chosen);result.focus({preventScroll:true});}));
  $('.selector-back')?.addEventListener('click',()=>{resetSelector();$('[data-property]').focus({preventScroll:true});});
  $('.selector-reset')?.addEventListener('click',()=>{resetSelector();$('[data-property]').focus({preventScroll:true});});

  // All unique project photos are present in the document. Progressive display
  // keeps the first gallery view light; filtering applies to the full collection.
  const cards=$$('.full-gallery .work-card'), filterButtons=$$('[data-filter]');
  let activeFilter='all',visibleLimit=18;
  const matches=(card,filter)=>filter==='all'||card.dataset.tags.split(' ').includes(filter)||(filter==='repair'&&card.dataset.tags.split(' ').includes('service'));
  function filterGallery(filter,updateUrl=true){
    activeFilter=filter;const matched=cards.filter(card=>matches(card,filter));
    cards.forEach(card=>card.hidden=!matches(card,filter)||matched.indexOf(card)>=visibleLimit);
    filterButtons.forEach(b=>{const active=b.dataset.filter===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    $('#gallery-count').textContent=t(`Showing ${Math.min(visibleLimit,matched.length)} of ${matched.length} project photographs`,`${Math.min(visibleLimit,matched.length)} de ${matched.length} fotografías de proyectos`);
    $('#load-more').hidden=visibleLimit>=matched.length;
    if(updateUrl){const u=new URL(location.href);if(filter==='all')u.searchParams.delete('filter');else u.searchParams.set('filter',filter);history.replaceState(null,'',u.pathname+u.search+u.hash);}
  }
  if(cards.length){
    filterButtons.forEach(button=>button.addEventListener('click',()=>{visibleLimit=18;filterGallery(button.dataset.filter);}));
    $('#load-more').addEventListener('click',()=>{const previous=visibleLimit;visibleLimit+=18;filterGallery(activeFilter,false);cards.filter(c=>matches(c,activeFilter))[previous]?.querySelector('button').focus({preventScroll:true});});
    const requested=query.get('filter');filterGallery(filterButtons.some(b=>b.dataset.filter===requested)?requested:'all',false);
    window.addEventListener('popstate',()=>{visibleLimit=18;const q=new URLSearchParams(location.search).get('filter');filterGallery(filterButtons.some(b=>b.dataset.filter===q)?q:'all',false);});
  }

  const dialog=$('#photo-dialog'),dialogImage=$('#lightbox-image');let currentPhoto=0,lightboxPhotos=[];
  function showPhoto(index){
    currentPhoto=(index+lightboxPhotos.length)%lightboxPhotos.length;const b=lightboxPhotos[currentPhoto];
    dialogImage.src=b.dataset.full;dialogImage.alt=b.querySelector('img').alt;$('#photo-caption').textContent=dialogImage.alt;
    $('#photo-position').textContent=`${currentPhoto+1} / ${lightboxPhotos.length}`;
  }
  $$('.photo-button').forEach(button=>button.addEventListener('click',()=>{lightboxPhotos=$$('.photo-button').filter(b=>!b.closest('[hidden]'));showPhoto(lightboxPhotos.indexOf(button));dialog.showModal();}));
  $('.lightbox-close')?.addEventListener('click',()=>dialog.close());
  $('#previous-photo')?.addEventListener('click',()=>showPhoto(currentPhoto-1));
  $('#next-photo')?.addEventListener('click',()=>showPhoto(currentPhoto+1));
  dialog?.addEventListener('click',e=>{if(e.target===dialog){const box=dialog.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)dialog.close();}});
  dialog?.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();showPhoto(currentPhoto+1);}if(e.key==='ArrowLeft'){e.preventDefault();showPhoto(currentPhoto-1);}});

  // Direct requests are sent only when server-side delivery is configured.
  // Draft and failure paths never claim successful submission.
  const form=$('#request-form');
  if(form){
    const service=form.elements.service,propertyField=form.elements.property;
    if(Object.hasOwn(serviceNames,query.get('service')))service.value=query.get('service');
    if(query.get('service')==='commercial'){service.value='service';propertyField.value='commercial';}
    if(['residential','commercial'].includes(query.get('property')))propertyField.value=query.get('property');
    const prefills={maintenance:t('I would like to discuss preventive maintenance.','Me gustaría consultar sobre mantenimiento preventivo.'),service:t('I would like an evaluation of comfort or airflow concerns.','Me gustaría evaluar problemas de confort o flujo de aire.'),repair:t('My cooling or heating system is not working properly.','Mi sistema de aire acondicionado o calefacción no funciona correctamente.'),installation:t('I would like to discuss a new or replacement HVAC system.','Me gustaría consultar por un sistema HVAC nuevo o un reemplazo.'),generators:t('I would like information about backup generators.','Me gustaría recibir información sobre generadores de respaldo.')};
    if(prefills[query.get('need')])form.elements.details.value=prefills[query.get('need')];
    const phoneField=form.elements.phone;
    function validatePhone(){const value=phoneField.value.trim(),digits=value.replace(/\D/g,'');phoneField.setCustomValidity(value&&(digits.length<10||digits.length>15||!/^[+\d\s().-]+$/.test(value))?t('Enter a phone number with 10 to 15 digits.','Escribe un teléfono de 10 a 15 dígitos.'):'');}
    phoneField.addEventListener('input',validatePhone);
    const direct=form.dataset.delivery==='direct',submit=$('#request-submit');
    let busy=false,requestId='',lastPayload='';
    function hideResult(){if(!busy)$('#request-result').hidden=true;}
    form.addEventListener('input',hideResult);form.addEventListener('change',hideResult);
    const showResult=(status,title,message,fallback=true)=>{const panel=$('#request-result');panel.dataset.status=status;$('#request-result-title').textContent=title;$('#request-result-message').textContent=message;$('#request-fallback').hidden=!fallback;panel.hidden=false;panel.focus({preventScroll:true});panel.scrollIntoView({block:'nearest',behavior:'smooth'});};
    form.addEventListener('submit',async e=>{
      e.preventDefault();if(busy)return;
      for(const field of ['name','address','city','details']){const input=form.elements[field];input.setCustomValidity(input.value.trim()?'':t('Please complete this field.','Completa este campo.'));input.addEventListener('input',()=>input.setCustomValidity(''),{once:true});}
      validatePhone();if(!form.reportValidity())return;
      const data=Object.fromEntries(new FormData(form));const clean=s=>String(s||'').trim();
      for(const key of Object.keys(data))data[key]=clean(data[key]);
      data.consent=form.elements.consent.checked;
      const summary=[t('Texcold quote request','Solicitud de cotización Texcold'),'',t('Name: ','Nombre: ')+data.name,t('Phone: ','Teléfono: ')+data.phone,t('Email: ','Correo: ')+(data.email||t('Not provided','No indicado')),t('Service address: ','Dirección del servicio: ')+[data.address,data.unit,data.city,data.state+' '+data.zip].filter(Boolean).join(', '),t('Property: ','Propiedad: ')+(data.property==='commercial'?t('Commercial / business','Comercial / negocio'):t('Residential / home','Residencial / hogar')),t('Service: ','Servicio: ')+serviceNames[data.service],'',data.details].join('\n');
      $('#request-summary').value=summary;
      const subject=t('Quote request — ','Solicitud de cotización — ')+serviceNames[data.service];
      $('#email-request').href='mailto:'+document.body.dataset.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(summary);
      $('#copy-status').textContent='';
      if(!direct){showResult('draft',t('Your quote request is ready','Tu solicitud de cotización está lista'),t('Nothing has been sent yet. Open your email app to review and send it, or copy the details and call Texcold.','Todavía no se ha enviado nada. Abre tu aplicación de correo para revisar y enviar, o copia los detalles y llama a Texcold.'));return;}
      const serialized=JSON.stringify(data);if(serialized!==lastPayload){requestId=crypto.randomUUID();lastPayload=serialized;}
      busy=true;form.setAttribute('aria-busy','true');$('#request-result').hidden=true;
      const controls=[...form.elements],originalLabel=submit.textContent;
      controls.forEach(control=>control.disabled=true);submit.textContent=t('Sending…','Enviando…');
      try{
        const response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,requestId}),signal:AbortSignal.timeout(20000)});
        const result=await response.json();
        if(!response.ok||result.ok!==true||!result.reference){
          const message=result.error==='RATE_LIMITED'?t('Please wait a few minutes before trying again, or call Texcold directly.','Espera unos minutos antes de volver a intentar o llama directamente a Texcold.'):result.error==='INVALID_FIELDS'?t('Please check the required information, then try again.','Revisa la información obligatoria y vuelve a intentar.'):result.error==='DELIVERY_NOT_CONFIGURED'?t('Online sending is unavailable. Open the email draft below or call Texcold. Nothing was sent by this form.','El envío en línea no está disponible. Abre el borrador de correo o llama a Texcold. Este formulario no envió la solicitud.'):t('We could not confirm sending. Try again with the same details, or use the email draft or phone below.','No pudimos confirmar el envío. Vuelve a intentar con los mismos datos o utiliza el correo o teléfono de abajo.');
          showResult('error',t('Please contact Texcold','Contacta a Texcold'),message);return;
        }
        showResult('success',t('Quote request sent','Solicitud de cotización enviada'),t('Reference: ','Referencia: ')+result.reference+'. '+t('Your request was accepted for email delivery to Texcold. We will confirm availability and the next step directly. This is not a confirmed appointment.','Tu solicitud fue aceptada para envío al correo de Texcold. Confirmaremos directamente la disponibilidad y el siguiente paso. Esto no confirma una cita.'),false);
      }catch{showResult('error',t('Sending could not be confirmed','No se pudo confirmar el envío'),t('Your details are still here. Try again with the same details, or open the email draft below.','Tus datos siguen aquí. Vuelve a intentar con los mismos datos o abre el borrador de correo de abajo.'));}
      finally{busy=false;form.removeAttribute('aria-busy');controls.forEach(control=>control.disabled=false);submit.textContent=originalLabel;}
    });
    $('#copy-request').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#request-summary').value);$('#copy-status').textContent=t('Copied. You can paste your quote request into an email or message.','Copiado. Puedes pegar tu solicitud de cotización en un correo o mensaje.');}catch{$('#request-summary').focus();$('#request-summary').select();$('#copy-status').textContent=t('Select and copy the details above.','Selecciona y copia los detalles de arriba.');}});
  }
})();
