document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.sac-service').forEach(card => {
        const base = parseFloat(card.dataset.base) || 0;
        const out = card.querySelector('.sac-price');

        const update = () => {
            let total = base;
            card.querySelectorAll('.sac-addon:checked').forEach(cb => {
                total += parseFloat(cb.dataset.price) || 0;
            });
            out.textContent = total.toFixed(2);
        };

        card.addEventListener('change', e => {
            if (e.target.classList.contains('sac-addon')) update();
        });
    });
});