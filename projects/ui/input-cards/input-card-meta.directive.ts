import { Directive, inject, input, InputSignal, TemplateRef } from '@angular/core';

import { InputCardMetaContext } from './input-card-meta-context.model';
import { InputCardOption } from './input-card-option.model';

/**
 * What every card of a cards input shows at its end, like a price: `<ng-template uiInputCardMeta let-option>`, inside
 * of the input. Give it the options, `[uiInputCardMeta]="cars"`, and `let-option` has their type.
 */
@Directive({
    selector: 'ng-template[uiInputCardMeta]'
})
export class InputCardMetaDirective<T> {
    /**
     * The options of the input, only for the type of `let-option`.
     */
    readonly uiInputCardMeta: InputSignal<InputCardOption<T>[] | ''> = input<InputCardOption<T>[] | ''>('');

    /**
     * The template, which every card renders with its option.
     */
    readonly template: TemplateRef<InputCardMetaContext<T>> = inject<TemplateRef<InputCardMetaContext<T>>>(TemplateRef);

    /**
     * Tells the compiler what the template gets, so `let-option` is typed.
     * @param directive - The directive on the template.
     * @param context - What the template gets.
     * @returns Always true.
     */
    // only the type checker of the templates calls it, with both arguments, and the predicate is all it reads.
    // eslint-disable-next-line unusedImports/no-unused-vars
    static ngTemplateContextGuard<T>(directive: InputCardMetaDirective<T>, context: unknown): context is InputCardMetaContext<T> {
        return true;
    }
}