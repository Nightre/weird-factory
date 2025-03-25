export const compareStrings = (str1: string, str2: string) => {
    const minLength = Math.min(str1.length, str2.length);
    return str1.substring(0, minLength) === str2.substring(0, minLength);
}

export const indexToRank = (index: number) => {
    index = index + 1
    if (index === 1) {
        return "🥇"
    } else if (index === 2) {
        return "🥈"
    } else if (index === 3) {
        return "🥉"
    }
    return `${index}.`
}

