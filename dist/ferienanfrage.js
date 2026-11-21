(() => {
  const form = document.getElementById('ferienformular');
  if (!form) return;

  const { anreise, abreise, gaeste } = form.elements;
  const draft = document.getElementById('ferien-entwurf');
  const message = document.getElementById('ferien-nachricht');
  const mail = document.getElementById('ferien-mail-oeffnen');
  const copy = document.getElementById('ferien-kopiere');
  const status = document.getElementById('ferien-status');
  const swissCalendar = new Intl.DateTimeFormat('de-CH', {
    timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit',
  });

  function todayInSwitzerland() {
    const parts = Object.fromEntries(swissCalendar.formatToParts(new Date()).map(({ type, value }) => [type, value]));
    return [parts.year, parts.month, parts.day].join('-');
  }

  function dayAfter(iso) {
    // UTC arithmetic on calendar dates keeps daylight saving changes out of the calculation.
    const date = new Date(iso + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
  }

  function formatDate(iso) {
    const [year, month, day] = iso.split('-');
    return [day, month, year].join('.');
  }

  function updateLimits() {
    const today = todayInSwitzerland();
    anreise.min = today;
    const firstPossibleArrival = anreise.value > today && Number.isFinite(anreise.valueAsNumber)
      ? anreise.value : today;
    abreise.min = dayAfter(firstPossibleArrival);
    anreise.setCustomValidity(anreise.value && anreise.value < today ? 'Bitte wähl hüt oder en spätere Aareisetag.' : '');
    abreise.setCustomValidity(abreise.value && abreise.value < abreise.min ? 'D Abreis muess nach de Aareis sii.' : '');
    gaeste.setCustomValidity(/^[1-4]$/.test(gaeste.value) ? '' : 'Bitte wähl eini bis vier Persone.');
  }

  function clearDraft() {
    draft.hidden = true;
    mail.removeAttribute('href');
    message.value = '';
    status.textContent = '';
    updateLimits();
  }

  form.addEventListener('input', clearDraft);
  form.addEventListener('change', clearDraft);
  form.addEventListener('focusin', updateLimits);

  form.addEventListener('submit', event => {
    event.preventDefault();
    updateLimits();
    if (!form.reportValidity()) return;
    const arrival = formatDate(anreise.value);
    const departure = formatDate(abreise.value);
    const guests = gaeste.value === '1' ? '1 Person' : gaeste.value + ' Personen';
    const subject = 'Ferienwohnung Alpenblick · ' + arrival + ' bis ' + departure;
    const body = [
      'Grüezi Familie Schönbächler', '',
      'Ist die Ferienwohnung Alpenblick vom ' + arrival + ' bis ' + departure + ' für ' + guests + ' frei?',
      'Was kostet der Aufenthalt für diesen Zeitraum?', '',
      'Freundliche Grüsse',
    ].join('\n');
    message.value = body;
    mail.href = 'mailto:eugensch@bluewin.ch?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body.replace(/\n/g, '\r\n'));
    draft.hidden = false;
    status.textContent = 'Din Entwurf isch parat.';
    mail.focus();
  });

  copy.addEventListener('click', async event => {
    event.preventDefault();
    if (draft.hidden) return;
    const text = message.value;
    try {
      await navigator.clipboard.writeText(text);
      if (message.value === text) status.textContent = 'Aafrag kopiert.';
    } catch {
      if (message.value !== text) return;
      message.focus();
      message.select();
      status.textContent = 'De Text isch markiert. Du chasch en jetzt kopiere.';
    }
  });

  anreise.required = abreise.required = gaeste.required = true;
  clearDraft();
  form.hidden = false;
})();
