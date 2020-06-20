const fs = require("fs");
const { createCommandHandler } = require("./index");
jest.mock("fs");

const readdirSyncSetup = () => {
  fs.readdirSync = jest
    .fn()
    .mockReturnValueOnce(["gal", "scaffolder"])
    .mockReturnValueOnce([])
    .mockReturnValueOnce(["templateCommand", "someTemplateTwo"])
    .mockReturnValueOnce(["templateCommand", "someTemplateTwo"])
    .mockReturnValueOnce(["someFile", "someFileTwo"]);
};

describe("createCommandHandler tests -> e2e", () => {
  it("creates the the specified template", () => {
    const templateCommand = "templateCommand";
    fs.writeFile = jest.fn();
    process.cwd = () => "gal/test";
    readdirSyncSetup();
    fs.readFileSync = jest.fn().mockReturnValue("file template {{someKey}}");
    fs.lstatSync
      .mockReturnValueOnce({ isDirectory: () => true })
      .mockReturnValueOnce({ isDirectory: () => false })
      .mockReturnValueOnce({ isDirectory: () => false });
    const cmd = {
      folder: false,
      parent: {
        rawArgs: ["someKey=gal"],
      },
    };

    createCommandHandler(templateCommand, cmd);

    expect(fs.writeFile).toHaveBeenCalledTimes(2);
    expect(fs.writeFile).toHaveBeenCalledWith(
      "gal/test/someTemplateTwo",
      "file template gal",
      expect.anything()
    );
  });
});
