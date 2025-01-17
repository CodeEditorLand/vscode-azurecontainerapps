/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard } from "@microsoft/vscode-azext-utils";
import { type WorkspaceFolder } from "vscode";
import { createActivityContext } from "../../../../utils/activityUtils";
import { localize } from "../../../../utils/localize";
import { type IContainerAppContext } from "../../../IContainerAppContext";
import { RootFolderStep } from "../../../image/imageSource/buildImageInAzure/RootFolderStep";
import { type DeploymentConfiguration } from "../DeploymentConfiguration";
import { DeploymentConfigurationListStep } from "./DeploymentConfigurationListStep";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export async function getWorkspaceDeploymentConfiguration(context: IContainerAppContext & { rootFolder?: WorkspaceFolder }): Promise<DeploymentConfiguration> {
    const wizardContext: WorkspaceDeploymentConfigurationContext = Object.assign(context, {
        ...await createActivityContext(),
    });

    const wizard: AzureWizard<WorkspaceDeploymentConfigurationContext> = new AzureWizard(wizardContext, {
        title: localize('selectWorkspaceDeploymentConfigurationTitle', 'Select a workspace deployment configuration'),
        promptSteps: [
            new RootFolderStep(),
            new DeploymentConfigurationListStep(),
        ],
    });

    await wizard.prompt();

    if (wizardContext.deploymentConfigurationSettings) {
        wizardContext.activityTitle = wizardContext.deploymentConfigurationSettings.label ?
            localize('loadWorkspaceDeploymentActivityTitleOne', 'Load workspace deployment configuration "{0}"', wizardContext.deploymentConfigurationSettings.label) :
            localize('loadWorkspaceDeploymentActivityTitleTwo', 'Load workspace deployment configuration');
    } else {
        wizardContext.activityTitle = localize('prepareWorkspaceDeploymentActivityTitle', 'Prepare new workspace deployment configuration');
    }

    await wizard.execute();

    return {
        configurationIdx: wizardContext.configurationIdx,
        rootFolder: wizardContext.rootFolder,
        dockerfilePath: wizardContext.dockerfilePath,
        srcPath: wizardContext.srcPath,
        envPath: wizardContext.envPath,
        resourceGroup: wizardContext.resourceGroup,
        containerApp: wizardContext.containerApp,
        registry: wizardContext.registry
    };
}
