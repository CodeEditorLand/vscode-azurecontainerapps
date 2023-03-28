/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Registry } from '@azure/arm-containerregistry';
import { SupportedRegistries } from '../../../constants';
import { IImageSourceBaseContext } from '../IImageSourceBaseContext';

export interface IContainerRegistryImageContext extends IImageSourceBaseContext {
    registryDomain?: SupportedRegistries;
    registry?: Registry;
    dockerHubNamespace?: string;

    repositoryName?: string;
    tag?: string;

    // Registry credentials
    registryName?: string;
    username?: string;
    secret?: string;
}