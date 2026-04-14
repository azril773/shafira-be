import { UUID } from "./common_type"

export type LoginBody = {
    username: string
    password: string
}

export type JwtTokenPayload = {
    user_id: UUID    
    role: string
}