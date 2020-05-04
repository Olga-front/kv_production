'use strict';
// -------------------------------------------------------------
//   Basic Navigation
// -------------------------------------------------------------

var halfOfWindowWidth = 0,
    isActive = false,
    rightDir = true,
    mySequence;

function getCursorPosition(e) {
    var posx = 0;
    var posy = 0;

    if (!e) {
        e = window.event;
    }

    if (e.pageX || e.pageY) {
        posx = e.pageX;
        posy = e.pageY;
    } else if (e.clientX || e.clientY) {
        posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    } else {
        if (e.originalEvent) {
            if (e.originalEvent.touches.length > 0) {
                var touch = e.originalEvent.touches[0];
                posx = touch.pageX;
                posy = touch.pageY;
            } else {
                posx = null;
                posy = null;
            }
        }
    }
    return {
        x: posx,
        y: posy
    }
}
var $frame;
var $slides;
var positions = [],
    sizes = [];

function findItem(curPos, lastItem) {
    lastItem = lastItem || 0;
    if (lastItem < 0) {
        lastItem = 0;
    }
    for (var i = positions.length; i >= lastItem; i--) {
        if (curPos >= positions[i]) {
            return i;
        }
    }
    return lastItem;
}

function getDistance() {
    var offset = $slides.offset();
    var fWidth = $frame.width();
    var sWidth = $slides.width();
    var nextPos, curItem, distance, curIdx;

    if (rightDir) {
        // click on the left side, shift slides to the right side
        if (offset.left == 0) {
            return 0;
        }
        var p = sWidth,
            cP = -offset.left;

        for (var i = sizes.length - 1; i > -1; i--) {
            p -= sizes[i];
            if (p < cP) {
                curIdx = i + 1;
                break;
            }
        }

        curItem = curIdx - 1;
        if (curItem < 0) {
            return -offset.left;
        }

        if (curItem == curIdx && curIdx > 0) {
            curItem--;
        }
        distance = Math.abs(Math.abs(offset.left) - positions[curItem]);
        return distance;
    } else {
        curIdx = findItem(-offset.left);
        // click on the right side, shift slides to the left side
        if (offset.left + sWidth == 0) {
            return 0;
        }

        curItem = curIdx + 1;
        if (curItem >= positions.length) {
            return 0;
        }
        distance = Math.abs(Math.abs(offset.left) - positions[curItem]);
        if (distance - offset.left + fWidth > sWidth) {
            distance = offset.left - fWidth + sWidth;
        }
        return distance;
    }
}

function animateSlides(distance) {
    distance = distance || getDistance();
    var dir = rightDir ? "+" : "-";
    var pos = Math.abs($slides.offset().left);
    if (rightDir) {
        pos -= distance;
    } else {
        pos += distance;
    }

    $slides.stop();
    $slides.animate({
        left: dir + "=" + distance + "px"
    });

    var p = $('.handle');
    var oldP = parseInt(p.css('left')) || 0;
    var delta = rightDir ? 0 : $frame.width();
    var newP = p.parent().width() * (pos + delta) / $slides.width();
    var progress = newP - oldP;
    dir = "+";
    if (progress < 0) {
        dir = "-";
        progress = -progress;
    }
    p.stop();
    p.animate({
        left: dir + "=" + progress + "px"
    },{
        complete: changeCursor
    });
}

function setSlidesWidth() {
    //calculate slider width
    var widthListPr = 0;
    var oldWidth = $slides.width();

    $slides.find('.slide-item').each(function() {
        var width = $(this).outerWidth();
        positions.push(widthListPr);
        sizes.push(width);
        widthListPr = widthListPr + width;
    });

    widthListPr++;

    $slides.css('width', widthListPr);
    var offset = $slides.offset();
    var len = widthListPr - $frame.width();
    if (!offset) {
        return;
    }
    if (offset.left < 0 && -offset.left > len) {
        $slides.css('left', '-' + len + 'px');
    }
}

function changeCursor() {
    var left = $slides.offset().left;
    $slides.removeClass('cursor-left');
    $slides.removeClass('cursor-right');
    if (rightDir) {
        if (!$slides.hasClass('cursor-left') && left < 0) {
            $slides.addClass('cursor-left');
        }
    } else {
        if(Math.abs(left) + $frame.width() < $slides.width()){
            $slides.addClass('cursor-right');
        }
    }
}

