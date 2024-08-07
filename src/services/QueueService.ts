import { createHash } from "crypto";
import { AWSConfig } from "../../config/aws";
import { classToPlain } from "class-transformer";
import { ISQSBodyMessage } from "../common/interface/ISQSMessage";
import { SQSMessage } from "sqs-consumer";
const AWS = require('aws-sdk');

// Set your AWS credentials and region
AWS.config.update({
  accessKeyId: AWSConfig.accessKey,
  secretAccessKey: AWSConfig.secretKey,
  region: AWSConfig.region, // e.g., 'us-east-1'
});

// Create an instance of the SNS service
const sns = new AWS.SNS();

export const DecodeSQSMessage = <T>(msg: SQSMessage) => {
	const body = JSON.parse(msg.Body) as ISQSBodyMessage;
	return JSON.parse(body.Message) as T;
}

export const sendSnsTopic = async(messageObjct:any, path:string, actionType: string[], uuid:number) =>{
  
  var params = {
    Message: JSON.stringify(classToPlain(messageObjct)), /* required */

    MessageAttributes: {
      path: {
        DataType: "String" /* required */,
        StringValue: path,
      },
      action: {
        DataType: "String.Array" /* required */,
        StringValue: actionType ? JSON.stringify(actionType) : JSON.stringify(["CRUD"]),
      },
      uuid: {
        DataType: "String" /* required */,
        StringValue: uuid.toString(),
      },
      messageVersion: {
        DataType: "String",
        StringValue: createHash('md5').update(JSON.stringify(messageObjct)).digest("hex"),
      },
      serverVersion: {
        DataType: "String",
        StringValue: AWSConfig.sns.snsTopicVersion ? AWSConfig.sns.snsTopicVersion: "",
      },
    },
    Subject: 'Publish SNS',
    TopicArn: AWSConfig.sns.snsARN+':'+AWSConfig.sns.snsQueuePath
  };

  sns.publish(params, function(err:any, data:any) {
    if (err) {
      console.log(err, err.stack);
    } else{
      console.log(data);
    }
  });
}