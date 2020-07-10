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
import cockpit from 'cockpit';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    Dropdown, DropdownItem, DropdownSeparator, KebabToggle,
    Tooltip,
} from '@patternfly/react-core';

import {
    shutdownVm,
    pauseVm,
    resumeVm,
    forceVmOff,
    forceRebootVm,
    rebootVm,
    sendNMI,
    startVm,
    installVm,
} from "../../actions/provider-actions.js";
import {
    vmId,
} from "../../helpers.js";

import { DeleteDialog } from "../deleteDialog.jsx";
import LibvirtDBus from '../../libvirt-dbus.js';

const _ = cockpit.gettext;

const VmActions = ({ vm, dispatch, storagePools, onAddErrorNotification }) => {
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [showDeleteDialog, toggleDeleteModal] = useState(false);

    const id = vmId(vm.name);
    const state = vm.state;
    const hasInstallPhase = vm.metadata.hasInstallPhase;
    const dropdownItems = [];

    const onStart = () => dispatch(startVm(vm)).catch(ex => {
        onAddErrorNotification({
            text: cockpit.format(_("VM $0 failed to start"), vm.name),
            detail: ex.message, resourceId: vm.id,
        });
    });
    const onInstall = () => dispatch(installVm(vm)).catch(ex => {
        onAddErrorNotification({
            text: cockpit.format(_("VM $0 failed to get installed"), vm.name),
            detail: ex.message, resourceId: vm.id,
        });
    });
    const onReboot = () => dispatch(rebootVm(vm)).catch(ex => {
        onAddErrorNotification({
            text: cockpit.format(_("VM $0 failed to reboot"), vm.name),
            detail: ex.message, resourceId: vm.id,
        });
    });
    const onForceReboot = () => dispatch(forceRebootVm(vm)).catch(ex => {
        onAddErrorNotification({
            text: cockpit.format(_("VM $0 failed to force reboot"), vm.name),
            detail: ex.message, resourceId: vm.id,
        });
    });
    const onShutdown = () => dispatch(shutdownVm(vm)).catch(ex => {
        onAddErrorNotification({
            text: cockpit.format(_("VM $0 failed to shutdown"), vm.name),
            detail: ex.message, resourceId: vm.id,
        });
    });
    const onPause = () => dispatch(pauseVm(vm)).catch(ex => {
        onAddErrorNotification({
            text: cockpit.format(_("VM $0 failed to pause"), vm.name),
            detail: ex.message, resourceId: vm.id,
        });
    });
    const onResume = () => dispatch(resumeVm(vm)).catch(ex => {
        onAddErrorNotification({
            text: cockpit.format(_("VM $0 failed to resume"), vm.name),
            detail: ex.message, resourceId: vm.id,
        });
    });
    const onForceoff = () => dispatch(forceVmOff(vm)).catch(ex => {
        onAddErrorNotification({
            text: cockpit.format(_("VM $0 failed to force shutdown"), vm.name),
            detail: ex.message, resourceId: vm.id,
        });
    });
    const onSendNMI = () => dispatch(sendNMI(vm)).catch(ex => {
        onAddErrorNotification({
            text: cockpit.format(_("VM $0 failed to send NMI"), vm.name),
            detail: ex.message, resourceId: vm.id,
        });
    });

    let shutdown;

    if (LibvirtDBus.canPause(state)) {
        dropdownItems.push(
            <DropdownItem key={`${id}-pause`}
                          id={`${id}-pause`}
                          onClick={() => onPause()}>
                {_("Pause")}
            </DropdownItem>
        );
        dropdownItems.push(<DropdownSeparator key="separator-pause" />);
    }

    if (LibvirtDBus.canResume(state)) {
        dropdownItems.push(
            <DropdownItem key={`${id}-resume`}
                          id={`${id}-resume`}
                          onClick={() => onResume()}>
                {_("Resume")}
            </DropdownItem>
        );
        dropdownItems.push(<DropdownSeparator key="separator-resume" />);
    }

    if (LibvirtDBus.canShutdown(state)) {
        shutdown = (<Button key='action-shutdown' variant='secondary' onClick={() => onShutdown()} id={`${id}-shutdown-button`}>
            {_("Shut down")}
        </Button>);
        dropdownItems.push(
            <DropdownItem key={`${id}-off`}
                          id={`${id}-off`}
                          onClick={() => onShutdown()}>
                {_("Shut down")}
            </DropdownItem>
        );
        dropdownItems.push(
            <DropdownItem key={`${id}-forceOff`}
                          id={`${id}-forceOff`}
                          onClick={() => onForceoff()}>
                {_("Force shut down")}
            </DropdownItem>
        );
        dropdownItems.push(<DropdownSeparator key="separator-shutdown" />);
        dropdownItems.push(
            <DropdownItem key={`${id}-sendNMI`}
                          id={`${id}-sendNMI`}
                          onClick={() => onSendNMI()}>
                {_("Send non-maskable interrupt")}
            </DropdownItem>
        );
        dropdownItems.push(<DropdownSeparator key="separator-sendnmi" />);
    }

    if (LibvirtDBus.canReset(state)) {
        dropdownItems.push(
            <DropdownItem key={`${id}-reboot`}
                          id={`${id}-reboot`}
                          onClick={() => onReboot()}>
                {_("Restart")}
            </DropdownItem>
        );
        dropdownItems.push(
            <DropdownItem key={`${id}-forceReboot`}
                          id={`${id}-forceReboot`}
                          onClick={() => onForceReboot()}>
                {_("Force restart")}
            </DropdownItem>
        );
        dropdownItems.push(<DropdownSeparator key="separator-reset" />);
    }

    let run = null;
    if (LibvirtDBus.canRun(state, hasInstallPhase)) {
        run = (<Button key='action-run' variant="secondary" onClick={() => onStart()} id={`${id}-run`}>
            {_("Run")}
        </Button>);
    }

    let install = null;
    if (LibvirtDBus.canInstall(state, hasInstallPhase)) {
        install = (<Button key='action-install' variant="secondary" onClick={() => onInstall()} id={`${id}-install`}>
            {_("Install")}
        </Button>);
    }

    let deleteAction = null;
    if (state !== undefined && LibvirtDBus.canDelete && LibvirtDBus.canDelete(state, vm.id)) {
        if (!vm.persistent) {
            dropdownItems.push(
                <Tooltip id={`${id}-delete-tooltip`} content={_("This VM is transient. Shut it down if you wish to delete it.")}>
                    <DropdownItem key={`${id}-delete`}
                                  id={`${id}-delete`}
                                  className='pf-m-danger'
                                  isDisabled>
                        {_("Delete")}
                    </DropdownItem>
                </Tooltip>
            );
        } else {
            dropdownItems.push(
                <DropdownItem className='pf-m-danger' key={`${id}-delete`} id={`${id}-delete`} onClick={() => toggleDeleteModal(true)}>
                    {_("Delete")}
                </DropdownItem>
            );
        }
        if (showDeleteDialog) {
            deleteAction = (
                <DeleteDialog key='action-delete' vm={vm} dispatch={dispatch} storagePools={storagePools} toggleModal={() => toggleDeleteModal(!showDeleteDialog)} />
            );
        }
    }

    return (
        <div className='btn-group'>
            {run}
            {shutdown}
            {install}
            {deleteAction}
            <Dropdown onSelect={() => setIsActionOpen(!isActionOpen)}
                      id={`${id}-action-kebab`}
                      toggle={<KebabToggle onToggle={isOpen => setIsActionOpen(isOpen)} />}
                      isPlain
                      isOpen={isActionOpen}
                      position='right'
                      dropdownItems={dropdownItems} />
        </div>
    );
};

VmActions.propTypes = {
    vm: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    storagePools: PropTypes.array.isRequired,
    onAddErrorNotification: PropTypes.func.isRequired,
};

export default VmActions;
