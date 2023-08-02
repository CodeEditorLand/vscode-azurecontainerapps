/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Template } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { ext } from "../../extensionVariables";
import { RevisionsItemModel } from "../../tree/revisionManagement/RevisionItem";
import { IContainerAppContext } from "../IContainerAppContext";

export abstract class RevisionDraftUpdateBaseStep<T extends IContainerAppContext> extends AzureWizardExecuteStep<T> {
    /**
     * This is what will eventually be used to update the revision draft template
     */
    protected revisionDraftTemplate: Template;

    constructor(readonly baseItem: RevisionsItemModel) {
        super();
        this.revisionDraftTemplate = this.initRevisionDraftTemplate();
    }

    abstract execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void>;
    abstract shouldExecute(context: T): boolean;

    protected updateRevisionDraftWithTemplate(): void {
        ext.revisionDraftFileSystem.updateRevisionDraftWithTemplate(this.baseItem, this.revisionDraftTemplate);
    }

    private initRevisionDraftTemplate(): Template {
        let template: Template | undefined = ext.revisionDraftFileSystem.parseRevisionDraft(this.baseItem);
        if (!template) {
            template = nonNullValueAndProp(this.baseItem.revision, 'template');
        }
        return template;
    }
}
