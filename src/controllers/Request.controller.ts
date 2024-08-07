import { JsonController, Param, Get, QueryParams, Authorized } from "routing-controllers";
import { RequestRepository, Request } from "../repositories/RequestRepository";
import { getCustomRepository } from "typeorm";
import { deDupe, getOccurrence, compareValues } from "../helpers";
import * as moment from "moment";
import { AWSConfig } from "../../config/aws";
import { formatDataByMonth, formatDataByWeekly } from "../helpers/DateFormats";

@JsonController("/req")
export class RequestController {
  reqRepo: RequestRepository;

  constructor() {
    this.reqRepo = getCustomRepository(RequestRepository);
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/export/:urlID")
  async getExportData(@Param("urlID") urlID: number) {
    const dataArray = new Array();
    const uniqueData = await this.reqRepo
      .getRequest()
      .where("URLID = :urlID", { urlID: urlID })
      .andWhere("locationID IS NOT NULL")
      .andWhere("payload IS NOT NULL")
      .andWhere("deletedAt IS NULL")
      .andWhere("isUnique = 1")
      .getMany();

    let device: string;
    for (const u of uniqueData) {
      if (u.payload.includes('"isTablet":true')) {
        device = "Tablet";
      } else if (u.payload.includes('"isMobile":true')) {
        device = "Mobile";
      } else {
        device = "Desktop";
      }

      dataArray.push({
        "Referrer URL": u.referrer,
        Country: (await u.requestLocation).countryName,
        IP: u.ip,
        "Date Time": u.createdAt,
        Devices: device,
        Browser: u.browser,
      });
    }

    return dataArray;
  }
  
  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/clicks/")
  async getClickData(@QueryParams() req: any) {

    let urlID = req?.urlID;
    let period = req?.filterType;
    let format =  req?.format;
    let dateRange = req?.dateRange;


    // Format :  0 (day) , 1 (weekly), 2 (month)
    // Period can only be = DAY, WEEK, MONTH, LIFETIME
    const upperCasePeriod = period.toUpperCase();
    if (upperCasePeriod === "TODAY") {
      const today = moment().format("YYYY-MM-DD");
      const data = await this.reqRepo
        .getRequestByUrlId(urlID)
        .andWhere("CAST(createdAt AS DATE) = :day", { day: today })
        .andWhere("locationID IS NOT NULL")
        .andWhere("payload IS NOT NULL")
        .andWhere("deletedAt IS NULL")
        .getCount();

      const uniqueData = await this.reqRepo
        .getRequestByUrlId(urlID)
        .andWhere("CAST(createdAt AS DATE) = :day", { day: today })
        .andWhere("isUnique = 1")
        .andWhere("locationID IS NOT NULL")
        .andWhere("payload IS NOT NULL")
        .andWhere("deletedAt IS NULL")
        .getCount();

      return [
        {
          date: moment(today).format("DD MMM YYYY").toUpperCase(),
          "TotalClicks": data,
          "UniqueClicks": uniqueData,
        },
      ];
    } else {
      let timeline: number;
      let arrayOfMomentDates = new Array();
      let arrayOfFormattedDates = new Array();
      const dataArr = new Array();

      // First date = today
      const today = moment();
      arrayOfMomentDates.push(today);
      arrayOfFormattedDates.push(today.format("YYYY-MM-DD"));

      if (upperCasePeriod === "LIFETIME") {
        let i: number = 0;

        // Get the first request made
        const firstRequest = await this.reqRepo
          .getRequestByUrlId(urlID)
          .andWhere("deletedAt IS NULL")
          .andWhere("locationID IS NOT NULL")
          .andWhere("payload IS NOT NULL")
          .addOrderBy("createdAt", "ASC")
          .getOne();
  
          if(firstRequest){

          // Save as a moment object
          const firstDate = moment(firstRequest.createdAt);

          // Do a While loop and - 1 day until it reaches firstDate
          while (arrayOfMomentDates[i].format("YYYY-MM-DD") != firstDate.format("YYYY-MM-DD")) {
            const previousDate = arrayOfMomentDates[i].subtract(1, "day");

            // Need to have 2 separate arrays, 1 with the momentDate and 1 with the formattedDate
            arrayOfMomentDates.push(previousDate);
            arrayOfFormattedDates.push(previousDate.format("YYYY-MM-DD"));
            i++;
          }
        }else{
          return "No data found";
        }

      } else if(upperCasePeriod === "CUSTOM"){

        arrayOfMomentDates = [];
        arrayOfFormattedDates = [];
        
        let dateRangeString = dateRange.split(':');
        
          let startDate = new Date(dateRangeString[0]);
          let endDate = new Date(dateRangeString[1]);

          while (startDate <= endDate) {
            arrayOfMomentDates.push(moment(startDate));
            arrayOfFormattedDates.push(moment(startDate).format("YYYY-MM-DD"));
            let newStartDate = moment(startDate).add(1, 'day').format("YYYY-MM-DD");
            startDate = new Date(newStartDate);
          }
          arrayOfFormattedDates = arrayOfFormattedDates.reverse();
      } else {

        if (upperCasePeriod === "WEEK") timeline = 7;
        else if (upperCasePeriod === "MONTH") timeline = 30;
        else if (upperCasePeriod === "QUARTER") timeline = 92;
        else return "Invalid Period";

        for (let i = 0; arrayOfMomentDates.length < timeline; i++) {
          const previousDate = arrayOfMomentDates[i].subtract(1, "day");

          // Need to have 2 separate arrays, 1 with the momentDate and 1 with the formattedDate
          arrayOfMomentDates.push(previousDate);
          arrayOfFormattedDates.push(previousDate.format("YYYY-MM-DD"));
        }

      }

      if(arrayOfFormattedDates.length > 0){

        for (const f of arrayOfFormattedDates) {
          const data = await this.reqRepo
            .getRequestByUrlId(urlID)
            .andWhere("CAST(createdAt AS DATE) = :day", { day: f })
            .andWhere("locationID IS NOT NULL")
            .andWhere("payload IS NOT NULL")
            .andWhere("deletedAt IS NULL")
            .getCount();
  
          const uniqueData = await this.reqRepo
            .getRequestByUrlId(urlID)
            .andWhere("CAST(createdAt AS DATE) = :day", { day: f })
            .andWhere("isUnique = 1")
            .andWhere("locationID IS NOT NULL")
            .andWhere("payload IS NOT NULL")
            .andWhere("deletedAt IS NULL")
            .getCount();
  
          dataArr.push({
            date: moment(f).format("DD MMM YYYY").toUpperCase(),
            "TotalClicks": data,
            "UniqueClicks": uniqueData,
          });
        }
      
        switch(parseInt(format)){
          case 0:
              return dataArr.reverse();
            break;
          case 1:
              return await formatDataByWeekly(dataArr);
            break;
          case 2:
              return await formatDataByMonth(dataArr);
            break;
        }  
      }else{
        return "No clicks found.";
      }
     

    }
  }

  // get total clicks by urlID
  @Authorized(AWSConfig.auth.darvisRole)
  @Get( "/totalClicks/:urlID/" )
  async getTotalClickData( @Param("urlID") urlID: number ) {
    const totalClicks = await this.reqRepo
    .getRequestByUrlId( urlID )
    .andWhere("deletedAt IS NULL")
    .getCount();

    return totalClicks;
  }

  // get total unique clicks by urlID
  @Authorized(AWSConfig.auth.darvisRole)
  @Get( "/totalUniqueClicks/:urlID/" )
  async getUniqueClickData( @Param("urlID") urlID: number ) {
    const totalUniqueClicks = await this.reqRepo
    .getRequestByUrlId( urlID )
    .andWhere("isUnique = 1")
    .andWhere("deletedAt IS NULL")
    .getCount();

    return totalUniqueClicks;
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/getAll/")
  async getAllRequests(@QueryParams() req: any) {
    
    const urlID = req.urlID;
    const browsers = new Array();
    const countries = new Array();
    const devices = new Array();
    const referrers = new Array();
    const uBrowsers = new Array();
    const uCountries = new Array();
    const uDevices = new Array();
    const uReferrers = new Array();
    const browserObj = new Array();
    const countryObj = new Array();
    const deviceObj = new Array();
    const referrerObj = new Array();

    

    let data: Request[];
    let uniqueData: Request[];

    if (req.period) {
      const upperCasePeriod = req.period.toUpperCase();
      if (upperCasePeriod === "TODAY") {
        const today = moment().format("YYYY-MM-DD");

        data = await this.reqRepo
          .getRequestByUrlId(urlID)
          .andWhere("CAST(createdAt AS DATE) = :day", { day: today })
          .andWhere("locationID IS NOT NULL")
          .andWhere("payload IS NOT NULL")
          .andWhere("deletedAt IS NULL")
          .getMany();

        uniqueData = await this.reqRepo
          .getRequest()
          .where("URLID = :urlID", { urlID: urlID })
          .andWhere("locationID IS NOT NULL")
          .andWhere("payload IS NOT NULL")
          .andWhere("deletedAt IS NULL")
          .andWhere("isUnique = 1")
          .getMany();
      } else {
        const arrayOfMomentDates = new Array();
        const arrayOfFormattedDates = new Array();

        if (upperCasePeriod === "LIFETIME") {
          let i: number = 0;
          // Get the first request made
          const firstRequest = await this.reqRepo
            .getRequestByUrlId(urlID)
            .andWhere("locationID IS NOT NULL")
            .andWhere("payload IS NOT NULL")
            .andWhere("deletedAt IS NULL")
            .addOrderBy("createdAt", "ASC")
            .getOne();

          if(firstRequest){
            // Save as a moment object
               // Do a While loop and - start from firstRequest.createdAt to today day by adding 1 day per loop
               while (new Date(firstRequest.createdAt) <= new Date()) {
                arrayOfMomentDates.push(moment(firstRequest.createdAt));
                arrayOfFormattedDates.push(moment(firstRequest.createdAt).format("YYYY-MM-DD"));
                firstRequest.createdAt.setDate(firstRequest.createdAt.getDate() + 1);
              }
          }
        } else if (upperCasePeriod === "CUSTOM"){
          let dateRange = req.dateRange.split(':');
          let startDate = new Date(dateRange[0]);
          let endDate = new Date(dateRange[1]);

          while (startDate <= endDate) {
            arrayOfMomentDates.unshift(moment(startDate));
            arrayOfFormattedDates.unshift(moment(startDate).format("YYYY-MM-DD"));
            let newStartDate = moment(startDate).add(1, 'day').format("YYYY-MM-DD");
            startDate = new Date(newStartDate);

          }

          data = await this.reqRepo
          .getRequestByUrlId(urlID)
          .andWhere("CAST(createdAt AS DATE) IN (:arrayOfDates)", { arrayOfDates: arrayOfFormattedDates })
          .andWhere("locationID IS NOT NULL")
          .andWhere("payload IS NOT NULL")
          .andWhere("deletedAt IS NULL")
          .getMany();

        uniqueData = await this.reqRepo
          .getRequestByUrlId(urlID)
          .andWhere("CAST(createdAt AS DATE) IN (:arrayOfDates)", { arrayOfDates: arrayOfFormattedDates })
          .andWhere("locationID IS NOT NULL")
          .andWhere("payload IS NOT NULL")
          .andWhere("deletedAt IS NULL")
          .andWhere("isUnique = 1")
          .getMany();
        }else {
          let timeline;

          // First date = today
          const today = moment();
          arrayOfMomentDates.push(today);
          arrayOfFormattedDates.push(today.format("YYYY-MM-DD"));

          if (upperCasePeriod === "WEEK") timeline = 7;
          else if (upperCasePeriod === "MONTH") timeline = 30;
          else if (upperCasePeriod === "QUARTER") timeline = 92;

          for (let i = 0; arrayOfMomentDates.length < timeline; i++) {
            const previousDate = arrayOfMomentDates[i].subtract(1, "day");

            // Need to have 2 separate arrays, 1 with the momentDate and 1 with the formattedDate
            arrayOfMomentDates.push(previousDate);
            arrayOfFormattedDates.push(previousDate.format("YYYY-MM-DD"));
          }
        }

        data = await this.reqRepo
          .getRequestByUrlId(urlID)
          .andWhere("CAST(createdAt AS DATE) IN (:arrayOfDates)", { arrayOfDates: arrayOfFormattedDates })
          .andWhere("locationID IS NOT NULL")
          .andWhere("payload IS NOT NULL")
          .andWhere("deletedAt IS NULL")
          .getMany();

        uniqueData = await this.reqRepo
          .getRequestByUrlId(urlID)
          .andWhere("CAST(createdAt AS DATE) IN (:arrayOfDates)", { arrayOfDates: arrayOfFormattedDates })
          .andWhere("locationID IS NOT NULL")
          .andWhere("payload IS NOT NULL")
          .andWhere("deletedAt IS NULL")
          .andWhere("isUnique = 1")
          .getMany();
      }
    } else {
      data = await this.reqRepo
        .getRequestByUrlId(urlID)
        .andWhere("locationID IS NOT NULL")
        .andWhere("payload IS NOT NULL")
        .andWhere("deletedAt IS NULL")
        .getMany();

      uniqueData = await this.reqRepo
        .getRequestByUrlId(urlID)
        .andWhere("locationID IS NOT NULL")
        .andWhere("payload IS NOT NULL")
        .andWhere("deletedAt IS NULL")
        .andWhere("isUnique = 1")
        .getMany();
    }

    for (const d of data) {
      browsers.push(d.browser);
      countries.push((await d.requestLocation).countryName);
      referrers.push(d.referrer);

      if (d.payload.includes('"isTablet":true')) {
        devices.push("Tablet");
      } else if (d.payload.includes('"isMobile":true')) {
        devices.push("Mobile");
      } else {
        devices.push("Desktop");
      }
    }

    for (const u of uniqueData) {
      uBrowsers.push(u.browser);
      uCountries.push((await u.requestLocation).countryName);
      uReferrers.push(u.referrer);

      if (u.payload.includes('"isTablet":true')) {
        uDevices.push("Tablet");
      } else if (u.payload.includes('"isMobile":true')) {
        uDevices.push("Mobile");
      } else {
        uDevices.push("Desktop");
      }
    }

    // Sort out and deDupe
    const deDupedBrowsers = deDupe(browsers);
    const numberOfBrowsers = browsers.length;
    const numberOfUniqueBrowsers = uBrowsers.length;

    const deDupedCountries = deDupe(countries);
    const numberOfCountries = countries.length;
    const numberOfUniqueCountries = uCountries.length;

    const deDupedDevices = deDupe(devices);
    const numberOfDevices = devices.length;
    const numberOfUniqueDevices = uDevices.length;

    const deDupedReferrers = deDupe(referrers);
    const numberOfReferrers = referrers.length;
    const numberOfUniqueReferrers = uReferrers.length;

    for (const b of deDupedBrowsers) {
      const occurrence = await getOccurrence(browsers, b);
      const uniqueOccurrence = await getOccurrence(uBrowsers, b);
      browserObj.push({
        browser: b,
        numberOfOccurences: occurrence,
        numberOfUniqueOccurences: uniqueOccurrence,
      });
    }

    for (const c of deDupedCountries) {
      const occurrence = await getOccurrence(countries, c);
      const uniqueOccurrence = await getOccurrence(uCountries, c);
      countryObj.push({
        country: c,
        numberOfOccurences: occurrence,
        numberOfUniqueOccurences: uniqueOccurrence,
      });
    }

    for (const d of deDupedDevices) {
      const occurrence = await getOccurrence(devices, d);
      const uniqueOccurrence = await getOccurrence(uDevices, d);
      deviceObj.push({
        device: d,
        numberOfOccurences: occurrence,
        numberOfUniqueOccurences: uniqueOccurrence,
      });
    }

    for (const r of deDupedReferrers) {
      const occurrence = await getOccurrence(referrers, r);
      const uniqueOccurrence = await getOccurrence(uReferrers, r);
      referrerObj.push({
        referrer: r,
        numberOfOccurences: occurrence,
        numberOfUniqueOccurences: uniqueOccurrence,
      });
    }

    const sortedBrowserObj = browserObj.sort(compareValues("desc"));
    const sortedCountryObj = countryObj.sort(compareValues("desc"));
    const sortedDeviceObj = deviceObj.sort(compareValues("desc"));
    const sortedReferrerObj = referrerObj.sort(compareValues("desc"));

    return {
      sortedBrowserObj,
      sortedCountryObj,
      sortedDeviceObj,
      sortedReferrerObj,
      numberOfBrowsers,
      numberOfCountries,
      numberOfDevices,
      numberOfReferrers,
      numberOfUniqueBrowsers,
      numberOfUniqueCountries,
      numberOfUniqueDevices,
      numberOfUniqueReferrers,
    };
  }
}