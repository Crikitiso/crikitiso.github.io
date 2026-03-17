// =============================================
// CRIKITISO — cookies.js
// Banner de consentimiento de cookies
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('crikitiso_cookies_accepted')) {
    setTimeout(() => {
      document.getElementById('cookieBanner').classList.add('show');
    }, 800);
  }
});

function acceptCookies() {
  localStorage.setItem('crikitiso_cookies_accepted', 'true');
  hideCookieBanner();
}

function rejectCookies() {
  localStorage.setItem('crikitiso_cookies_accepted', 'false');
  hideCookieBanner();
}

function hideCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  banner.classList.remove('show');
  banner.classList.add('hide');
  setTimeout(() => { banner.style.display = 'none'; }, 450);
}
