/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import {TPromise} from 'vs/base/common/winjs.base';
import {EditorModel, EditorInput} from 'vs/workbench/common/editor';
import {ResourceEditorModel} from 'vs/workbench/common/editor/resourceEditorModel';
import URI from 'vs/base/common/uri';
import {EventType} from 'vs/base/common/events';
import {IInstantiationService} from 'vs/platform/instantiation/common/instantiation';
import {IModelService} from 'vs/editor/common/services/modelService';

/**
 * A read-only text editor input whos contents are made of the provided resource that points to an existing
 * code editor model.
 */
export class ResourceEditorInput extends EditorInput {

	public static ID: string = 'workbench.editors.resourceEditorInput';

	protected cachedModel: ResourceEditorModel;
	protected resource: URI;

	private name: string;
	private description: string;

	constructor(
		name: string,
		description: string,
		resource: URI,
		@IModelService protected modelService: IModelService,
		@IInstantiationService protected instantiationService: IInstantiationService
	) {
		super();

		this.name = name;
		this.description = description;
		this.resource = resource;
	}

	public getId(): string {
		return ResourceEditorInput.ID;
	}

	public getName(): string {
		return this.name;
	}

	public getDescription(): string {
		return this.description;
	}

	public resolve(refresh?: boolean): TPromise<EditorModel> {

		// Use Cached Model
		if (this.cachedModel) {
			return TPromise.as<EditorModel>(this.cachedModel);
		}

		// Otherwise Create Model and handle dispose event
		let model = this.instantiationService.createInstance(ResourceEditorModel, this.resource);
		const unbind = model.addListener(EventType.DISPOSE, () => {
			this.cachedModel = null; // make sure we do not dispose model again
			unbind();
			this.dispose();
		});

		// Load it
		return model.load().then((resolvedModel: ResourceEditorModel) => {
			this.cachedModel = resolvedModel;

			return this.cachedModel;
		});
	}

	public matches(otherInput: any): boolean {
		if (super.matches(otherInput) === true) {
			return true;
		}

		if (otherInput instanceof ResourceEditorInput) {
			let otherResourceEditorInput = <ResourceEditorInput>otherInput;

			// Compare by properties
			return otherResourceEditorInput.resource.toString() === this.resource.toString();
		}

		return false;
	}

	public dispose(): void {
		if (this.cachedModel) {
			this.cachedModel.dispose();
			this.cachedModel = null;
		}

		super.dispose();
	}
}
