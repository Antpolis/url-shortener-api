import { DomainController } from "../src/controllers/Domain.controller";
import { createTypeormConn, closeTypeormConn } from "./createTypeormConnection";

beforeEach(async () => {
  await createTypeormConn();
});

afterEach(async () => {
  await closeTypeormConn();
});

describe("I want to test the getDomainById API", () => {
  it("should return dv.sg when id = 1", async () => {
    const domainController = new DomainController();

    const result = await domainController.getDomainById(1);
    expect(result.domain).toStrictEqual("dv.sg");
  });
});

describe("I want to test create Domain API", () => {
  it("should create a new Domain", async () => {
    const domainController = new DomainController();

    const newDomain = await domainController.addNewDomain({
      accountID: 1,
      domain: "testdomain.com",
      defaultLink: "testdomain.com",
    });
    const newDomainId = newDomain.id;

    const result = await domainController.getDomainById(newDomainId);
    expect(result.id).toStrictEqual(newDomainId);
    expect(result.accountID).toStrictEqual(1);
    expect(result.defaultLink).toStrictEqual("testdomain.com");
    expect(result.domain).toStrictEqual("testdomain.com");
    expect(result.active).toStrictEqual(1);
  });
});

describe("I want to test update Domain API", () => {
  it("should update the Domain", async () => {
    const domainController = new DomainController();

    await domainController.updateDomain({ accountID: 2, totalShortenURL: 5 }, 2);

    const result = await domainController.getDomainById(2);
    expect(result.id).toStrictEqual(2);
    expect(result.accountID).toStrictEqual(2);
    expect(result.totalShortenURL).toStrictEqual(5);
    expect(result.defaultLink).toStrictEqual("https://avenueone.sg");
    expect(result.domain).toStrictEqual("av1.sg");
    expect(result.active).toStrictEqual(0);
  });
});
