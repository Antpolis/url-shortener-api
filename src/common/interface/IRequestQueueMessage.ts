export interface IRequestQueueMessage<T> {
  headers: {
    host: string,
    "user-agent": string
    [key: string]: string
  },
  userAgent?: string,
  hash: string,
  host: string,
  urlEntityID?: T,
  ipAddress?: string
  requestDate?: Date
}