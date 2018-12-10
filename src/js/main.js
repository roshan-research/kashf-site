import Masonry from 'masonry-layout';
import imagesLoaded from 'imagesloaded';
import SmoothScroll from 'smooth-scroll';

import NavbarShade from './_navbar';

document.addEventListener("DOMContentLoaded", function () {

    document.querySelector('.hero-section').classList.add('--play');

    NavbarShade();

    const scrollr = new SmoothScroll('a[data-scroll]');

    const msnry = new Masonry('.samples-grid', {
        itemSelector: '.sample',
        columnWidth: '.sample',
        percentPosition: true
    });

    const imgLoad = imagesLoaded(document.querySelector('.samples-grid'));
    imgLoad.on('progress', (instance, image) => {
        msnry.layout();
        let sampleElement = image.img.parentElement.parentElement;
        sampleElement.classList.remove('--hidden');
    });

});
