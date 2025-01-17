/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from "path";
import {
	AzureWizardPromptStep,
	nonNullProp,
	nonNullValueAndProp,
} from "@microsoft/vscode-azext-utils";

import { ext } from "../../../extensionVariables";
import { localize } from "../../../utils/localize";
import { ContainerAppNameStep } from "../../createContainerApp/ContainerAppNameStep";
import { ImageNameStep } from "../../image/imageSource/buildImageInAzure/ImageNameStep";
import { type DeployWorkspaceProjectInternalContext } from "./DeployWorkspaceProjectInternalContext";
import { sanitizeResourceName } from "./sanitizeResourceName";

/** Names the resources unique to the individual app: `container app`, `image name` */
export class AppResourcesNameStep extends AzureWizardPromptStep<DeployWorkspaceProjectInternalContext> {
	public constructor(private readonly suppressContainerAppCreation: boolean) {
		super();
	}

	public async configureBeforePrompt(
		context: DeployWorkspaceProjectInternalContext,
	): Promise<void> {
		// Configure the image name even if the rest of the resources have already been built
		context.imageName = ImageNameStep.getTimestampedImageName(
			context.newContainerAppName ||
				context.containerApp?.name ||
				context.newManagedEnvironmentName ||
				context.managedEnvironment?.name ||
				context.newResourceGroupName ||
				nonNullValueAndProp(context.resourceGroup, "name"),
		);
	}

	public async prompt(
		context: DeployWorkspaceProjectInternalContext,
	): Promise<void> {
		context.newContainerAppName = (
			await context.ui.showInputBox({
				prompt: localize(
					"containerAppNamePrompt",
					"Enter a name for the new container app",
				),
				value: sanitizeResourceName(
					context.dockerfilePath?.split(path.sep).at(-2) ?? "",
				),
				validateInput: (name: string) =>
					ContainerAppNameStep.validateInput(name),
				asyncValidationTask: async (name: string) => {
					const resourceGroupName: string =
						context.resourceGroup?.name ||
						nonNullProp(context, "newResourceGroupName");

					const isAvailable: boolean =
						await ContainerAppNameStep.isNameAvailable(
							context,
							resourceGroupName,
							name,
						);

					return isAvailable
						? undefined
						: localize(
								"containerAppExists",
								'The container app "{0}" already exists in resource group "{1}".',
								name,
								resourceGroupName,
							);
				},
			})
		).trim();

		context.imageName = ImageNameStep.getTimestampedImageName(
			context.newContainerAppName,
		);

		ext.outputChannel.appendLog(
			localize(
				"usingContainerAppName",
				'User provided the name "{0}" for the new container app.',
				context.newContainerAppName,
			),
		);
	}

	public shouldPrompt(
		context: DeployWorkspaceProjectInternalContext,
	): boolean {
		return (
			!context.containerApp &&
			!context.newContainerAppName &&
			!this.suppressContainerAppCreation
		);
	}
}
