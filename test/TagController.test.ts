// import { TagController } from "../controllers/tagController";
import { createTypeormConn, closeTypeormConn } from "./createTypeormConnection";

beforeEach(async () => {
  await createTypeormConn();
});

afterEach(async () => {
  await closeTypeormConn();
});

// describe("I want to test the Tag index API", () => {
//   it("should return 5 Campaign Tags when, page = 0 and take = 5", async () => {
//     const tagController = new TagController();

//     const result = await tagController.getTags("campaign", 0, 5);
//     for (const r of result) {
//       expect(r.key).toStrictEqual("campaign");
//     }
//     expect(result.length).toEqual(5);
//   });

//   it("should return 5 Client Tags when, page = 0 and take = 5", async () => {
//     const tagController = new TagController();

//     const result = await tagController.getTags("client", 0, 5);
//     for (const r of result) {
//       expect(r.key).toStrictEqual("client");
//     }
//     expect(result.length).toEqual(5);
//   });
// });

// describe("I want to test the getTagById API", () => {
//   it("should return tag.id = 5", async () => {
//     const tagController = new TagController();

//     const result = await tagController.getTagById(5);
//     expect(result.id).toEqual(5);
//   });
// });

// describe("I want to test the getTagByName API", () => {
//   it("should return tag.value = blueberry", async () => {
//     const tagController = new TagController();

//     const result = await tagController.getTagByName("blueberry");
//     expect(result.value).toEqual("blueberry");
//   });
// });

// describe("I want to test the updateTag API", () => {
//   it("should change tag.value = abc123", async () => {
//     const tagController = new TagController();

//     const expectedResult = "abc123";
//     await tagController.updateTag({ value: expectedResult }, 20);
//     const result = await tagController.getTagById(20);
//     expect(result.value).toEqual(expectedResult);
//   });

//   it("should should the tag.key from client to campaign", async () => {
//     const tagController = new TagController();

//     const expectedResult = "campaign";
//     await tagController.updateTag({ key: expectedResult }, 23);
//     const result = await tagController.getTagById(23);
//     expect(result.key).toEqual(expectedResult);
//   });

//   it("should should the tag.key from campaign to client", async () => {
//     const tagController = new TagController();

//     const expectedResult = "client";
//     await tagController.updateTag({ key: expectedResult }, 22);
//     const result = await tagController.getTagById(22);
//     expect(result.key).toEqual(expectedResult);
//   });
// });
