/*
 * Evento -  Event html  Template
 * Build Date: jan 2018
 * Author: colorlib
 * Copyright (C) 2018 colorlib
 */
 /* ------------------------------------- */
/*  TABLE OF CONTENTS
 /* ------------------------------------- */
/*   PRE LOADING                          */
/*   WOW                                 */
/*   sliders                      */
/*    MAPS                               */
/*   COUNTER JS              */

jQuery(document).ready(function($){
    var transitionEnd = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';
    var transitionsSupported = ( $('.csstransitions').length > 0 );
    //if browser does not support transitions - use a different event to trigger them
    if( !transitionsSupported ) transitionEnd = 'noTransition';
    
    //should add a loding while the events are organized 

    function SchedulePlan( element ) {
        this.element = element;
        this.timeline = this.element.find('.timeline');
        this.timelineItems = this.timeline.find('li');
        this.timelineItemsNumber = this.timelineItems.length;
        this.timelineStart = getScheduleTimestamp(this.timelineItems.eq(0).text());
        //need to store delta (in our case half hour) timestamp
        this.timelineUnitDuration = getScheduleTimestamp(this.timelineItems.eq(1).text()) - getScheduleTimestamp(this.timelineItems.eq(0).text());
        this.eventsWrapper = this.element.find('.events');
        this.eventsGroup = this.eventsWrapper.find('.events-group');
        this.singleEvents = this.eventsGroup.find('.single-event');
        
        //this.eventSlotHeight = this.eventsGroup.eq(0).children('.top-info').outerHeight();
        this.eventSlotHeight = this.timelineItems.eq(0).outerHeight();

        this.modal = this.element.find('.event-modal');
        this.modalHeader = this.modal.find('.header');
        this.modalHeaderBg = this.modal.find('.header-bg');
        this.modalBody = this.modal.find('.body'); 
        this.modalBodyBg = this.modal.find('.body-bg'); 
        this.modalMaxWidth = 800;
        this.modalMaxHeight = 480;

        this.animating = false;

        this.initSchedule();
    }

    SchedulePlan.prototype.initSchedule = function() {
        this.scheduleReset();
        this.initEvents();
    };

    SchedulePlan.prototype.scheduleReset = function() {
        var mq = this.mq();
        if( mq == 'desktop' && !this.element.hasClass('js-full') ) {
            //in this case you are on a desktop version (first load or resize from mobile)
            this.element.addClass('js-full');
            this.placeEvents();
            this.element.hasClass('modal-is-open') && this.checkEventModal();
        } else if(  mq == 'mobile' && this.element.hasClass('js-full') ) {
            //in this case you are on a mobile version (first load or resize from desktop)
            this.element.removeClass('js-full loading');
            this.eventsGroup.children('ul').add(this.singleEvents).removeAttr('style');
            this.eventsWrapper.children('.grid-line').remove();
            this.element.hasClass('modal-is-open') && this.checkEventModal();
        } else if( mq == 'desktop' && this.element.hasClass('modal-is-open')){
            //on a mobile version with modal open - need to resize/move modal window
            this.checkEventModal('desktop');
            this.element.removeClass('loading');
        } else {
            this.element.removeClass('loading');
        }
    };

    SchedulePlan.prototype.initEvents = function() {
        var self = this;
        var mq = self.mq();
        this.singleEvents.each(function(){
            //create the .event-date element for each event
            var durationLabel = '<span class="event-date">'+$(this).data('start')+' - '+$(this).data('end')+'</span>';
            $(this).children('a').prepend($(durationLabel));

            //detect click on the event and open the modal

            if (mq != 'mobile') {
                $(this).on('click', 'a', function(event){
                event.preventDefault();
                if( !self.animating ) self.openModal($(this));
            });
            }
            
        });

        //close modal window
        this.modal.on('click', '.close', function(event){
            event.preventDefault();
            if( !self.animating ) self.closeModal(self.eventsGroup.find('.selected-event'));
        });
        this.element.on('click', '.cover-layer', function(event){
            if( !self.animating && self.element.hasClass('modal-is-open') ) self.closeModal(self.eventsGroup.find('.selected-event'));
        });
    };

    SchedulePlan.prototype.placeEvents = function() {
        var self = this;
        this.singleEvents.each(function(){
            //place each event in the grid -> need to set top position and height
            var start = getScheduleTimestamp($(this).attr('data-start')),
                duration = getScheduleTimestamp($(this).attr('data-end')) - start;

            var eventTop = self.eventSlotHeight*(start - self.timelineStart)/self.timelineUnitDuration,
                eventHeight = self.eventSlotHeight*duration/self.timelineUnitDuration;

            
            
            $(this).css({
                top: (eventTop -1) +'px',
                height: (eventHeight+1)+'px'
            });
        });

        this.element.removeClass('loading');
    };

    SchedulePlan.prototype.openModal = function(event) {
        var self = this;
        var mq = self.mq();
        this.animating = true;

        //update event name and time
        this.modalHeader.find('.event-name').text(event.find('.event-name').text());
        this.modalHeader.find('.event-date').text(event.find('.event-date').text());
        this.modal.attr('data-event', event.parent().attr('data-event'));

        //update event content
        this.modalBody.find('.event-info').load(event.parent().attr('data-content')+'.html .event-info > *', function(data){
            //once the event content has been loaded
            self.element.addClass('content-loaded');
        });

        this.element.addClass('modal-is-open');

        setTimeout(function(){
            //fixes a flash when an event is selected - desktop version only
            event.parent('li').addClass('selected-event');
        }, 10);

        if( mq == 'mobile' ) {
            self.modal.one(transitionEnd, function(){
                self.modal.off(transitionEnd);
                self.animating = false;
            });
        } else {
            var eventTop = event.offset().top - $(window).scrollTop(),
                eventLeft = event.offset().left,
                eventHeight = event.innerHeight(),
                eventWidth = event.innerWidth();

            var windowWidth = $(window).width(),
                windowHeight = $(window).height();

            var modalWidth = ( windowWidth*.8 > self.modalMaxWidth ) ? self.modalMaxWidth : windowWidth*.8,
                modalHeight = ( windowHeight*.8 > self.modalMaxHeight ) ? self.modalMaxHeight : windowHeight*.8;

            var modalTranslateX = parseInt((windowWidth - modalWidth)/2 - eventLeft),
                modalTranslateY = parseInt((windowHeight - modalHeight)/2 - eventTop);
            
            var HeaderBgScaleY = modalHeight/eventHeight,
                BodyBgScaleX = (modalWidth - eventWidth);

            //change modal height/width and translate it
            self.modal.css({
                top: eventTop+'px',
                left: eventLeft+'px',
                height: modalHeight+'px',
                width: modalWidth+'px',
            });
            transformElement(self.modal, 'translateY('+modalTranslateY+'px) translateX('+modalTranslateX+'px)');

            //set modalHeader width
            self.modalHeader.css({
                width: eventWidth+'px',
            });
            //set modalBody left margin
            self.modalBody.css({
                marginLeft: eventWidth+'px',
            });

            //change modalBodyBg height/width ans scale it
            self.modalBodyBg.css({
                height: eventHeight+'px',
                width: '1px',
            });
            transformElement(self.modalBodyBg, 'scaleY('+HeaderBgScaleY+') scaleX('+BodyBgScaleX+')');

            //change modal modalHeaderBg height/width and scale it
            self.modalHeaderBg.css({
                height: eventHeight+'px',
                width: eventWidth+'px',
            });
            transformElement(self.modalHeaderBg, 'scaleY('+HeaderBgScaleY+')');
            
            self.modalHeaderBg.one(transitionEnd, function(){
                //wait for the  end of the modalHeaderBg transformation and show the modal content
                self.modalHeaderBg.off(transitionEnd);
                self.animating = false;
                self.element.addClass('animation-completed');
            });
        }

        //if browser do not support transitions -> no need to wait for the end of it
        if( !transitionsSupported ) self.modal.add(self.modalHeaderBg).trigger(transitionEnd);
    };

    SchedulePlan.prototype.closeModal = function(event) {
        var self = this;
        var mq = self.mq();

        this.animating = true;

        if( mq == 'mobile' ) {
            this.element.removeClass('modal-is-open');
            this.modal.one(transitionEnd, function(){
                self.modal.off(transitionEnd);
                self.animating = false;
                self.element.removeClass('content-loaded');
                event.removeClass('selected-event');
            });
        } else {
            var eventTop = event.offset().top - $(window).scrollTop(),
                eventLeft = event.offset().left,
                eventHeight = event.innerHeight(),
                eventWidth = event.innerWidth();

            var modalTop = Number(self.modal.css('top').replace('px', '')),
                modalLeft = Number(self.modal.css('left').replace('px', ''));

            var modalTranslateX = eventLeft - modalLeft,
                modalTranslateY = eventTop - modalTop;

            self.element.removeClass('animation-completed modal-is-open');

            //change modal width/height and translate it
            this.modal.css({
                width: eventWidth+'px',
                height: eventHeight+'px'
            });
            transformElement(self.modal, 'translateX('+modalTranslateX+'px) translateY('+modalTranslateY+'px)');
            
            //scale down modalBodyBg element
            transformElement(self.modalBodyBg, 'scaleX(0) scaleY(1)');
            //scale down modalHeaderBg element
            transformElement(self.modalHeaderBg, 'scaleY(1)');

            this.modalHeaderBg.one(transitionEnd, function(){
                //wait for the  end of the modalHeaderBg transformation and reset modal style
                self.modalHeaderBg.off(transitionEnd);
                self.modal.addClass('no-transition');
                setTimeout(function(){
                    self.modal.add(self.modalHeader).add(self.modalBody).add(self.modalHeaderBg).add(self.modalBodyBg).attr('style', '');
                }, 10);
                setTimeout(function(){
                    self.modal.removeClass('no-transition');
                }, 20);

                self.animating = false;
                self.element.removeClass('content-loaded');
                event.removeClass('selected-event');
            });
        }

        //browser do not support transitions -> no need to wait for the end of it
        if( !transitionsSupported ) self.modal.add(self.modalHeaderBg).trigger(transitionEnd);
    }

    SchedulePlan.prototype.mq = function(){
        //get MQ value ('desktop' or 'mobile') 
        var self = this;
        return window.getComputedStyle(this.element.get(0), '::before').getPropertyValue('content').replace(/["']/g, '');
    };

    SchedulePlan.prototype.checkEventModal = function(device) {
        this.animating = true;
        var self = this;
        var mq = this.mq();

        if( mq == 'mobile' ) {
            //reset modal style on mobile
            self.modal.add(self.modalHeader).add(self.modalHeaderBg).add(self.modalBody).add(self.modalBodyBg).attr('style', '');
            self.modal.removeClass('no-transition');    
            self.animating = false; 
        } else if( mq == 'desktop' && self.element.hasClass('modal-is-open') ) {
            self.modal.addClass('no-transition');
            self.element.addClass('animation-completed');
            var event = self.eventsGroup.find('.selected-event');

            var eventTop = event.offset().top - $(window).scrollTop(),
                eventLeft = event.offset().left,
                eventHeight = event.innerHeight(),
                eventWidth = event.innerWidth();

            var windowWidth = $(window).width(),
                windowHeight = $(window).height();

            var modalWidth = ( windowWidth*.8 > self.modalMaxWidth ) ? self.modalMaxWidth : windowWidth*.8,
                modalHeight = ( windowHeight*.8 > self.modalMaxHeight ) ? self.modalMaxHeight : windowHeight*.8;

            var HeaderBgScaleY = modalHeight/eventHeight,
                BodyBgScaleX = (modalWidth - eventWidth);

            setTimeout(function(){
                self.modal.css({
                    width: modalWidth+'px',
                    height: modalHeight+'px',
                    top: (windowHeight/2 - modalHeight/2)+'px',
                    left: (windowWidth/2 - modalWidth/2)+'px',
                });
                transformElement(self.modal, 'translateY(0) translateX(0)');
                //change modal modalBodyBg height/width
                self.modalBodyBg.css({
                    height: modalHeight+'px',
                    width: '1px',
                });
                transformElement(self.modalBodyBg, 'scaleX('+BodyBgScaleX+')');
                //set modalHeader width
                self.modalHeader.css({
                    width: eventWidth+'px',
                });
                //set modalBody left margin
                self.modalBody.css({
                    marginLeft: eventWidth+'px',
                });
                //change modal modalHeaderBg height/width and scale it
                self.modalHeaderBg.css({
                    height: eventHeight+'px',
                    width: eventWidth+'px',
                });
                transformElement(self.modalHeaderBg, 'scaleY('+HeaderBgScaleY+')');
            }, 10);

            setTimeout(function(){
                self.modal.removeClass('no-transition');
                self.animating = false; 
            }, 20);
        }
    };

    var schedules = $('.cd-schedule');
    var objSchedulesPlan = [],
        windowResize = false;
    
    if( schedules.length > 0 ) {
        schedules.each(function(){
            //create SchedulePlan objects
            objSchedulesPlan.push(new SchedulePlan($(this)));
        });
    }

    $(window).on('resize', function(){
        if( !windowResize ) {
            windowResize = true;
            (!window.requestAnimationFrame) ? setTimeout(checkResize) : window.requestAnimationFrame(checkResize);
        }
    });

    $(window).keyup(function(event) {
        if (event.keyCode == 27) {
            objSchedulesPlan.forEach(function(element){
                element.closeModal(element.eventsGroup.find('.selected-event'));
            });
        }
    });

    function checkResize(){
        objSchedulesPlan.forEach(function(element){
            element.scheduleReset();
        });
        windowResize = false;
    }

    function getScheduleTimestamp(time) {
        //accepts hh:mm format - convert hh:mm to timestamp
        time = time.replace(/ /g,'');
        var timeArray = time.split(':');
        var timeStamp = parseInt(timeArray[0])*60 + parseInt(timeArray[1]);
        return timeStamp;
    }

    function transformElement(element, value) {
        element.css({
            '-moz-transform': value,
            '-webkit-transform': value,
            '-ms-transform': value,
            '-o-transform': value,
            'transform': value
        });
    }
});

    /* ==============================================
/*  PRE LOADING
  =============================================== */
'use strict';
$(window).load(function() {
    $('.loader').delay(500).fadeOut('slow');
});


$(document).ready(function() {

    'use strict';
    /* ==============================================
     /*   wow
      =============================================== */
    var wow = new WOW(
        {
            animateClass: 'animated',
            offset: 10,
            mobile: true
        }
    );
    wow.init();
    /* ==============================================
        STICKY HEADER
        =============================================== */

    $(window).on('scroll', function () {
        if ($(window).scrollTop() < 100) {
            $('.header').removeClass('sticky_header');
        } else {
            $('.header').addClass('sticky_header');
        }
    });
    /* --------------------------------------------------------
     COUNTER JS
     ----------------------------------------------------------- */

    $('.counter').counterUp({
        delay: 5,
        time: 3000
    });

    $(".countdown")
        .countdown("2018/11/25 09:00:00", function(event) {
            $(this).html(
                event.strftime('<div style="border: 2px solid red; border-radius: 10px ;background:transparent">%D <span>Gün</span></div>  <div style="border: 2px solid red; border-radius: 10px ;background:transparent">%H<span>Saat</span></div> <div style="border: 2px solid red; border-radius: 10px ;background:transparent">%M<span>Dakika</span></div> <div style="border: 2px solid red; border-radius: 10px ;background:transparent">%S<span>Saniye</span></div>')
            );
        });

    /* ==============================================
     SLIDER
     =============================================== */
    $(".cover_slider").owlCarousel({
        loop:true,
        autoplay:true,
        smartSpeed:1000,
        autoplayHoverPause:false,
        autoplayTimeout:5000,
        dots:true,
        nav:false,
        items:1,
        animateOut: 'fadeOut',
        animateIn: 'fadeIn',
        dotsContainer: '.cover_dots'
    });

    $(".brand_carousel").owlCarousel({
        loop:false,
        autoplay:true,
        smartSpeed:450,
        autoplayHoverPause:false,
        dots:false,
        nav:false,
        responsiveClass:true,
        responsive:{
            0:{
                items:2
            },
            600:{
                items:2

            },
            1000:{
                items:4

            }
        },
        items:5
    });
    /* ------------------------------------- */
    /* Animated progress bars
     /* ------------------------------------- */

    var waypoints = $('.progress_container').waypoint(function() {
        $('.progress .progress-bar').progressbar({
            transition_delay: 1000
        });
    },{
        offset: '50%'
    });


        /* --------------------------------------------------------
    MAPS
    ----------------------------------------------------------- */
    var map = $('#map');
    if(map.length > 0) {
        google.maps.event.addDomListener(window, 'load', init);
        var lattuide = map.attr('data-lat');
        var longtuided = map.attr('data-lon');
    }
    function init() {
        // Basic options for a simple Google Map
        // For more options see: https://developers.google.com/maps/documentation/javascript/reference#MapOptions
        var mapOptions = {
            // How zoomed in you want the map to start at (always required)
            zoom: 16,
            scrollwheel: false,
            navigationControl: false,
            mapTypeControl: false,
            scaleControl: false,
            // The latitude and longitude to center the map (always required)
            center: new google.maps.LatLng(lattuide, longtuided), // New York

            // How you would like to style the map.
            // This is where you would paste any style found on Snazzy Maps.
            styles: [{"featureType":"water","stylers":[{"saturation":43},{"lightness":-11},{"hue":"#0088ff"}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"hue":"#ff0000"},{"saturation":-100},{"lightness":99}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#808080"},{"lightness":54}]},{"featureType":"landscape.man_made","elementType":"geometry.fill","stylers":[{"color":"#ece2d9"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#ccdca1"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#767676"}]},{"featureType":"road","elementType":"labels.text.stroke","stylers":[{"color":"#ffffff"}]},{"featureType":"poi","stylers":[{"visibility":"off"}]},{"featureType":"landscape.natural","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"color":"#b8cb93"}]},{"featureType":"poi.park","stylers":[{"visibility":"on"}]},{"featureType":"poi.sports_complex","stylers":[{"visibility":"on"}]},{"featureType":"poi.medical","stylers":[{"visibility":"on"}]},{"featureType":"poi.business","stylers":[{"visibility":"simplified"}]}]
        };

        // Get the HTML DOM element that will contain your map
        // We are using a div with id="map" seen below in the <body>
        var mapElement = document.getElementById('map');

        // Create the Google Map using our element and options defined above
        var map = new google.maps.Map(mapElement, mapOptions);

        // Let's also add a marker while we're at it
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(lattuide, longtuided),
            map: map,
            title: 'evento!'
        });
    }

});