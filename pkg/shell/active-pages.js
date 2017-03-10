/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2017 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <http://www.gnu.org/licenses/>.
 */

var cockpit = require("cockpit");
var _ = cockpit.gettext;

var React = require("react");

var dialogPattern = require("cockpit-components-dialog.jsx");
var PagesDialog = require("./active-pages-dialog.jsx");

var showDialog = function() {
    var dataStore = { };

    function gatherIframes() {
        var frames = [];
        var visibleHost; // we omit the host for all pages on our current system
        var search = function (iframes) {
            var n;
            var element;
            for (n = 0; n < iframes.length; n++) {
                if (iframes[n].frames.length > 0)
                    search(iframes[n].frames);
                element = {
                    page: iframes[n],
                    frame: iframes[n].frameElement
                };
                // prepare the frame info
                if (element.frame.name)
                    element.name = element.frame.name;
                else
                    element.name = element.frame.baseURI;
                if (element.name.indexOf("cockpit1:") === 0)
                    element.name = element.name.substring(9);
                var p = element.name.indexOf("/");
                if (p !== -1) {
                    element.hostname = element.name.substring(0, p);
                    element.name = element.name.substring(p + 1);
                }
                frames.push(element);
                element.visible = (element.frame.style.display.indexOf("block") !== -1);
                if (element.visible && element.hostname !== undefined)
                    visibleHost = element.hostname;
            }
        };
        search(window.top.frames);
        // now update the displayName
        var n, frame;
        for (n = 0; n < frames.length; n++) {
            frame = frames[n];
            if (frame.hostname == visibleHost)
                frame.displayName = "/" + frame.name;
            else
                frame.displayName = frame.hostname + ":/" + frame.name;
        }
        return frames;
    }

    var selectedFrames = [];

    dataStore.closePage = function() {
        // the user wants to close the selected pages
        var dfd = cockpit.defer();
        selectedFrames.map(function(frame) {
            frame.frame.parentNode.removeChild(frame.frame);
        });
        dfd.resolve();
        return dfd.promise();
    };

    function selectionChanged(frame, selected) {
        var index = selectedFrames.indexOf(frame);
        if (selected) {
            if (index === -1)
                selectedFrames.push(frame);
        } else {
            if (index !== -1)
                selectedFrames.splice(index, 1);
        }
    }

    var frames = gatherIframes();
    // by default, select currently active (visible) frame
    frames.forEach(function(f, index) {
        if (f.visible) {
            if (!(f in selectedFrames))
                selectedFrames.push(f);
        }
        f.selected = f.visible;
    });
    dataStore.dialogProps = {
        title: _("Active Pages"),
        id: "active-pages-dialog",
        body: React.createElement(PagesDialog, { iframes: frames, selectionChanged: selectionChanged }),
    };

    dataStore.footerProps = {
        'actions': [
              { 'clicked': dataStore.closePage,
                'caption': _("Close Selected Pages"),
                'style': 'primary',
              }
          ],
    };

    dataStore.dialogObj = dialogPattern.show_modal_dialog(dataStore.dialogProps, dataStore.footerProps);

    dataStore.update = function() {
        dataStore.dialogProps.body = React.createElement(PagesDialog, { });
        dataStore.dialogObj.setProps(dataStore.dialogProps);
    };

    return dataStore;
};

module.exports = {
    showDialog: showDialog
};
