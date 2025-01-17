/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from "@microsoft/vscode-azext-utils";

import { deployWorkspaceProject } from "../deployWorkspaceProject/deployWorkspaceProject";

export async function deployWorkspaceProjectWalkthrough(
	context: IActionContext,
): Promise<void> {
	await deployWorkspaceProject(context);
}
