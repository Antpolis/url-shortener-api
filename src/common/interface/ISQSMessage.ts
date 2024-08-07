export interface ISQSBodyMessage {
  Message: string
  MessageId: string
  TopicArn: string
  Subject: string
  Timestamp: Date
  Signature: string
}

export interface ISQSOldDecodedMessage<T> {
	key: string
	body: T
}