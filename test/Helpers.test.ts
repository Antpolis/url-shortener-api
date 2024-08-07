import { UrlController } from "../src/controllers/Url.controller";
import { deDupe, botsAndSpidersFiltering } from "../src/helpers";
import { createTypeormConn, closeTypeormConn } from "./createTypeormConnection";
const puppeteer = require("puppeteer");

beforeEach(async () => {
  await createTypeormConn();
});

afterEach(async () => {
  await closeTypeormConn();
});

describe("I want to test the deDupe helper", () => {
  it("should return deDuped array", async () => {
    const arr = [1, 1, 2, 3, 4];

    const result = deDupe(arr);
    const expectedResult = [1, 2, 3, 4];
    expect(result).toStrictEqual(expectedResult);
  });
});

describe("I want to test the soft delete helper", () => {
  it("should return deletedAt with a Date", async () => {
    const urlController = new UrlController();

    await urlController.deleteUrl(10);
    const expectedResult = await urlController.getUrlById(10);
    expect(expectedResult).toBeUndefined();
  });
});

describe("I want to test the restore helper", () => {
  it("should return deletedAt = null", async () => {
    const urlController = new UrlController();

    await urlController.restoreUrl(10);
    const result = await urlController.getUrlById(10);
    expect(result.deletedAt).toBeNull();
  });
});

describe("I want to test the botsAndSpidersFiltering helper", () => {
  it("should return true if it is a bot", async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (request: any) => {
      request.respond({
        status: 200,
        headers: {
          userAgent: ["Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"],
        },
        body: "Test Test",
      });
    });

    const response = await page.goto("https://example.com");
    const responseHeaders = response.headers();
    const userAgent = responseHeaders.useragent;
    await browser;

    const result = await botsAndSpidersFiltering(userAgent);

    expect(result).toBeTruthy();
  });

  it("should return true if it is a bot", async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (request: any) => {
      request.respond({
        status: 200,
        headers: {
          userAgent: ["Mozilla/5.0 (compatible; MegaIndex.ru/2.0; +http://megaindex.com/crawler)"],
        },
        body: "Test Test",
      });
    });

    const response = await page.goto("https://example.com");
    const responseHeaders = response.headers();
    const userAgent = responseHeaders.useragent;
    await browser;

    const result = await botsAndSpidersFiltering(userAgent);

    expect(result).toBeTruthy();
  });

  it("should return false if it is not a bot", async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("https://www.google.com");
    const userAgent = await page.evaluate(() => navigator.userAgent);
    await browser;

    const result = await botsAndSpidersFiltering(userAgent);

    expect(result).toBeFalsy();
  });
});
