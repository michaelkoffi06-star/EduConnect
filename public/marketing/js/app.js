/*==================================================
                EDUCONNECT
                 APP.JS
==================================================*/

function initSite() {

    initMobileMenu();
    initScrollReveal();
    initCounters();
    initContactForm();

}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSite);
} else {
    // Le document est déjà chargé quand ce script s'exécute
    // (cas normal dans une app Next.js, où le script est injecté après l'hydratation).
    initSite();
}

/*==========================
    MOBILE MENU
==========================*/

function initMobileMenu() {

    const menuBtn = document.querySelector(".menu-btn");
    const mobileMenu = document.querySelector(".mobile-menu");

    if (!menuBtn || !mobileMenu) return;

    const toggleMenu = () => {
        mobileMenu.classList.toggle("active");

        const isOpen = mobileMenu.classList.contains("active");
        menuBtn.innerHTML = isOpen
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-bars"></i>';
    };

    menuBtn.addEventListener("click", toggleMenu);

    mobileMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            mobileMenu.classList.remove("active");
            menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        });
    });

}

/*==========================
    SCROLL REVEAL
==========================*/

function initScrollReveal() {

    const targets = document.querySelectorAll(
        ".service-card, .why-card, .subject-card, .tutor-card, .testimonial-card, .stat-card, .step"
    );

    if (!("IntersectionObserver" in window) || targets.length === 0) {
        targets.forEach(el => el.classList.add("active"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {

        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {

                setTimeout(() => {
                    entry.target.classList.add("active");
                }, index * 80);

                observer.unobserve(entry.target);
            }
        });

    }, { threshold: 0.15 });

    targets.forEach(el => observer.observe(el));

}

/*==========================
    CONTACT FORM
==========================*/

function initContactForm() {

    const form = document.querySelector(".contact-form");
    const status = document.querySelector(".form-status");

    if (!form) return;

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const submitBtn = form.querySelector("button[type='submit']");
        const originalLabel = submitBtn.textContent;

        const payload = {
            fullName: form.fullName.value.trim(),
            email: form.email.value.trim(),
            subject: form.subject.value.trim(),
            message: form.message.value.trim(),
        };

        submitBtn.disabled = true;
        submitBtn.textContent = "Envoi en cours...";
        setStatus(status, "", "");

        try {

            const response = await fetch("/api/contact-message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Une erreur est survenue.");
            }

            setStatus(status, "Message envoyé avec succès. Nous vous répondrons rapidement.", "success");
            form.reset();

        } catch (error) {

            setStatus(status, error.message || "Impossible d'envoyer le message. Réessayez.", "error");

        } finally {

            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;

        }

    });

}

function setStatus(el, text, type) {

    if (!el) return;

    el.textContent = text;
    el.classList.remove("success", "error");

    if (type) el.classList.add(type);

}

/*==========================
    ANIMATED COUNTERS
==========================*/

function initCounters() {

    const counters = document.querySelectorAll("[data-count]");

    if (counters.length === 0) return;

    const animateCounter = (el) => {

        const target = parseInt(el.getAttribute("data-count"), 10) || 0;
        const duration = 1600;
        const start = performance.now();

        const step = (now) => {

            const progress = Math.min((now - start) / duration, 1);
            const value = Math.floor(progress * target);

            el.textContent = value;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target;
            }

        };

        requestAnimationFrame(step);

    };

    if (!("IntersectionObserver" in window)) {
        counters.forEach(animateCounter);
        return;
    }

    const observer = new IntersectionObserver((entries) => {

        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });

    }, { threshold: 0.4 });

    counters.forEach(el => observer.observe(el));

}
