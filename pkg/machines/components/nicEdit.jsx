/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2018 Red Hat, Inc.
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
import React from 'react';
import cockpit from 'cockpit';
import PropTypes from 'prop-types';
import {
    Alert,
    Modal,
    Button
} from 'patternfly-react';
import * as Select from 'cockpit-components-select.jsx';
import {
    changeNetworkSettings,
    getVm
} from '../actions/provider-actions.es6';

import './nicEdit.css';

const _ = cockpit.gettext;

const NetworkModelRow = ({ idPrefix, onValueChanged, dialogValues, network, osTypeArch, osTypeMachine, isRunning }) => {
    let availableModelTypes = [
        { 'name': 'virtio', 'desc': 'Linux, perf' },
        { 'name': 'e1000e', 'desc': 'PCI' },
        { 'name': 'e1000', 'desc': 'PCI, legacy' },
        { 'name': 'rtl8139', 'desc': 'PCI, legacy' } ];
    let defaultModelType = dialogValues.networkModel;

    if (osTypeArch == 'ppc64' && osTypeMachine == 'pseries') {
        availableModelTypes.push('spapr-vlan');
    }

    return (
        <div className='row'>
            <div className='col-md-2 dialog-field'>
                <label htmlFor={`${idPrefix}-select-model`}>
                    {_('Model')}
                </label>
            </div>
            <div className='col-md-4 dialog-field'>
                <Select.Select id={`${idPrefix}-select-model`}
                               onChange={value => onValueChanged('networkModel', value)}
                               initial={defaultModelType}
                               extraClass='form-control'>
                    {availableModelTypes
                            .map(networkModel => {
                                return (
                                    <Select.SelectEntry data={networkModel.name} key={networkModel.name}>
                                        {networkModel.name} ({networkModel.desc})
                                    </Select.SelectEntry>
                                );
                            })}
                </Select.Select>
            </div>
        </div>
    );
};

const NetworkTypeAndSourceRow = ({ idPrefix, onValueChanged, dialogValues, network, connectionName, networks }) => {
    let defaultNetworkType = dialogValues.networkType;
    let availableNetworkTypes = [];
    let defaultNetworkSource = dialogValues.networkSource;
    let availableNetworkSources = [];
    let networkSourcesContent;

    if (connectionName !== 'session')
        availableNetworkTypes = [
            { 'name': 'network', 'desc': 'Virtual network' },
            { 'name': 'bridge', 'desc': 'Bridge to LAN', 'disabled': true },
            { 'name': 'ethernet', 'desc': 'Generic ethernet connection', 'disabled': true },
            { 'name': 'direct', 'desc': 'Direct attachment', 'disabled': true },
        ];
    else
        availableNetworkTypes = [
            { 'name': 'network', 'desc': 'Virtual network' },
            { 'name': 'user', 'desc': 'Userspace SLIRP stack' },
        ];

    if (dialogValues.networkType == 'network')
        availableNetworkSources = networks[connectionName];
    if (availableNetworkSources.length > 0) {
        networkSourcesContent = availableNetworkSources
                .map(networkSource => {
                    return (
                        <Select.SelectEntry data={networkSource} key={networkSource}>
                            {networkSource}
                        </Select.SelectEntry>
                    );
                });
    } else {
        networkSourcesContent = (
            <Select.SelectEntry data='empty' key='empty-list'>
                <i>{_('No virtual networks')}</i>
            </Select.SelectEntry>
        );
        defaultNetworkSource = 'empty';
    }

    return (
        <div className='row'>
            <div className='col-md-2 dialog-field'>
                <label htmlFor={`${idPrefix}-select-type`}>
                    {_('Network Type')}
                </label>
            </div>
            <div className='col-md-4 dialog-field'>
                <Select.Select id={`${idPrefix}-select-type`}
                               onChange={value => onValueChanged('networkType', value)}
                               initial={defaultNetworkType}
                               extraClass='form-control'>
                    {availableNetworkTypes
                            .map(networkType => {
                                return (
                                    <Select.SelectEntry data={networkType.name} key={networkType.name} disabled={networkType.disabled || false} >
                                        {networkType.desc}
                                    </Select.SelectEntry>
                                );
                            })}
                </Select.Select>
            </div>
            {(dialogValues.networkType === 'network') && (
                <div className='col-md-6 dialog-field edit-nic-source'>
                    <label htmlFor={`${idPrefix}-select-source`}>
                        {_('Network Source')}
                    </label>
                    <Select.Select id={`${idPrefix}-select-source`}
                                   onChange={value => onValueChanged('networkSource', value)}
                                   initial={defaultNetworkSource}
                                   extraClass='form-control'>
                        {networkSourcesContent}
                    </Select.Select>
                </div>
            )}
        </div>
    );
};

