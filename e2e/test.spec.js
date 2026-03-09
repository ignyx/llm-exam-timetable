import { test, expect } from "@playwright/test";

test("Exam Timetable App loads correctly", async ({ page }) => {
  await page.goto("/");

  // Check if the app title is visible
  const title = await page.textContent("h1");
  expect(title).toBe("Exam Timetable App");

  // Check if loaded message is visible
  const loadingText = await page.getByTestId("status").textContent();
  expect(loadingText).toBe("Loaded! Ready to schedule exams.");
});
