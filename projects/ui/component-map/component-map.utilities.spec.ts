import { Component } from '@angular/core';
import { describe, expect, test } from 'vitest';

import { ComponentMapUtilities } from './component-map.utilities';

@Component({ selector: 'ui-link-stub', template: '' })
class LinkStubComponent {}

@Component({ selector: 'ui-image-stub', template: '' })
class ImageStubComponent {}

describe('ComponentMapUtilities', () => {
    test('accepts a component for exactly every key that is used', () => {
        expect(() => ComponentMapUtilities.validate({ link: LinkStubComponent, image: undefined }, ['link', 'link'], 'The navbar')).not.toThrow();
        expect(() => ComponentMapUtilities.validate({}, [], 'The navbar')).not.toThrow();
    });

    test('names the keys that are used without a component', () => {
        expect(() => ComponentMapUtilities.validate({ link: LinkStubComponent }, ['link', 'image', 'menu'], 'The navbar'))
            .toThrow('The navbar needs a component for "image", "menu", which are used but missing in its components.');
    });

    test('names the components nothing uses, which would only make the bundle bigger', () => {
        expect(() => ComponentMapUtilities.validate({ link: LinkStubComponent, image: ImageStubComponent }, ['link'], 'The footer'))
            .toThrow('The footer has a component for "image", which nothing uses. Remove it from its components, so it stays out of the bundle.');
    });
});