/**
 * The body of the requests that reset or roll back a change set.
 */
export type ChangeSetRequestBody = {
    /**
     * The id of the change set to reset or roll back.
     */
    changeSetId: string
};