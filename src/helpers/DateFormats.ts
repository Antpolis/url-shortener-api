import moment = require("moment");

export const formatDataByWeekly = async (dataArr:any) => {
    let filterDateByWeek:any = [];
    await Promise.all(dataArr.map((data:any)=>{
     
      let weekNumber = getWeekNumber(data.date)

      let dateRangeObj :any = getWeekRange(weekNumber,moment(new Date(data.date)).format('YYYY'));
  
      let dateRange = moment(dateRangeObj.startDay).format("DD MMM").toUpperCase() +" - "+ moment(dateRangeObj.endDay).format("DD MMM YYYY").toUpperCase();
     
      let index = filterDateByWeek.findIndex((res:any) => res.date === dateRange);

      if(index !== -1){
        filterDateByWeek[index].TotalClicks = filterDateByWeek[index].TotalClicks + data.TotalClicks;
        filterDateByWeek[index].UniqueClicks = filterDateByWeek[index].UniqueClicks + data.UniqueClicks;
      }else{
        filterDateByWeek.push({
          date : dateRange,
          TotalClicks: 0,
          UniqueClicks: 0,
        })
      }
    }))
    return filterDateByWeek.reverse();
}

export const formatDataByMonth = async (dataArray:any) => {
    let filterDateByMonth:any = [];
    await Promise.all(dataArray.map((data:any)=>{
      let dateRange = moment(new Date(data.date)).format('MMM') +"-"+ moment(new Date(data.date)).format('YYYY');
      let index = filterDateByMonth.findIndex((res:any) => res.date === dateRange);
      if(index !== -1){
        filterDateByMonth[index].TotalClicks = filterDateByMonth[index].TotalClicks + data.TotalClicks;
        filterDateByMonth[index].UniqueClicks = filterDateByMonth[index].UniqueClicks + data.UniqueClicks;
      }else{            
        filterDateByMonth.push({
          month: moment(new Date(data.date)).format('MMM'),
          year: moment(new Date(data.date)).format('YYYY'),
          date : dateRange,
          TotalClicks: 0,
          UniqueClicks: 0,
        })
      }
    }))
    return filterDateByMonth.reverse();
}

export const getWeekNumber = (date:any) => {
    let currentDate:any  = new Date(date);
    let startDate:any = new Date(currentDate.getFullYear(), 0, 1);
    let days = Math.floor((currentDate - startDate) /
      (24 * 60 * 60 * 1000));
   
    return Math.ceil(days / 7);
}

export const getWeekRange = (weekNo:any,yearNo:any) => {
    let firstDayofYear = new Date(yearNo, 0, 1);

    if (firstDayofYear.getDay() > 4)  {
        let weekStart = new Date(yearNo, 0, 1 + (weekNo - 1) * 7 - firstDayofYear.getDay() + 8);
        let weekEnd = new Date(yearNo, 0, 1 + (weekNo - 1) * 7 - firstDayofYear.getDay() + 8 + 6);
        return { startDay: weekStart, endDay: weekEnd }
    }
    else {
        let weekStart = new Date(yearNo, 0, 1 + (weekNo - 1) * 7 - firstDayofYear.getDay() + 1);
        let weekEnd = new Date(yearNo, 0, 1 + (weekNo - 1) * 7 - firstDayofYear.getDay() + 1 + 6);
        return { startDay: weekStart, endDay: weekEnd }
    }
}