function initSlide() {
    var h = $('.handle');
    $frame = $('#basic');
    $slides = $('.slide-items');
    var $wrap = $frame.parent();

    if ($frame.length == 0) {
        return;
    }

    setSlidesWidth();

    function onSlidesMouseMove(e) {
        if (isActive) {
            return;
        }
        isActive = true;
        var cursorPosition = getCursorPosition(e);
        var x = cursorPosition.x;

        rightDir = x < halfOfWindowWidth;

        changeCursor();

        isActive = false;
    }

    $slides.on('mousemove', onSlidesMouseMove);

    var pos = 0,
        btnIsDown = false,
        isMoved = false;
    var width, sWidth, fWidth, startPos, pbWidth;

    var onMouseDown = function(e) {
        e.preventDefault();
        btnIsDown = true;
        isMoved = false;
        pos = getCursorPosition(e);
        rightDir = pos.x < halfOfWindowWidth;
        sWidth = $slides.width();
        fWidth = $frame.width();
        pbWidth = h.parent().width();
    };

    var moveSlide = function(distance) {
        if (distance == 0) {
            return;
        }
        var offset = $slides.offset();

        if (rightDir) {
            if (offset.left >= 0) {
                return;
            }
        } else {
            if (offset.left - fWidth + sWidth <= 0) {
                return;
            }
        }

        isMoved = true;

        var left = offset.left + distance;
        if (left > 0) {
            left = 0;
        }

        $slides.css('left', left + 'px');
        var hPos = pbWidth * (left) / (sWidth - fWidth);
        if (hPos < 0) {
            hPos = -hPos;
        }
        if (hPos > pbWidth) {
            hPos = pbWidth;
        }
        h.css('left', hPos);
    };

    var onMouseMove = function(e) {
        if (!btnIsDown) {
            return;
        }
        var curPos = getCursorPosition(e);
        if (Math.abs(curPos.x - pos.x) <= 10) {
            return;
        }

        rightDir = curPos.x > pos.x;
        var distance = curPos.x - pos.x;
        pos = curPos;
        moveSlide(distance);
    };

    var onMouseUp = function(e) {
        e.preventDefault();
        btnIsDown = false;
        if (isMoved) {
            return;
        }
        var curPos = getCursorPosition(e);
        if (curPos.x === null || Math.abs(curPos.x - pos.x) <= 10) {
            animateSlides();
        }
    };
    $frame
        .on('mousedown touchstart', onMouseDown)
        .on('mousemove touchmove', onMouseMove)
        .on('mouseup touchend', onMouseUp)
        .on('wheel', function(e) {
            sWidth = $slides.width();
            fWidth = $frame.width();
            pbWidth = h.parent().width();
            rightDir = e.originalEvent.deltaY < 0;
            moveSlide(-e.originalEvent.deltaY);
        });

    var isHandleDown = false;

    var handleDown = function(e) {
        e.preventDefault();
        isHandleDown = true;
        width = h.parent().width();
        sWidth = $slides.width();
        fWidth = $frame.width();
        startPos = h.closest('.scrollbar-area').offset().left;
    };

    var handleMove = function(e) {
        if (!isHandleDown) {
            return false;
        }
        var curPos = getCursorPosition(e);
        var distance = curPos.x - startPos;
        if (distance == 0) {
            return;
        }

        if (distance > width) {
            distance = width;
        }

        if (distance < 0) {
            distance = 0;
        }

        h.css('left', distance);

        var slideShift = (distance / width) * (sWidth - fWidth);

        if (slideShift + fWidth > sWidth) {
            slideShift = sWidth - fWidth;
        }

        if (slideShift > 0) {
            slideShift = -slideShift;
        }
        $slides.css('left', slideShift + 'px');
    };
    var handleUp = function(e) {
        isHandleDown = false;
    };

    h.on('mousedown touchstart', handleDown);
    h.closest('.scrollbar-area')
        .on('mousemove touchmove', handleMove)
        .on('mouseup touchend', handleUp);

    $('.toStart')
        .on('click', function() {
            var distance = $slides.offset().left;
            if (distance == 0) {
                return;
            }
            distance = -distance;
            rightDir = true;
            animateSlides(distance);
        });
}

