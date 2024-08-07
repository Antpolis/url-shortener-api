export const AWSConfig = {
  accessKey: process.env.AWS_ACCESS,
  secretKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION,
  auth: {
    region: process.env.AUTH_REGION,
    authBaseURL: process.env.BASE_AUTH_URL as string,
    userInfoEndpoint: process.env.AUTH_TOKEN_ENDPOINT as string,
    timeout: process.env.BASE_AUTH_TIMEOUT,
    userRole: process.env.AUTH_USER_ROLE,
    tokenEndpoint: process.env.AUTH_TOKEN_PATH,
    darvisRole: (process.env.AUTH_DARVIS_ROLE as string).split(","),
    urlShortenerRole: process.env.AUTH_URLSHORTENER_ROLE,
    JWTCookieName: process.env.AUTH_COOKIE_ACCESS_TOKEN_NAME,
    userPoolID: process.env.AUTH_USER_POOL_ID as string,
    clientID: process.env.AUTH_CLIENTID as string,
    tokenUse: process.env.AUTH_TOKEN_USE as string,
  },
  sns:{
    snsTopicVersion: process.env.AWS_SNS_TOPIC_VERSION,
    snsARN: process.env.AWS_SNS_ARN,
    snsQueuePath:process.env.AWS_SNS_QUEUE_PATH,
    region: process.env.AWS_REGION,
  },
  sqs:{
    sqsQueueUrl: process.env.AWS_SQS_QUEUE_URL,
    sqsQueuePath:process.env.AWS_SQS_QUEUE_PATH,
    region: process.env.AWS_REGION,
  },
  instanceConfig: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET
  }
}


