(function(){
  "use strict";

  /* Mobile nav toggle — present in the header on every page. */
  var navToggle = document.getElementById('navToggle');
  var primaryNav = document.getElementById('primaryNav');
  if (navToggle && primaryNav){
    navToggle.addEventListener('click', function(){
      var isOpen = primaryNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    primaryNav.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click', function(){
        primaryNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Application form — only present on basvuru.html, so every selector
     below is guarded and this whole block is a no-op on other pages. */
  var form = document.getElementById('basvuruForm');
  if (!form) return;

  var successPanel = document.getElementById('formSuccess');
  var resetBtn = document.getElementById('formResetBtn');

  function atLeastOnePlatformFilled(data){
    return Boolean(data.ytLink || data.kickLink || data.igLink || data.fbLink || data.digerLink);
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();

    if (!form.checkValidity()){
      form.reportValidity();
      return;
    }

    var data = Object.fromEntries(new FormData(form).entries());

    if (!atLeastOnePlatformFilled(data)){
      alert('Lütfen en az bir platform linki (YouTube, Kick, Instagram, Facebook veya Diğer) gir.');
      return;
    }

    handleSubmit(data);
  });

  resetBtn.addEventListener('click', function(){
    form.reset();
    form.classList.remove('hide');
    successPanel.classList.remove('show');
    window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
  });

  /**
   * ============================================================
   * BAŞVURU GÖNDERİM ENTEGRASYONU — Google Sheets (Apps Script Web App)
   * ============================================================
   * Form verisi aşağıdaki Web App URL'sine POST edilip bir Google
   * Sheet'e satır olarak ekleniyor. `mode: 'no-cors'` kullanıldığı
   * için tarayıcı Google'ın cevabını okuyamıyor (opak response) —
   * bu yüzden gerçek sunucu tarafı hatalarını (örn. script'te bir
   * hata olması) formdan göremeyiz, sadece ağ isteğinin gidip
   * gitmediğini biliriz. Kayıtların gerçekten düştüğünü sheet'ten
   * kontrol edebilirsin.
   * ============================================================
   */
  var SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycby4byYlF_DEIY0sXY-s5MMJutV5Y_sjLu1QTEhQq63MjBbBN1xcW5-dheqkCi81xtbGPw/exec';

  function handleSubmit(data){
    console.log('Prime XL başvurusu:', data);

    fetch(SHEET_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    }).then(function(){
      showSuccess();
    }).catch(function(err){
      console.error('Başvuru gönderilemedi:', err);
      alert('Başvurun gönderilirken bir sorun oluştu. İnternet bağlantını kontrol edip tekrar dener misin?');
    });
  }

  function showSuccess(){
    form.classList.add('hide');
    successPanel.classList.add('show');
    successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

})();
