import { UrlRepository } from "../src/repositories/UrlRepository";
import { SiteController } from "../src/controllers/Site.controller";
import { createTypeormConn, closeTypeormConn } from "./createTypeormConnection";
import { getCustomRepository } from "typeorm";

beforeEach(async () => {
  await createTypeormConn();
});

afterEach(async () => {
  await closeTypeormConn();
});

describe("I want to test the generateNewHash and checkHash API", () => {
  it("should return 'This hash has not been used yet' when new hash is unused", async () => {
    const siteController = new SiteController();

    const result = await siteController.generateNewHash();
    const expectedResult = "This hash has not been used yet";
    expect(result.status).toStrictEqual(expectedResult);
  });

  it("should return 'This hash has not been used yet' when hash = 'raspberries'", async () => {
    const siteController = new SiteController();

    const result = await siteController.checkHash("raspberries");
    const expectedResult = "This hash has not been used yet";
    expect(result.status).toStrictEqual(expectedResult);
  });

  it("should return 'This hash has already been used' when hash = 'google1234'", async () => {
    const siteController = new SiteController();

    const result = await siteController.checkHash("google1234");
    const expectedResult = "This hash has already been used";
    expect(result.status).toStrictEqual(expectedResult);
  });
});

describe("I want to test the search API", () => {
  it("should return tags with values containing 'test'", async () => {
    const siteController = new SiteController();

    const result = await siteController.searchPage("test");
    for (const r of result) {
      expect(r.value.toLowerCase().includes("test")).toBeTruthy();
    }
  });

  it("should return tags with values containing '2'", async () => {
    const siteController = new SiteController();

    const result = await siteController.searchPage("2");
    for (const r of result) {
      expect(r.value.toLowerCase().includes("2")).toBeTruthy();
    }
  });
});

describe("I want to test the redirect API", () => {
  it("should return 'https://www.google.com/1234' when hash = 'google1234'", async () => {
    const urlRepo = getCustomRepository(UrlRepository);

    const result = await urlRepo.getUrlByHash("google1234").getOne();
    const expectedResult = "https://www.google.com/1234";
    expect(result.redirectURL).toStrictEqual(expectedResult);
  });

  it("should return 'https://www.google.com/circles' when hash = 'circles'", async () => {
    const urlRepo = getCustomRepository(UrlRepository);

    const result = await urlRepo.getUrlByHash("circles").getOne();
    const expectedResult = "https://www.google.com/circles";
    expect(result.redirectURL).toStrictEqual(expectedResult);
  });
});