const NetworkMacRow = ({ network }) => {
    return (
        <div className='row'>
            <div className='col-md-2 dialog-field'>
                <label>
                    {_('MAC Address')}
                </label>
            </div>
            <div className='col-md-4 dialog-field dialog-field-readonly'>
                {network.mac}
            </div>
        </div>
    );
};

export class EditNICAction extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showModal: false,
            dialogError: undefined,
            networkType: props.network.type,
            networkSource: props.network.source[props.network.type],
            networkModel: props.network.model,
        };
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.save = this.save.bind(this);
        this.onValueChanged = this.onValueChanged.bind(this);
        this.dialogErrorSet = this.dialogErrorSet.bind(this);
        this.dialogErrorDismiss = this.dialogErrorDismiss.bind(this);
    }

    onValueChanged(key, value) {
        const stateDelta = { [key]: value };

        this.setState(stateDelta);
    }

    dialogErrorSet(text) {
        this.setState({ dialogError: text });
    }

    dialogErrorDismiss() {
        this.setState({ dialogError: undefined });
    }

    close() {
        this.setState({ showModal: false });
        this.dialogErrorDismiss();
    }

    open() {
        this.setState({ showModal: true });
    }

    save() {
        const { dispatch, vm, network } = this.props;

        dispatch(changeNetworkSettings({
            vm, macAddress: network.mac,
            networkModel: this.state.networkModel,
            networkType: this.state.networkType,
            networkSource: this.state.networkSource
        }))
                .fail((exc) => {
                    this.dialogErrorSet(_('Network settings failed to change with following error: ') + exc.message);
                })
                .then(() => {
                    dispatch(getVm({ connectionName: vm.connectionName, id: vm.id }));
                    this.close();
                });
    }

    render() {
        const { idPrefix, vm, network, networks } = this.props;
        const defaultBody = (
            <div className='modal-body edit-nic-dialog'>
                <div className='container-fluid edit-nic-body'>
                    <NetworkTypeAndSourceRow idPrefix={idPrefix}
                                             dialogValues={this.state}
                                             onValueChanged={this.onValueChanged}
                                             network={network}
                                             networks={networks}
                                             connectionName={vm.connectionName}
                                             isRunning={vm.state == 'running'} />
                    <NetworkModelRow idPrefix={idPrefix}
                                     dialogValues={this.state}
                                     onValueChanged={this.onValueChanged}
                                     network={network}
                                     osTypeArch={vm.arch}
                                     osTypeMachine={vm.emulatedMachines}
                                     isRunning={vm.state == 'running'} />
                    <NetworkMacRow network={network} />
                </div>
            </div>
        );
        const footerWarning = (
            <span id={`${idPrefix}-edit-dialog-idle-message`} className='nic-edit-idle-message'>
                <span className='fa-stack'>
                    <i className='fa fa-circle-thin fa-stack-2x fa-stack-md' />
                    <i className='fa fa-hourglass fa-stack-1x fa-stack-md' />
                </span>
                <span>{'Changes will apply on VM restart'}</span>
            </span>
        );

        return (
            <div id={`${idPrefix}-edit-dialog-full`}>
                <Button id={`${idPrefix}-edit-dialog`} bsStyle='default' onClick={this.open}>
                    {_('Edit')}
                </Button>

                <Modal id={`${idPrefix}-edit-dialog-modal-window`} show={this.state.showModal} onHide={this.close}>
                    <Modal.Header>
                        <Modal.CloseButton onClick={this.close} />
                        <Modal.Title> {`${network.mac} Virtual Network Interface Settings`} </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {this.state.dialogError && (<Alert onDismiss={this.dialogErrorDismiss}> {this.state.dialogError} </Alert>)}
                        {defaultBody}
                    </Modal.Body>
                    <Modal.Footer>
                        { vm.state === 'running' && footerWarning }
                        <Button id={`${idPrefix}-edit-dialog-cancel`} bsStyle='default' className='btn-cancel' onClick={this.close}>
                            {_('Cancel')}
                        </Button>
                        <Button id={`${idPrefix}-edit-dialog-save`} bsStyle='primary' onClick={this.save}>
                            {_('Save')}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

EditNICAction.propTypes = {
    dispatch: PropTypes.func.isRequired,
    idPrefix: PropTypes.string.isRequired,
    vm: PropTypes.object.isRequired,
    network: PropTypes.object.isRequired,
    networks: PropTypes.object.isRequired,
};

export default EditNICAction;
