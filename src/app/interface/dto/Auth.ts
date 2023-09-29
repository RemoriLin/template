export interface DtoLogin {
  tokenType: string
  user: {
    uid: string
  }
  username: string
  accessToken: string
  expiresIn: number
  message: string
}
