import { JsonController, Param, Get, Location, Req, Res, HttpCode, Redirect, Authorized, Post, QueryParams } from "routing-controllers";
import { TagRepository } from "../repositories/TagRepository";
import { Request, RequestRepository } from "../repositories/RequestRepository";
import { GeoLocationRepository } from "../repositories/GeoLocationRepository";
import { RequestLocation, RequestLocationRepository } from "../repositories/RequestLocationRepository";
import { Domain, DomainRepository } from "../repositories/DomainRepository";
import { Url, UrlRepository } from "../repositories/UrlRepository";
import { generateNewHash, botsAndSpidersFiltering } from "../helpers";
import { getCustomRepository } from "typeorm";
import * as moment from "moment";
import { Response } from "express";
import { UrlRequestDumpRepository } from "../repositories/UrlRequestDump";
import { sendSnsTopic } from "../services/QueueService";
import { domain } from "process";
import { AWSConfig } from "../../config/aws";

const defaultURL = "https://google.com";
const ip = require("ip");
var res: object;

@JsonController()
export class SiteController {
  urlRepo: UrlRepository;
  reqRepo: RequestRepository;
  domainRepo: DomainRepository;
  tagRepo: TagRepository;
  geoRepo: GeoLocationRepository;
  reqLocationRepo: RequestLocationRepository;
  urlRequestDumpRepo: UrlRequestDumpRepository;

  constructor() {
    this.urlRepo = getCustomRepository(UrlRepository);
    this.domainRepo = getCustomRepository(DomainRepository);
    this.tagRepo = getCustomRepository(TagRepository);
    this.reqRepo = getCustomRepository(RequestRepository);
    this.reqLocationRepo = getCustomRepository(RequestLocationRepository);
    this.geoRepo = getCustomRepository(GeoLocationRepository);
    this.urlRequestDumpRepo = getCustomRepository(UrlRequestDumpRepository);
  }

  @Get('/')
  @HttpCode(302)
  @Redirect(":redirectURL")
  async redirectDefaultPage(@Req() request?: any, @Res() response?: any) {
    const domainName = request.headers["host"];
    const domainResult: Domain = await this.domainRepo.getDomainByName(domainName).getOne();
    if(domainResult) {
      return {
        redirectURL: domainResult.defaultLink?domainResult.defaultLink:defaultURL
      }
    }
    return {
      redirectURL: defaultURL
    }
  }

  @Get("/:hash")
  async redirectURL(@Param("hash") hash?: string, @Req() request?: any, @Res() response?: Response) {
    return this.redirectPageV2(hash, request, response)
  }
  
  @Get("/v2/:hash")
  async redirectPageV2(@Param("hash") hash?: string, @Req() request?: any, @Res() response?: Response) {

    const domainName = request.headers["host"];
    const domainResult: Domain = await this.domainRepo.getDomainByName(domainName).getOne();

    let redirectURL = defaultURL
    if(domainResult) {
      redirectURL = domainResult.defaultLink?domainResult.defaultLink:defaultURL
    }

    if (hash && hash.trim() !== "" && domainResult) {
      const urlEntity = await this.urlRepo
        .getUrlByHash(hash)
        .andWhere("domainID = :domainID", { domainID: domainResult.id })
        .getOne();

      if(urlEntity) {
        let ipAddress:string;
        const userAgent = request.headers['user-agent'];
          // Check for IP
        if (request.headers["x-real-ip"]) {
          ipAddress = request.headers["x-real-ip"];
        } else {
          ipAddress = request.remoteAddress;
        }
       
        let urlRequestObjct = {
          "headers" : request.headers,
          "userAgent":userAgent,
          "hash": hash,
          "host": domainName,
          "urlEntityID": urlEntity.id,
          "ipAddress": ipAddress,
          "requestDate": moment().toString()
        }

        // let result  = await this.urlRequestDumpRepo.saveUrlRequestDump(urlRequestObjct);
        console.log("Request Dump Result: ", urlRequestObjct)
        await sendSnsTopic(urlRequestObjct,'/raw-request/'+domainName+'/'+hash, ['request'],urlEntity.id);
        
        if (redirectURL) {
          response.status(301)
          redirectURL = urlEntity.redirectURL          
        }

      }
    }

    response.redirect(redirectURL)
    return response;
 
  }

