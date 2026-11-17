import { booleanAttribute, Component, computed, inject, input, InputSignal, InputSignalWithTransform, model, ModelSignal, Signal } from '@angular/core';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { FilterTileOption } from './filter-tile-option.model';
import { FilterTile } from './filter-tile.model';
import { FilterTilesColor } from './filter-tiles-color.type';
import { FilterTilesConfig } from './filter-tiles-config.model';
import { FILTER_TILES_CONFIG } from './filter-tiles-config.provider';

// a min-h instead of a fixed height, so a label that wraps or grows with the text makes the tile taller. Icons are
// sized in em, so they grow with the text.
const TILE_BASE_CLASSES: string = `
    flex min-h-24 min-w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-filter-tile border px-4 py-3 text-center
    text-label transition
    focus-visible:outline-2 focus-visible:outline-offset-2
    [&_svg]:size-[1.75em]
`;

// like a toggle button: a chosen tile is filled, which sets it apart by more than its color, the others are the
// colored text on the surface. Hover and press only switch to the -hover, -pressed, -tint and -tint-pressed tokens,
// whose pairs are checked. The border of a tile that isn't chosen is decorative, its label identifies it; a filled one
// has a transparent border, which keeps its shape in forced colors mode.
const TILE_CLASSES: Record<'pressed' | 'unpressed', Record<FilterTilesColor, string>> = {
    pressed: {
        primary: `
            border-transparent bg-primary text-on-primary
            hover:bg-primary-hover
            active:bg-primary-pressed
            focus-visible:outline-primary
        `,
        secondary: `
            border-transparent bg-secondary text-on-secondary
            hover:bg-secondary-hover
            active:bg-secondary-pressed
            focus-visible:outline-secondary-text
        `
    },
    unpressed: {
        primary: `
            border-outline-variant bg-surface text-primary
            hover:bg-primary-tint
            active:bg-primary-tint-pressed
            focus-visible:outline-primary
        `,
        secondary: `
            border-outline-variant bg-surface text-secondary-text
            hover:bg-secondary-tint
            active:bg-secondary-tint-pressed
            focus-visible:outline-secondary-text
        `
    }
};

/**
 * A row of tiles that filter a list, like the categories of treatments, with a tile that shows everything first:
 * `<ui-filter-tiles label="Categories" [options]="categories" [(value)]="chosen" />`. Each tile has a label, and
 * optionally an icon and how many items it has. They are toggle buttons, so screen readers say which ones are chosen.
 * The value is a list of the chosen values, empty while everything shows: choosing a tile replaces the one that was
 * chosen, and choosing it again shows everything; with multiple, every tile is chosen on its own.
 * Unset inputs fall back to the values provided with provideFilterTilesConfig.
 */
@Component({
    selector: 'ui-filter-tiles',
    templateUrl: './filter-tiles.component.html',
    imports: [IconComponent],
    host: {
        class: 'block'
    }
})
export class FilterTilesComponent<T> {
    private readonly config: FilterTilesConfig = inject(FILTER_TILES_CONFIG);

    /**
     * What screen readers call the group of tiles, like 'Categories'.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * The tiles, after the one that shows everything.
     */
    readonly options: InputSignal<FilterTileOption<T>[]> = input.required<FilterTileOption<T>[]>();

    /**
     * The chosen values, empty while everything shows. Bind it with [(value)].
     */
    readonly value: ModelSignal<T[]> = model<T[]>([]);

    /**
     * Whether several tiles can be chosen at once.
     */
    readonly multiple: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * How many items there are in total, shown on the tile that shows everything.
     */
    readonly allCount: InputSignal<number | undefined> = input<number>();

    /**
     * The label of the tile that shows everything. The default comes from provideFilterTilesConfig.
     */
    readonly allLabel: InputSignal<string> = input<string>(this.config.allLabel);

    /**
     * The color of the tiles. The default comes from provideFilterTilesConfig.
     */
    readonly color: InputSignal<FilterTilesColor> = input<FilterTilesColor>(this.config.color);

    /**
     * The tiles as they show, the one that shows everything first. It has an icon while the others have them.
     */
    protected readonly tiles: Signal<FilterTile<T>[]> = computed(() => {
        const chosen: T[] = this.value();
        const options: FilterTileOption<T>[] = this.options();
        const allIcon: IconDefinition | undefined = options.some(option => option.icon != undefined) ? this.config.allIcon : undefined;
        return [
            this.toTile(undefined, this.allLabel(), allIcon, this.allCount(), chosen.length === 0),
            ...options.map(option => this.toTile(option, option.label, option.icon, option.count, chosen.includes(option.value)))
        ];
    });

    /**
     * Chooses a tile, or takes it back.
     * @param tile - The tile the user pressed.
     */
    protected toggle(tile: FilterTile<T>): void {
        const option: FilterTileOption<T> | undefined = tile.option;
        if (option == undefined) {
            this.value.set([]);
            return;
        }
        if (tile.pressed) {
            this.value.update(chosen => chosen.filter(value => value !== option.value));
            return;
        }
        this.value.update(chosen => this.multiple() ? [...chosen, option.value] : [option.value]);
    }

    private toTile(
        option: FilterTileOption<T> | undefined,
        label: string,
        icon: IconDefinition | undefined,
        count: number | undefined,
        pressed: boolean
    ): FilterTile<T> {
        return {
            option,
            label,
            icon,
            count,
            countLabel: count == undefined ? '' : this.config.countLabel(count),
            pressed,
            classes: `${TILE_BASE_CLASSES} ${TILE_CLASSES[pressed ? 'pressed' : 'unpressed'][this.color()]}`
        };
    }
}