export interface Message {
  id: number
  type: 'bot' | 'user'
  content: string
  image?: string
}
