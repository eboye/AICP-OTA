/*global console, window, jQuery, alert*/

/**
 * Created by eboye on 3/15/15.
 */

/* Configuration */
(function ($) {
    'use strict';
    //noinspection JSUnresolvedVariable
    var noDataMessage = 'No data provided!',
        noDeviceMessage = 'You have to specify device name!',
        domain = location.href.replace(location.hash, ""),
        config = '/config/devices.json',
        deviceImages = '/imgs/devices/',
        oemCheck = '',
        // proxy = 'https://crossorigin.me/',
        proxy = 'https://cors-anywhere.herokuapp.com/',
        aicpAPI = proxy + 'http://updates.aicp-rom.com/update.php',
        storage = $.localStorage,
        graphHeight = 30;

    //noinspection JSLint
    jQuery.extend(
        jQuery.expr[':'].containsCI = function (a, i, m) {
            //-- faster than jQuery(a).text()
            var sText = (a.textContent || a.innerText || "");
            var zRegExp = new RegExp(m[3], 'i');
            return zRegExp.test(sText);
        }
    );
    /* Main Functions */

    /* Colored ConsoleLog */

    function log(msg, color) {
        color = color || "black";
        var bgc = "White";
        switch (color) {
        case "success":
            color = "Green";
            bgc = "LimeGreen";
            break;
        case "info":
            color = "DodgerBlue";
            bgc = "Turquoise";
            break;
        case "error":
            color = "Red";
            bgc = "Black";
            break;
        case "start":
            color = "OliveDrab";
            bgc = "PaleGreen";
            break;
        case "warning":
            color = "Tomato";
            bgc = "Black";
            break;
        case "end":
            color = "Orchid";
            bgc = "MediumVioletRed";
            break;
        default: //noinspection SillyAssignmentJS
            color = color;
        }

        if (typeof msg === "object") {
            console.log(msg);
        } else if (typeof color === "object") {
            console.log("%c" + msg, "color: PowderBlue;font-weight:bold; background-color: RoyalBlue;");
            console.log(color);
        } else {
            console.log("%c" + msg, "color:" + color + ";font-weight:bold; background-color: " + bgc + ";");
        }
    }

    /* HomePage Rendering of Cards */

    function homePageRender(data) {
        if (!data) {
            console.log(noDataMessage);
        } else {

            /* Sort array by OEMs then by name */

            /** @namespace data.devices */
            /** @namespace data.codename */
            /** @namespace data.OEM */
            var sortBy = 'OEM',
                thenBy = 'name',
                deviceThumb,
                oemHeader,
                i,
                deviceTabs = $('#devicechoose'),
                thumbnailDevices = $('#thumbnail-devices'),
                li,
                link,
                devices = data.devices.sort(function (a, b) {
                    if (a[sortBy] === b[sortBy]) {
                        if (a[sortBy] === b[sortBy]) {

                            if (a[thenBy] === b[thenBy]) {
                                return 0;
                            } else if (a[thenBy] < b[thenBy]) {
                                return -1;
                            } else {
                                return 1;
                            }

                        }
                    } else if (a[sortBy] < b[sortBy]) {
                        return -1;
                    } else {
                        return 1;
                    }
                });

            deviceTabs.empty();

            for (i = 0; i < devices.length; i += 1) {

                /* Make device card */

                deviceThumb = '<div data-codename="' + devices[i].codename + '" class="modal-btn col s12 m6 l3">' +
                    '<div class="card">' +
                    '<div class="card-image modal-trigger" data-target="modal">' +
                    '<img src="' + domain + deviceImages + devices[i].codename + '.jpg" alt="' + devices[i].codename + '">' +
                    '</div>' +
                    '<div class="card-content modal-trigger" data-target="modal">' +
                    '<h5>' + devices[i].name + '<br><div class="grey-text"><small>made by <strong>' + devices[i].OEM + '</strong></small></div></h5>' +
                    '<h6>codename: <span class="chip">' + devices[i].codename + '</span></h6>' +
                    '</div>' +
                    '<div class="card-action center amber darken-3">' +
                    '<a class="download-latest white-text" data-codename="' + devices[i].codename + '" href="#!">Download latest version</a>' +
                    '</div>' +
                    '</div>' +
                    '</div>';
                oemHeader = '<div class="col s12">' +
                    '<div class="row tab-content" id="' + devices[i].OEM.toLowerCase() + '">' +
                    '<div class="col s12 oem-title">' +
                    '<h3>' + devices[i].OEM + '</h3>' +
                    '</div>' +
                    '</div>' +
                    '</div>';

                /* Check if new OEM starts and add heading */

                if (oemCheck !== devices[i].OEM) {

                    /* Make scroll buttons */
                    li = $('<li>').addClass('tab');
                    link = $('<a>').attr('href', '#' + devices[i].OEM.toLowerCase()).text(devices[i].OEM);
                    if (i === 0) {
                        link.addClass('active');
                    }
                    link.appendTo(li);
                    li.appendTo(deviceTabs);


                    thumbnailDevices.append(oemHeader);
                }
                thumbnailDevices.find('#' + devices[i].OEM.toLowerCase()).append(deviceThumb);

                oemCheck = devices[i].OEM;

            }

        }

        return true;

    }

    /* Make Modal with data provided */

    //noinspection JSLint
    function makeModal(data, deviceName, deviceHeader) {
        if (data === 'error') {
            log(noDataMessage, 'error');
            $('#modal').find('.modal-body').html('There was an error connecting AICP servers');
            $('#downloadModal').html('<h5>No OTAs found, sorry!</h5>');
        } else if (!data || data === '' || data.error === 'Nothing found') {
            log(noDataMessage, 'error');
            $('#modal').find('.modal-body').html('No data provided');
            $('#downloadModal').html('<h5>No OTAs found, sorry!</h5>');
        } else {

            /** @namespace data.updates */
            var updates = data.updates,
                deviceTable = '',
                i,
                currentSize,
                tr,
                date,
                year,
                month,
                day,
                time,
                updateRow,
                sizes = $.map(updates, function (updates) {
                    return updates.size;
                }),
                maxSize = Math.max.apply(null, sizes),
                minSize = Math.min.apply(null, sizes),
                difference = maxSize - minSize;

            for (i = 0; i < updates.length; i += 1) {

                /* Graph Drawing */

                currentSize = updates[i].size;

                if (i < 12) {

                    $('.graph .bar' + i).height((maxSize - currentSize) * (difference / graphHeight) + 20).text(currentSize);
                }

                tr = '<tr data-url="' + updates[i].url + '">';
                date = updates[i].name.slice(-12, -4);
                year = date.slice(0, 4);
                month = date.slice(4, 6);
                day = date.slice(6, 8);
                time = day + '/' + month + '/' + year;

                if (updates[i].version.toLowerCase().indexOf('experimental') >= 0) {
                    tr = '<tr data-url="' + updates[i].url + '" class="danger">';
                } else if (updates[i].version.toLowerCase().indexOf('nightly') >= 0) {
                    tr = '<tr data-url="' + updates[i].url + '" class="warning">';
                } else if (updates[i].version.toLowerCase().indexOf('release') >= 0) {
                    tr = '<tr data-url="' + updates[i].url + '" class="success">';
                }

                /** @namespace updates.md5 */
                updateRow = tr +
                    '<td class="dload"><strong>' + time + '</strong></td>' +
                    '<td class="dload">' + updates[i].version + '</td>' +
                    '<td class="dload">' + updates[i].name + '</td>' +
                    '<td class="dload"><strong>' + currentSize + ' MB</strong></td>' +
                    '<td class="dload">' + updates[i].md5 + '</td>' +
                    '<td><a href="' + updates[i].url + '" class="waves-effect waves-light btn amber darken-1 white-text">Download</a></td>' +
                    '</tr>';

                deviceTable = deviceTable + updateRow;

            }

            deviceTable = '<table class="responsive-table">' +
                '<tr><th>Date</th><th>Version</th><th>Filename</th><th>Size</th><th>md5</th><th>Download</th></tr>' +
                deviceTable + '</table>';

            // $('#modal').modal('open').find('.modal-body').html(deviceTable);
            $('#modal').find('.modal-body').html(deviceTable);
            //$('#downloadModal').html(deviceHeader);

        }

        log('Modal width data for ' + deviceName + ' opened', 'success');
        return true;

    }

    /* Get Data from local storage */

    function getLocalStorage(devicename) {
        if (!devicename) {

            log(noDeviceMessage, 'error');
            return false;

        } else {

            log(devicename + ' data retrived from localstorage', 'success');
            var theData = storage.get(devicename);
            log(theData);
            return storage.get(theData);

        }

    }

    /* Store data locally */

    function storeLocally(devicename, data) {
        if (data && devicename) {

            storage.set(devicename, data);
            storage.set(devicename + '-timestamp', $.now());

            log('Stored info of ' + devicename + ' to localStorage', 'success');
            return true;

        } else if (!devicename) {

            log(noDeviceMessage, 'error');
            return false;

        } else if (!data) {

            log(noDataMessage, 'error');
            return false;
        } else {
            return false;
        }

    }

    /* Get fresh data from server and make modal */

    function modalWithNewData(deviceToGrab, deviceHeader) {
        if (!deviceToGrab) {
            log(deviceToGrab, 'error');
        } else {

            //noinspection JSUnusedGlobalSymbols
            $.ajax({
                url: aicpAPI,
                type: 'GET',
                dataType: 'json',
                async: true,
                contentType: 'application/x-www-form-urlencoded; charset=utf-8',
                data: {
                    'device': deviceToGrab
                },
                xhrFields: {
                    onprogress: function (e) {

                        /** @namespace e.lengthComputable */
                        /** @namespace e.loaded */
                        /** @namespace e.total */
                        if (e.lengthComputable) {
                            log(e.loaded / e.total * 100 + '%');
                        }
                    }
                },
                success: function (data) {
                    makeModal(data, deviceToGrab, deviceHeader);
                    storeLocally(deviceToGrab, data);

                },
                error: function (e) {
                    makeModal('error', null, null);
                    log(e.message, 'error');
                }
            });

        }

    }

    /* Quick search filter */

    function filter(searchParam) {
        var tabContent = $('.tab-content'),
            found = $('#thumbnail-devices').find('.card-content h5:containsCI(' + searchParam + '),.card-content h5 strong:containsCI(' + searchParam + '),.card-content h6 .chip:containsCI(' + searchParam + ')').closest('.modal-btn');
        if (searchParam && searchParam !== '') {
            $('.modal-btn,#thumbnail-devices>.col').addClass('hide');
            found.removeClass('hide');
            found.closest('#thumbnail-devices>.col').removeClass('hide');
            tabContent.addClass('active').show();
            tabContent.find('.oem-title').hide();
        } else {
            $('.modal-btn').removeClass('hide');
            $('#thumbnail-devices>.col').removeClass('hide');
            tabContent.find('.oem-title').show();
            tabContent.removeClass('active').hide().first().addClass('active').show();
        }
    }

    /* OTA page only */
    $(function () {
        var search = $('#search');
        if ($('body').hasClass('ota')) {
            $('.button-collapse').sideNav({
                menuWidth: 300, // Default is 300
                edge: 'right', // Choose the horizontal origin
                closeOnClick: true, // Closes side-nav on <a> clicks, useful for Angular/Meteor
                draggable: true // Choose whether you can drag to open on touch screens
            });
            $('.modal').modal();
            $.getJSON(domain + config, function (data) {
                homePageRender(data);
                $('#devicechoose').addClass('tabs').tabs();
                filter(search.val());
            });

            $(document).on('click', '.download-latest', function (e) {
                e.preventDefault();
                var elem = $(this),
                    deviceToGrab = elem.attr('data-codename'),
                    localData = getLocalStorage(deviceToGrab),
                    deviceDataLastChecked = $.now() - storage.get(deviceToGrab + '-timestamp');

                if (localData !== null && (deviceDataLastChecked !== undefined || deviceDataLastChecked < 3600000)) { /* One hour is 3600000 ms */
                    window.location = localData.updates[0].url;
                } else {
                    $.ajax({
                        url: aicpAPI,
                        type: 'GET',
                        dataType: 'json',
                        async: true,
                        contentType: 'application/x-www-form-urlencoded; charset=utf-8',
                        data: {
                            'device': deviceToGrab
                        },
                        xhrFields: {
                            onprogress: function (e) {

                                /** @namespace e.lengthComputable */
                                /** @namespace e.loaded */
                                /** @namespace e.total */
                                if (e.lengthComputable) {
                                    log(e.loaded / e.total * 100 + '%');
                                }
                            }
                        },
                        success: function (data) {
                            window.location = data.updates[0].url;
                        },
                        error: function (e) {
                            makeModal('error', null, null);
                            log(e.message, 'error');
                        }
                    });
                }
            });

            $(document).on('click', '.modal-trigger', function () {

                var elem = $(this).closest('.modal-btn'),
                    deviceToGrab = elem.data('codename'),
                    deviceHeader = elem.find('.card-content').html(),
                    localData = getLocalStorage(deviceToGrab),
                    deviceDataLastChecked = $.now() - storage.get(deviceToGrab + '-timestamp');

                // show the device header and pre-loader without wait for ajax
                $('#downloadModal').html(deviceHeader);
                $('#modal').find('.modal-body').html('' +
                    '<div class="progress">' +
                    '   <div class="indeterminate"></div>' +
                    '</div>');

                if (localData !== null && (deviceDataLastChecked !== undefined || deviceDataLastChecked < 3600000)) { /* One hour is 3600000 ms */

                    makeModal(localData, deviceToGrab, deviceHeader);

                } else {

                    modalWithNewData(deviceToGrab, deviceHeader);

                }
                //noinspection JSUnresolvedVariable,JSLint
                var _gaq = _gaq || [];
                _gaq.push(['_setAccount', 'UA-71822266-1']);
                _gaq.push(['_trackPageview', deviceToGrab]);

            });

            $(document).on('click', '.modal tr .dload', function () {
                var downloadLink = $(this).parent().attr('data-url');
                window.open(downloadLink, '_blank');
            });
            if (search.val()) {
                search.next('label').css('opacity', 0);
            }
            search.on('focus', function () {
                $(this).next('label').css('opacity', 0);
            });
            search.on('change keyup', function () {
                var searchParam = $(this).val();
                filter(searchParam);
            });
        }
    });
}(jQuery));