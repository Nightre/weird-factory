import type { IInput } from "@/stores/game";

export const USER_STATUS = {
    BANNED: 'ban',
    NORMAL: 'nor',
    UNVERIFIED: 'unv'
};

export const ITEM_TYPE = {
    CONSUMABLE: 'con',
    MACHINE: 'mac',
    CONTAINER: "container",
    SUBMIT: "sub",
    TOOL: "tool",
    WAREROOM: "area",
    ANIMAL: "animal"
};

export const LEVEL = {
    PUBLIC: 'pub',
    PRIVATE: 'pri',
}

export const MARKET_TYPE = {
    CONSUMABLE: 'con',
    MACHINE: 'mac',
}
export const INPUT_TYPE = {
    NORMAL: "INPUT_TYPE.NORMAL",
    ALLOW_REFERENCE: "INPUT_TYPE.ALLOW_REFERENCE",
    PRIVATE: "INPUT_TYPE.PRIVATE",
}
export const ATTRIBUTES = {
    MONEY_CHANGE_PER_SECOND: "MONEY_CHANGE_PER_SECOND"
}

export const LOCK_TYPE = {
    LOCK_OUTPUT: "LOCK_OUTPUT",
    LOCK_INPUT: "LOCK_INPUT",
    LOCK_ACTION: "LOCK_ACTION",
    LOCK_SYNTHESIS: "LOCK_SYNTHESIS",
}

export const createInitInputsData = ({ item = null, isShadow = false, type }: IInput): IInput => {
    return {
        item,
        isShadow,
        type: (type ?? INPUT_TYPE.NORMAL) as keyof typeof INPUT_TYPE,
    }
}