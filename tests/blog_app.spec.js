import { loginWith, createBlog, getIntitialLikes } from "./helper";
import {
  test,
  expect,
  describe,
  beforeEach,
  afterEach,
} from "@playwright/test";

describe("Blog app", () => {
  beforeEach(async ({ page, request }) => {
    await request.post("http://localhost:3003/api/testing/reset");
    await request.post("http://localhost:3003/api/users", {
      data: {
        name: "root",
        username: "root",
        password: "password",
      },
    });
    await request.post("http://localhost:3003/api/users", {
      data: {
        name: "user2",
        username: "user2",
        password: "password",
      },
    });

    await page.goto("/");
  });

  test("Login form is shown", async ({ page }) => {
    const locator = await page.getByText("Welcome to Blogs");
    await expect(locator).toBeVisible();
    await expect(page.getByRole("button", { name: "log in" })).toBeVisible();
  });

  describe("Login", () => {
    test("succeeds with correct credentials", async ({ page }) => {
      await loginWith(page, "root", "password");

      await expect(page.getByTestId("user-logged-in")).toContainText(
        "root logged in"
      );
    });

    test("fails with wrong credentials", async ({ page }) => {
      await loginWith(page, "root", "wrong password");

      const errorDiv = await page.locator(".error");
      await expect(errorDiv).toContainText("Wrong credentials");
    });
  });

  describe("When logged in", () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, "root", "password");
    });

    afterEach(async ({ page, request }) => {
      await request.post("http://localhost:3003/api/testing/reset");
      await page.close();
    });

    test("a new blog can be created", async ({ page }) => {
      const randomTitle = Math.random().toString(36).substring(2, 7);

      await createBlog(page, {
        title: randomTitle,
        author: "test author",
        url: "test url",
      });

      const blogsContainer = page.getByTestId("blogs");
      await expect(blogsContainer).toContainText(randomTitle);
    });

    test("a blog can be liked", async ({ page }) => {
      await createBlog(page, {
        title: "test blog 2",
        author: "test author 2",
        url: "test url 2",
      });

      await page
        .getByTestId("blogs")
        .locator(".blog:nth-child(1) > button")
        .click();

      const initialLikes = await getIntitialLikes(page);

      await page
        .getByTestId("blogs")
        .locator(".blog:nth-child(1) button.like")
        .click();

      await expect(
        page.getByTestId("blogs").locator(".blog:nth-child(1) span.likes")
      ).toContainText(`likes: ${initialLikes + 1}`);
    });

    test("a blog can be deleted", async ({ page }) => {
      await createBlog(page, {
        title: "a blog can be deleted",
        author: "test author 3",
        url: "test url 3",
      });

      // Verify blog exists first
      await expect(page.getByTestId("blogs")).toContainText(
        "a blog can be deleted",
        { timeout: 10000 }
      );

      // open details and wait for it to be visible
      const detailsButton = page
        .getByTestId("blogs")
        .locator(".blog:nth-child(1) button");
      await detailsButton.waitFor({ state: "visible" });
      await detailsButton.click();

      // Wait for delete button to be visible
      const deleteButton = page.getByRole("button", { name: "delete" });
      await deleteButton.waitFor({ state: "visible" });

      // Set up dialog handler
      page.on("dialog", (dialog) => dialog.accept());

      // Click delete and wait for network response
      await deleteButton.click();
      // Wait for blog to disappear with longer timeout
      await expect(page.getByTestId("blogs")).not.toContainText(
        "a blog can be deleted",
        { timeout: 10000 }
      );
    });

    test.only("a blog can only be deleted by the creator", async ({ page }) => {
      await createBlog(page, {
        title: "a blog can only be deleted by the creator",
        author: "test author 4",
        url: "test url 4",
      });
      await page.locator(".message").waitFor({ state: "visible" });

      await page.getByRole("button", { name: "logout" }).click();

      await loginWith(page, "user2", "password");
      const detailsButton = page
        .getByTestId("blogs")
        .locator(".blog:nth-child(1) button");
      await detailsButton.waitFor({ state: "visible" });
      await detailsButton.click();
      await expect(
        page.getByRole("button", { name: "delete" })
      ).not.toBeVisible();
    });
  });
});
