export function hasIntersection<T>(arr1: T[], arr2: T[]) {
    const set = new Set(arr1);
    return arr2.some(item => set.has(item));
}

export function difference<T>(arr1: T[], arr2: T[]): T[] {
    const set = new Set(arr2);
    return arr1.filter(item => !set.has(item));
}