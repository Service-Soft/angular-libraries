import { PopoverTestingUtilities } from 'testing/popover';

// jsdom has no popover api, which the lists of the autocomplete and the chips open with.
PopoverTestingUtilities.addPopovers();