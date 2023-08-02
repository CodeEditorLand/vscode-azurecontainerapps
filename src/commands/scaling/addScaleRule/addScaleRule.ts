/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, Scale } from "@azure/arm-appcontainers";
import { AzureWizard, IActionContext, createSubscriptionContext, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { ScaleRuleGroupItem } from "../../../tree/scaling/ScaleRuleGroupItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import { pickScaleRuleGroup } from "../../../utils/pickItem/pickScale";
import { AddScaleRuleStep } from "./AddScaleRuleStep";
import type { IAddScaleRuleContext } from "./IAddScaleRuleContext";
import { ScaleRuleNameStep } from "./ScaleRuleNameStep";
import { ScaleRuleTypeListStep } from "./ScaleRuleTypeListStep";

export async function addScaleRule(context: IActionContext, node?: ScaleRuleGroupItem): Promise<void> {
    const item: ScaleRuleGroupItem = node ?? await pickScaleRuleGroup(context);
    const { subscription, containerApp, revision } = item;

    // Branching path reasoning: <insert link to README>
    let scale: Scale | undefined;
    if (containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
        scale = nonNullValueAndProp(containerApp.template, 'scale');
    } else {
        scale = nonNullValueAndProp(revision.template, 'scale');
    }

    const wizardContext: IAddScaleRuleContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext(),
        containerApp,
        subscription,
        scaleRules: scale.rules ?? [],
    };

    const wizard: AzureWizard<IAddScaleRuleContext> = new AzureWizard(wizardContext, {
        title: localize('addScaleRuleTitle', 'Add scale rule to container app "{0}" (unsaved change)', containerApp.name),
        promptSteps: [new ScaleRuleNameStep(), new ScaleRuleTypeListStep()],
        executeSteps: [new AddScaleRuleStep(item)],
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();

    ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
}
