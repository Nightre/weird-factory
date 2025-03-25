export type successReq<D = any> = { success: string, message: string, data?: D }

export interface User {
    name: string,
    id: string
}

export type PlayerList = Array<User>