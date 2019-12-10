export default function() {
    const navbar = document.querySelector('#navbar');
    const heroBottom = document.querySelector('#hero').offsetHeight;
    let scrollTop = 0;

    function checkState() {
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > heroBottom) {
            navbar.classList.add('--condensed');
            $(".navbar-toggler>.line").css("background-color", "#747474");


            if (window.matchMedia('(max-width: 767px)').matches)
                $("nav#navbar .container").css("background-color", "#fff");

        } else {
            navbar.classList.remove('--condensed');
            $(".navbar-toggler>.line").css("background-color", "white");

            if (window.matchMedia('(max-width: 767px)').matches) {
                $("nav#navbar .container").css("background-color", "#19293b");
            }
        }
    }

    checkState();
    document.addEventListener('scroll', checkState);
}
``