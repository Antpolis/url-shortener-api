import { UrlController } from "../src/controllers/Url.controller";
import { createTypeormConn, closeTypeormConn } from "./createTypeormConnection";

beforeEach(async () => {
  await createTypeormConn();
});

afterEach(async () => {
  await closeTypeormConn();
});

describe("I want to test the URL index API", () => {
  it("should return 30 URLs when, page = 0 and take = 30", async () => {
    const urlController = new UrlController();

    const result = await urlController.getUrls(0, 30);
    expect(result.urls.length).toEqual(30);
  });
});

describe("I want to test the getUrlById API", () => {
  it("should return correct URL Entity", async () => {
    const urlController = new UrlController();

    const result = await urlController.getUrlById(1);
    expect(result.id).toStrictEqual(1);
    expect(result.domainID).toStrictEqual(1);
    expect(result.redirectURL).toStrictEqual("https://www.google.com/1234");
    expect(result.fullURL).toStrictEqual("dv.sg/google1234");
    expect(result.hash).toStrictEqual("google1234");
  });
});

describe("I want to test the getUrlByTag API", () => {
  it("should return correct URL Entity", async () => {
    const urlController = new UrlController();

    const result: any = await urlController.getUrlByTag({ client: "blueberry", campaign: "berries" });
    expect(result[0].id).toStrictEqual(50);
    expect(result[0].redirectURL).toStrictEqual("https://www.google.com/new");
    expect(result[0].tags[0].value).toStrictEqual("blueberry");
    expect(result[0].tags[1].value).toStrictEqual("berries");
  });
});

describe("I want to test the checkIfRedirectUrlIsUsed API", () => {
  it("should return 'This URL has already been used'", async () => {
    const urlController = new UrlController();
    const encoded = encodeURI("https://www.google.com/1234/");
    const result = await urlController.checkIfRedirectUrlIsUsed(encoded);

    expect(result.status).toStrictEqual("This URL has already been used");
  });

  it("should return 'This URL has not been used'", async () => {
    const urlController = new UrlController();
    const encoded = encodeURI("https://www.facdasebook.com/5612t3egh");
    const result = await urlController.checkIfRedirectUrlIsUsed(encoded);

    expect(result.status).toStrictEqual("This URL has not been used");
  });
});

describe("I want to test the archive URL API", () => {
  it("should archive URL", async () => {
    const urlController = new UrlController();

    await urlController.archiveUrl(30, "archive");
    const result = await urlController.getUrlById(30);

    expect(result.id).toStrictEqual(30);
    expect(result.active).toStrictEqual(0);
  });

  it("should unarchive URL", async () => {
    const urlController = new UrlController();

    await urlController.archiveUrl(30, "unarchive");
    const result = await urlController.getUrlById(30);

    expect(result.id).toStrictEqual(30);
    expect(result.active).toStrictEqual(1);
  });
});

describe("I want to test the reset click API", () => {
  it("should reset click count to 0", async () => {
    const urlController = new UrlController();

    await urlController.resetClicks(43);
    const result = await urlController.getUrlById(43);

    expect(result.id).toStrictEqual(43);
    expect(result.lastRequested).toBeNull();
    expect(result.totalRequested).toBeNull();
  });
});

describe("I want to test create URL API", () => {
  it("should create a URL with existing client and campaign tags", async () => {
    const urlController = new UrlController();
    const newUrl = await urlController.addNewUrl({
      accountID: 1,
      clientName: "blueberry",
      campaignName: "berries",
      redirectURL: "https://www.example.com",
      description: "this is a new description",
      domainName: "dv.sg",
      hash: "neverUsedBeforeHash",
    });
    const newUrlId = newUrl.id;

    const result = await urlController.getUrlById(newUrlId);

    expect(result.id).toStrictEqual(newUrlId);
    expect(result.domainID).toStrictEqual(1);
    expect(result.description).toStrictEqual("this is a new description");
    expect(result.redirectURL).toStrictEqual("https://www.example.com");
    expect(result.fullURL).toStrictEqual("dv.sg/neverUsedBeforeHash");
    expect(result.hash).toStrictEqual("neverUsedBeforeHash");
  });

  it("should create a URL with new client and campaign tags", async () => {
    const urlController = new UrlController();
    const newUrl = await urlController.addNewUrl({
      accountID: 1,
      clientName: "Completely New Client",
      campaignName: "Completely New Campaign",
      redirectURL: "https://www.example123.com",
      description: "this is a completely new description",
      domainName: "dv.sg",
      hash: "thisisanewhash",
    });
    const newUrlId = newUrl.id;

    const result = await urlController.getUrlById(newUrlId);
    expect(result.id).toStrictEqual(newUrlId);
    expect(result.domainID).toStrictEqual(1);
    expect(result.description).toStrictEqual("this is a completely new description");
    expect(result.redirectURL).toStrictEqual("https://www.example123.com");
    expect(result.fullURL).toStrictEqual("dv.sg/thisisanewhash");
    expect(result.hash).toStrictEqual("thisisanewhash");
  });
});

describe("I want to test the update URL API", () => {
  it("should update URL accordingly", async () => {
    const urlController = new UrlController();

    await urlController.updateUrl(
      {
        domainName: "dv.sg",
        clientName: "rectangles",
        campaignName: "shapes",
        redirectURL: "https://www.google.com/squares",
        description: "this is a test description123",
      },
      51
    );

    const result = await urlController.getUrlById(51);

    expect(result.id).toStrictEqual(51);
    expect(result.description).toStrictEqual("this is a test description123");
    expect(result.redirectURL).toStrictEqual("https://www.google.com/squares");
    expect(result.tags.length).toStrictEqual(2);
    expect(result.tags[1].value).toStrictEqual("rectangles");
    expect(result.tags[0].value).toStrictEqual("shapes");
  });
});