  @Get("/v1/:hash")
  async redirectPage(@Param("hash") hash?: string, @Req() request?: any, @Res() response?: Response) {
    const domainName = request.headers["host"];
    const domainResult: Domain = await this.domainRepo.getDomainByName(domainName).getOne();
    let redirectURL = defaultURL
    if(domainResult) {
      redirectURL = domainResult.defaultLink?domainResult.defaultLink:defaultURL
    }
    if (hash && hash.trim() !== "" && domainResult) {
      const urlEntity = await this.urlRepo
        .getUrlByHash(hash)
        .andWhere("domainID = :domainID", { domainID: domainResult.id })
        .getOne();
      if(urlEntity) {

        let isUniqueClick: Boolean = true;
        let requestEntity: Request = new Request();
        let updateClicks: Url = new Url();
        const userAgent = request.useragent;
        const isUserABot: Boolean = await botsAndSpidersFiltering(userAgent.source);
        const currentDateAndTime: Date = new Date();        
       
        // Check for IP
        if (request.headers["x-real-ip"]) {
          requestEntity.ip = request.headers["x-real-ip"];
        } else {
          requestEntity.ip = request.connection.remoteAddress;
        }
        
        // Check if the click is unique
        const reqEntityWithSameIP = await this.reqRepo
        .getRequestByUrlId(urlEntity.id)
        .andWhere("request.ip = :reqIP", { reqIP: requestEntity.ip })
        .getOne();

         // Check if the click is unique
         if (reqEntityWithSameIP) {
          const date1 = moment(reqEntityWithSameIP.createdAt);
          const date2 = moment(currentDateAndTime);
          if (date2.diff(date1, "minutes") < 30) {
            isUniqueClick = false;
          }
        }

        if (isUserABot === false) {
          if (userAgent.browser !== "unknown" && userAgent.browser !== "curl") {
            if (isUniqueClick === true) {
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
            requestEntity.createdAt = currentDateAndTime;
            requestEntity.requestDate = currentDateAndTime;
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
              let location;
              
              ipLong = ip.toLong(requestEntity.ip);

              const geoEntity = await this.geoRepo.getGeoWithInRange(ipLong);
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
                requestLocationEntity.createdAt = currentDateAndTime;
                requestLocationEntity.geoNameID = geoEntity.geoNameID;
                requestLocationEntity.geoCountryNameID = geoEntity.geoCountryNameID;

                const newRequestLocationEntry = await this.reqLocationRepo.saveNewRequestLocation(requestLocationEntity);
                // const newRequestLocationEntry = await this.reqLocationRepo.getLatestRequestLocationEntry(
                //   geoEntity.geoNameID,
                //   geoEntity.geoCountryNameID
                // );

                requestEntity.locationID = newRequestLocationEntry.id;
              }
            }

            await this.reqRepo.save(requestEntity)
          }

          // Update request info. in url table
          updateClicks.lastRequested = currentDateAndTime;
          updateClicks.totalRequested = urlEntity.totalRequested + 1;
          try {
            await this.urlRepo
              .getUrlById(urlEntity.id)
              .update()
              .set(updateClicks)
              .execute()
          } 
          catch(err) {
            console.log(err)
          }
        }
       
        if (redirectURL) {
          response.status(301)
          redirectURL = urlEntity.redirectURL          
        }
      }
    }
    response.redirect(redirectURL)
    return response;
  }

  @Get("/search/:searchString")
  async searchPage(@Param("searchString") searchString: string) {
    if (searchString !== "") return await this.tagRepo.findTag({searchText: searchString}).getMany();
  }

  @Get("/hash/getNewHash/:domain")
  async generateNewHash(@Param("domain") domain: string, @Req() request?: any, @Res() response?: Response) {
      let newHash:string 
      let oldHash:any
      const domainID = (await this.domainRepo.getDomainByName(domain).getOne()).id;
      do {
        newHash = generateNewHash(5);
        oldHash = await this.urlRepo.getUrlByHash(newHash).andWhere("url.domainID = :domainID", { domainID: domainID }).getOne();  
        if(!oldHash) break;
      } while (oldHash && newHash);
     
      response.statusCode = 200;
      return response.send(JSON.stringify({message:"This hash has not been used yet.",hash:newHash}))
  }

  @Get("/hash/:hash/domain/:domain/id/:id")
  async checkHash(@Param("hash") hash: string, @Param("domain") domain: string, @Param("id") id: string, @Req() request?: any, @Res() response?: Response) {
    if (hash !== "") {
      const domainID = (await this.domainRepo.getDomainByName(domain).getOne()).id;
      let result = await this.urlRepo.getUrlByHash(hash).andWhere("url.domainID = :domainID", { domainID: domainID }).getOne();
      if(!result){
         response.statusCode = 200;
         return response.send(JSON.stringify({message:"This hash has not been used yet."}))
      }else{
        if(id !== '0' && result.id.toString() == id.toString() && result.hash == hash){
          response.statusCode = 200;
          return response.send(JSON.stringify({message:"This hash has not been change."}))
        }else{
          response.statusCode = 403;  
          return response.send(JSON.stringify({message:"This hash has already used."})) 
        }
      }
    }
  }

  // update clicks total into urltable
  @Post("/updateClicksByUrlIDs")
  async getUpdateClicksData( @QueryParams() params: any ) {
    
    console.log("Start Updating");
    let ids = params["ids"].split(',');
    if(ids.length > 0){
      for(let id of ids){
            let updateClicks: Url = new Url();
            const totalClicks = await this.reqRepo
            .getRequestByUrlId(parseInt(id))
            .andWhere("deletedAt IS NULL")
            .andWhere("locationID IS NOT NULL")
            .andWhere("payload IS NOT NULL")
            .getCount();
        
            updateClicks.totalRequested = totalClicks;
        
            const totalUniqueClicks = await this.reqRepo
            .getRequestByUrlId(parseInt(id))
            .andWhere("isUnique = 1")
            .andWhere("locationID IS NOT NULL")
            .andWhere("payload IS NOT NULL")
            .andWhere("deletedAt IS NULL")
            .getCount();
        
            updateClicks.totalUniqueRequested = totalUniqueClicks;
            updateClicks.updatedAt = new Date();
            await this.urlRepo
            .getUrlById(parseInt(id))
            .update()
            .set(updateClicks)
            .execute()
            .catch(function (err: any) {
              if (err) {
                return (res = {
                  status: "fail:" + id  ,
                });
              }
            });
        
            return { "status": "Successfully Updated - Total Clicks: " + totalClicks + " & Total Unique Clicks: " + totalUniqueClicks +" Url Id: " + id };
            
      }
    }
    
   
    
    
  }   
}