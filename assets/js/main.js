/* main.js */
document.addEventListener('DOMContentLoaded', function () {
  // Atualiza o ano no rodapé
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Toggle menu mobile
  const navToggle = document.getElementById('navToggle');
  const navList = document.getElementById('navList');
  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navList.style.display = expanded ? 'none' : 'flex';
    });
  }

  // Destacar link ativo conforme rolagem
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const offset = 80;

  function onScroll() {
    const pos = window.scrollY + offset;
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const bottom = top + sec.offsetHeight;
      const id = sec.getAttribute('id');
      const link = document.querySelector('.nav-link[href="#' + id + '"]');
      if (link) {
        if (pos >= top && pos < bottom) {
          navLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      }
    });
  }
  window.addEventListener('scroll', onScroll);
  onScroll();

  // Rolagem suave
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (navList.style.display === 'flex') {
          navList.style.display = 'none';
          navToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // Modal do portfólio
  window.openPortfolioModal = function (el) {
    const title = el.dataset.title || '';
    const img = el.dataset.img || '';
    const desc = el.dataset.desc || '';
    const modal = document.getElementById('portfolioModal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalImg').src = img;
    document.getElementById('modalImg').alt = title;
    document.getElementById('modalDesc').textContent = desc;
    modal.setAttribute('aria-hidden', 'false');
  };

  const modalClose = document.getElementById('modalClose');
  const modal = document.getElementById('portfolioModal');
  if (modalClose) {
    modalClose.addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
  }
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.setAttribute('aria-hidden', 'true');
  });

  // Envio de formulário de contato (mailto)
  window.submitForm = function (e) {
    e.preventDefault();
    const f = e.target;
    const name = encodeURIComponent(f.name.value.trim());
    const email = encodeURIComponent(f.email.value.trim());
    const message = encodeURIComponent(f.message.value.trim());
    const subject = encodeURIComponent("Contato pelo site - " + decodeURIComponent(name));
    const body = encodeURIComponent(`Nome: ${decodeURIComponent(name)}\nE-mail: ${decodeURIComponent(email)}\n\nMensagem:\n${decodeURIComponent(message)}`);

    // Abre o cliente de e-mail padrão
    window.location.href = `mailto:argoliveira80@gmail.com?subject=${subject}&body=${body}`;

    // Feedback visual no formulário
    const note = f.querySelector(".form-note");
    if (note) {
      note.textContent = "Mensagem preparada com sucesso! Seu cliente de e-mail será aberto.";
      note.style.color = "green";
    }

    f.reset();
  };
    // === Animação de entrada ao rolar (reveal) ===
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // ativa uma vez
        }
      });
    },
    { threshold: 0.15 }
  );

  reveals.forEach(el => observer.observe(el));

});

