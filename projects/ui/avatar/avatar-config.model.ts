import { AvatarColor } from './avatar-color.type';
import { AvatarSize } from './avatar-size.type';

/**
 * The values an avatar uses when its inputs are not set.
 */
export type AvatarConfig = {
    /**
     * How large it is.
     */
    size: AvatarSize,
    /**
     * The background of its initials.
     */
    color: AvatarColor
};
