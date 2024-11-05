const loginWith = async (page, username, password) => {
  await page.getByRole("button", { name: "log in" }).click();
  await page.getByTestId("username").fill(username);
  await page.getByTestId("password").fill(password);
  await page.getByRole("button", { name: "login" }).click();
};

const createBlog = async (page, content) => {
  await page.getByRole("button", { name: "new blog" }).click();
  await page.getByTestId("title").fill(content.title);
  await page.getByTestId("author").fill(content.author);
  await page.getByTestId("url").fill(content.url);
  await page.getByRole("button", { name: "save" }).click();
};

const getIntitialLikes = async (page) => {
  const intitialLikesText = await page
    .getByTestId("blogs")
    .locator(".blog:nth-child(1) span.likes")
    .textContent();

  return parseInt(intitialLikesText.replace("likes: ", ""));
};

export { loginWith, createBlog, getIntitialLikes };
