/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownSkuName, Registry } from "@azure/arm-containerregistry";
import { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { WorkspaceFolder } from "vscode";
import { ext } from "../../../extensionVariables";
import { localize } from "../../../utils/localize";
import { AcrListStep } from "../../deployImage/imageSource/containerRegistry/acr/AcrListStep";
import { RegistryNameStep } from "../../deployImage/imageSource/containerRegistry/acr/createAcr/RegistryNameStep";
import { IDeployWorkspaceProjectSettings, getContainerAppDeployWorkspaceSettings } from "../getContainerAppDeployWorkspaceSettings";

interface DefaultAzureContainerRegistry {
    registry?: Registry;
    newRegistryName?: string;
    newRegistrySku?: KnownSkuName;
}

export async function getDefaultAzureContainerRegistry(context: ISubscriptionActionContext, rootFolder: WorkspaceFolder, resourceNameBase: string): Promise<DefaultAzureContainerRegistry> {
    const registries: Registry[] = await AcrListStep.getRegistries(context);

    // Strategy 1: See if there is a local workspace configuration to leverage
    const settings: IDeployWorkspaceProjectSettings | undefined = await getContainerAppDeployWorkspaceSettings(rootFolder);
    const savedRegistry: Registry | undefined = registries.find(r => settings?.acrName && r.name === settings.acrName);
    if (savedRegistry) {
        ext.outputChannel.appendLog(localize('foundResourceMatch', 'Used saved workspace settings to find existing container registry "{0}".', settings?.acrName));
        return {
            registry: savedRegistry,
            newRegistryName: undefined,
            newRegistrySku: undefined
        };
    }

    // Strategy 2: See if we can reuse existing resources that match the workspace name
    const registry: Registry | undefined = registries.find(r => r.name === resourceNameBase);

    // If still no registry we can use, then make sure the name is available
    if (!registry && !await RegistryNameStep.isNameAvailable(context, resourceNameBase)) {
        const resourceNameError: string = localize('resourceNameError', 'Azure Container Registry matching the current workspace name "{0}" is unavailable.', resourceNameBase);
        ext.outputChannel.appendLog(resourceNameError)
        throw new Error(resourceNameError);
    }

    return {
        registry,
        newRegistryName: !registry ? resourceNameBase : undefined,
        newRegistrySku: KnownSkuName.Basic
    };
}