function customJs() {
    setTimeout(function() {
        $(".text-area:not(.no-js)").customScrollbar({
            updateOnWindowResize: true
        });
    }, 300)

    // init autosize
    jQuery('textarea').autoResize({
        extraSpace: 0
    });
    $(window).on('resize', function() {
        halfOfWindowWidth = $(window).width() / 2;
        setSlidesWidth();
    });
    halfOfWindowWidth = $(window).width() / 2;

    initSlide();

    $(".description-area").customScrollbar();

    // wow initialization
    var wow = new WOW({
        boxClass: 'wow', // default
        animateClass: 'animated', // default
        offset: 0, // default
        mobile: true, // default
        live: true // default
    });

    wow.init();

    // script for modal windows
    function openModal() {
        var $ovarlay = $('.overlay'),
            $body = $('body'),
            $menuOpener = $('.menu-opener'),
            classes = ['color-red', 'color-green', 'color-blue'];
        var randomnumber = Math.floor(Math.random() * classes.length);

        $menuOpener.click(function() {
            var randomnumber = Math.floor(Math.random() * classes.length);

            $ovarlay.toggleClass('open');
            $body.addClass('modal-open');
            $ovarlay.addClass(classes[randomnumber]);

        });
        $('.overlay-close').click(function() {
            $ovarlay.removeClass('open');
            $body.removeClass('modal-open');
            setTimeout(function() {
                $ovarlay.removeClass('color-red color-green color-blue');
            }, 250);

        });
    }

    openModal();

    // script for elements animation for project page
    $('.news-item').each(function(index, el) {
        var item_heading = $(this).find('h2');
        var item_img = $(this).find('.img-holder');
        $(item_heading)
            .mouseover(function() {
                $(this).closest('.news-item').find('.img-holder').addClass('mouseover')
            })
            .mouseout(function() {
                $(this).closest('.news-item').find('.img-holder').removeClass('mouseover')
            });
        $(item_img)
            .mouseover(function() {
                $(this).closest('.news-item').find('.arrow-link').addClass('mouseover')
            })
            .mouseout(function() {
                $(this).closest('.news-item').find('.arrow-link').removeClass('mouseover')
            });
    });

    // add classes on hover/touch
    function initCustomHover() {
        $('#header .lang-area').touchHover();
        $('.filter-list-area').touchHover();
    }

    /*
     * Mobile hover plugin
     */
    (function($) {

        // detect device type
        var isTouchDevice = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
            isWinPhoneDevice = /Windows Phone/.test(navigator.userAgent);

        // define events
        var eventOn = (isTouchDevice && 'touchstart') || (isWinPhoneDevice && navigator.pointerEnabled && 'pointerdown') || (isWinPhoneDevice && navigator.msPointerEnabled && 'MSPointerDown') || 'mouseenter',
            eventOff = (isTouchDevice && 'touchend') || (isWinPhoneDevice && navigator.pointerEnabled && 'pointerup') || (isWinPhoneDevice && navigator.msPointerEnabled && 'MSPointerUp') || 'mouseleave';

        // event handlers
        var toggleOn, toggleOff, preventHandler;
        if (isTouchDevice || isWinPhoneDevice) {
            // prevent click handler
            preventHandler = function(e) {
                e.preventDefault();
            };

            // touch device handlers
            toggleOn = function(e) {
                var options = e.data,
                    element = $(this);

                var toggleOff = function(e) {
                    var target = $(e.target);
                    if (!target.is(element) && !target.closest(element).length) {
                        element.removeClass(options.hoverClass);
                        element.off('click', preventHandler);
                        if (options.onLeave) options.onLeave(element);
                        $(document).off(eventOn, toggleOff);
                    }
                };

                if (!element.hasClass(options.hoverClass)) {
                    element.addClass(options.hoverClass);
                    element.one('click', preventHandler);
                    $(document).on(eventOn, toggleOff);
                    if (options.onHover) options.onHover(element);
                }
            };
        } else {
            // desktop browser handlers
            toggleOn = function(e) {
                var options = e.data,
                    element = $(this);
                element.addClass(options.hoverClass);
                $(options.context).on(eventOff, options.selector, options, toggleOff);
                if (options.onHover) options.onHover(element);
            };
            toggleOff = function(e) {
                var options = e.data,
                    element = $(this);
                element.removeClass(options.hoverClass);
                $(options.context).off(eventOff, options.selector, toggleOff);
                if (options.onLeave) options.onLeave(element);
            };
        }

        // jQuery plugin
        $.fn.touchHover = function(opt) {
            var options = $.extend({
                context: this.context,
                selector: this.selector,
                hoverClass: 'hover'
            }, opt);

            $(this.context).on(eventOn, this.selector, options, toggleOn);
            return this;
        };
    }(jQuery));

    initCustomHover();

    function seqTheme() {
        /**
         * Theme Name: Two Up
         * Version: 1.0.0
         * Theme URL: http://sequencejs.com/themes/two-up/
         *
         * A full-screen, two column layout for showing a featured image and description
         *
         * This theme is powered by Sequence.js - The
         * responsive CSS animation framework for creating unique sliders,
         * presentations, banners, and other step-based applications.
         *
         * Author: Ian Lunn
         * Author URL: http://ianlunn.co.uk/
         *
         * Theme License: http://sequencejs.com/licenses/#free-theme
         * Sequence.js Licenses: http://sequencejs.com/licenses/
         *
         * Copyright © 2015 Ian Lunn Design Limited unless otherwise stated.
         */

        var windowWidth,
            lastAnimation = 0,
            delta,
            timeNow;

        var keyUp = function(e) {
            if (!mySequence) {
                return;
            }
            switch (e.keyCode) {
                // If any of the following keys are pressed, go to the next slide:
                // space, right arrow
                case 32:
                case 39:
                    e.preventDefault();
                    mySequence.next();
                    break;
                    // page down, down arrow (Large layout only)
                case 34:
                case 40:
                    if (windowWidth > 768) {
                        e.preventDefault();
                        mySequence.next();
                    }
                    break;
                    // If any of the following keys are pressed, go to the previous slide:
                    // left arrow
                case 37:
                    e.preventDefault();
                    mySequence.prev();
                    break;
                    // page up, up arrow (Large layout only)
                case 33:
                case 38:
                    if (windowWidth > 768) {
                        e.preventDefault();
                        mySequence.prev();
                    }
                    break;
            }
        };

        function scroll(e) {
            if (!mySequence) {
                return;
            }

            // Only allow mousewheel navigation above 769px
            if (windowWidth < 769) {
                return;
            }

            e.preventDefault();

            delta = e.wheelDelta || -e.detail;

            var deltaOfInterest = delta;
            timeNow = new Date().getTime();

            // Cancel scroll if currently animating or within quiet period
            if (timeNow - lastAnimation < mouseWheel.quietPeriod + mouseWheel.animationTime) {
                e.preventDefault();
                return;
            }

            if (deltaOfInterest < 0) {
                mySequence.next();
            } else {
                mySequence.prev();
            }

            lastAnimation = timeNow;

        }

        if (mySequence) {
            mySequence.utils.removeEvent(document, "mousewheel", scroll);
            mySequence.utils.removeEvent(document, "DOMMouseScroll", scroll);
            mySequence.utils.removeEvent(document.body, "keyup", keyUp);
            mySequence.destroy();
            mySequence = null;
        }

        // Get the Sequence element
        var sequenceElement = document.getElementById("sequence");

        if (!sequenceElement) {
            return;
        }

        // Place your Sequence options here to override defaults
        // See: http://sequencejs.com/documentation/#options
        var options = {
            animateCanvas: true,
            phaseThreshold: false,
            preloader: false,
            fadeStepWhenSkipped: true,
            reverseWhenNavigatingBackwards: true,
            swipeEvents: {
                left: function(sequence) {
                    sequence.next();
                },
                right: function(sequence) {
                    sequence.prev();
                },
                up: function(sequence) {
                    sequence.next();
                },
                down: function(sequence) {
                    sequence.prev();
                }
            },
            fallback: {
                speed: 300
            }
        };

        var mouseWheel = {

            // Only allow mousewheel navigation every x amount of ms
            quietPeriod: 1000,

            // Set this to the same length as the longest transition in Sequence
            animationTime: 300
        };

        // Launch Sequence on the element, and with the options we specified above
        mySequence = sequence(sequenceElement, options);


        function getWindowWidth() {
            return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        }

        var colorClassPrefixes = ['white', 'grey', 'black'];
        var lastItem = 0;

        function changeColor(index, seq) {
            var pageHeader = $('#header');

            var slide = $('.seq-canvas').find('li:not(.seq-out)');
            index = seq.$steps.indexOf(slide[0]);

            var closestParent = slide.closest('.seq');
            //remove all color classes
            for (var i = 0; i < colorClassPrefixes.length; i++) {
                closestParent.removeClass(colorClassPrefixes[i] + '-color');
                pageHeader.removeClass(colorClassPrefixes[i] + '-color');
            }

            // choose new color from array
            if (index >= colorClassPrefixes.length) {
                index = 0;
            }
            var newClass = colorClassPrefixes[index] + '-color';
            // set new color class
            pageHeader.addClass(newClass);
            closestParent.addClass(newClass);
        }

        // Determine Hammer directions required based on window width
        // A window greater than 768 allows up/down/left/right swiping
        // A window less than 769 allows left/right swiping
        function enableSwiping() {

            if (mySequence.hammerTime === false) {
                return;
            }

            var windowWidth = getWindowWidth();

            // if (windowWidth > 769) {
            //   mySequence.hammerTime.get("swipe").set({ direction: Hammer.DIRECTION_ALL });
            // } else {
            //   mySequence.hammerTime.get("swipe").set({ direction: Hammer.DIRECTION_HORIZONTAL });
            // }

            return windowWidth;
        }

        mySequence.currentPhaseEnded = function(id, seq) {

            // add different colors accordion to slide class
            changeColor(id, seq);
        };

        mySequence.ready = function() {
            // Get the windowWidth each time the window is resized
            windowWidth = enableSwiping();
            mySequence.throttledResize = function() {
                windowWidth = enableSwiping();
            };

            mySequence.utils.addEvent(document, "mousewheel", scroll);
            mySequence.utils.addEvent(document, "DOMMouseScroll", scroll);

            // Navigate between steps when certain buttons are pressed
            mySequence.utils.addEvent(document.body, "keyup", keyUp);
        };
    }

    seqTheme();
}

