import { getCustomRepository } from "typeorm";
import { Url, UrlRepository } from "../services/Url.service";
import { RequestRepository, Request } from "../services/Request.service";
import { GeoLocationRepository } from "../services/GeoLocationRepository";
import { RequestLocation, RequestLocationRepository } from "../services/RequestLocation.service";
import moment = require("moment");
import { AWSConfig } from "../../config/aws";
import { botsAndSpidersFiltering } from "../helpers";
import { DecodeSQSMessage, sendSnsTopic } from "../services/QueueService";
import { Consumer, SQSMessage } from "sqs-consumer";
import AWS = require("aws-sdk");
import { parse } from "express-useragent";
import { toLong } from "ip";
import { IRequestQueueMessage } from "../common/interface/IRequestQueueMessage";

const processMessage = async (message: SQSMessage) => {
 
  const urlRepo = getCustomRepository(UrlRepository);
  const reqRepo = getCustomRepository(RequestRepository);
  const geoRepo =  getCustomRepository(GeoLocationRepository);
  const reqLocationRepo = getCustomRepository(RequestLocationRepository);

  // process messages in this function  
  let request = DecodeSQSMessage<IRequestQueueMessage<number>>(message);
  // console.log("Processing: " + message.Body)

  const urlEntity = await urlRepo
    .getUrlById(request.urlEntityID)
    .andWhere("url.active = 1")
    .getOne();
  if(urlEntity){

    let requestEntity: Request = new Request();
    let updateClicks: Url = new Url();
    if(!request.userAgent) {
      return
    }
    const userAgent = parse(request.userAgent);
    const isUserABot = await botsAndSpidersFiltering(userAgent.source);
    const currentDateAndTime = moment(request.requestDate)
    
    requestEntity.ip = request.ipAddress;
    
    // Check if the click is unique
    const sameIPCount = await reqRepo
      .getRequestByUrlId(request.urlEntityID)
      .andWhere("request.ip = :reqIP", { reqIP: requestEntity.ip })
      .andWhere('requestDate > :last30Minutes and requestDate < :after30Min', {
        last30Minutes: currentDateAndTime.clone().subtract(15, 'minutes').toDate(),
        after30Min: currentDateAndTime.clone().add(15, 'minutes').toDate()
      })
      .getCount()

    if (isUserABot === false) {
      if (userAgent.browser !== "unknown" && userAgent.browser !== "curl") {
        if (sameIPCount <= 0) {
          updateClicks.totalUniqueRequested = urlEntity.totalUniqueRequested + 1;
          requestEntity.isUnique = 1;
        } else {
          requestEntity.isUnique = 0;
        }
        
        // Save request into request table
        requestEntity.rawRequest = JSON.stringify(request.headers);
        requestEntity.payload = JSON.stringify({
          useragent: userAgent,
          headers: request.headers,
        });
        
        requestEntity.URLID = urlEntity.id;
        requestEntity.createdAt = currentDateAndTime.toDate();
        requestEntity.requestDate = currentDateAndTime.toDate();
        requestEntity.agentSource = userAgent.source;
        requestEntity.platform = userAgent.platform;
        requestEntity.os = userAgent.os;
        requestEntity.browser = userAgent.browser;
        requestEntity.browserVersion = userAgent.version;

        // Check for Referer
        if (request.headers["referer"]) {
          requestEntity.referrer = request.headers["referer"];
        } else {
          requestEntity.referrer = "Direct";
        }

        // Save Request Location
        
        if (requestEntity.ip) {
          let ipLong;
          
          ipLong = toLong(requestEntity.ip);

          const geoEntity = await geoRepo.getGeoWithInRange(ipLong);
          if (geoEntity) {
            let requestLocationEntity: RequestLocation = new RequestLocation();
            const geoName = await geoEntity.geoname;
            requestLocationEntity.continent = geoName.continent;
            requestLocationEntity.continentName = geoName.continentName;
            requestLocationEntity.ISOCode = geoName.ISOCode;
            requestLocationEntity.countryName = geoName.countryName;
            requestLocationEntity.cityName = geoName.cityName;
            requestLocationEntity.postalCode = geoEntity.postalCode;
            requestLocationEntity.latitude = geoEntity.latitude;
            requestLocationEntity.longitude = geoEntity.longitude;
            requestLocationEntity.createdAt = currentDateAndTime.toDate();
            requestLocationEntity.geoNameID = geoEntity.geoNameID;
            requestLocationEntity.geoCountryNameID = geoEntity.geoCountryNameID;
            console.log("saving location:", requestLocationEntity)
            const newRequestLocationEntry = await reqLocationRepo.saveNewRequestLocation(requestLocationEntity);
            requestEntity.locationID = newRequestLocationEntry.id;
          }
        }
        try {

          const lastestRequestDetails = await reqRepo.save(requestEntity)
          
          if(lastestRequestDetails){
            await lastestRequestDetails.url;
            await lastestRequestDetails.requestLocation

            sendSnsTopic(lastestRequestDetails,'/request/'+request.host, ['create'], lastestRequestDetails.id);
          }
        } catch(e) {
          console.log(requestEntity)
          throw new Error(e);
        }
        
      }

      // Update request info. in url table
      
      updateClicks.lastRequested = currentDateAndTime.toDate();
      updateClicks.totalRequested = urlEntity.totalRequested + 1;
      try {
        console.log("Updating Unique Clicks:");
        console.log("UrlEntity :", urlEntity);
        console.log("Clicks:", updateClicks);
        
        await urlRepo.update(urlEntity.id, updateClicks)
        sendSnsTopic(urlEntity,'/url',['update'],urlEntity.id);
      } 
      catch(err) {
        console.log(updateClicks)
        throw new Error(err);
      }
    } else {
      console.log("Bot Detected: ", message.Body)
    }
  }
};

export const ProcessRequestQueueListener = Consumer.create({
  queueUrl: AWSConfig.sqs.sqsQueueUrl+'/'+AWSConfig.sqs.sqsQueuePath,
  batchSize: 10,
  handleMessage: processMessage,
  sqs: new AWS.SQS(AWSConfig.instanceConfig)
})

ProcessRequestQueueListener.on('error', (e) => {
	console.log("Request Message Error:")
	console.log(e)
})

ProcessRequestQueueListener.on('processing_error', (err) => {
  console.log("Request Message Error:")
  console.error(err);
});