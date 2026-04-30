const { getHashedPass, verifyPass } = require("../../src/utils/hash");
const { generateAccessToken, generateRefreshToken } = require("../../src/utils/jwt");

describe("Testing", () => {

  describe("Password Hashing", () => {
    const rawPassword = "mypassword123";
    const saltRounds = 10;

    test("hash password correctly", async () => {
      const hashed = await getHashedPass(rawPassword, saltRounds);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(rawPassword);
    });

    test("verify the correct password", async () => {
      const hashed = await getHashedPass(rawPassword, saltRounds);
      const isMatch = await verifyPass(rawPassword, hashed);

      expect(isMatch).toBe(true);
    });

    test("fail for the wrong password", async () => {
      const hashed = await getHashedPass(rawPassword, saltRounds);
      const isMatch = await verifyPass("wrongpassword", hashed);

      expect(isMatch).toBe(false);
    });
  });

  describe("Token Generation", () => {
    const userId = "user123";

    process.env.JWT_SECRET = "test_secret_key";

    test("generate an access token", () => {
      const token = generateAccessToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });

    test("generate a refresh token", () => {
      const token = generateRefreshToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });
  });

});
