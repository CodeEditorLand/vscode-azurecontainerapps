/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	callWithTelemetryAndErrorHandling,
	nonNullProp,
	type IActionContext,
} from "@microsoft/vscode-azext-utils";
import {
	type AzureResource,
	type AzureResourceBranchDataProvider,
	type AzureSubscription,
	type ResourceModelBase,
	type ViewPropertiesModel,
} from "@microsoft/vscode-azureresources-api";
import * as vscode from "vscode";

import { ext } from "../extensionVariables";
import { type ContainerAppModel } from "./ContainerAppItem";
import { ManagedEnvironmentItem } from "./ManagedEnvironmentItem";

export interface TreeElementBase extends ResourceModelBase {
	getChildren?(): vscode.ProviderResult<TreeElementBase[]>;

	getTreeItem(): vscode.TreeItem | Thenable<vscode.TreeItem>;

	viewProperties?: ViewPropertiesModel;
}

export interface ContainerAppsItem extends TreeElementBase {
	subscription: AzureSubscription;

	containerApp: ContainerAppModel;
}

export class ContainerAppsBranchDataProvider
	extends vscode.Disposable
	implements AzureResourceBranchDataProvider<TreeElementBase>
{
	private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<
		TreeElementBase | undefined
	>();

	constructor() {
		super(() => {
			this.onDidChangeTreeDataEmitter.dispose();
		});
	}

	get onDidChangeTreeData(): vscode.Event<TreeElementBase | undefined> {
		return this.onDidChangeTreeDataEmitter.event;
	}

	async getChildren(
		element: TreeElementBase,
	): Promise<TreeElementBase[] | null | undefined> {
		return (await element.getChildren?.())?.map((child) => {
			if (child.id) {
				return ext.state.wrapItemInStateHandling(
					child as TreeElementBase & { id: string },
					() => this.refresh(child),
				);
			}

			return child;
		});
	}

	async getResourceItem(element: AzureResource): Promise<TreeElementBase> {
		const resourceItem = await callWithTelemetryAndErrorHandling(
			"getResourceItem",
			async (context: IActionContext) => {
				context.errorHandling.rethrow = true;

				const managedEnvironment = await ManagedEnvironmentItem.Get(
					context,
					element.subscription,
					nonNullProp(element, "resourceGroup"),
					element.name,
				);

				return new ManagedEnvironmentItem(
					element.subscription,
					element,
					managedEnvironment,
				);
			},
		);

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return ext.state.wrapItemInStateHandling(resourceItem!, () =>
			this.refresh(resourceItem),
		);
	}

	async getTreeItem(element: TreeElementBase): Promise<vscode.TreeItem> {
		const ti = await element.getTreeItem();

		return ti;
	}

	refresh(element?: TreeElementBase): void {
		this.onDidChangeTreeDataEmitter.fire(element);
	}
}

export const branchDataProvider = new ContainerAppsBranchDataProvider();
