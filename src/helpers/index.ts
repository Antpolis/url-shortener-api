export const deDupe = (arr: any[]) => {
  const deDupedArr = [...new Set(arr)];
  return deDupedArr;
};

export function compareValues(order = "asc") {
  return function innerSort(a: any, b: any) {
    const varA = a.numberOfOccurences;
    const varB = b.numberOfOccurences;

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return order === "desc" ? comparison * -1 : comparison;
  };
}

export const compareCreateDate = (a: any, b: any) => {
  if (a.id > b.id) return 1;
  if (b.id > a.id) return -1;

  return 0;
};

export const getOccurrence = async (array: any[], value: String) => {
  return array.filter((v) => v === value).length;
};

export function generateNewHash(maxChar: any) {
  const chars: string = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz-";
  let stringLength: number = maxChar || 3;
  let newHashString: string = "";

  for (let i = 0; i < stringLength; i++) {
    let rnum: number = Math.floor(Math.random() * chars.length);
    newHashString += chars.substring(rnum, rnum + 1);
  }
  return newHashString;
}

export async function restore(query: any) {
  const currentDateAndTime: Date = new Date();
  let res;
  return await query
    .update()
    .set({ updatedAt: currentDateAndTime, deletedAt: null })
    .execute()
    .catch(function (err: any) {
      if (err) {
        return (res = {
          status: "Fail",
        });
      }
    })
    .then(() => {
      return (res = { status: "Success" });
    });
}

export async function softDelete(query: any) {
  const currentDateAndTime: Date = new Date();
  let res;
  return await query
    .update()
    .set({ updatedAt: currentDateAndTime, deletedAt: currentDateAndTime })
    .execute()
    .catch(function (err: any) {
      if (err) {
        return (res = {
          status: "Fail",
        });
      }
    })
    .then(() => {
      return (res = { status: "Success" });
    });
}

export async function botsAndSpidersFiltering(userAgent: string) {
  if (
    userAgent.indexOf("WhatsApp") !== -1 ||
    userAgent.indexOf("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)") !== -1 ||
    userAgent.includes("facebookexternalhit/1.1") ||
    userAgent.includes("Facebot") ||
    userAgent.includes("spider") ||
    userAgent.includes("jeeves") ||
    userAgent.includes("crawler") ||
    userAgent.includes("bot") ||
    userAgent.includes("AHC") ||
    userAgent.includes("dataminr.com")
  ) {
    return true;
  } else {
    return false;
  }
}
