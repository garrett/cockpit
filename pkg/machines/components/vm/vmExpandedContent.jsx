/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2016 Red Hat, Inc.
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
import PropTypes from 'prop-types';
import React from 'react';
import cockpit from 'cockpit';

import { vmId } from "../../helpers.js";

import VmDisksTab from '../vmDisksTabLibvirt.jsx';
import VmNetworkTab from '../vmnetworktab.jsx';
import Consoles from '../consoles.jsx';
import VmOverviewTab from '../vmOverviewTabLibvirt.jsx';
import VmActions from './vmActions.jsx';
import VmUsageTab from './vmUsageTab.jsx';
import { ListingPanel } from 'cockpit-components-listing-panel.jsx';

const _ = cockpit.gettext;

/** One VM in the list (a row)
 */
export const VmExpandedContent = ({
    vm, vms, config, libvirtVersion, hostDevices, storagePools, onStart, onInstall, onShutdown, onPause, onResume, onForceoff, onReboot, onForceReboot,
    onUsageStartPolling, onUsageStopPolling, onSendNMI, dispatch, networks, interfaces, nodeDevices, resourceHasError, onAddErrorNotification
}) => {
    const overviewTabName = _("Overview");
    const usageTabName = _("Usage");
    const disksTabName = _("Disks");
    const networkTabName = _("Network Interfaces");
    const consolesTabName = _("Consoles");

    const tabRenderers = [
        { name: overviewTabName, id: cockpit.format("$0-overview", vmId(vm.name)), renderer: VmOverviewTab, data: { vm, config, dispatch, nodeDevices, libvirtVersion } },
        { name: usageTabName, id: cockpit.format("$0-usage", vmId(vm.name)), renderer: VmUsageTab, data: { vm, onUsageStartPolling, onUsageStopPolling }, presence: 'onlyActive' },
        { name: disksTabName, id: cockpit.format("$0-disks", vmId(vm.name)), renderer: VmDisksTab, data: { vm, vms, config, storagePools, onUsageStartPolling, onUsageStopPolling, dispatch, onAddErrorNotification }, presence: 'onlyActive' },
        { name: networkTabName, id: cockpit.format("$0-networks", vmId(vm.name)), renderer: VmNetworkTab, presence: 'onlyActive', data: { vm, dispatch, config, hostDevices, interfaces, networks, nodeDevices, onAddErrorNotification } },
        { name: consolesTabName, id: cockpit.format("$0-consoles", vmId(vm.name)), renderer: Consoles, data: { vm, config, dispatch } },
    ];

    let initiallyActiveTab = null;
    if (vm.ui.initiallyOpenedConsoleTab) {
        initiallyActiveTab = tabRenderers.map((o) => o.name).indexOf(consolesTabName);
    }

    return (<ListingPanel
        colSpan='4'
        initiallyActiveTab={initiallyActiveTab}
        tabRenderers={tabRenderers}
        listingActions={VmActions({
            vm,
            config,
            dispatch,
            storagePools,
            onStart,
            onInstall,
            onReboot,
            onForceReboot,
            onShutdown,
            onPause,
            onResume,
            onForceoff,
            onSendNMI,
        })} />);
};
VmExpandedContent.propTypes = {
    vm: PropTypes.object.isRequired,
    vms: PropTypes.array.isRequired,
    config: PropTypes.object.isRequired,
    libvirtVersion: PropTypes.number.isRequired,
    storagePools: PropTypes.array.isRequired,
    hostDevices: PropTypes.object.isRequired,
    onStart: PropTypes.func.isRequired,
    onShutdown: PropTypes.func.isRequired,
    onPause: PropTypes.func.isRequired,
    onResume: PropTypes.func.isRequired,
    onForceoff: PropTypes.func.isRequired,
    onReboot: PropTypes.func.isRequired,
    onForceReboot: PropTypes.func.isRequired,
    onUsageStartPolling: PropTypes.func.isRequired,
    onUsageStopPolling: PropTypes.func.isRequired,
    onSendNMI: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    networks: PropTypes.array.isRequired,
    interfaces: PropTypes.array.isRequired,
    onAddErrorNotification: PropTypes.func.isRequired,
    nodeDevices: PropTypes.array.isRequired,
};
