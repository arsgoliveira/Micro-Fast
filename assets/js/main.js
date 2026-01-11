// main.js
document.addEventListener('DOMContentLoaded', function () {
  // Atualiza o ano no rodapé
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Toggle menu mobile melhorado
  const navToggle = document.getElementById('navToggle');
  const navList = document.getElementById('navList');
  const navOverlay = document.getElementById('navOverlay');
  const body = document.body;

  function openMenu() {
    navList.classList.add('active');
    if (navOverlay) navOverlay.classList.add('active');
    navToggle.setAttribute('aria-expanded', 'true');
    body.style.overflow = 'hidden'; // Previne scroll do body
  }

  function closeMenu() {
    navList.classList.remove('active');
    if (navOverlay) navOverlay.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    body.style.overflow = ''; // Restaura scroll
  }

  if (navToggle && navList) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Fechar ao clicar no overlay
    if (navOverlay) {
      navOverlay.addEventListener('click', closeMenu);
    }

    // Fechar ao clicar fora do menu
    document.addEventListener('click', (e) => {
      if (navList.classList.contains('active') && 
          !navList.contains(e.target) && 
          !navToggle.contains(e.target)) {
        closeMenu();
      }
    });

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navList.classList.contains('active')) {
        closeMenu();
      }
    });

    // Fechar menu ao clicar em link (já existe no código de rolagem suave)
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
        // Fechar menu mobile ao clicar em link
        if (navList && navList.classList.contains('active')) {
          navList.classList.remove('active');
          if (navOverlay) navOverlay.classList.remove('active');
          navToggle && navToggle.setAttribute('aria-expanded', 'false');
          body.style.overflow = '';
        }
      }
    });
  });

  // Modal do portfólio (para uso futuro)
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
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.setAttribute('aria-hidden', 'true');
    });
  }

  // Validação em tempo real do formulário
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const inputs = contactForm.querySelectorAll('input, textarea');
    
    function validateField(field) {
      const value = field.value.trim();
      let isValid = true;
      let errorMessage = '';

      // Remover classes anteriores
      field.classList.remove('error', 'valid');
      
      // Remover ícones anteriores se existirem
      const existingIcon = field.parentElement.querySelector('.field-icon');
      if (existingIcon) existingIcon.remove();
      
      // Remover mensagens de erro anteriores
      const existingError = field.parentElement.querySelector('.field-error');
      if (existingError) existingError.remove();

      // Validação específica por campo
      if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          isValid = false;
          errorMessage = 'Por favor, insira um e-mail válido';
        }
      } else if (field.type === 'text' && field.id === 'name') {
        if (value && value.length < 2) {
          isValid = false;
          errorMessage = 'O nome deve ter pelo menos 2 caracteres';
        }
      } else if (field.tagName === 'TEXTAREA') {
        if (value && value.length < 10) {
          isValid = false;
          errorMessage = 'A mensagem deve ter pelo menos 10 caracteres';
        }
      }

      // Adicionar feedback visual
      if (value) {
        if (isValid && field.checkValidity()) {
          field.classList.add('valid');
          // Criar ícone de sucesso
          const icon = document.createElement('i');
          icon.className = 'field-icon valid fas fa-check-circle';
          field.parentElement.appendChild(icon);
        } else {
          field.classList.add('error');
          // Criar ícone de erro
          const icon = document.createElement('i');
          icon.className = 'field-icon error fas fa-exclamation-circle';
          field.parentElement.appendChild(icon);
        }
      }

      // Adicionar mensagem de erro se necessário
      if (!isValid || (value && !field.checkValidity())) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error active';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${errorMessage || 'Por favor, preencha este campo corretamente'}`;
        field.parentElement.appendChild(errorDiv);
      }

      return isValid;
    }

    // Validar em tempo real
    inputs.forEach(input => {
      // Criar wrapper se não existir
      if (!input.parentElement.classList.contains('field-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'field-wrapper';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
      }

      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', function() {
        // Limpar estado de erro ao começar a digitar
        if (this.classList.contains('error')) {
          const errorMsg = this.parentElement.querySelector('.field-error');
          if (errorMsg) errorMsg.remove();
          this.classList.remove('error');
          const icon = this.parentElement.querySelector('.field-icon.error');
          if (icon) icon.remove();
        }
        if (this.value.trim()) {
          validateField(this);
        }
      });
    });
  }

  // Envio de formulário de contato (mailto)
  window.submitForm = function (e) {
    e.preventDefault();
    const f = e.target;
    const name = f.name.value.trim();
    const email = f.email.value.trim();
    const message = f.message.value.trim();

    // Validar todos os campos antes de enviar
    let allValid = true;
    const inputs = f.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
      // Trigger blur para validação
      input.dispatchEvent(new Event('blur'));
      if (!input.checkValidity() || input.classList.contains('error')) {
        allValid = false;
      }
    });

    if (!allValid) {
      const note = f.querySelector('.form-note');
      if (note) {
        note.textContent = 'Por favor, preencha todos os campos corretamente.';
        note.style.color = '#dc2626';
      }
      return;
    }

    const encodedName = encodeURIComponent(name);
    const encodedEmail = encodeURIComponent(email);
    const encodedMessage = encodeURIComponent(message);
    const subject = encodeURIComponent("Contato pelo site - " + name);
    const body = encodeURIComponent(`Nome: ${name}\nE-mail: ${email}\n\nMensagem:\n${message}`);

    // Abre o cliente de e-mail padrão
    window.location.href = `mailto:argoliveira80@gmail.com?subject=${subject}&body=${body}`;

    // Feedback visual no formulário
    const note = f.querySelector('.form-note');
    if (note) {
      note.textContent = 'Mensagem preparada com sucesso! Seu cliente de e-mail será aberto.';
      note.style.color = '#16a34a';
    }

    f.reset();
    // Limpar classes de validação
    inputs.forEach(input => {
      input.classList.remove('error', 'valid');
      const icon = input.parentElement.querySelector('.field-icon');
      if (icon) icon.remove();
      const errorMsg = input.parentElement.querySelector('.field-error');
      if (errorMsg) errorMsg.remove();
    });
  };

  // Animação de entrada ao rolar (reveal)
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
