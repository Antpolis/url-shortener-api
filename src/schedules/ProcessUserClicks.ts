import { RequestRepository } from "../repositories/RequestRepository";
import { Url, UrlRepository } from "../repositories/UrlRepository";
import moment = require("moment");
import { getCustomRepository } from "typeorm";

const cron = require('node-cron');

export const ProcessUserClicks = async () => {

  try {
    const urlRepo = getCustomRepository(UrlRepository);
    const reqRepo = getCustomRepository(RequestRepository);
    const currentDateAndTime = moment();
    let urls = await urlRepo.getUrl().
    andWhere('url.lastRequested > :last2Hours', {
      last2Hours: currentDateAndTime.clone().subtract(2, 'hours').toDate(),
    }).
    addOrderBy("url.id", "DESC").getMany();
  
    console.log(moment().format('LLL')+ " # of urls: " +urls.length);
  
    if(urls.length > 0){
      for(let url of urls){
        let updateClicks: Url = new Url();
        const totalClicks = await reqRepo
        .getRequestByUrlId(url.id)
        .andWhere("deletedAt IS NULL")
        .andWhere("locationID IS NOT NULL")
        .andWhere("payload IS NOT NULL")
        .getCount();
    
        updateClicks.totalRequested = totalClicks;
    
        const totalUniqueClicks = await reqRepo
        .getRequestByUrlId(url.id)
        .andWhere("isUnique = 1")
        .andWhere("locationID IS NOT NULL")
        .andWhere("payload IS NOT NULL")
        .andWhere("deletedAt IS NULL")
        .getCount();
    
        updateClicks.totalUniqueRequested = totalUniqueClicks;
        updateClicks.updatedAt = new Date();
        await urlRepo
        .getUrlById(url.id)
        .update()
        .set(updateClicks)
        .execute()
        .catch(function (err: any) {
          if (err) {
            console.log(moment().format('LLL')+" Failed to Updated  Url Id: " + url.id );  
          }
        });
    
        console.log(moment().format('LLL')+" Successfully Updated - Total Clicks: " + totalClicks + " & Total Unique Clicks: " + totalUniqueClicks +" Url Id: " + url.id );
  
      }
  
    }   
  } catch (error) {
    console.log(moment().format('LLL')+ " User clicks error : ", error);
  }
  
}


export const ProcessUserClicksSchedule = cron.schedule('0 0 */1 * * *', ProcessUserClicks, {
    scheduled: false,
    timezone: "Asia/Singapore"
  });