$(document).ready(function($) {
    customJs();
});

// BEGIN of script for smoothState
$(window).load(function() {
    // show preloader
    $('#preloader').fadeOut('slow', function() {});

    function initMasonry() {
        $('.grid').masonry({
            itemSelector: '.grid-item',
            columnWidth: '.grid-sizer',
            percentPosition: true
        });
    }

    initMasonry();

    function initIsotope() {
        // init Isotope
        var $grid = $('.grid').isotope({
            itemSelector: '.grid-item'
        });



        // filter items when filter link is clicked
        $('.filter-area a').click(function() {
            var selector = $(this).attr('data-filter');
            $('.grid-item' + selector).css('visibility', 'visible');
            $grid.isotope({ filter: selector });
            return false;

        });

    }

    initIsotope();

    var $body = $('html, body'),
        $main = $('#wrapper'),
        options = {
            prefetch: true,
            pageCacheSize: 4,
            anchors: 'a:not(.simple-link)',
            onStart: {
                duration: 525,
                render: function(url, $container) {
                    $main.addClass('is-exiting');
                    smoothState.restartCSSAnimations();
                }
            },
            onEnd: {
                duration: 0,
                render: function(url, $container, $content) {
                    $main.html($content);
                    $main.removeClass('is-exiting');
                }
            },
            callback: function(url, $container, $content) {
                $(function() {
                    customJs();
                    initMasonry();
                    initIsotope();
                });

            },
        },
        smoothState = $main.smoothState(options).data('smoothState');

    window.smoothstate = smoothState;
});
// END of script for smoothState
