import { loginWith, createBlog } from "./helper";
import { test, expect, describe, beforeEach } from "@playwright/test";

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

    await page.goto("/");
  });

  test("Login form is shown", async ({ page }) => {
    const locator = await page.getByText("Welcome to Blogs");
    await expect(locator).toBeVisible();
    await expect(page.getByRole("button", { name: "log in" })).toBeVisible();
  });

  test("login form can be opened", async ({ page }) => {
    await loginWith(page, "root", "password");

    await expect(page.getByTestId("user-logged-in")).toContainText(
      "root logged in"
    );
  });

  test("login fails with wrong password", async ({ page }) => {
    await loginWith(page, "root", "wrong password");

    const errorDiv = await page.locator(".error");
    await expect(errorDiv).toContainText("Wrong credentials");
  });

  describe("when logged in", () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, "root", "password");
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
  });
});
