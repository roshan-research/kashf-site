export default function () {
    const navbar = document.querySelector('#navbar');
    const heroBottom = document.querySelector('#hero').offsetHeight;
    let scrollTop = 0;

    function checkState() {
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if(scrollTop > heroBottom - 100) {
            navbar.classList.add('--condensed');
        } else {
            navbar.classList.remove('--condensed');
        }
    }

    checkState();
    document.addEventListener('scroll', checkState);
}